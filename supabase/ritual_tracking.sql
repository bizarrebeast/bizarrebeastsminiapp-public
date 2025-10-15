-- Create ritual completions table for tracking
CREATE TABLE IF NOT EXISTS ritual_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
  ritual_id INTEGER NOT NULL,
  ritual_title TEXT NOT NULL,
  completed BOOLEAN DEFAULT true,
  time_to_complete INTEGER, -- in seconds
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for performance
  INDEX idx_ritual_completions_user_id (user_id),
  INDEX idx_ritual_completions_ritual_id (ritual_id),
  INDEX idx_ritual_completions_created_at (created_at DESC)
);

-- Create view for ritual analytics
CREATE OR REPLACE VIEW ritual_analytics AS
SELECT
  rc.ritual_id,
  rc.ritual_title,
  COUNT(DISTINCT rc.user_id) as unique_users,
  COUNT(*) as total_completions,
  AVG(rc.time_to_complete)::INTEGER as avg_time_to_complete,
  MAX(rc.created_at) as last_completed,
  COUNT(DISTINCT DATE(rc.created_at)) as active_days
FROM ritual_completions rc
GROUP BY rc.ritual_id, rc.ritual_title;

-- Create view for user ritual stats
CREATE OR REPLACE VIEW user_ritual_stats AS
SELECT
  u.id as user_id,
  u.farcaster_username,
  u.wallet_address,
  COUNT(rc.id) as total_rituals,
  COUNT(DISTINCT rc.ritual_id) as unique_rituals,
  COUNT(DISTINCT DATE(rc.created_at)) as active_days,
  MAX(rc.created_at) as last_ritual_date,
  AVG(rc.time_to_complete)::INTEGER as avg_completion_time
FROM unified_users u
LEFT JOIN ritual_completions rc ON u.id = rc.user_id
GROUP BY u.id, u.farcaster_username, u.wallet_address;

-- Create daily ritual stats for bar charts
CREATE OR REPLACE VIEW daily_ritual_stats AS
SELECT
  DATE(created_at) as date,
  ritual_id,
  ritual_title,
  COUNT(*) as completions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(time_to_complete)::INTEGER as avg_time
FROM ritual_completions
GROUP BY DATE(created_at), ritual_id, ritual_title
ORDER BY date DESC;

-- Grant permissions
GRANT SELECT ON ritual_completions TO anon, authenticated;
GRANT INSERT ON ritual_completions TO authenticated;
GRANT SELECT ON ritual_analytics TO anon, authenticated;
GRANT SELECT ON user_ritual_stats TO anon, authenticated;
GRANT SELECT ON daily_ritual_stats TO anon, authenticated;

-- Enable RLS
ALTER TABLE ritual_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see all completions (for leaderboards)
CREATE POLICY "Public read access" ON ritual_completions
  FOR SELECT USING (true);

-- RLS Policy: Users can only insert their own completions
CREATE POLICY "Users can insert own completions" ON ritual_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_ritual_completions_date ON ritual_completions(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_ritual_completions_user_date ON ritual_completions(user_id, DATE(created_at));