import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Admin check - you might want to add proper authentication here
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting ritual FID migration...');

    // Step 1: Get all ritual completions without FID
    const { data: ritualsWithoutFid, error: fetchError } = await supabase
      .from('ritual_completions')
      .select('id, wallet_address')
      .is('fid', null);

    if (fetchError) {
      console.error('Error fetching rituals:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    console.log(`Found ${ritualsWithoutFid?.length || 0} rituals without FID`);

    // Step 2: Get unique wallet addresses
    const uniqueWallets = [...new Set(ritualsWithoutFid?.map(r => r.wallet_address.toLowerCase()) || [])];
    console.log(`Processing ${uniqueWallets.length} unique wallets`);

    // Step 3: Look up FIDs for each wallet
    const walletToFidMap: Record<string, number> = {};

    for (const wallet of uniqueWallets) {
      // Try to find user in users table
      const { data: user } = await supabase
        .from('users')
        .select('farcaster_fid')
        .eq('wallet_address', wallet)
        .single();

      if (user?.farcaster_fid) {
        walletToFidMap[wallet] = user.farcaster_fid;
        console.log(`Found FID ${user.farcaster_fid} for wallet ${wallet}`);
      }
    }

    // Step 4: Update rituals with FIDs
    let updatedCount = 0;
    let failedCount = 0;

    for (const ritual of ritualsWithoutFid || []) {
      const walletLower = ritual.wallet_address.toLowerCase();
      const fid = walletToFidMap[walletLower];

      if (fid) {
        const { error: updateError } = await supabase
          .from('ritual_completions')
          .update({ fid })
          .eq('id', ritual.id);

        if (updateError) {
          console.error(`Failed to update ritual ${ritual.id}:`, updateError);
          failedCount++;
        } else {
          updatedCount++;
        }
      }
    }

    // Step 5: Also update ritual_shares table
    const { data: sharesWithoutFid, error: sharesFetchError } = await supabase
      .from('ritual_shares')
      .select('id, wallet_address')
      .is('fid', null);

    if (!sharesFetchError && sharesWithoutFid) {
      for (const share of sharesWithoutFid) {
        const walletLower = share.wallet_address?.toLowerCase();
        const fid = walletLower ? walletToFidMap[walletLower] : null;

        if (fid) {
          await supabase
            .from('ritual_shares')
            .update({ fid })
            .eq('id', share.id);
        }
      }
    }

    const summary = {
      totalRituals: ritualsWithoutFid?.length || 0,
      updated: updatedCount,
      failed: failedCount,
      skipped: (ritualsWithoutFid?.length || 0) - updatedCount - failedCount,
      walletToFidMap
    };

    console.log('✅ Migration complete:', summary);

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}