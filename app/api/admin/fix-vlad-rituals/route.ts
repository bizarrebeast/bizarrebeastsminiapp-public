import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const vladFid = 1025376;
    const vladWallet = '0xfb70c8B3d0cbd18F5bCaf871831166bBf78CF742'.toLowerCase();

    // The rituals Vlad completed today based on Farcaster evidence
    const ritualsToAdd = [
      { id: 1, title: 'Create GIVE', castHash: '0x6b548ec8' },
      { id: 2, title: 'Dexscreener', castHash: '0x0922a681' },
      { id: 3, title: 'Empire rank', castHash: '0xb664bff4' }
    ];

    const results = [];

    for (const ritual of ritualsToAdd) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('ritual_completions')
        .select('*')
        .eq('fid', vladFid)
        .eq('ritual_id', ritual.id)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .single();

      if (!existing) {
        // Add the ritual completion
        const { data, error } = await supabase
          .from('ritual_completions')
          .insert({
            wallet_address: vladWallet,
            fid: vladFid,
            ritual_id: ritual.id,
            ritual_title: ritual.title,
            completed: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          results.push({
            ritualId: ritual.id,
            status: 'error',
            error: error.message
          });
        } else {
          results.push({
            ritualId: ritual.id,
            status: 'added',
            data
          });
        }
      } else {
        results.push({
          ritualId: ritual.id,
          status: 'already_exists',
          data: existing
        });
      }
    }

    // Also ensure Vlad's wallet is properly linked in unified_users
    const { data: userUpdate, error: userError } = await supabase
      .from('unified_users')
      .update({
        wallet_address: vladWallet,
        updated_at: new Date().toISOString()
      })
      .eq('farcaster_fid', vladFid);

    return NextResponse.json({
      success: true,
      message: 'Vlad\'s rituals have been retroactively added',
      rituals: results,
      userWalletFixed: !userError,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fixing Vlad rituals:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}