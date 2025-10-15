/**
 * POST /api/flip/withdraw
 * Request withdrawal of accumulated $BB winnings
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MIN_WITHDRAWAL_AMOUNT = '20000000000000000000000'; // 20,000 $BB in wei (lowered for testing)

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get current balance
    const { data: balance, error: balanceError } = await supabase
      .from('flip_player_balances')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (balanceError || !balance) {
      return NextResponse.json(
        { error: 'No balance found' },
        { status: 404 }
      );
    }

    // Check minimum withdrawal
    if (BigInt(balance.pending_balance) < BigInt(MIN_WITHDRAWAL_AMOUNT)) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          message: 'Minimum withdrawal is 20,000 $BB',
          currentBalance: balance.pending_balance,
          minRequired: MIN_WITHDRAWAL_AMOUNT
        },
        { status: 400 }
      );
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawal } = await supabase
      .from('flip_withdrawals')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .in('status', ['pending', 'processing'])
      .single();

    if (pendingWithdrawal) {
      return NextResponse.json(
        {
          error: 'Withdrawal already pending',
          withdrawal: {
            id: pendingWithdrawal.id,
            amount: pendingWithdrawal.amount,
            status: pendingWithdrawal.status,
            requestedAt: pendingWithdrawal.requested_at
          }
        },
        { status: 400 }
      );
    }

    const withdrawAmount = balance.pending_balance;

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('flip_withdrawals')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        amount: withdrawAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError);
      return NextResponse.json(
        { error: 'Failed to create withdrawal', details: withdrawalError.message },
        { status: 500 }
      );
    }

    // Update balance (deduct from pending, add to total_withdrawn)
    const { error: updateError } = await supabase
      .from('flip_player_balances')
      .update({
        pending_balance: '0',
        total_withdrawn: (BigInt(balance.total_withdrawn) + BigInt(withdrawAmount)).toString(),
        last_withdrawal_at: new Date().toISOString(),
        total_withdrawals: (balance.total_withdrawals || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress.toLowerCase());

    if (updateError) {
      console.error('Error updating balance:', updateError);
      // Note: Withdrawal record exists but balance wasn't updated
      // This should be handled by admin review
    }

    // Convert wei to $BB for display
    const amountBB = (BigInt(withdrawAmount) / BigInt('1000000000000000000')).toString();

    // Trigger instant processing (don't wait for cron)
    // Fire and forget - don't block the response
    const processorUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}/api/flip/process-withdrawals`;
    fetch(processorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('Failed to trigger instant withdrawal processing:', err);
      // Cron will pick it up later if this fails
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawAmount,
        amountBB: amountBB,
        status: withdrawal.status,
        requestedAt: withdrawal.requested_at
      },
      message: `Withdrawal processing... Your tokens will arrive within 1-2 minutes.`
    });

  } catch (error) {
    console.error('Error in /api/flip/withdraw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/flip/withdraw
 * Get withdrawal history and pending balance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get balance
    const { data: balance } = await supabase
      .from('flip_player_balances')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    // Get withdrawal history
    const { data: withdrawals } = await supabase
      .from('flip_withdrawals')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('requested_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      balance: balance ? {
        totalWon: balance.total_won,
        totalWithdrawn: balance.total_withdrawn,
        pendingBalance: balance.pending_balance,
        totalWonBB: (BigInt(balance.total_won) / BigInt('1000000000000000000')).toString(),
        totalWithdrawnBB: (BigInt(balance.total_withdrawn) / BigInt('1000000000000000000')).toString(),
        pendingBalanceBB: (BigInt(balance.pending_balance) / BigInt('1000000000000000000')).toString(),
        canWithdraw: BigInt(balance.pending_balance) >= BigInt(MIN_WITHDRAWAL_AMOUNT),
        minWithdrawalBB: '20000'
      } : null,
      withdrawals: withdrawals?.map(w => ({
        id: w.id,
        amount: w.amount,
        amountBB: (BigInt(w.amount) / BigInt('1000000000000000000')).toString(),
        status: w.status,
        txHash: w.tx_hash,
        requestedAt: w.requested_at,
        processedAt: w.processed_at,
        completedAt: w.completed_at
      })) || []
    });

  } catch (error) {
    console.error('Error in GET /api/flip/withdraw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
