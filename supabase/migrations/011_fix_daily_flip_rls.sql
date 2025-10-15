-- Fix RLS policies for daily flip feature
-- Allow users to insert their own flips (both free daily and betting)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own flips" ON coin_flip_bets;
DROP POLICY IF EXISTS "Users can read their own flips" ON coin_flip_bets;

-- Allow users to insert flips
CREATE POLICY "Users can insert their own flips"
ON coin_flip_bets
FOR INSERT
WITH CHECK (
  -- Either wallet address matches
  (auth.jwt() ->> 'wallet_address')::text = lower(wallet_address)
  OR
  -- Or allow service role (for API)
  auth.role() = 'service_role'
  OR
  -- Or allow anon inserts with valid wallet/fid
  (wallet_address IS NOT NULL OR farcaster_fid IS NOT NULL)
);

-- Allow users to read their own flips
CREATE POLICY "Users can read their own flips"
ON coin_flip_bets
FOR SELECT
USING (
  -- Either wallet address matches
  (auth.jwt() ->> 'wallet_address')::text = lower(wallet_address)
  OR
  -- Or allow service role
  auth.role() = 'service_role'
  OR
  -- Or allow reading by farcaster FID
  (farcaster_fid IS NOT NULL)
);

-- Ensure RLS is enabled
ALTER TABLE coin_flip_bets ENABLE ROW LEVEL SECURITY;
