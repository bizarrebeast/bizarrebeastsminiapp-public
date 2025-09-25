/**
 * Authentication Verification Endpoint
 * POST /api/auth/v2/verify
 *
 * Verifies Farcaster token and optional wallet address
 * Returns session token if verification succeeds
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthHeaders,
  verifyCompleteAuth,
  createSessionToken
} from '@/lib/auth/verification-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Auth verification request received');

    // Extract auth headers
    const { authToken, walletAddress } = extractAuthHeaders(request);

    console.log('📋 Auth headers:', {
      hasToken: !!authToken,
      hasWallet: !!walletAddress,
      wallet: walletAddress
    });

    // Verify authentication
    const verification = await verifyCompleteAuth(authToken, walletAddress);

    if (!verification.success) {
      console.error('❌ Verification failed:', verification.error);
      return NextResponse.json(
        { error: verification.error },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = createSessionToken(verification.user!);

    console.log('✅ Auth verified successfully:', {
      fid: verification.user!.fid,
      username: verification.user!.username,
      walletVerified: verification.user!.isWalletVerified
    });

    // Return success with user data and session token
    return NextResponse.json({
      success: true,
      user: verification.user,
      sessionToken,
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });
  } catch (error) {
    console.error('🔥 Auth verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking auth status
 */
export async function GET(request: NextRequest) {
  try {
    const { authToken, walletAddress } = extractAuthHeaders(request);

    if (!authToken) {
      return NextResponse.json({
        authenticated: false,
        message: 'No authentication token'
      });
    }

    const verification = await verifyCompleteAuth(authToken, walletAddress);

    return NextResponse.json({
      authenticated: verification.success,
      user: verification.user || null,
      error: verification.error
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check auth status' },
      { status: 500 }
    );
  }
}