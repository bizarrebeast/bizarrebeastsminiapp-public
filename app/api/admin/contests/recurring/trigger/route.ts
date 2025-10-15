import { NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/admin';

/**
 * Manual trigger for recurring contest processing
 *
 * This endpoint allows admins to manually trigger the recurring contest
 * processing logic without waiting for the cron job. Useful for testing
 * and immediate processing.
 *
 * Usage: GET /api/admin/contests/recurring/trigger?wallet=0x...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminWallet = searchParams.get('wallet');

    // Validate admin access
    if (!adminWallet || !validateAdminAccess(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    console.log(`🔧 Manual recurring contest trigger by admin: ${adminWallet}`);

    // Call the actual cron endpoint with the CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const cronUrl = `${baseUrl}/api/cron/recurring-contests`;

    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to trigger recurring contests');
    }

    return NextResponse.json({
      success: true,
      message: 'Recurring contests processed successfully',
      ...data
    });

  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger recurring contest processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
