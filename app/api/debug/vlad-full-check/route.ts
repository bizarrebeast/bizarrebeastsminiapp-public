import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const vladFid = 1025376;
    const knownWallet1 = '0xfb70c8B3d0cbd18F5bCaf871831166bBf78CF742'; // From your data
    const knownWallet2 = '0xFB70c8B3D0cbd18F5bCaF871831166bBf78Cf742'; // Case variations

    // Check all possible wallet variations
    const walletVariations = [
      knownWallet1.toLowerCase(),
      knownWallet1.toUpperCase(),
      knownWallet1,
      knownWallet2
    ];

    // 1. Check unified_users table
    const { data: unifiedUsers } = await supabase
      .from('unified_users')
      .select('*')
      .or(`farcaster_fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`);

    // 2. Check users table
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .or(`fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`);

    // 3. Check all ritual completions
    const { data: ritualCompletions } = await supabase
      .from('ritual_completions')
      .select('*')
      .or(`fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`)
      .order('created_at', { ascending: false });

    // 3a. Check today's ritual completions specifically
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayCompletions } = await supabase
      .from('ritual_completions')
      .select('*')
      .or(`fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    // 3b. Check ritual shares (needed for grid completion)
    const { data: ritualShares } = await supabase
      .from('ritual_shares')
      .select('*')
      .or(`fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(20);

    // 3c. Check today's ritual shares
    const { data: todayShares } = await supabase
      .from('ritual_shares')
      .select('*')
      .or(`fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    // 4. Check contest entries
    const { data: contestEntries } = await supabase
      .from('contest_entries')
      .select('*')
      .or(`farcaster_fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Check user_shares
    const { data: userShares } = await supabase
      .from('user_shares')
      .select('*')
      .eq('farcaster_fid', vladFid)
      .order('created_at', { ascending: false })
      .limit(10);

    // 6. Check checkins
    const { data: checkins } = await supabase
      .from('checkin_records')
      .select('*')
      .or(`fid.eq.${vladFid},wallet_address.in.(${walletVariations.join(',')})`)
      .order('checked_in_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      searchCriteria: {
        fid: vladFid,
        wallets: walletVariations
      },
      results: {
        unifiedUsers: {
          count: unifiedUsers?.length || 0,
          records: unifiedUsers?.map(u => ({
            id: u.id,
            fid: u.farcaster_fid,
            wallet: u.wallet_address,
            verifiedAddresses: u.verified_addresses,
            createdAt: u.created_at
          }))
        },
        users: {
          count: users?.length || 0,
          records: users?.map(u => ({
            id: u.id,
            fid: u.fid,
            wallet: u.wallet_address,
            createdAt: u.created_at
          }))
        },
        ritualCompletions: {
          totalCount: ritualCompletions?.length || 0,
          todayCount: todayCompletions?.length || 0,
          byRitualId: ritualCompletions?.reduce((acc: any, r) => {
            acc[r.ritual_id] = (acc[r.ritual_id] || 0) + 1;
            return acc;
          }, {}),
          todaysCompletions: todayCompletions?.map(r => ({
            ritualId: r.ritual_id,
            wallet: r.wallet_address,
            fid: r.fid,
            completed: r.completed,
            createdAt: r.created_at
          })),
          recent: ritualCompletions?.slice(0, 5).map(r => ({
            ritualId: r.ritual_id,
            wallet: r.wallet_address,
            fid: r.fid,
            completed: r.completed,
            createdAt: r.created_at
          }))
        },
        ritualShares: {
          totalCount: ritualShares?.length || 0,
          todayCount: todayShares?.length || 0,
          todaysShares: todayShares?.map(s => ({
            ritualId: s.ritual_id,
            platform: s.platform,
            wallet: s.wallet_address,
            fid: s.fid,
            createdAt: s.created_at
          })),
          recentShares: ritualShares?.slice(0, 5).map(s => ({
            ritualId: s.ritual_id,
            platform: s.platform,
            wallet: s.wallet_address,
            fid: s.fid,
            createdAt: s.created_at
          }))
        },
        contestEntries: {
          count: contestEntries?.length || 0,
          entries: contestEntries?.map(e => ({
            contestId: e.contest_id,
            wallet: e.wallet_address,
            fid: e.farcaster_fid,
            username: e.farcaster_username,
            createdAt: e.created_at
          }))
        },
        userShares: {
          count: userShares?.length || 0,
          shares: userShares?.map(s => ({
            shareType: s.share_type,
            contentId: s.content_id,
            verified: s.verified,
            createdAt: s.created_at
          }))
        },
        checkins: {
          count: checkins?.length || 0,
          records: checkins?.map(c => ({
            wallet: c.wallet_address,
            fid: c.fid,
            checkedAt: c.checked_in_at
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error checking Vlad data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}