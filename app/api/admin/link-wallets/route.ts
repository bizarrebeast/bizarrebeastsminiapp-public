import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, wallets, username } = body;

    if (!fid || !wallets || !Array.isArray(wallets)) {
      return NextResponse.json({ error: 'FID and wallets array required' }, { status: 400 });
    }

    console.log(`🔗 Linking FID ${fid} with wallets:`, wallets);

    // Normalize all wallets to lowercase
    const normalizedWallets = wallets.map(w => w.toLowerCase());

    // First, delete any existing entries for this FID to avoid conflicts
    const { error: deleteError } = await supabase
      .from('unified_users')
      .delete()
      .eq('farcaster_fid', fid);

    if (deleteError) {
      console.log('No existing entries to delete or error:', deleteError.message);
    }

    // Also delete any existing entries for these wallets to avoid duplicates
    for (const wallet of normalizedWallets) {
      await supabase
        .from('unified_users')
        .delete()
        .eq('wallet_address', wallet);
    }

    // Create new unified entry with all wallets properly linked
    const { data, error } = await supabase
      .from('unified_users')
      .insert({
        wallet_address: normalizedWallets[0], // Primary wallet
        farcaster_fid: fid,
        farcaster_username: username || 'bizarrebeast',
        verified_addresses: normalizedWallets,
        primary_identity: 'farcaster',
        identities_linked: true,
        linked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating unified user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Created unified user for FID ${fid} with ${normalizedWallets.length} wallets`);
    return NextResponse.json({ success: true, action: 'created', data });
  } catch (error) {
    console.error('Error in link-wallets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check current linkage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const wallet = searchParams.get('wallet');

    let query = supabase.from('unified_users').select('*');

    if (fid) {
      query = query.eq('farcaster_fid', parseInt(fid));
    } else if (wallet) {
      query = query.eq('wallet_address', wallet.toLowerCase());
    } else {
      return NextResponse.json({ error: 'FID or wallet required' }, { status: 400 });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching unified users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (error) {
    console.error('Error in get link-wallets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}