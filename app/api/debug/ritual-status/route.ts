import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const wallet = searchParams.get('wallet');

    if (!fid && !wallet) {
      return NextResponse.json({
        error: 'Please provide either ?fid=XXX or ?wallet=0xXXX'
      }, { status: 400 });
    }

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      queryParams: { fid, wallet },
      results: {}
    };

    // 1. Check rituals by FID
    if (fid) {
      const { data: fidRituals, error: fidError } = await supabase
        .from('ritual_completions')
        .select('*')
        .eq('fid', parseInt(fid))
        .order('created_at', { ascending: false });

      debugInfo.results.byFid = {
        count: fidRituals?.length || 0,
        rituals: fidRituals?.map(r => ({
          id: r.ritual_id,
          wallet: r.wallet_address,
          fid: r.fid,
          date: r.created_at
        })),
        error: fidError?.message
      };

      // Get unique wallets used with this FID
      if (fidRituals) {
        const uniqueWallets = [...new Set(fidRituals.map(r => r.wallet_address))];
        debugInfo.results.walletsUsedByFid = uniqueWallets;
      }
    }

    // 2. Check rituals by wallet
    if (wallet) {
      const { data: walletRituals, error: walletError } = await supabase
        .from('ritual_completions')
        .select('*')
        .eq('wallet_address', wallet.toLowerCase())
        .order('created_at', { ascending: false });

      debugInfo.results.byWallet = {
        count: walletRituals?.length || 0,
        rituals: walletRituals?.map(r => ({
          id: r.ritual_id,
          wallet: r.wallet_address,
          fid: r.fid,
          date: r.created_at
        })),
        error: walletError?.message
      };

      // Count how many have FID vs don't
      if (walletRituals) {
        debugInfo.results.walletStats = {
          withFid: walletRituals.filter(r => r.fid !== null).length,
          withoutFid: walletRituals.filter(r => r.fid === null).length,
          fidsFound: [...new Set(walletRituals.filter(r => r.fid).map(r => r.fid))]
        };
      }
    }

    // 3. For Kate specifically, check both wallets
    if (fid === '871846' || wallet?.toLowerCase() === '0x5507fec77956e9643e553bf674850379d3091327' || wallet?.toLowerCase() === '0xac4a0053f1bb9f4e87f92ad741260f89fc522e15') {
      const kateWallets = [
        '0x5507fec77956e9643e553bf674850379d3091327',
        '0xac4a0053f1bb9f4e87f92ad741260f89fc522e15'
      ];

      const { data: kateRituals } = await supabase
        .from('ritual_completions')
        .select('*')
        .or(`wallet_address.in.(${kateWallets.join(',')}),fid.eq.871846`)
        .order('created_at', { ascending: false });

      debugInfo.kateAnalysis = {
        totalRituals: kateRituals?.length || 0,
        byWallet: {
          '0x5507...': kateRituals?.filter(r => r.wallet_address === '0x5507fec77956e9643e553bf674850379d3091327').length || 0,
          '0xac4a...': kateRituals?.filter(r => r.wallet_address === '0xac4a0053f1bb9f4e87f92ad741260f89fc522e15').length || 0
        },
        withFid: kateRituals?.filter(r => r.fid === 871846).length || 0,
        withoutFid: kateRituals?.filter(r => !r.fid).length || 0,
        uniqueRitualIds: [...new Set(kateRituals?.map(r => r.ritual_id) || [])].sort(),
        details: kateRituals?.map(r => ({
          ritual: r.ritual_id,
          wallet: r.wallet_address.slice(0, 8) + '...',
          hasFid: !!r.fid,
          fid: r.fid,
          date: new Date(r.created_at).toLocaleDateString()
        }))
      };

      // Check what the API would return for Kate
      debugInfo.apiSimulation = {
        description: "What /api/rituals/complete would return",
        withFid: `If FID 871846 is provided, would return ${kateRituals?.filter(r => r.fid === 871846).length || 0} rituals`,
        withWallet0x5507: `If wallet 0x5507... is provided, would return ${kateRituals?.filter(r => r.wallet_address === '0x5507fec77956e9643e553bf674850379d3091327').length || 0} rituals`,
        withWallet0xac4a: `If wallet 0xac4a... is provided, would return ${kateRituals?.filter(r => r.wallet_address === '0xac4a0053f1bb9f4e87f92ad741260f89fc522e15').length || 0} rituals`
      };
    }

    // 4. Check users table for FID mapping
    if (wallet) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, wallet_address, farcaster_fid, farcaster_username')
        .eq('wallet_address', wallet.toLowerCase())
        .single();

      debugInfo.userTableData = userData || { found: false };
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}