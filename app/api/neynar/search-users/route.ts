/**
 * Search Farcaster users by query using Neynar API
 * Supports partial matching and case-insensitive search
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
      );
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Clean query (remove @ if present)
    const cleanQuery = query.replace('@', '').trim();

    // Use Neynar API v2 to search for users
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(cleanQuery)}&limit=10`,
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
        { error: 'Failed to search users' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.result && data.result.users) {
      const users = data.result.users.map((user: any) => ({
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        bio: user.profile?.bio?.text,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        powerBadge: user.power_badge,
      }));

      return NextResponse.json({
        success: true,
        users,
        count: users.length,
      });
    }

    return NextResponse.json({
      success: true,
      users: [],
      count: 0,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
