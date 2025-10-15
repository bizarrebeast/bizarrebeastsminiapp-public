-- Drop and Recreate Ritual Tracking Tables
-- This will DELETE ALL EXISTING DATA in these tables!

-- Drop existing tables and views
DROP VIEW IF EXISTS ritual_leaderboard CASCADE;
DROP VIEW IF EXISTS ritual_performance CASCADE;
DROP VIEW IF EXISTS ritual_stats_view CASCADE;
DROP VIEW IF EXISTS user_ritual_stats_view CASCADE;

DROP TABLE IF EXISTS ritual_clicks CASCADE;
DROP TABLE IF EXISTS ritual_shares CASCADE;
DROP TABLE IF EXISTS ritual_completions CASCADE;
DROP TABLE IF EXISTS ritual_stats CASCADE;
DROP TABLE IF EXISTS user_ritual_stats CASCADE;

-- Now create fresh tables with correct schema

-- Create ritual_completions table
CREATE TABLE ritual_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  wallet_address TEXT,
  ritual_id INTEGER NOT NULL,
  ritual_title TEXT,
  completed BOOLEAN DEFAULT true,
  time_to_complete INTEGER,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- At least one identifier is required
  CONSTRAINT require_identifier CHECK (user_id IS NOT NULL OR wallet_address IS NOT NULL)
);

-- Create ritual_shares table
CREATE TABLE ritual_shares (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  wallet_address TEXT,
  ritual_id INTEGER NOT NULL,
  ritual_title TEXT,
  platform TEXT NOT NULL,
  share_url TEXT,
  share_text TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completion_id BIGINT REFERENCES ritual_completions(id),
  CONSTRAINT require_identifier CHECK (user_id IS NOT NULL OR wallet_address IS NOT NULL)
);

-- Create ritual_clicks table
CREATE TABLE ritual_clicks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  wallet_address TEXT,
  ritual_id INTEGER NOT NULL,
  ritual_title TEXT,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_completions_user ON ritual_completions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_completions_wallet ON ritual_completions(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_completions_ritual ON ritual_completions(ritual_id);
CREATE INDEX idx_completions_date ON ritual_completions(created_at DESC);

CREATE INDEX idx_shares_user ON ritual_shares(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_shares_wallet ON ritual_shares(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_shares_ritual ON ritual_shares(ritual_id);
CREATE INDEX idx_shares_platform ON ritual_shares(platform);

CREATE INDEX idx_clicks_ritual ON ritual_clicks(ritual_id);
CREATE INDEX idx_clicks_action ON ritual_clicks(action);
CREATE INDEX idx_clicks_date ON ritual_clicks(created_at DESC);

-- Create views for analytics

-- Ritual stats view
CREATE VIEW ritual_stats_view AS
SELECT
  rituals.ritual_id,
  MAX(rituals.ritual_title) as ritual_title,
  COUNT(DISTINCT c.id) as total_completions,
  COUNT(DISTINCT s.id) as total_shares,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.action = 'click_cta') as total_clicks,
  COUNT(DISTINCT COALESCE(c.user_id, c.wallet_address)) as unique_users,
  AVG(c.time_to_complete) FILTER (WHERE c.time_to_complete > 0)::INTEGER as avg_time_to_complete,
  CASE
    WHEN COUNT(DISTINCT cl.id) FILTER (WHERE cl.action = 'click_cta') > 0 THEN
      (COUNT(DISTINCT c.id)::DECIMAL / COUNT(DISTINCT cl.id) FILTER (WHERE cl.action = 'click_cta') * 100)
    ELSE 0
  END as conversion_rate,
  CASE
    WHEN COUNT(DISTINCT c.id) > 0 THEN
      (COUNT(DISTINCT s.id)::DECIMAL / COUNT(DISTINCT c.id) * 100)
    ELSE 0
  END as share_rate
FROM (
  SELECT DISTINCT ritual_id, ritual_title FROM ritual_completions
  UNION
  SELECT DISTINCT ritual_id, ritual_title FROM ritual_shares
  UNION
  SELECT DISTINCT ritual_id, ritual_title FROM ritual_clicks WHERE ritual_title IS NOT NULL
) rituals
LEFT JOIN ritual_completions c ON rituals.ritual_id = c.ritual_id
LEFT JOIN ritual_shares s ON rituals.ritual_id = s.ritual_id
LEFT JOIN ritual_clicks cl ON rituals.ritual_id = cl.ritual_id
GROUP BY rituals.ritual_id;

-- User stats view
CREATE VIEW user_ritual_stats_view AS
SELECT
  users.user_identifier,
  MAX(users.user_id) as user_id,
  MAX(users.wallet_address) as wallet_address,
  COUNT(DISTINCT c.id) as total_completions,
  COUNT(DISTINCT s.id) as total_shares,
  MAX(c.created_at::DATE) as last_completion_date,
  MIN(c.created_at::DATE) as first_completion_date
FROM (
  SELECT DISTINCT
    COALESCE(user_id, wallet_address) as user_identifier,
    user_id,
    wallet_address
  FROM ritual_completions
  UNION
  SELECT DISTINCT
    COALESCE(user_id, wallet_address) as user_identifier,
    user_id,
    wallet_address
  FROM ritual_shares
) users
LEFT JOIN ritual_completions c ON (
  (users.user_id IS NOT NULL AND c.user_id = users.user_id) OR
  (users.wallet_address IS NOT NULL AND c.wallet_address = users.wallet_address)
)
LEFT JOIN ritual_shares s ON (
  (users.user_id IS NOT NULL AND s.user_id = users.user_id) OR
  (users.wallet_address IS NOT NULL AND s.wallet_address = users.wallet_address)
)
GROUP BY users.user_identifier;

-- Leaderboard view
CREATE VIEW ritual_leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY total_completions DESC, total_shares DESC) as rank,
  user_identifier,
  user_id,
  wallet_address,
  total_completions,
  total_shares,
  last_completion_date,
  first_completion_date
FROM user_ritual_stats_view
ORDER BY total_completions DESC, total_shares DESC;

-- Grant permissions
GRANT SELECT, INSERT ON ritual_completions TO anon, authenticated;
GRANT SELECT, INSERT ON ritual_shares TO anon, authenticated;
GRANT SELECT, INSERT ON ritual_clicks TO anon, authenticated;
GRANT SELECT ON ritual_stats_view TO anon, authenticated;
GRANT SELECT ON user_ritual_stats_view TO anon, authenticated;
GRANT SELECT ON ritual_leaderboard TO anon, authenticated;

-- Enable RLS
ALTER TABLE ritual_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_clicks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all reads" ON ritual_completions FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON ritual_completions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all reads" ON ritual_shares FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON ritual_shares FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all reads" ON ritual_clicks FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON ritual_clicks FOR INSERT WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Ritual tracking tables successfully recreated!';
END $$;