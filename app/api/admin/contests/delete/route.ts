import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('id');
    const adminWallet = searchParams.get('wallet');

    if (!contestId || !adminWallet) {
      return NextResponse.json(
        { error: 'Contest ID and admin wallet required' },
        { status: 400 }
      );
    }

    // Validate admin access
    if (!validateAdminAccess(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // First, check if it's a test contest (safety check)
    const { data: contest, error: fetchError } = await supabaseAdmin
      .from('contests')
      .select('id, name, is_test, status')
      .eq('id', contestId)
      .single();

    if (fetchError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of test contests or draft contests
    if (!contest.is_test && contest.status !== 'draft') {
      return NextResponse.json(
        {
          error: 'Only test contests or draft contests can be deleted',
          details: 'For safety, only contests marked as test or in draft status can be deleted'
        },
        { status: 400 }
      );
    }

    // Delete related submissions first (cascade)
    const { error: submissionsError } = await supabaseAdmin
      .from('contest_submissions')
      .delete()
      .eq('contest_id', contestId);

    if (submissionsError) {
      console.error('Error deleting submissions:', submissionsError);
      // Continue even if no submissions exist
    }

    // Delete related winners if any
    const { error: winnersError } = await supabaseAdmin
      .from('contest_winners')
      .delete()
      .eq('contest_id', contestId);

    if (winnersError) {
      console.error('Error deleting winners:', winnersError);
      // Continue even if no winners exist
    }

    // Delete the contest
    const { error: deleteError } = await supabaseAdmin
      .from('contests')
      .delete()
      .eq('id', contestId);

    if (deleteError) {
      console.error('Error deleting contest:', deleteError);
      return NextResponse.json(
        {
          error: 'Failed to delete contest',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    console.log('Contest deleted successfully:', contestId, contest.name);

    return NextResponse.json({
      success: true,
      message: `Contest "${contest.name}" deleted successfully`,
      deletedContest: {
        id: contestId,
        name: contest.name,
        was_test: contest.is_test
      }
    });

  } catch (error) {
    console.error('Delete contest error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}