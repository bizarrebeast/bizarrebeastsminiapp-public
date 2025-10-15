import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeaders, verifyCompleteAuth } from '@/lib/auth/verification-service';

export async function GET(request: NextRequest) {
  try {
    const { authToken, walletAddress } = extractAuthHeaders(request);

    // Verify authentication
    const verification = await verifyCompleteAuth(authToken, walletAddress);

    if (!verification.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return verified addresses from the authenticated user
    const verifiedAddresses = verification.user?.verifiedAddresses || [];

    return NextResponse.json({
      success: true,
      verifiedAddresses,
      currentWallet: walletAddress,
      isCurrentWalletVerified: walletAddress ?
        verifiedAddresses.some((addr: string) =>
          addr.toLowerCase() === walletAddress.toLowerCase()
        ) : false,
      fid: verification.user?.fid,
      username: verification.user?.username
    });
  } catch (error) {
    console.error('Error fetching verified addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verified addresses' },
      { status: 500 }
    );
  }
}