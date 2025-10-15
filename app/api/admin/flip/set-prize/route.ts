/**
 * POST /api/admin/flip/set-prize
 * Set monthly prize configuration (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-wallet-address');

    if (!isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const {
      month, // '2025-10-01'
      prizeName,
      prizeDescription,
      prizeValue,
      prizeImageUrl,
      drawingDate
    } = await request.json();

    // Validation
    if (!month || !prizeName || !drawingDate) {
      return NextResponse.json(
        { error: 'Missing required fields: month, prizeName, drawingDate' },
        { status: 400 }
      );
    }

    // Validate month format (YYYY-MM-01)
    if (!/^\d{4}-\d{2}-01$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Must be YYYY-MM-01 (e.g., 2025-10-01)' },
        { status: 400 }
      );
    }

    // Upsert prize
    const { data: prize, error } = await supabase
      .from('flip_monthly_prizes')
      .upsert({
        month,
        prize_name: prizeName,
        prize_description: prizeDescription || null,
        prize_value: prizeValue || null,
        prize_image_url: prizeImageUrl || null,
        drawing_date: drawingDate,
        status: 'active',
        created_by: adminWallet,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'month'
      })
      .select()
      .single();

    if (error) {
      console.error('Error setting prize:', error);
      return NextResponse.json(
        { error: 'Failed to set prize', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prize: {
        id: prize.id,
        month: prize.month,
        name: prize.prize_name,
        description: prize.prize_description,
        value: prize.prize_value,
        imageUrl: prize.prize_image_url,
        drawingDate: prize.drawing_date,
        status: prize.status
      },
      message: `Successfully set prize for ${month}`
    });

  } catch (error) {
    console.error('Error in /api/admin/flip/set-prize:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/flip/set-prize
 * Get all monthly prizes (admin only)
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

    const { data: prizes, error } = await supabase
      .from('flip_monthly_prizes')
      .select('*')
      .order('month', { ascending: false })
      .limit(12); // Last 12 months

    if (error) {
      console.error('Error fetching prizes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prizes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prizes: prizes.map(p => ({
        id: p.id,
        month: p.month,
        name: p.prize_name,
        description: p.prize_description,
        value: p.prize_value,
        imageUrl: p.prize_image_url,
        drawingDate: p.drawing_date,
        status: p.status,
        winner: p.winner_username || p.winner_wallet,
        createdBy: p.created_by
      }))
    });

  } catch (error) {
    console.error('Error in GET /api/admin/flip/set-prize:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
