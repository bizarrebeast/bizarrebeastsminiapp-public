import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Get admin wallet from headers for authentication
    const adminWallet = request.headers.get('x-admin-wallet');

    if (!adminWallet || adminWallet.toLowerCase() !== process.env.NEXT_PUBLIC_CONTEST_ADMIN_WALLET?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Create a new test contest
    const contestData = {
      title: body.title || 'Screenshot Upload Test',
      description: body.description || 'Testing R2 storage integration',
      type: body.type || 'screenshot',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      min_bb_required: body.min_bb_required || 0,
      prizes: body.prizes || {
        first: 1000,
        second: 500,
        third: 250
      },
      metadata: {
        created_by: 'admin',
        r2_enabled: true
      }
    };

    const { data: contest, error } = await supabase
      .from('contests')
      .insert(contestData)
      .select()
      .single();

    if (error) {
      console.error('Error creating contest:', error);
      return NextResponse.json(
        { error: 'Failed to create contest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contest: {
        id: contest.id,
        title: contest.title,
        status: contest.status
      },
      message: `Contest created! ID: ${contest.id}`
    });

  } catch (error) {
    console.error('Create contest error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}