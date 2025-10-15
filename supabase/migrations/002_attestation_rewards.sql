-- Attestation Rewards Tracking
-- For managing milestone rewards and tier overrides

-- Create rewards tracking table
CREATE TABLE IF NOT EXISTS bizarre_attestation_rewards (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  milestone_type TEXT NOT NULL, -- '30_day', '100_day'
  achieved_date TIMESTAMPTZ DEFAULT NOW(),
  claimed_date TIMESTAMPTZ,
  token_reward TEXT, -- Amount of $BB tokens to distribute
  nft_minted BOOLEAN DEFAULT FALSE,
  tx_hash TEXT, -- Transaction hash for reward distribution
  notes TEXT,

  -- Ensure unique milestone per wallet
  UNIQUE(wallet_address, milestone_type)
);

-- Add tier override column to stats table
ALTER TABLE bizarre_attestation_stats
ADD COLUMN IF NOT EXISTS has_bizarre_tier_override BOOLEAN DEFAULT FALSE;

-- Update the stats table to set override for 100-day achievers
UPDATE bizarre_attestation_stats
SET has_bizarre_tier_override = TRUE
WHERE best_streak >= 100;

-- Create function to check and create reward milestones
CREATE OR REPLACE FUNCTION check_attestation_milestones()
RETURNS TRIGGER AS $$
BEGIN
  -- Check 30-day milestone
  IF NEW.best_streak >= 30 THEN
    INSERT INTO bizarre_attestation_rewards (
      wallet_address,
      milestone_type,
      token_reward
    )
    VALUES (
      NEW.wallet_address,
      '30_day',
      '1000000' -- 1M $BB
    )
    ON CONFLICT (wallet_address, milestone_type) DO NOTHING;
  END IF;

  -- Check 100-day milestone
  IF NEW.best_streak >= 100 THEN
    -- Set tier override
    NEW.has_bizarre_tier_override := TRUE;

    -- Create reward record
    INSERT INTO bizarre_attestation_rewards (
      wallet_address,
      milestone_type,
      token_reward
    )
    VALUES (
      NEW.wallet_address,
      '100_day',
      '5000000' -- 5M $BB
    )
    ON CONFLICT (wallet_address, milestone_type) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for milestone checking
DROP TRIGGER IF EXISTS trigger_check_milestones ON bizarre_attestation_stats;
CREATE TRIGGER trigger_check_milestones
  BEFORE UPDATE ON bizarre_attestation_stats
  FOR EACH ROW
  WHEN (NEW.best_streak > OLD.best_streak)
  EXECUTE FUNCTION check_attestation_milestones();

-- Create view for admin dashboard
CREATE OR REPLACE VIEW bizarre_reward_dashboard AS
SELECT
  r.wallet_address,
  s.username,
  s.farcaster_fid,
  r.milestone_type,
  r.token_reward,
  r.achieved_date,
  r.claimed_date,
  r.nft_minted,
  s.current_streak,
  s.best_streak,
  s.total_attestations,
  CASE
    WHEN r.claimed_date IS NOT NULL THEN 'claimed'
    ELSE 'pending'
  END as status
FROM bizarre_attestation_rewards r
LEFT JOIN bizarre_attestation_stats s ON r.wallet_address = s.wallet_address
ORDER BY r.achieved_date DESC;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_wallet ON bizarre_attestation_rewards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_rewards_milestone ON bizarre_attestation_rewards(milestone_type);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON bizarre_attestation_rewards(claimed_date) WHERE claimed_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_stats_tier_override ON bizarre_attestation_stats(has_bizarre_tier_override) WHERE has_bizarre_tier_override = TRUE;

-- Grant permissions
GRANT SELECT ON bizarre_attestation_rewards TO anon, authenticated;
GRANT SELECT ON bizarre_reward_dashboard TO anon, authenticated;
GRANT UPDATE ON bizarre_attestation_rewards TO authenticated;

-- Enable RLS
ALTER TABLE bizarre_attestation_rewards ENABLE ROW LEVEL SECURITY;

-- Policy for reading rewards (anyone can see)
CREATE POLICY "Allow public read rewards" ON bizarre_attestation_rewards
  FOR SELECT USING (true);

-- Policy for admin updates (only service role can update)
-- This ensures rewards are only distributed through admin interface

-- Sample queries for admin use:
-- Get pending rewards: SELECT * FROM bizarre_reward_dashboard WHERE status = 'pending';
-- Mark reward as claimed: UPDATE bizarre_attestation_rewards SET claimed_date = NOW(), tx_hash = '0x...' WHERE id = ?;
-- Get BIZARRE tier overrides: SELECT * FROM bizarre_attestation_stats WHERE has_bizarre_tier_override = TRUE;