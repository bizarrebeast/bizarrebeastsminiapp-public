import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadToR2, generateScreenshotKey, getFileExtension, validateImageFile, isR2Configured } from '@/lib/r2-storage';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { extractImageMetadata, validateImageWithMetadata, createFraudDetectionSummary } from '@/lib/image-metadata';

export async function POST(request: Request) {
  console.log('🎯 Contest submission API called at:', new Date().toISOString());
  try {
    // Rate limiting: 5 submissions per minute per IP
    const clientIp = getClientIp(request);
    const { success, remaining, reset } = await rateLimit(clientIp, {
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 5 // 5 submissions per minute
    });

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many submissions. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString()
          }
        }
      );
    }
    // Parse form data
    console.log('📝 Parsing form data...');
    const formData = await request.formData();

    const contestId = formData.get('contestId') as string;
    const walletAddress = formData.get('walletAddress') as string;
    const score = formData.get('score') as string;
    const screenshot = formData.get('screenshot') as File | null;
    const tokenBalance = formData.get('tokenBalance') as string;
    const farcasterUsername = formData.get('farcasterUsername') as string;
    const farcasterFid = formData.get('farcasterFid') as string;
    const xUsername = formData.get('username') as string; // X username if platform is X
    const usernamePlatform = formData.get('usernamePlatform') as string;
    const imageCaption = formData.get('image_caption') as string;

    console.log('📝 Form data parsed:', {
      contestId,
      walletAddress: walletAddress?.substring(0, 6) + '...',
      score,
      hasScreenshot: !!screenshot,
      tokenBalance,
      farcasterUsername,
      farcasterFid,
      xUsername,
      usernamePlatform
    });

    // Validate required fields
    if (!contestId || !walletAddress) {
      return NextResponse.json(
        { error: 'Contest ID and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if contest exists and is active
    console.log('🏆 Fetching contest:', contestId);
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    console.log('🏆 Contest fetch result:', {
      contestFound: !!contest,
      contestError: contestError?.message,
      contestName: contest?.name,
      maxEntries: contest?.max_entries_per_wallet
    });

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Check if contest is active
    const now = new Date();
    const startDate = contest.start_date ? new Date(contest.start_date) : null;
    const endDate = contest.end_date ? new Date(contest.end_date) : null;

    if (startDate && startDate > now) {
      return NextResponse.json(
        { error: 'Contest has not started yet' },
        { status: 400 }
      );
    }

    if (endDate && endDate < now) {
      return NextResponse.json(
        { error: 'Contest has ended' },
        { status: 400 }
      );
    }

    // Check token requirements
    if (contest.min_bb_required > 0) {
      const userBalance = BigInt(tokenBalance || '0');
      const required = BigInt(contest.min_bb_required);

      if (userBalance < required) {
        return NextResponse.json(
          { error: `Insufficient $BB balance. Required: ${contest.min_bb_required}` },
          { status: 403 }
        );
      }
    }

    // Check submission limit based on max_entries_per_wallet
    console.log('📊 Checking existing submissions for wallet:', walletAddress?.substring(0, 6) + '...');
    const { data: existingSubmissions, error: countError } = await supabase
      .from('contest_submissions')
      .select('id')
      .eq('contest_id', contestId)
      .eq('wallet_address', walletAddress.toLowerCase());

    console.log('📊 Existing submissions check result:', {
      submissionsFound: existingSubmissions?.length || 0,
      countError: countError?.message,
      maxAllowed: contest.max_entries_per_wallet
    });

    if (countError) {
      console.error('❌ Error counting existing submissions:', countError);
      return NextResponse.json(
        { error: 'Failed to check existing submissions' },
        { status: 500 }
      );
    }

    const submissionCount = existingSubmissions?.length || 0;

    if (submissionCount >= contest.max_entries_per_wallet) {
      return NextResponse.json(
        {
          error: `Maximum ${contest.max_entries_per_wallet} ${contest.max_entries_per_wallet === 1 ? 'entry' : 'entries'} allowed per wallet. You have already submitted ${submissionCount}.`
        },
        { status: 400 }
      );
    }

    // Handle screenshot upload with enhanced validation
    let screenshotUrl = null;
    let imageMetadata = null;
    let fraudDetectionSummary = null;

    if (screenshot) {
      // Basic validation first
      const basicValidation = validateImageFile(screenshot);
      if (!basicValidation.valid) {
        return NextResponse.json(
          { error: basicValidation.error },
          { status: 400 }
        );
      }

      // Extract image metadata for fraud detection
      try {
        console.log('📸 Extracting image metadata for fraud detection...');
        imageMetadata = await extractImageMetadata(screenshot);
        fraudDetectionSummary = createFraudDetectionSummary(imageMetadata);

        console.log('📸 Metadata extraction result:', {
          isSuspicious: imageMetadata.fraudDetection.isSuspicious,
          riskScore: imageMetadata.fraudDetection.riskScore,
          suspiciousReasons: imageMetadata.fraudDetection.suspiciousReasons
        });

        // Enhanced validation with metadata
        const enhancedValidation = validateImageWithMetadata(screenshot, imageMetadata);
        if (!enhancedValidation.valid) {
          return NextResponse.json(
            { error: enhancedValidation.error },
            { status: 400 }
          );
        }

        // Log warnings for admin review
        if (enhancedValidation.warnings.length > 0) {
          console.log('⚠️ Image validation warnings:', enhancedValidation.warnings);
        }

      } catch (metadataError) {
        console.error('❌ Metadata extraction failed:', metadataError);
        // Don't block submission, but log the issue
        fraudDetectionSummary = 'Metadata extraction failed';
      }

      // Check if R2 is configured
      if (isR2Configured()) {
        try {
          // Convert File to Buffer
          const buffer = Buffer.from(await screenshot.arrayBuffer());

          // Generate unique key for the screenshot
          const extension = getFileExtension(screenshot.name, screenshot.type);
          const key = generateScreenshotKey(contestId, walletAddress, extension);

          // Upload to R2
          screenshotUrl = await uploadToR2(buffer, key, screenshot.type);
          console.log('Screenshot uploaded to R2:', screenshotUrl);
        } catch (uploadError) {
          console.error('R2 upload failed:', uploadError);
          // Fall back to placeholder if upload fails
          screenshotUrl = 'pending-upload';
        }
      } else {
        // R2 not configured, use placeholder
        console.log('R2 not configured, using placeholder');
        screenshotUrl = 'pending-upload';
      }
    }

    // Create submission
    const submissionData = {
      contest_id: contestId,
      wallet_address: walletAddress.toLowerCase(),
      username: farcasterUsername || xUsername || null, // Store username from either platform
      score: score ? parseInt(score) : null,
      screenshot_url: screenshotUrl,
      image_caption: imageCaption || null,
      token_balance: tokenBalance,
      status: 'pending',
      metadata: {
        submitted_from: 'web',
        user_agent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        username_platform: usernamePlatform || 'unknown', // Store which platform the username is from
        farcaster_fid: farcasterFid || null, // Store FID in metadata if Farcaster
        // Enhanced fraud detection metadata
        image_metadata: imageMetadata ? {
          file_size: imageMetadata.fileSize,
          mime_type: imageMetadata.mimeType,
          dimensions: imageMetadata.dimensions,
          exif_data: imageMetadata.exif,
          fraud_detection: {
            is_suspicious: imageMetadata.fraudDetection.isSuspicious,
            risk_score: imageMetadata.fraudDetection.riskScore,
            suspicious_reasons: imageMetadata.fraudDetection.suspiciousReasons,
            checks: imageMetadata.fraudDetection.checks,
            summary: fraudDetectionSummary
          }
        } : null
      }
    };

    const { data: submission, error: submissionError } = await supabase
      .from('contest_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      console.error('Submission error:', submissionError);
      return NextResponse.json(
        { error: 'Failed to submit entry. Please try again.' },
        { status: 500 }
      );
    }

    // For onboarding contests, create task entries
    if (contest.type === 'onboarding') {
      // Default onboarding tasks
      const tasks = [
        { task_name: 'connect_wallet', completed: true },
        { task_name: 'follow_twitter', completed: false },
        { task_name: 'join_telegram', completed: false },
        { task_name: 'first_trade', completed: false }
      ];

      const taskData = tasks.map(task => ({
        submission_id: submission.id,
        ...task
      }));

      await supabase
        .from('onboarding_tasks')
        .insert(taskData);
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        contestId: submission.contest_id,
        status: submission.status
      },
      message: 'Entry submitted successfully!'
    });

  } catch (error) {
    console.error('❌ Contest submission FATAL error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}