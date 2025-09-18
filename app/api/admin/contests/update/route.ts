import { NextRequest, NextResponse } from 'next/server';
import { contestQueries } from '@/lib/supabase';
import { validateAdminAccess } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest) {
  try {
    // Check admin authorization
    const adminWallet = request.headers.get('x-admin-wallet')?.toLowerCase();

    if (!adminWallet || !validateAdminAccess(adminWallet)) {
      // Try to get from request body as fallback
      const body = await request.json();
      const walletFromBody = body.adminWallet?.toLowerCase();

      if (!walletFromBody || !validateAdminAccess(walletFromBody)) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }

      // If authorized via body, proceed with the update
      const { contestId, updates } = body;

      if (!contestId) {
        return NextResponse.json(
          { error: 'Contest ID is required' },
          { status: 400 }
        );
      }

      // Update contest using supabaseAdmin to bypass RLS
      const { data: updatedContest, error: updateError } = await supabaseAdmin
        .from('contests')
        .update(updates)
        .eq('id', contestId)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        contest: updatedContest
      });
    }

    // If authorized via header, parse body normally
    const { contestId, updates } = await request.json();

    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID is required' },
        { status: 400 }
      );
    }

    // Update contest using supabaseAdmin to bypass RLS
    const { data: updatedContest, error: updateError } = await supabaseAdmin
      .from('contests')
      .update(updates)
      .eq('id', contestId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    console.log(`Contest ${contestId} updated by ${adminWallet}`);

    return NextResponse.json({
      success: true,
      contest: updatedContest
    });
  } catch (error) {
    console.error('Error updating contest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update contest' },
      { status: 500 }
    );
  }
}