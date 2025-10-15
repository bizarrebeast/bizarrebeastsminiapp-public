import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractAuthHeaders, verifyCompleteAuth } from '@/lib/auth/verification-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, ritualId, shared = false, fid, blockTimestamp } = await request.json();

    // Allow either walletAddress OR fid to be provided
    if ((!walletAddress && !fid) || ritualId === undefined) {
      return NextResponse.json({ error: 'Missing required fields: need either walletAddress or fid' }, { status: 400 });
    }

    // Use block timestamp if provided (for ritual 10 attestations), otherwise use current time
    const completionTimestamp = blockTimestamp ? new Date(blockTimestamp) : new Date();
    console.log('📅 Recording ritual completion with timestamp:', completionTimestamp.toISOString());

    // Try to get FID from multiple sources
    let userFid = fid;

    // If no FID provided in body, try to get from auth
    if (!userFid) {
      const { authToken } = extractAuthHeaders(request);

      if (authToken) {
        const verification = await verifyCompleteAuth(authToken, null);

        if (verification.success && verification.user?.fid) {
          userFid = verification.user.fid;
          console.log('Got FID from auth:', userFid);
        }
      }
    }

    // Mark ritual as completed - with FID if available
    const insertData: any = {
      ritual_id: ritualId,
      ritual_title: `Ritual ${ritualId}`, // Add a default title
      completed: true,
      created_at: completionTimestamp.toISOString() // Use blockchain timestamp for ritual 10, current time for others
    };

    // Use wallet address if provided, otherwise use FID-based identifier
    if (walletAddress) {
      insertData.wallet_address = walletAddress.toLowerCase();
    } else if (userFid) {
      // For FID-only users, use a placeholder wallet address
      insertData.wallet_address = `fid:${userFid}`;
    }

    // Add FID if we have it
    if (userFid) {
      insertData.fid = userFid;
      console.log(`Storing ritual ${ritualId} for FID ${userFid} with wallet ${walletAddress || 'FID-only'}`);
    }

    const { data, error } = await supabase
      .from('ritual_completions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error marking ritual complete:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in complete ritual:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let walletAddress = searchParams.get('wallet');
    const fidParam = searchParams.get('fid');
    const dateParam = searchParams.get('date');

    console.log('🔍 GET /api/rituals/complete called with:', {
      wallet: walletAddress,
      fid: fidParam,
      date: dateParam,
      headers: {
        authorization: request.headers.get('authorization')?.substring(0, 20) + '...',
        'x-wallet-address': request.headers.get('x-wallet-address')
      }
    });

    // Use UTC date to avoid timezone issues
    // Force UTC by using Date.UTC to get the current UTC date
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const date = dateParam || utcDate.toISOString().split('T')[0];

    // Create date range that spans the full day in all timezones
    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;

    let completions: any[] = [];
    let userFid = fidParam ? parseInt(fidParam) : null;
    let allUserWallets: string[] = [];

    // Try to get FID and verified wallets from auth
    const { authToken } = extractAuthHeaders(request);

    if (authToken) {
      console.log('🔐 Auth token found, verifying...');
      const verification = await verifyCompleteAuth(authToken, walletAddress);
      console.log('🔐 Verification result:', {
        success: verification.success,
        hasFid: !!verification.user?.fid,
        fid: verification.user?.fid,
        hasVerifiedAddresses: verification.user?.verifiedAddresses && verification.user.verifiedAddresses.length > 0,
        verifiedAddressCount: verification.user?.verifiedAddresses?.length || 0
      });

      if (verification.success && verification.user) {
        if (!userFid) {
          userFid = verification.user.fid;
          console.log('Using FID from auth:', userFid);
        }

        // Get ALL verified addresses from auth
        if (verification.user.verifiedAddresses && verification.user.verifiedAddresses.length > 0) {
          allUserWallets = verification.user.verifiedAddresses.map((addr: string) => addr.toLowerCase());
          console.log(`Got ${allUserWallets.length} verified wallets from auth for FID ${userFid}`);
        }
      }
    } else {
      console.log('⚠️ No auth token found in request');
    }

    // If we have FID but no wallets yet, fetch from Neynar directly
    if (userFid && allUserWallets.length === 0) {
      console.log(`Fetching verified wallets from Neynar for FID ${userFid}`);

      // Import the function we need
      const { fetchUserFromNeynar } = await import('@/lib/auth/verification-service');
      const userData = await fetchUserFromNeynar(userFid);

      if (userData?.verified_addresses?.eth_addresses) {
        allUserWallets = userData.verified_addresses.eth_addresses.map((addr: string) => addr.toLowerCase());
        console.log(`Got ${allUserWallets.length} verified wallets from Neynar for FID ${userFid}:`, allUserWallets);
      }
    }

    // Add current wallet if provided and not in list
    if (walletAddress && !allUserWallets.includes(walletAddress.toLowerCase())) {
      allUserWallets.push(walletAddress.toLowerCase());
    }

    // Use a Map to deduplicate rituals across multiple queries
    const allCompletions = new Map<number, any>();

    // Priority 1: If we have FID, fetch all rituals by FID column
    if (userFid) {
      console.log(`Fetching rituals for FID ${userFid}`);
      const { data: fidCompletions, error: fidError } = await supabase
        .from('ritual_completions')
        .select('ritual_id, completed, created_at, wallet_address')
        .eq('fid', userFid)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (fidError) {
        console.error('Error fetching by FID:', fidError);
      } else if (fidCompletions) {
        fidCompletions.forEach(c => {
          allCompletions.set(c.ritual_id, c);
        });
        console.log(`Found ${fidCompletions.length} rituals by FID ${userFid}`);
      }
    }

    // Priority 2: If we have verified wallets, fetch from ALL of them
    if (allUserWallets.length > 0) {
      console.log(`Fetching rituals for ${allUserWallets.length} verified wallets`);
      const { data: walletCompletions, error: walletError } = await supabase
        .from('ritual_completions')
        .select('ritual_id, completed, created_at, wallet_address')
        .in('wallet_address', allUserWallets)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (walletError) {
        console.error('Error fetching by wallets:', walletError);
      } else if (walletCompletions) {
        walletCompletions.forEach(c => {
          allCompletions.set(c.ritual_id, c);
        });
        console.log(`Found ${walletCompletions.length} rituals across ${allUserWallets.length} wallets`);
      }
    }

    // Priority 3: If still no results but we have a single wallet, try it alone
    if (allCompletions.size === 0 && walletAddress && allUserWallets.length === 0) {
      console.log(`Fetching rituals for single wallet ${walletAddress}`);
      const { data: walletCompletions, error: walletError } = await supabase
        .from('ritual_completions')
        .select('ritual_id, completed, created_at, wallet_address')
        .eq('wallet_address', walletAddress.toLowerCase())
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (walletError) {
        console.error('Error fetching by wallet:', walletError);
      } else if (walletCompletions) {
        walletCompletions.forEach(c => {
          allCompletions.set(c.ritual_id, c);
        });
        console.log(`Found ${walletCompletions.length} rituals for wallet ${walletAddress}`);
      }
    }

    // Convert map to array
    completions = Array.from(allCompletions.values());

    // Priority 2.5: If still no results but we have FID, try FID-based wallet placeholder
    if (completions.length === 0 && userFid) {
      const fidWallet = `fid:${userFid}`;
      console.log(`Fetching rituals for FID-based wallet ${fidWallet}`);
      const { data: fidWalletCompletions, error: fidWalletError } = await supabase
        .from('ritual_completions')
        .select('ritual_id, completed, created_at')
        .eq('wallet_address', fidWallet)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (!fidWalletError && fidWalletCompletions) {
        completions = fidWalletCompletions;
        console.log(`Found ${completions.length} rituals for FID-based wallet`);
      }
    }

    // Priority 3: If still no results but we have auth, try verified addresses
    if (completions.length === 0) {
      const { authToken } = extractAuthHeaders(request);
      if (authToken) {
        const verification = await verifyCompleteAuth(authToken, null);

        if (verification.success && verification.user?.verifiedAddresses && verification.user.verifiedAddresses.length > 0) {
          const verifiedLower = verification.user.verifiedAddresses.map((addr: string) => addr.toLowerCase());
          console.log('Checking verified addresses:', verifiedLower);

          const { data: verifiedCompletions, error: verifiedError } = await supabase
            .from('ritual_completions')
            .select('ritual_id, completed, created_at')
            .in('wallet_address', verifiedLower)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

          if (!verifiedError) {
            completions = verifiedCompletions || [];
            console.log(`Found ${completions.length} rituals for verified addresses`);
          }
        }
      }
    }

    // Check if ritual_id 0 (featured) is in the completions
    const hasFeaturedInCompletions = completions?.some(c => c.ritual_id === 0) || false;

    // Also try to get featured ritual completion specifically (ritual_id = 0)
    let featuredCompleted = hasFeaturedInCompletions;

    if (!featuredCompleted) {
      // Double-check for featured ritual
      if (userFid) {
        // Check by FID
        const { data: featuredCompletion } = await supabase
          .from('ritual_completions')
          .select('ritual_id, created_at')
          .eq('fid', userFid)
          .eq('ritual_id', 0)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .limit(1)
          .maybeSingle();

        featuredCompleted = !!featuredCompletion;
      } else if (walletAddress) {
        // Check by wallet
        const { data: featuredCompletion } = await supabase
          .from('ritual_completions')
          .select('ritual_id, created_at')
          .eq('wallet_address', walletAddress.toLowerCase())
          .eq('ritual_id', 0)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .limit(1)
          .maybeSingle();

        featuredCompleted = !!featuredCompletion;
      }
    }

    // Get last attestation time for ritual 10 cooldown checking
    // Ritual 10 uses 20-hour cooldown, not daily reset, so we need to check beyond today's date range
    let lastAttestationTime: string | null = null;

    // Check if ritual 10 is in today's completions
    const ritual10Completion = completions?.find(c => c.ritual_id === 10);
    if (ritual10Completion) {
      lastAttestationTime = ritual10Completion.created_at;
    } else {
      // If not found in today's completions, check last 20 hours for ritual 10
      const twentyHoursAgo = new Date(Date.now() - (20 * 60 * 60 * 1000)).toISOString();

      if (userFid) {
        const { data: recentAttestation } = await supabase
          .from('ritual_completions')
          .select('ritual_id, created_at')
          .eq('fid', userFid)
          .eq('ritual_id', 10)
          .gte('created_at', twentyHoursAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentAttestation) {
          lastAttestationTime = recentAttestation.created_at;
        }
      } else if (walletAddress) {
        const { data: recentAttestation } = await supabase
          .from('ritual_completions')
          .select('ritual_id, created_at')
          .eq('wallet_address', walletAddress.toLowerCase())
          .eq('ritual_id', 10)
          .gte('created_at', twentyHoursAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentAttestation) {
          lastAttestationTime = recentAttestation.created_at;
        }
      }
    }

    const response = {
      completedRituals: completions?.filter(c => c.ritual_id !== 0).map(c => c.ritual_id) || [],
      sharedRituals: completions?.filter(c => c.completed && c.ritual_id !== 0).map(c => c.ritual_id) || [],
      featuredCompleted,
      lastAttestationTime, // Include for cross-device cooldown sync
      date
    };

    console.log('📤 Returning response:', {
      completedRitualsCount: response.completedRituals.length,
      completedRituals: response.completedRituals,
      featuredCompleted: response.featuredCompleted,
      lastAttestationTime: response.lastAttestationTime,
      date: response.date,
      userFid,
      walletCount: allUserWallets.length
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching ritual completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}