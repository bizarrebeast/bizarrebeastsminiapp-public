// Admin endpoint to sync all vote counts for a contest
import { NextRequest, NextResponse } from 'next/server';
import { syncAllVoteCounts } from '@/lib/vote-sync';

export async function POST(request: NextRequest) {
  try {
    const { contestId } = await request.json();

    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID required' },
        { status: 400 }
      );
    }

    const success = await syncAllVoteCounts(contestId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Vote counts synced for contest ${contestId}`
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to sync vote counts' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Failed to sync votes' },
      { status: 500 }
    );
  }
}