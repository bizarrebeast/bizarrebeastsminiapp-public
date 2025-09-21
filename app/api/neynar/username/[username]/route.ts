/**
 * Fetch Farcaster user data by username using Neynar API
 * For validating if a username exists
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ username: string }> }
) {
  try {
    const params = await props.params;
    const username = params.username;
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
      );
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace('@', '').trim();

    // Use Neynar API v2 to search for user by username
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=${encodeURIComponent(cleanUsername)}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': apiKey,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'User not found', exists: false },
          { status: 404 }
        );
      }

      const error = await response.text();
      console.error('Neynar API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.user) {
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          fid: data.user.fid,
          username: data.user.username,
          displayName: data.user.display_name,
          pfpUrl: data.user.pfp_url,
          bio: data.user.profile?.bio?.text,
          followerCount: data.user.follower_count,
          followingCount: data.user.following_count,
          powerBadge: data.user.power_badge,
        }
      });
    }

    return NextResponse.json(
      { error: 'User not found', exists: false },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}