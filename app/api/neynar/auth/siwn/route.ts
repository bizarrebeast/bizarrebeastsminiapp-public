/**
 * Sign In With Neynar (SIWN) Authentication
 * Since full SIWN requires higher tier, we use FID-based authentication
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the redirect URL from query params or use default
    const searchParams = request.nextUrl.searchParams;
    const redirectPath = searchParams.get('redirect') || '/';

    // Construct the full callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Direct to our FID-based auth page
    // This works with Starter plan and doesn't require SIWN setup
    const authUrl = `${baseUrl}/api/neynar/auth/mock?redirect=${encodeURIComponent(redirectPath)}`;

    // Redirect directly to the auth page instead of returning JSON
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    // Fallback to homepage on error
    return NextResponse.redirect('/');
  }
}