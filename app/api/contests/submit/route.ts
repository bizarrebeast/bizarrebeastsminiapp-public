import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadToR2, generateScreenshotKey, getFileExtension, validateImageFile, isR2Configured } from '@/lib/r2-storage';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
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
    const formData = await request.formData();

    const contestId = formData.get('contestId') as string;
    const walletAddress = formData.get('walletAddress') as string;
    const score = formData.get('score') as string;
    const screenshot = formData.get('screenshot') as File | null;
    const tokenBalance = formData.get('tokenBalance') as string;
    const farcasterUsername = formData.get('farcasterUsername') as string;
    const farcasterFid = formData.get('farcasterFid') as string;

    // Validate required fields
    if (!contestId || !walletAddress) {
      return NextResponse.json(
        { error: 'Contest ID and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if contest exists and is active
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

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
    const { count } = await supabase
      .from('contest_submissions')
      .select('id', { count: 'exact' })
      .eq('contest_id', contestId)
      .eq('wallet_address', walletAddress.toLowerCase());

    const submissionCount = count || 0;

    if (submissionCount >= contest.max_entries_per_wallet) {
      return NextResponse.json(
        {
          error: `Maximum ${contest.max_entries_per_wallet} ${contest.max_entries_per_wallet === 1 ? 'entry' : 'entries'} allowed per wallet. You have already submitted ${submissionCount}.`
        },
        { status: 400 }
      );
    }

    // Handle screenshot upload
    let screenshotUrl = null;
    if (screenshot) {
      // Validate the image file
      const validation = validateImageFile(screenshot);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
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
      username: farcasterUsername || null, // Store Farcaster username if available
      score: score ? parseInt(score) : null,
      screenshot_url: screenshotUrl,
      token_balance: tokenBalance,
      status: 'pending',
      metadata: {
        submitted_from: 'web',
        user_agent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        farcaster_fid: farcasterFid || null // Store FID in metadata
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
    console.error('Contest submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}