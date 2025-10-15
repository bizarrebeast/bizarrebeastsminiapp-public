import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch all rewards with user stats
    const { data: rewards, error: rewardsError } = await supabase
      .from('bizarre_reward_dashboard')
      .select('*')
      .order('achieved_date', { ascending: false });

    if (rewardsError) throw rewardsError;

    // Calculate statistics
    const stats = {
      total_pending: 0,
      total_claimed: 0,
      pending_7_day: 0,
      pending_30_day: 0,
      pending_100_day: 0,
      total_tokens_pending: '0',
      total_tokens_distributed: '0'
    };

    let tokensPending = 0;
    let tokensDistributed = 0;

    rewards?.forEach((reward: any) => {
      if (reward.status === 'pending') {
        stats.total_pending++;
        tokensPending += parseInt(reward.token_reward || '0');

        switch (reward.milestone_type) {
          case '7_day':
            stats.pending_7_day++;
            break;
          case '30_day':
            stats.pending_30_day++;
            break;
          case '100_day':
            stats.pending_100_day++;
            break;
        }
      } else {
        stats.total_claimed++;
        tokensDistributed += parseInt(reward.token_reward || '0');
      }
    });

    stats.total_tokens_pending = tokensPending.toString();
    stats.total_tokens_distributed = tokensDistributed.toString();

    // Format rewards data
    const formattedRewards = rewards?.map((r: any) => ({
      id: r.id || 0,
      wallet_address: r.wallet_address,
      username: r.username,
      farcaster_fid: r.farcaster_fid,
      milestone_type: r.milestone_type,
      token_reward: r.token_reward,
      achieved_date: r.achieved_date,
      claimed_date: r.claimed_date,
      tx_hash: r.tx_hash,
      nft_minted: r.nft_minted,
      current_streak: r.current_streak,
      best_streak: r.best_streak,
      total_attestations: r.total_attestations,
      status: r.status
    })) || [];

    return NextResponse.json({
      rewards: formattedRewards,
      stats
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards data' },
      { status: 500 }
    );
  }
}