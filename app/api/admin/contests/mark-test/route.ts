import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminAccess } from '@/lib/admin';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: Request) {
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

    // Mark contests as test
    const { data, error } = await supabaseAdmin
      .from('contests')
      .update({ is_test: true })
      .in('id', contestIds)
      .select('id, name');

    if (error) {
      console.error('Error marking contests as test:', error);
      return NextResponse.json(
        {
          error: 'Failed to mark contests as test',
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log(`Marked ${data?.length || 0} contests as test`);

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${data?.length || 0} contest(s) as test`,
      updatedContests: data
    });

  } catch (error) {
    console.error('Mark test error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}