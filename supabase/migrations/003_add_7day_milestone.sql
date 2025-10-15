-- Add 7-day milestone to rewards tracking

-- Update the milestone checking function to include 7-day milestone
CREATE OR REPLACE FUNCTION check_attestation_milestones()
RETURNS TRIGGER AS $$
BEGIN
  -- Check 7-day milestone
  IF NEW.best_streak >= 7 THEN
    INSERT INTO bizarre_attestation_rewards (
      wallet_address,
      milestone_type,
      token_reward
    )
    VALUES (
      NEW.wallet_address,
      '7_day',
      '25000' -- 25K $BB
    )
    ON CONFLICT (wallet_address, milestone_type) DO NOTHING;
  END IF;

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

-- Retroactively create 7-day rewards for users who already achieved it
INSERT INTO bizarre_attestation_rewards (
  wallet_address,
  milestone_type,
  token_reward,
  achieved_date
)
SELECT
  wallet_address,
  '7_day',
  '25000',
  NOW()
FROM bizarre_attestation_stats
WHERE best_streak >= 7
ON CONFLICT (wallet_address, milestone_type) DO NOTHING;

-- Update the dashboard view to properly handle IDs
DROP VIEW IF EXISTS bizarre_reward_dashboard;

CREATE VIEW bizarre_reward_dashboard AS
SELECT
  r.id,
  r.wallet_address,
  s.username,
  s.farcaster_fid,
  r.milestone_type,
  r.token_reward,
  r.achieved_date,
  r.claimed_date,
  r.tx_hash,
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

-- Grant permissions for the new view
GRANT SELECT ON bizarre_reward_dashboard TO anon, authenticated;