import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  const sql = `
    CREATE OR REPLACE FUNCTION get_pending_withdrawals(max_count INT DEFAULT 10)
    RETURNS TABLE (
      id UUID,
      wallet_address TEXT,
      amount_text TEXT,
      status TEXT,
      requested_at TIMESTAMPTZ
    )
    LANGUAGE SQL
    AS $$
      SELECT
        id,
        wallet_address,
        amount::TEXT as amount_text,
        status,
        requested_at
      FROM flip_withdrawals
      WHERE status = 'pending'
      ORDER BY requested_at ASC
      LIMIT max_count;
    $$;
  `;

  const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: sql });

  if (error) {
    // Try alternative approach - call the SQL directly via raw query
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      });

      if (!result.ok) {
        return NextResponse.json({
          error: 'Migration failed',
          details: error.message,
          note: 'Please run this SQL manually in Supabase SQL editor',
          sql
        }, { status: 500 });
      }
    } catch (e: any) {
      return NextResponse.json({
        error: 'Migration failed',
        details: error.message,
        note: 'Please run this SQL manually in Supabase SQL editor',
        sql
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Migration applied successfully'
  });
}
