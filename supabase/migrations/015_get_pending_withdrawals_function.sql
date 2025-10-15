-- Create RPC function to get pending withdrawals with amount as text
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
