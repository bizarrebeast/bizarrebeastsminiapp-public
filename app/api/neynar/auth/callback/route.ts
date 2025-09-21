/**
 * Neynar OAuth Callback Handler
 * Processes the authorization code from Neynar after successful login
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '/rituals';
    const error = searchParams.get('error');

    // Handle errors from Neynar
    if (error) {
      console.error('Neynar auth error:', error);
      return NextResponse.redirect(
        new URL(`/rituals?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Check for authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/rituals?error=no_code', request.url)
      );
    }

    // Handle mock authentication for free tier
    const isMockAuth = code.startsWith('mock_');

    try {
      let userData;

      if (isMockAuth) {
        // Extract mock FID from code
        const mockFid = code.replace('mock_', '');

        // The actual user data is already stored in localStorage by the mock auth page
        // We'll just create a basic user object here for the cookie
        userData = {
          fid: parseInt(mockFid),
          username: `user${mockFid}`,
          displayName: `User ${mockFid}`,
          pfpUrl: undefined,
          bio: undefined,
          followerCount: 0,
          followingCount: 0,
          powerBadge: false,
          mockAuth: true
        };

        console.log('Mock authentication successful for FID:', mockFid);
      } else {
        // In production with paid Neynar, you would exchange the code for real user data
        console.log('Processing real Neynar callback with code:', code);

        // For now, create a placeholder
        userData = {
          fid: 123456,
          username: 'realuser',
          displayName: 'Real User',
          pfpUrl: undefined,
          bio: undefined,
          followerCount: 0,
          followingCount: 0,
          powerBadge: false
        };
      }

      // Store user data in a cookie or session
      // For now, we'll redirect with the data in URL params
      const redirectUrl = new URL(state, request.url);
      redirectUrl.searchParams.set('auth', 'success');

      // In production, you'd set a secure HTTP-only cookie here
      const response = NextResponse.redirect(redirectUrl);

      // Set a simple cookie for demo purposes
      response.cookies.set('neynar_user', JSON.stringify(userData), {
        httpOnly: false, // Set to true in production
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    } catch (error) {
      console.error('Error processing Neynar callback:', error);
      return NextResponse.redirect(
        new URL('/rituals?error=processing_failed', request.url)
      );
    }
  } catch (error) {
    console.error('Callback handler error:', error);
    return NextResponse.redirect(
      new URL('/rituals?error=callback_error', request.url)
    );
  }
}