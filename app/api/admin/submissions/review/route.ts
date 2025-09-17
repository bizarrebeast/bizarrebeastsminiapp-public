import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limiting: 30 admin actions per minute
    const clientIp = getClientIp(request);
    const { success, remaining, reset } = await rateLimit(`admin:${clientIp}`, {
      interval: 60 * 1000,
      uniqueTokenPerInterval: 30
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        { status: 429 }
      );
    }
    const body = await request.json();
    const { submissionId, status, reviewerWallet, notes } = body;

    // Validate required fields
    if (!submissionId || !status || !reviewerWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate admin access
    if (!validateAdminAccess(reviewerWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved or rejected' },
        { status: 400 }
      );
    }

    // Update submission status
    const { data, error } = await supabaseAdmin
      .from('contest_submissions')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerWallet.toLowerCase(),
        reviewer_notes: notes || null
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('=== SUBMISSION UPDATE ERROR ===');
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Submission ID:', submissionId);
      console.error('Status:', status);
      console.error('Reviewer wallet:', reviewerWallet);
      console.error('==============================');
      return NextResponse.json(
        { error: 'Failed to update submission status', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Log the action
    console.log(`Submission ${submissionId} ${status} by ${reviewerWallet}`);

    return NextResponse.json({
      success: true,
      submission: data,
      message: `Submission ${status} successfully`
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch submissions for review
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    const status = searchParams.get('status');
    const walletAddress = searchParams.get('wallet');

    // Validate admin access
    if (!validateAdminAccess(walletAddress)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from('contest_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (contestId) {
      query = query.eq('contest_id', contestId);
    }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissions: data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}