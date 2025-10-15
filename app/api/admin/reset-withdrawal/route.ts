import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  // Get the latest failed withdrawal
  const { data: failed, error: queryError } = await supabaseAdmin
    .from('flip_withdrawals')
    .select('*')
    .eq('status', 'failed')
    .order('requested_at', { ascending: false })
    .limit(1)
    .single();

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  if (!failed) {
    return NextResponse.json({ error: 'No failed withdrawals found' }, { status: 404 });
  }

  // Reset to pending
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('flip_withdrawals')
    .update({
      status: 'pending',
      processed_at: null,
      error_message: null
    })
    .eq('id', failed.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Withdrawal reset to pending',
    withdrawal: {
      id: updated.id,
      wallet: updated.wallet_address,
      amount: updated.amount,
      status: updated.status
    }
  });
}
