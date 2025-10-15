/**
 * POST /api/admin/flip/award-spins
 * Award bonus spins to a user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    // Get admin wallet from header or body
    const adminWallet = request.headers.get('x-wallet-address');

    if (!isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { recipient, spins, reason, expiresIn } = await request.json();

    // Validation
    if (!recipient || !spins) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient, spins' },
        { status: 400 }
      );
    }

    if (spins < 1 || spins > 100) {
      return NextResponse.json(
        { error: 'Spins must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Parse recipient (wallet address or FID)
    const isWallet = recipient.startsWith('0x');
    const walletAddress = isWallet ? recipient.toLowerCase() : null;
    const fid = !isWallet ? parseInt(recipient) : null;

    if (!isWallet && isNaN(fid as number)) {
      return NextResponse.json(
        { error: 'Invalid recipient. Must be wallet address (0x...) or Farcaster FID (number)' },
        { status: 400 }
      );
    }

    // If FID provided, try to get wallet address
    let username = null;
    if (fid) {
      // TODO: Fetch username from Neynar or database
      // For now, leave as null
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresIn && expiresIn !== 'never') {
      const now = Date.now();
      const expiryMap: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      const expiryMs = expiryMap[expiresIn] || 0;

      if (expiryMs > 0) {
        expiresAt = new Date(now + expiryMs).toISOString();
      }
    }

    // Check if user already has bonus spins
    let existingQuery = supabase
      .from('flip_bonus_spins')
      .select('*');

    if (walletAddress) {
      existingQuery = existingQuery.eq('wallet_address', walletAddress);
    } else {
      existingQuery = existingQuery.eq('farcaster_fid', fid);
    }

    const { data: existing } = await existingQuery.single();

    let result;
    if (existing) {
      // Add to existing spins
      const { data, error } = await supabase
        .from('flip_bonus_spins')
        .update({
          bonus_spins_remaining: existing.bonus_spins_remaining + spins,
          bonus_spins_awarded: existing.bonus_spins_awarded + spins,
          reason: reason || existing.reason,
          awarded_by: adminWallet,
          awarded_at: new Date().toISOString(),
          expires_at: expiresAt || existing.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating bonus spins:', error);
        return NextResponse.json(
          { error: 'Failed to update bonus spins', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new bonus spins record
      const { data, error } = await supabase
        .from('flip_bonus_spins')
        .insert({
          wallet_address: walletAddress,
          farcaster_fid: fid,
          farcaster_username: username,
          bonus_spins_remaining: spins,
          bonus_spins_awarded: spins,
          reason: reason || 'Admin award',
          awarded_by: adminWallet,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating bonus spins:', error);
        return NextResponse.json(
          { error: 'Failed to create bonus spins', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      award: {
        recipient: walletAddress || `FID:${fid}`,
        spinsAwarded: spins,
        totalSpinsNow: result.bonus_spins_remaining,
        reason: result.reason,
        expiresAt: result.expires_at,
        awardedBy: adminWallet
      },
      message: `Successfully awarded ${spins} bonus spin${spins > 1 ? 's' : ''} to ${walletAddress || `FID:${fid}`}`
    });

  } catch (error) {
    console.error('Error in /api/admin/flip/award-spins:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/flip/award-spins
 * Get recent bonus spin awards (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-wallet-address');

    if (!isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get recent awards
    const { data: awards, error } = await supabase
      .from('flip_bonus_spins')
      .select('*')
      .order('awarded_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching bonus spins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch awards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      awards: awards.map(award => ({
        id: award.id,
        recipient: award.wallet_address || `FID:${award.farcaster_fid}`,
        username: award.farcaster_username,
        spinsRemaining: award.bonus_spins_remaining,
        spinsAwarded: award.bonus_spins_awarded,
        spinsUsed: award.total_used,
        reason: award.reason,
        awardedBy: award.awarded_by,
        awardedAt: award.awarded_at,
        expiresAt: award.expires_at,
        lastUsedAt: award.last_used_at
      }))
    });

  } catch (error) {
    console.error('Error in GET /api/admin/flip/award-spins:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
