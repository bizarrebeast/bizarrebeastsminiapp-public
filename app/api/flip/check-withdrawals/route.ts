import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('flip_withdrawals')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    withdrawals: data.map(w => ({
      id: w.id.substring(0, 8),
      wallet: w.wallet_address,
      amount: w.amount,
      amountRaw: JSON.stringify(w.amount),
      amountType: typeof w.amount,
      amountToFixed: typeof w.amount === 'number' ? w.amount.toFixed(0) : w.amount,
      status: w.status,
      error: w.error_message,
      requested: w.requested_at,
      processed: w.processed_at
    }))
  });
}
