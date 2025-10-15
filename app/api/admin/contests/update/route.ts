import { NextRequest, NextResponse } from 'next/server';
import { contestQueries } from '@/lib/supabase';
import { validateAdminAccess } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest) {
  try {
    // Parse body once
    const body = await request.json();
    const { contestId, updates, adminWallet: walletFromBody } = body;

    // Check admin authorization - try header first, then body
    const adminWallet = request.headers.get('x-admin-wallet')?.toLowerCase() || walletFromBody?.toLowerCase();

    if (!adminWallet || !validateAdminAccess(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID is required' },
        { status: 400 }
      );
    }

    // Validate dates if both are being updated
    if (updates.start_date && updates.end_date) {
      const startDate = new Date(updates.start_date);
      const endDate = new Date(updates.end_date);

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Validate voting dates if being updated
    if (updates.voting_start_date && updates.voting_end_date) {
      const votingStart = new Date(updates.voting_start_date);
      const votingEnd = new Date(updates.voting_end_date);

      if (votingEnd <= votingStart) {
        return NextResponse.json(
          { error: 'Voting end date must be after voting start date' },
          { status: 400 }
        );
      }

      if (updates.start_date && updates.end_date) {
        const startDate = new Date(updates.start_date);
        const endDate = new Date(updates.end_date);

        if (votingStart < startDate || votingEnd > endDate) {
          return NextResponse.json(
            { error: 'Voting period must be within contest dates' },
            { status: 400 }
          );
        }
      }
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