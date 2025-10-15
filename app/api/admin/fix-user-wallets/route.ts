import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Admin check would go here in production

    // Find all users with FID but no wallet address
    const { data: brokenUsers, error: fetchError } = await supabase
      .from('unified_users')
      .select('*')
      .not('farcaster_fid', 'is', null)
      .is('wallet_address', null);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const fixes = [];

    for (const user of brokenUsers || []) {
      // Look for this user's wallet in various places

      // 1. Check contest entries for this FID
      const { data: contestEntry } = await supabase
        .from('contest_entries')
        .select('wallet_address')
        .eq('farcaster_fid', user.farcaster_fid)
        .not('wallet_address', 'is', null)
        .limit(1)
        .single();

      // 2. Check the old users table
      const { data: oldUser } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('fid', user.farcaster_fid)
        .not('wallet_address', 'is', null)
        .limit(1)
        .single();

      // 3. Check verified_addresses JSON field
      let walletToUse = null;

      if (contestEntry?.wallet_address) {
        walletToUse = contestEntry.wallet_address;
      } else if (oldUser?.wallet_address) {
        walletToUse = oldUser.wallet_address;
      } else if (user.verified_addresses && typeof user.verified_addresses === 'object') {
        // Get first verified address
        const addresses = Object.values(user.verified_addresses);
        if (addresses.length > 0) {
          walletToUse = addresses[0] as string;
        }
      }

      if (walletToUse) {
        // Update the unified_users record
        const { error: updateError } = await supabase
          .from('unified_users')
          .update({
            wallet_address: walletToUse.toLowerCase(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (!updateError) {
          fixes.push({
            userId: user.id,
            fid: user.farcaster_fid,
            username: user.farcaster_username,
            walletFixed: walletToUse,
            source: contestEntry ? 'contest_entry' : oldUser ? 'users_table' : 'verified_addresses'
          });
        }
      }
    }

    // Special case for Vlad if not fixed above
    const vladFid = 1025376;
    const vladWallet = '0xfb70c8B3d0cbd18F5bCaf871831166bBf78CF742';

    const { data: vladUser } = await supabase
      .from('unified_users')
      .select('*')
      .eq('farcaster_fid', vladFid)
      .single();

    if (vladUser && !vladUser.wallet_address) {
      const { error: vladUpdateError } = await supabase
        .from('unified_users')
        .update({
          wallet_address: vladWallet.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', vladUser.id);

      if (!vladUpdateError) {
        fixes.push({
          userId: vladUser.id,
          fid: vladFid,
          username: 'bulgakov-vlad',
          walletFixed: vladWallet,
          source: 'manual_fix'
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalBrokenUsers: brokenUsers?.length || 0,
      totalFixed: fixes.length,
      fixes
    });

  } catch (error) {
    console.error('Error fixing user wallets:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check how many users need fixing
    const { data: needsFix, count } = await supabase
      .from('unified_users')
      .select('id, farcaster_fid, farcaster_username', { count: 'exact' })
      .not('farcaster_fid', 'is', null)
      .is('wallet_address', null);

    return NextResponse.json({
      needsFix: count || 0,
      users: needsFix?.map(u => ({
        id: u.id,
        fid: u.farcaster_fid,
        username: u.farcaster_username
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check users' }, { status: 500 });
  }
}