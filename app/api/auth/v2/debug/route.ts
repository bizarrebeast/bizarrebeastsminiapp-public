/**
 * Debug Endpoint for BB Auth
 * GET/POST /api/auth/v2/debug
 *
 * Shows exactly what headers and data the Farcaster SDK sends
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeaders, verifyFarcasterToken } from '@/lib/auth/verification-service';

export async function GET(request: NextRequest) {
  return handleDebug(request);
}

export async function POST(request: NextRequest) {
  return handleDebug(request);
}

async function handleDebug(request: NextRequest) {
  // Extract all headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Extract auth headers specifically
  const { authToken, walletAddress } = extractAuthHeaders(request);

  // Debug log
  console.log('🔍 BB Auth Debug - Headers received:', {
    authorization: authToken,
    wallet: walletAddress,
    allHeaders: headers
  });

  // Try to decode the token if present
  let tokenInfo = null;
  let tokenError = null;

  if (authToken) {
    try {
      // Try to decode without verification
      const actualToken = authToken.startsWith('Bearer ')
        ? authToken.replace('Bearer ', '')
        : authToken;

      // Log the raw token format
      console.log('🔍 Raw token:', {
        startsWithBearer: authToken.startsWith('Bearer '),
        startsWithFc: actualToken.startsWith('fc_'),
        tokenLength: actualToken.length,
        firstChars: actualToken.substring(0, 20)
      });

      // Try to verify using our service
      const verified = await verifyFarcasterToken(authToken);

      if (verified) {
        tokenInfo = {
          verified: true,
          fid: verified.fid,
          username: verified.username,
          expiresAt: new Date(verified.expiresAt).toISOString()
        };
      } else {
        // Try manual decode to see what's in it
        if (actualToken.startsWith('fc_')) {
          const base64Data = actualToken.replace('fc_', '');
          const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
          tokenInfo = {
            verified: false,
            format: 'fc_token',
            decoded: JSON.parse(decoded)
          };
        } else if (actualToken.includes('.')) {
          // Try JWT decode
          const parts = actualToken.split('.');
          if (parts.length === 3) {
            const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
            tokenInfo = {
              verified: false,
              format: 'jwt',
              decoded: JSON.parse(payload)
            };
          }
        }
      }
    } catch (error) {
      tokenError = error instanceof Error ? error.message : 'Failed to decode token';
      console.error('Token decode error:', error);
    }
  }

  // Return debug info
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    request: {
      method: request.method,
      url: request.url
    },
    headers: {
      authorization: authToken || 'NOT_PRESENT',
      wallet: walletAddress || 'NOT_PRESENT',
      contentType: headers['content-type'],
      origin: headers['origin'],
      referer: headers['referer'],
      userAgent: headers['user-agent']
    },
    token: {
      present: !!authToken,
      info: tokenInfo,
      error: tokenError
    },
    yourActualFid: 357897, // Your FID from the test
    yourActualWallet: '0x3FDD6aFEd7a19990632468c7102219d051E685dB'
  });
}