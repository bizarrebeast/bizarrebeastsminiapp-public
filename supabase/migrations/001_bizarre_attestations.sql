-- Bizarre Attestations Database Schema
-- For tracking onchain "I AM BIZARRE" attestations

-- Create attestations table
CREATE TABLE IF NOT EXISTS bizarre_attestations (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  farcaster_fid INTEGER,
  username TEXT,
  tx_hash TEXT NOT NULL,
  block_number BIGINT DEFAULT 0,
  gas_price TEXT,
  attestation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique attestation per wallet per 20-hour period
  -- Using date for simplicity, contract handles the actual 20-hour cooldown
  UNIQUE(wallet_address, attestation_date)
);

-- Create stats table for aggregated data
CREATE TABLE IF NOT EXISTS bizarre_attestation_stats (
  wallet_address TEXT PRIMARY KEY,
  farcaster_fid INTEGER,
  username TEXT,
  total_attestations INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_attestation_date DATE,
  first_attestation_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attestations_wallet ON bizarre_attestations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_attestations_date ON bizarre_attestations(attestation_date DESC);
CREATE INDEX IF NOT EXISTS idx_attestations_fid ON bizarre_attestations(farcaster_fid) WHERE farcaster_fid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stats_total ON bizarre_attestation_stats(total_attestations DESC);
CREATE INDEX IF NOT EXISTS idx_stats_streak ON bizarre_attestation_stats(current_streak DESC);

-- Function to calculate streaks
CREATE OR REPLACE FUNCTION calculate_attestation_streak(p_wallet_address TEXT)
RETURNS TABLE(current_streak INT, best_streak INT) AS $$
DECLARE
  v_current_streak INT := 0;
  v_best_streak INT := 0;
  v_temp_streak INT := 0;
  v_last_date DATE := NULL;
  v_date DATE;
BEGIN
  -- Calculate current streak and best streak
  FOR v_date IN
    SELECT DISTINCT attestation_date
    FROM bizarre_attestations
    WHERE wallet_address = p_wallet_address
    ORDER BY attestation_date DESC
  LOOP
    IF v_last_date IS NULL OR v_last_date - v_date = 1 THEN
      v_temp_streak := v_temp_streak + 1;
      IF v_last_date IS NULL THEN
        v_current_streak := v_temp_streak;
      END IF;
    ELSE
      v_best_streak := GREATEST(v_best_streak, v_temp_streak);
      v_temp_streak := 1;
    END IF;
    v_last_date := v_date;
  END LOOP;

  v_best_streak := GREATEST(v_best_streak, v_temp_streak, v_current_streak);

  RETURN QUERY SELECT v_current_streak, v_best_streak;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats after each attestation
CREATE OR REPLACE FUNCTION update_attestation_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_data RECORD;
BEGIN
  -- Calculate streaks
  SELECT * INTO v_streak_data FROM calculate_attestation_streak(NEW.wallet_address);

  -- Insert or update stats
  INSERT INTO bizarre_attestation_stats (
    wallet_address,
    farcaster_fid,
    username,
    total_attestations,
    current_streak,
    best_streak,
    last_attestation_date,
    first_attestation_date,
    updated_at
  )
  VALUES (
    NEW.wallet_address,
    NEW.farcaster_fid,
    NEW.username,
    1,
    1,
    1,
    NEW.attestation_date,
    NEW.attestation_date,
    NOW()
  )
  ON CONFLICT (wallet_address) DO UPDATE SET
    farcaster_fid = COALESCE(EXCLUDED.farcaster_fid, bizarre_attestation_stats.farcaster_fid),
    username = COALESCE(EXCLUDED.username, bizarre_attestation_stats.username),
    total_attestations = bizarre_attestation_stats.total_attestations + 1,
    current_streak = v_streak_data.current_streak,
    best_streak = GREATEST(bizarre_attestation_stats.best_streak, v_streak_data.best_streak),
    last_attestation_date = EXCLUDED.last_attestation_date,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_attestation_stats ON bizarre_attestations;
CREATE TRIGGER trigger_update_attestation_stats
  AFTER INSERT ON bizarre_attestations
  FOR EACH ROW
  EXECUTE FUNCTION update_attestation_stats();

-- View for leaderboard (combines data for easy querying)
CREATE OR REPLACE VIEW bizarre_attestation_leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY s.total_attestations DESC, s.current_streak DESC) as rank,
  s.wallet_address,
  s.farcaster_fid,
  s.username,
  s.total_attestations,
  s.current_streak,
  s.best_streak,
  s.last_attestation_date,
  s.first_attestation_date,
  CASE
    WHEN s.last_attestation_date >= CURRENT_DATE - INTERVAL '1 day' THEN true
    ELSE false
  END as can_attest_today
FROM bizarre_attestation_stats s
ORDER BY s.total_attestations DESC, s.current_streak DESC;

-- Grant permissions (adjust based on your Supabase setup)
GRANT SELECT ON bizarre_attestations TO anon, authenticated;
GRANT INSERT ON bizarre_attestations TO anon, authenticated;
GRANT SELECT ON bizarre_attestation_stats TO anon, authenticated;
GRANT SELECT ON bizarre_attestation_leaderboard TO anon, authenticated;

-- Add RLS policies if needed
ALTER TABLE bizarre_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizarre_attestation_stats ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read attestations
CREATE POLICY "Allow public read attestations" ON bizarre_attestations
  FOR SELECT USING (true);

-- Policy to allow users to insert their own attestations
CREATE POLICY "Allow users to insert attestations" ON bizarre_attestations
  FOR INSERT WITH CHECK (true);

-- Policy to allow public read of stats
CREATE POLICY "Allow public read stats" ON bizarre_attestation_stats
  FOR SELECT USING (true);

-- Sample queries for testing:
-- Get leaderboard: SELECT * FROM bizarre_attestation_leaderboard LIMIT 10;
-- Get user stats: SELECT * FROM bizarre_attestation_stats WHERE wallet_address = '0x...';
-- Check if can attest: SELECT can_attest_today FROM bizarre_attestation_leaderboard WHERE wallet_address = '0x...';