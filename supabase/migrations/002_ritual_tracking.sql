-- Ritual Tracking System
-- For tracking ritual completions, shares, and analytics

-- Create ritual_completions table for tracking when users complete rituals
CREATE TABLE IF NOT EXISTS ritual_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT,
  ritual_id INTEGER NOT NULL,
  ritual_title TEXT,
  completed BOOLEAN DEFAULT true,
  time_to_complete INTEGER, -- seconds
  source TEXT DEFAULT 'web', -- web, mobile, miniapp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate completions within same day
  completion_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED,
  UNIQUE(user_id, ritual_id, completion_date)
);

-- Create ritual_shares table for tracking when users share rituals
CREATE TABLE IF NOT EXISTS ritual_shares (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT,
  ritual_id INTEGER NOT NULL,
  ritual_title TEXT,
  platform TEXT NOT NULL, -- farcaster, twitter, telegram, etc
  share_url TEXT,
  share_text TEXT,
  verified BOOLEAN DEFAULT false, -- if we verified the share happened
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Link to completion if this share is related to a completion
  completion_id BIGINT REFERENCES ritual_completions(id)
);

-- Create ritual_clicks table for tracking CTA clicks
CREATE TABLE IF NOT EXISTS ritual_clicks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  wallet_address TEXT,
  ritual_id INTEGER NOT NULL,
  ritual_title TEXT,
  action TEXT NOT NULL, -- view, click_cta, start, etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create aggregated stats table for performance
