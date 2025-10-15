-- Add FID support to ritual tracking
-- This migration adds FID column for unified ritual tracking across wallets

-- Add FID column to ritual_completions
ALTER TABLE ritual_completions
ADD COLUMN IF NOT EXISTS fid INTEGER;

-- Add FID column to ritual_shares
ALTER TABLE ritual_shares
ADD COLUMN IF NOT EXISTS fid INTEGER;

-- Add FID column to ritual_clicks
ALTER TABLE ritual_clicks
ADD COLUMN IF NOT EXISTS fid INTEGER;

-- Create indexes for FID queries
CREATE INDEX IF NOT EXISTS idx_completions_fid
ON ritual_completions(fid)
WHERE fid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_completions_fid_date
ON ritual_completions(fid, created_at DESC)
WHERE fid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shares_fid
ON ritual_shares(fid)
WHERE fid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clicks_fid
ON ritual_clicks(fid)
WHERE fid IS NOT NULL;

-- Create a view for FID-based ritual stats
CREATE OR REPLACE VIEW user_ritual_stats_by_fid AS
SELECT
  fid,
  COUNT(DISTINCT id) as total_completions,
  COUNT(DISTINCT ritual_id) as unique_rituals_completed,
  MAX(created_at::DATE) as last_completion_date,
  MIN(created_at::DATE) as first_completion_date,
  -- Get all associated wallets for this FID
  ARRAY_AGG(DISTINCT wallet_address) FILTER (WHERE wallet_address IS NOT NULL) as wallets_used
FROM ritual_completions
WHERE fid IS NOT NULL
GROUP BY fid;

-- Grant permissions on new view
GRANT SELECT ON user_ritual_stats_by_fid TO anon, authenticated;

-- Migration helper: Update existing rituals with FID from users table
-- This will be run manually or via admin endpoint
-- DO $$
-- BEGIN
--   UPDATE ritual_completions rc
--   SET fid = u.farcaster_fid
--   FROM users u
--   WHERE rc.wallet_address = u.wallet_address
--   AND rc.fid IS NULL
--   AND u.farcaster_fid IS NOT NULL;
--
--   RAISE NOTICE 'Updated % ritual completions with FID', ROW_COUNT;
-- END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'FID support added to ritual tracking tables!';
END $$;