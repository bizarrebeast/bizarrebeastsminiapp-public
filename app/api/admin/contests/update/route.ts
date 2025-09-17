import { NextRequest, NextResponse } from 'next/server';
import { contestQueries } from '@/lib/supabase';

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').toLowerCase().split(',');

export async function PUT(request: NextRequest) {
  try {
    // Check admin authorization
    const adminWallet = request.headers.get('x-admin-wallet')?.toLowerCase();

    if (!adminWallet || !ADMIN_WALLETS.includes(adminWallet)) {
      // Try to get from request body as fallback
      const body = await request.json();
      const walletFromBody = body.adminWallet?.toLowerCase();

      if (!walletFromBody || !ADMIN_WALLETS.includes(walletFromBody)) {
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

      // Update contest
      const updatedContest = await contestQueries.updateContest(contestId, updates);

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

    // Update contest
    const updatedContest = await contestQueries.updateContest(contestId, updates);

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