CREATE TABLE IF NOT EXISTS ritual_stats (
  ritual_id INTEGER PRIMARY KEY,
  ritual_title TEXT,
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_time_to_complete INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0, -- clicks to completions
  share_rate DECIMAL(5,2) DEFAULT 0, -- completions to shares
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create user ritual stats
CREATE TABLE IF NOT EXISTS user_ritual_stats (
  user_id TEXT PRIMARY KEY,
  wallet_address TEXT,
  total_completions INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  first_completion_date DATE,
  favorite_ritual_id INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_completions_user ON ritual_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_ritual ON ritual_completions(ritual_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON ritual_completions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_user ON ritual_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_ritual ON ritual_shares(ritual_id);
CREATE INDEX IF NOT EXISTS idx_shares_platform ON ritual_shares(platform);
CREATE INDEX IF NOT EXISTS idx_clicks_ritual ON ritual_clicks(ritual_id);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON ritual_clicks(created_at DESC);

-- Function to update ritual stats after completion
CREATE OR REPLACE FUNCTION update_ritual_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ritual_stats
  INSERT INTO ritual_stats (
    ritual_id,
    ritual_title,
    total_completions,
    unique_users,
    avg_time_to_complete
  )
  VALUES (
    NEW.ritual_id,
    NEW.ritual_title,
    1,
    1,
    COALESCE(NEW.time_to_complete, 0)
  )
  ON CONFLICT (ritual_id) DO UPDATE SET
    total_completions = ritual_stats.total_completions + 1,
    unique_users = (
      SELECT COUNT(DISTINCT user_id)
      FROM ritual_completions
      WHERE ritual_id = NEW.ritual_id
    ),
    avg_time_to_complete = (
      SELECT AVG(time_to_complete)::INTEGER
      FROM ritual_completions
      WHERE ritual_id = NEW.ritual_id
      AND time_to_complete IS NOT NULL
    ),
    last_updated = NOW();

  -- Update user stats
  INSERT INTO user_ritual_stats (
    user_id,
    wallet_address,
    total_completions,
    first_completion_date,
    last_completion_date
  )
  VALUES (
    NEW.user_id,
    NEW.wallet_address,
    1,
    CURRENT_DATE,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_completions = user_ritual_stats.total_completions + 1,
    last_completion_date = CURRENT_DATE,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update stats after share
CREATE OR REPLACE FUNCTION update_share_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ritual_stats
  UPDATE ritual_stats
  SET
    total_shares = total_shares + 1,
    share_rate = CASE
      WHEN total_completions > 0 THEN
        (total_shares + 1)::DECIMAL / total_completions * 100
      ELSE 0
    END,
    last_updated = NOW()
  WHERE ritual_id = NEW.ritual_id;

  -- Update user stats
  UPDATE user_ritual_stats
  SET
    total_shares = total_shares + 1,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update stats after click
CREATE OR REPLACE FUNCTION update_click_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ritual_stats based on action
  IF NEW.action = 'view' THEN
    UPDATE ritual_stats
    SET total_views = total_views + 1
    WHERE ritual_id = NEW.ritual_id;
  ELSIF NEW.action = 'click_cta' THEN
    UPDATE ritual_stats
    SET
      total_clicks = total_clicks + 1,
      conversion_rate = CASE
        WHEN total_clicks > 0 THEN
          total_completions::DECIMAL / (total_clicks + 1) * 100
        ELSE 0
      END
    WHERE ritual_id = NEW.ritual_id;
  END IF;

  -- If ritual not in stats yet, create it
  INSERT INTO ritual_stats (ritual_id, ritual_title)
  VALUES (NEW.ritual_id, NEW.ritual_title)
  ON CONFLICT (ritual_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_ritual_stats ON ritual_completions;
CREATE TRIGGER trigger_update_ritual_stats
  AFTER INSERT ON ritual_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_ritual_stats();

DROP TRIGGER IF EXISTS trigger_update_share_stats ON ritual_shares;
CREATE TRIGGER trigger_update_share_stats
  AFTER INSERT ON ritual_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_share_stats();

DROP TRIGGER IF EXISTS trigger_update_click_stats ON ritual_clicks;
CREATE TRIGGER trigger_update_click_stats
  AFTER INSERT ON ritual_clicks
  FOR EACH ROW
  EXECUTE FUNCTION update_click_stats();

-- View for ritual leaderboard
CREATE OR REPLACE VIEW ritual_leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY s.total_completions DESC, s.total_shares DESC) as rank,
  s.user_id,
  s.wallet_address,
  s.total_completions,
  s.total_shares,
  s.current_streak,
  s.best_streak,
  s.last_completion_date,
  s.first_completion_date
FROM user_ritual_stats s
ORDER BY s.total_completions DESC, s.total_shares DESC;

-- View for ritual performance
CREATE OR REPLACE VIEW ritual_performance AS
SELECT
  s.*,
  CASE
    WHEN s.total_views > 0 THEN
      (s.total_clicks::DECIMAL / s.total_views * 100)
    ELSE 0
  END as ctr
FROM ritual_stats s;

-- Grant permissions
GRANT SELECT, INSERT ON ritual_completions TO anon, authenticated;
GRANT SELECT, INSERT ON ritual_shares TO anon, authenticated;
GRANT SELECT, INSERT ON ritual_clicks TO anon, authenticated;
GRANT SELECT ON ritual_stats TO anon, authenticated;
GRANT SELECT ON user_ritual_stats TO anon, authenticated;
GRANT SELECT ON ritual_leaderboard TO anon, authenticated;
GRANT SELECT ON ritual_performance TO anon, authenticated;

-- Enable RLS
ALTER TABLE ritual_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_clicks ENABLE ROW LEVEL SECURITY;

-- Policies for public access (adjust as needed)
CREATE POLICY "Public read ritual data" ON ritual_completions
  FOR SELECT USING (true);

CREATE POLICY "Public insert ritual completions" ON ritual_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read ritual shares" ON ritual_shares
  FOR SELECT USING (true);

CREATE POLICY "Public insert ritual shares" ON ritual_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read ritual clicks" ON ritual_clicks
  FOR SELECT USING (true);

CREATE POLICY "Public insert ritual clicks" ON ritual_clicks
  FOR INSERT WITH CHECK (true);

-- Sample queries:
-- Top rituals: SELECT * FROM ritual_performance ORDER BY total_completions DESC;
-- User leaderboard: SELECT * FROM ritual_leaderboard LIMIT 10;
-- Recent shares: SELECT * FROM ritual_shares ORDER BY created_at DESC LIMIT 10;