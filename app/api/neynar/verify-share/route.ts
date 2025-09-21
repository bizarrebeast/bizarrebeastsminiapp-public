/**
 * API endpoint for verifying Farcaster shares via Neynar
 * Checks if a user has actually shared a ritual to Farcaster
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchUserCastsForRitual } from '@/lib/neynar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, ritualId, expectedText } = body;

    // Validate input
    if (!fid || !ritualId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: fid and ritualId',
          verified: false
        },
        { status: 400 }
      );
    }

    // For testing without a real FID, allow a test mode
    if (process.env.NODE_ENV === 'development' && fid === 'test') {
      console.log('Test mode: Auto-verifying share for development');
      return NextResponse.json({
        verified: true,
        message: 'Test mode: Share auto-verified',
        testMode: true
      });
    }

    // Verify the share via Neynar
    const result = await searchUserCastsForRitual(
      parseInt(fid),
      parseInt(ritualId)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in verify-share endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify share',
        verified: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Share verification endpoint is running',
    testEndpoint: '/api/neynar/verify-share',
    method: 'POST',
    requiredFields: ['fid', 'ritualId'],
    testMode: process.env.NODE_ENV === 'development' ?
      'Use fid: "test" to auto-verify in development' : 'Disabled'
  });
}