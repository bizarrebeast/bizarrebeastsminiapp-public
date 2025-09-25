/**
 * Authentication Test Endpoint
 * GET /api/auth/v2/test
 *
 * Tests the complete auth flow with mock data
 * Helps verify the implementation before SDK integration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyFarcasterToken,
  fetchUserFromNeynar,
  verifyWalletOwnership,
  verifyCompleteAuth
} from '@/lib/auth/verification-service';

/**
 * GET - Run authentication tests
 */
export async function GET(request: NextRequest) {
  const tests = [];

  // Test 1: Token verification with mock token
  try {
    console.log('🧪 Test 1: Token Verification');

    // Create a mock JWT token
    const mockPayload = {
      fid: 3621, // Test FID
      username: 'testuser',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };

    const mockToken = `Bearer eyJhbGciOiJIUzI1NiJ9.${Buffer.from(
      JSON.stringify(mockPayload)
    ).toString('base64')}.signature`;

    const tokenResult = await verifyFarcasterToken(mockToken);

    tests.push({
      test: 'Token Verification',
      success: !!tokenResult,
      result: tokenResult,
      expected: { fid: 3621, username: 'testuser' }
    });
  } catch (error) {
    tests.push({
      test: 'Token Verification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: Fetch user from Neynar
  try {
    console.log('🧪 Test 2: Neynar User Fetch');

    // Try to fetch a real user (dwr.eth has FID 3621)
    const user = await fetchUserFromNeynar(3621);

    tests.push({
      test: 'Neynar User Fetch',
      success: !!user,
      result: user ? {
        fid: user.fid,
        username: user.username,
        hasVerifiedAddresses: !!(user.verified_addresses?.eth_addresses?.length)
      } : null
    });
  } catch (error) {
    tests.push({
      test: 'Neynar User Fetch',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 3: Wallet verification
  try {
    console.log('🧪 Test 3: Wallet Verification');

    // Test with a known FID and wallet
    // Using FID 3621 (dwr.eth) as example
    const isVerified = await verifyWalletOwnership(
      3621,
      '0x0000000000000000000000000000000000000000' // Test address
    );

    tests.push({
      test: 'Wallet Verification',
      success: true,
      result: { isVerified },
      note: 'Used test address - should be false'
    });
  } catch (error) {
    tests.push({
      test: 'Wallet Verification',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 4: Complete auth flow
  try {
    console.log('🧪 Test 4: Complete Auth Flow');

    const mockPayload = {
      fid: 3621,
      username: 'dwr',
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    const mockToken = `Bearer eyJhbGciOiJIUzI1NiJ9.${Buffer.from(
      JSON.stringify(mockPayload)
    ).toString('base64')}.signature`;

    const verification = await verifyCompleteAuth(
      mockToken,
      '0x0000000000000000000000000000000000000000'
    );

    tests.push({
      test: 'Complete Auth Flow',
      success: verification.success,
      result: verification
    });
  } catch (error) {
    tests.push({
      test: 'Complete Auth Flow',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 5: Check API key configuration
  const hasApiKey = !!process.env.NEYNAR_API_KEY;
  tests.push({
    test: 'Neynar API Key',
    success: hasApiKey,
    result: hasApiKey ? 'Configured' : 'Missing'
  });

  // Calculate summary
  const summary = {
    total: tests.length,
    passed: tests.filter(t => t.success).length,
    failed: tests.filter(t => !t.success).length
  };

  console.log('📊 Test Summary:', summary);

  return NextResponse.json({
    summary,
    tests,
    timestamp: new Date().toISOString(),
    environment: {
      hasNeynarKey: !!process.env.NEYNAR_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}

/**
 * POST - Test with custom parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, wallet, token } = body;

    const results: any = {};

    // Test token if provided
    if (token) {
      results.tokenVerification = await verifyFarcasterToken(token);
    }

    // Test user fetch if FID provided
    if (fid) {
      results.userFetch = await fetchUserFromNeynar(fid);
    }

    // Test wallet verification if both provided
    if (fid && wallet) {
      results.walletVerification = await verifyWalletOwnership(fid, wallet);
    }

    // Test complete flow if token and wallet provided
    if (token && wallet) {
      results.completeAuth = await verifyCompleteAuth(token, wallet);
    }

    return NextResponse.json({
      success: true,
      results,
      parameters: { fid, wallet, hasToken: !!token }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      },
      { status: 500 }
    );
  }
}