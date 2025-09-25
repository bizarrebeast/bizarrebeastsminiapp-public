/**
 * Session Management Endpoint
 * GET /api/auth/v2/session - Get current session
 * POST /api/auth/v2/session - Create new session
 * DELETE /api/auth/v2/session - End session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/verification-service';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'bb_session';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: '/'
};

/**
 * GET - Check current session
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session'
      });
    }

    const sessionData = verifySessionToken(sessionCookie.value);

    if (!sessionData) {
      // Invalid or expired session
      return NextResponse.json({
        authenticated: false,
        message: 'Session expired or invalid'
      });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        fid: sessionData.fid,
        username: sessionData.username,
        wallet: sessionData.wallet,
        isWalletVerified: sessionData.isWalletVerified,
        expiresAt: sessionData.exp
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new session
 * Expects sessionToken in body (from /api/auth/v2/verify)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 400 }
      );
    }

    // Verify the session token
    const sessionData = verifySessionToken(sessionToken);

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session created successfully',
      session: {
        fid: sessionData.fid,
        username: sessionData.username,
        wallet: sessionData.wallet,
        isWalletVerified: sessionData.isWalletVerified
      }
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);

    console.log('✅ Session created for user:', sessionData.username);

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - End session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Session ended successfully'
    });

    // Clear session cookie
    response.cookies.delete(SESSION_COOKIE_NAME);

    console.log('✅ Session ended');

    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}