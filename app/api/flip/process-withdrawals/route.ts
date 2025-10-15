/**
 * POST /api/flip/process-withdrawals
 * Automated processor for pending withdrawals
 * Can be called by:
 * 1. Vercel Cron (runs every 5 minutes)
 * 2. Manual trigger (for testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createWithdrawalService } from '@/lib/flip/withdrawal-service';

// Maximum withdrawals to process per run
const MAX_BATCH_SIZE = 10;

// Prevent concurrent processing
let isProcessing = false;

export async function POST(request: NextRequest) {
  // Verify this is called by cron or has valid auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Prevent concurrent runs
  if (isProcessing) {
    return NextResponse.json({
      message: 'Processor already running',
      skipped: true
    });
  }

  isProcessing = true;

  try {
    console.log('🚀 [Withdrawal Processor] Starting...');

    // Get pending withdrawals
    // Note: We select amount separately to ensure it comes back as string, not number
    const { data: withdrawals, error: queryError } = await supabaseAdmin
      .from('flip_withdrawals')
      .select('id, wallet_address, amount, status, requested_at')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(MAX_BATCH_SIZE);

    if (queryError) {
      console.error('[Withdrawal Processor] Error querying withdrawals:', queryError);
      return NextResponse.json(
        { error: 'Failed to query withdrawals' },
        { status: 500 }
      );
    }

    if (!withdrawals || withdrawals.length === 0) {
      console.log('[Withdrawal Processor] No pending withdrawals');
      return NextResponse.json({
        message: 'No pending withdrawals',
        processed: 0
      });
    }

    console.log(`[Withdrawal Processor] Found ${withdrawals.length} pending withdrawal(s)`);

    // Initialize withdrawal service
    let withdrawalService;
    try {
      withdrawalService = createWithdrawalService();
      console.log(`[Withdrawal Processor] Using wallet: ${withdrawalService.getWalletAddress()}`);

      // Check wallet balances
      const [tokenBalance, ethBalance] = await Promise.all([
        withdrawalService.getWalletBalance(),
        withdrawalService.getEthBalance()
      ]);

      console.log(`[Withdrawal Processor] Token balance: ${tokenBalance}`);
      console.log(`[Withdrawal Processor] ETH balance: ${ethBalance}`);

    } catch (error: any) {
      console.error('[Withdrawal Processor] Failed to initialize service:', error.message);
      return NextResponse.json(
        { error: 'Withdrawal service not configured', details: error.message },
        { status: 500 }
      );
    }

    // Process each withdrawal
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      details: [] as any[]
    };

    for (const withdrawal of withdrawals) {
      try {
        console.log(`\n[Withdrawal ${withdrawal.id}] Processing...`);
        console.log(`[Withdrawal ${withdrawal.id}] User: ${withdrawal.wallet_address}`);
        console.log(`[Withdrawal ${withdrawal.id}] Amount: ${withdrawal.amount}`);

        // Mark as processing
        await supabaseAdmin
          .from('flip_withdrawals')
          .update({
            status: 'processing',
            processed_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        // Process withdrawal
        // Handle amount from PostgreSQL NUMERIC (could be number or string)
        let amountStr: string;
        if (typeof withdrawal.amount === 'string') {
          amountStr = withdrawal.amount;
        } else if (typeof withdrawal.amount === 'number') {
          // If it's a number in scientific notation, convert it properly
          const numStr = String(withdrawal.amount);
          if (numStr.includes('e')) {
            // Parse scientific notation like "2e+22" -> "20000000000000000000000"
            const match = numStr.match(/^([0-9.]+)e\+?([0-9]+)$/i);
            if (match) {
              const [_, base, exp] = match;
              const expNum = parseInt(exp);
              // Remove decimal point if present
              const baseClean = base.replace('.', '');
              const decimalPlaces = base.includes('.') ? base.split('.')[1].length : 0;
              // For 2e+22: base="2", exp=22, baseClean="2", decimalPlaces=0
              // We need 22 total digits after decimal point shift, minus what we have
              const zerosNeeded = expNum - decimalPlaces;
              amountStr = baseClean + '0'.repeat(zerosNeeded);
            } else {
              throw new Error(`Failed to parse scientific notation: ${numStr}`);
            }
          } else {
            amountStr = numStr;
          }
        } else {
          throw new Error(`Invalid amount type: ${typeof withdrawal.amount}`);
        }

        console.log(`[Withdrawal ${withdrawal.id}] Amount (converted): ${amountStr}`);

        const result = await withdrawalService.processWithdrawal(
          withdrawal.wallet_address,
          amountStr,
          {
            maxRetries: 3,
            retryDelay: 2000
          }
        );

        if (result.success) {
          // Update as completed
          await supabaseAdmin
            .from('flip_withdrawals')
            .update({
              status: 'completed',
              tx_hash: result.txHash,
              completed_at: new Date().toISOString()
            })
            .eq('id', withdrawal.id);

          console.log(`[Withdrawal ${withdrawal.id}] ✅ SUCCESS`);
          console.log(`[Withdrawal ${withdrawal.id}] TX: ${result.txHash}`);

          results.succeeded++;
          results.details.push({
            id: withdrawal.id,
            status: 'success',
            txHash: result.txHash
          });

        } else {
          // Update as failed
          await supabaseAdmin
            .from('flip_withdrawals')
            .update({
              status: 'failed',
              error_message: result.error,
              completed_at: new Date().toISOString()
            })
            .eq('id', withdrawal.id);

          // Refund user's balance (fetch current, then update)
          const { data: currentBalance } = await supabaseAdmin
            .from('flip_player_balances')
            .select('pending_balance')
            .eq('wallet_address', withdrawal.wallet_address.toLowerCase())
            .single();

          if (currentBalance) {
            await supabaseAdmin
              .from('flip_player_balances')
              .update({
                pending_balance: (BigInt(currentBalance.pending_balance) + BigInt(withdrawal.amount)).toString(),
                updated_at: new Date().toISOString()
              })
              .eq('wallet_address', withdrawal.wallet_address.toLowerCase());
          }

          console.log(`[Withdrawal ${withdrawal.id}] ❌ FAILED: ${result.error}`);

          results.failed++;
          results.details.push({
            id: withdrawal.id,
            status: 'failed',
            error: result.error
          });
        }

        results.processed++;

      } catch (error: any) {
        console.error(`[Withdrawal ${withdrawal.id}] Unexpected error:`, error);

        // Mark as failed
        await supabaseAdmin
          .from('flip_withdrawals')
          .update({
            status: 'failed',
            error_message: error.message || 'Unexpected error',
            completed_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        // Refund balance (fetch current, then update)
        const { data: currentBalance } = await supabaseAdmin
          .from('flip_player_balances')
          .select('pending_balance')
          .eq('wallet_address', withdrawal.wallet_address.toLowerCase())
          .single();

        if (currentBalance) {
          await supabaseAdmin
            .from('flip_player_balances')
            .update({
              pending_balance: (BigInt(currentBalance.pending_balance) + BigInt(withdrawal.amount)).toString(),
              updated_at: new Date().toISOString()
            })
            .eq('wallet_address', withdrawal.wallet_address.toLowerCase());
        }

        results.failed++;
        results.processed++;
        results.details.push({
          id: withdrawal.id,
          status: 'failed',
          error: error.message
        });
      }

      // Small delay between withdrawals to avoid rate limiting
      if (withdrawals.indexOf(withdrawal) < withdrawals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n[Withdrawal Processor] Complete!');
    console.log(`[Withdrawal Processor] Processed: ${results.processed}`);
    console.log(`[Withdrawal Processor] Succeeded: ${results.succeeded}`);
    console.log(`[Withdrawal Processor] Failed: ${results.failed}`);

    return NextResponse.json({
      message: 'Processing complete',
      ...results
    });

  } catch (error: any) {
    console.error('[Withdrawal Processor] Fatal error:', error);
    return NextResponse.json(
      { error: 'Processor failed', details: error.message },
      { status: 500 }
    );

  } finally {
    isProcessing = false;
  }
}

/**
 * GET /api/flip/process-withdrawals
 * Get processor status
 */
export async function GET() {
  return NextResponse.json({
    status: isProcessing ? 'running' : 'idle',
    message: 'Withdrawal processor endpoint'
  });
}
