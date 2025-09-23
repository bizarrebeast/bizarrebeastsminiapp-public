import { NextResponse } from 'next/server';
import { getUserStats, getUserProfile } from '@/lib/neynar-enhanced';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid: fidString } = await params;
    const fid = parseInt(fidString);

    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    // Fetch comprehensive user stats
    const stats = await getUserStats(fid);

    if (!stats) {
      // Try to get just the profile as fallback
      const profile = await getUserProfile(fid);

      if (!profile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Return minimal stats with just profile
      return NextResponse.json({
        profile,
        engagement: null,
        growth: null,
        channels: [],
        recentCasts: [],
        topCasts: [],
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}