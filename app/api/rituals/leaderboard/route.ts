import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const neynarClient = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY! });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ritualId = searchParams.get('ritualId');

  if (!ritualId) {
    return NextResponse.json({ error: 'Ritual ID is required' }, { status: 400 });
  }

  try {
    // Get all completions for this specific ritual
    const { data: completions, error: completionsError } = await supabase
      .from('ritual_completions')
      .select('*')
      .eq('ritual_id', ritualId)
      .order('created_at', { ascending: true });

    if (completionsError) {
      console.error('Error fetching completions:', completionsError);
      throw completionsError;
    }

    if (!completions || completions.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        stats: {
          totalCompletions: 0,
          uniqueUsers: 0
        }
      });
    }

    // Group completions by user (wallet_address or fid)
    const userCompletionsMap = new Map<string, {
      identifier: string;
      wallet_address?: string;
      farcaster_fid?: number;
      username?: string;
      completion_count: number;
      first_completed_at: string;
      last_completed_at: string;
    }>();

    completions.forEach((completion) => {
      // Use FID as primary identifier, fallback to wallet
      const identifier = completion.fid
        ? `fid:${completion.fid}`
        : completion.wallet_address || 'unknown';

      if (!userCompletionsMap.has(identifier)) {
        userCompletionsMap.set(identifier, {
          identifier,
          wallet_address: completion.wallet_address,
          farcaster_fid: completion.fid,
          username: undefined, // Will fetch from Neynar
          completion_count: 1,
          first_completed_at: completion.created_at,
          last_completed_at: completion.created_at
        });
      } else {
        const user = userCompletionsMap.get(identifier)!;
        user.completion_count++;
        user.last_completed_at = completion.created_at;
      }
    });

    // Fetch usernames from Neynar for users with FIDs
    const usersWithFids = Array.from(userCompletionsMap.values())
      .filter(user => user.farcaster_fid);

    if (usersWithFids.length > 0) {
      try {
        const fids = usersWithFids.map(u => u.farcaster_fid!);
        const bulkUsers = await neynarClient.fetchBulkUsers({ fids });

        // Map usernames back to our user data
        bulkUsers.users.forEach((neynarUser) => {
          const identifier = `fid:${neynarUser.fid}`;
          const user = userCompletionsMap.get(identifier);
          if (user) {
            user.username = neynarUser.username;
          }
        });
      } catch (neynarError) {
        console.error('Error fetching usernames from Neynar:', neynarError);
        // Continue without usernames
      }
    }

    // Sort and rank users
    const leaderboard = Array.from(userCompletionsMap.values())
      .sort((a, b) => {
        // Sort by completion count (descending)
        if (b.completion_count !== a.completion_count) {
          return b.completion_count - a.completion_count;
        }
        // Break ties by earliest first completion (ascending)
        return a.first_completed_at.localeCompare(b.first_completed_at);
      })
      .map((user, index) => ({
        rank: index + 1,
        identifier: user.identifier,
        wallet_address: user.wallet_address,
        username: user.username,
        farcaster_fid: user.farcaster_fid,
        completion_count: user.completion_count,
        last_completed_at: user.last_completed_at
      }));

    // Calculate stats
    const totalCompletions = completions.length;
    const uniqueUsers = leaderboard.length;

    return NextResponse.json({
      leaderboard,
      stats: {
        totalCompletions,
        uniqueUsers
      }
    });
  } catch (error) {
    console.error('Error fetching ritual leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}