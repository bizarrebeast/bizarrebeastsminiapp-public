-- Migration: Add FID-based check-in tracking
-- Purpose: Prevent users from exploiting check-ins with multiple wallets
-- Date: 2025-09-28

-- Table to track all check-ins by FID
CREATE TABLE IF NOT EXISTS checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  fid INTEGER,
  checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  streak_at_checkin INTEGER,
  tier_at_checkin TEXT,
  on_chain_tx_hash TEXT,
  rewards_earned DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkin_fid ON checkin_records(fid);
CREATE INDEX IF NOT EXISTS idx_checkin_wallet ON checkin_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_checkin_date ON checkin_records(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_checkin_fid_date ON checkin_records(fid, checked_in_at DESC);

-- FID-based streak tracking
CREATE TABLE IF NOT EXISTS fid_streaks (
  fid INTEGER PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_checkin_at TIMESTAMP,
  total_checkins INTEGER DEFAULT 0,
  total_rewards_earned DECIMAL DEFAULT 0,
  first_checkin_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Function to get latest check-in for an FID across all wallets
CREATE OR REPLACE FUNCTION get_fid_last_checkin(user_fid INTEGER)
RETURNS TABLE(
  wallet_address TEXT,
  checked_in_at TIMESTAMP,
  hours_ago NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.wallet_address,
    cr.checked_in_at,
    EXTRACT(EPOCH FROM (NOW() - cr.checked_in_at)) / 3600 as hours_ago
  FROM checkin_records cr
  WHERE cr.fid = user_fid
  ORDER BY cr.checked_in_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if FID can check in (20 hour cooldown)
CREATE OR REPLACE FUNCTION can_fid_checkin(user_fid INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  last_checkin TIMESTAMP;
  hours_since NUMERIC;
BEGIN
  -- Get the most recent check-in for this FID
  SELECT checked_in_at INTO last_checkin
  FROM checkin_records
  WHERE fid = user_fid
  ORDER BY checked_in_at DESC
  LIMIT 1;

  -- If no previous check-in, they can check in
  IF last_checkin IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Calculate hours since last check-in
  hours_since := EXTRACT(EPOCH FROM (NOW() - last_checkin)) / 3600;

  -- Must wait at least 20 hours
  RETURN hours_since >= 20;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate FID streak (44 hour grace period)
CREATE OR REPLACE FUNCTION calculate_fid_streak(user_fid INTEGER)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  prev_checkin TIMESTAMP;
  curr_checkin TIMESTAMP;
  hours_between NUMERIC;
  checkin_record RECORD;
BEGIN
  -- Get all check-ins for this FID, ordered by date descending
  FOR checkin_record IN
    SELECT checked_in_at
    FROM checkin_records
    WHERE fid = user_fid
    ORDER BY checked_in_at DESC
  LOOP
    IF prev_checkin IS NULL THEN
      -- First iteration, start streak
      streak := 1;
      prev_checkin := checkin_record.checked_in_at;
    ELSE
      curr_checkin := checkin_record.checked_in_at;
      hours_between := EXTRACT(EPOCH FROM (prev_checkin - curr_checkin)) / 3600;

      -- If more than 44 hours between check-ins, streak is broken
      IF hours_between > 44 THEN
        EXIT; -- Stop counting
      ELSE
        streak := streak + 1;
        prev_checkin := curr_checkin;
      END IF;
    END IF;
  END LOOP;

  RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing check-in data if available (placeholder for future migration)
-- This would need to be customized based on existing data structure
COMMENT ON TABLE checkin_records IS 'FID-centric check-in tracking to prevent multi-wallet exploitation';
COMMENT ON TABLE fid_streaks IS 'Aggregated streak data per FID for quick lookups';