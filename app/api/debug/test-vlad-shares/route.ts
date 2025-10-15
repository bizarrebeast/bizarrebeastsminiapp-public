import { NextRequest, NextResponse } from 'next/server';
import { searchUserCastsForRitual } from '@/lib/neynar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const vladFid = 1025376;
    const vladWallet = '0xfb70c8B3d0cbd18F5bCaf871831166bBf78CF742';

    // Test verification for specific rituals Vlad shared
    const ritualTests = [
      { id: 1, name: 'Create GIVE', castHash: '0x6b548ec8' },
      { id: 2, name: 'Dexscreener', castHash: '0x0922a681' },
      { id: 3, name: 'Empire rank', castHash: '0xb664bff4' },
    ];

    const results = [];

    for (const ritual of ritualTests) {
      console.log(`\n=== Testing Ritual ${ritual.id}: ${ritual.name} ===`);

      // Test Neynar verification
      const verificationResult = await searchUserCastsForRitual(vladFid, ritual.id);

      results.push({
        ritualId: ritual.id,
        name: ritual.name,
        expectedCastHash: ritual.castHash,
        neynarVerified: verificationResult.verified,
        neynarMessage: verificationResult.message,
        foundCast: verificationResult.cast ? {
          hash: verificationResult.cast.hash,
          text: verificationResult.cast.text?.substring(0, 100),
          timestamp: verificationResult.cast.timestamp
        } : null
      });
    }

    // Check database records
    const { data: dbCompletions } = await supabase
      .from('ritual_completions')
      .select('*')
      .eq('fid', vladFid)
      .order('created_at', { ascending: false })
      .limit(10);

    // Check shares table
    const { data: shares } = await supabase
      .from('user_shares')
      .select('*')
      .eq('farcaster_fid', vladFid)
      .eq('share_type', 'ritual')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check unified users table
    const { data: userData } = await supabase
      .from('unified_users')
      .select('*')
      .eq('farcaster_fid', vladFid)
      .single();

    return NextResponse.json({
      fid: vladFid,
      wallet: vladWallet,
      timestamp: new Date().toISOString(),
      verificationTests: results,
      database: {
        ritualCompletions: dbCompletions?.length || 0,
        completionDetails: dbCompletions?.map(c => ({
          ritualId: c.ritual_id,
          completed: c.completed,
          createdAt: c.created_at
        })),
        userShares: shares?.length || 0,
        shareDetails: shares?.map(s => ({
          contentId: s.content_id,
          verified: s.verified,
          verifiedAt: s.verified_at,
          createdAt: s.created_at
        })),
        unifiedUser: userData ? {
          id: userData.id,
          fid: userData.farcaster_fid,
          walletAddress: userData.wallet_address,
          verifiedAddresses: userData.verified_addresses
        } : null
      }
    });
  } catch (error) {
    console.error('Error testing Vlad shares:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}