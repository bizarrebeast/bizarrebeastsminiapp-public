/**
 * Fetch Farcaster user data by FID using Neynar API
 * Works with Starter plan
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ fid: string }> }
) {
  try {
    const params = await props.params;
    const fid = params.fid;
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
      );
    }

    // Use Neynar API to fetch user data
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Neynar API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.users && data.users.length > 0) {
      const user = data.users[0];
      return NextResponse.json({
        success: true,
        user: {
          fid: user.fid,
          username: user.username,
          displayName: user.display_name,
          pfpUrl: user.pfp_url,
          bio: user.profile?.bio?.text,
          followerCount: user.follower_count,
          followingCount: user.following_count,
          powerBadge: user.power_badge,
        }
      });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}