import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { contestIds, adminWallet } = body;

    if (!contestIds || !Array.isArray(contestIds) || contestIds.length === 0) {
      return NextResponse.json(
        { error: 'Contest IDs array required' },
        { status: 400 }
      );
    }

    if (!adminWallet) {
      return NextResponse.json(
        { error: 'Admin wallet required' },
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

    // Check if all contests are test or draft
    const { data: contests, error: fetchError } = await supabaseAdmin
      .from('contests')
      .select('id, name, is_test, status')
      .in('id', contestIds);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch contests' },
        { status: 500 }
      );
    }

    const invalidContests = contests?.filter(c => !c.is_test && c.status !== 'draft') || [];
    if (invalidContests.length > 0) {
      return NextResponse.json(
        {
          error: 'Some contests cannot be deleted',
          details: 'Only test contests or draft contests can be deleted',
          invalidContests: invalidContests.map(c => ({ id: c.id, name: c.name }))
        },
        { status: 400 }
      );
    }

    // Delete submissions first
    const { error: submissionsError } = await supabaseAdmin
      .from('contest_submissions')
      .delete()
      .in('contest_id', contestIds);

    if (submissionsError) {
      console.error('Error deleting submissions:', submissionsError);
    }

    // Delete winners
    const { error: winnersError } = await supabaseAdmin
      .from('contest_winners')
      .delete()
      .in('contest_id', contestIds);

    if (winnersError) {
      console.error('Error deleting winners:', winnersError);
    }

    // Delete contests
    const { data: deletedContests, error: deleteError } = await supabaseAdmin
      .from('contests')
      .delete()
      .in('id', contestIds)
      .select('id, name');

    if (deleteError) {
      console.error('Error deleting contests:', deleteError);
      return NextResponse.json(
        {
          error: 'Failed to delete contests',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    console.log(`Batch deleted ${deletedContests?.length || 0} contests`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedContests?.length || 0} contest(s)`,
      deletedContests
    });

  } catch (error) {
    console.error('Batch delete error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}