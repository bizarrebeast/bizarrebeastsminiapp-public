-- Sharing Verification System Database Schema
-- Run this migration in Supabase SQL editor

-- Create user_shares table
CREATE TABLE IF NOT EXISTS user_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE NOT NULL,
  share_type VARCHAR(50) NOT NULL,
  share_platform VARCHAR(50) NOT NULL,
  content_id VARCHAR(255),
  content_data JSONB DEFAULT '{}',
  share_url TEXT,
  share_text TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verification_data JSONB DEFAULT '{}',
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_share_type CHECK (
    share_type IN ('ritual', 'contest', 'rank', 'checkin', 'claim', 'milestone', 'contest_entry', 'contest_position', 'contest_winner', 'meme', 'default')
  ),
  CONSTRAINT valid_platform CHECK (
    share_platform IN ('farcaster', 'twitter', 'telegram', 'whatsapp', 'discord', 'other')
  )
);

-- Create indexes for performance
CREATE INDEX idx_user_shares_user_id ON user_shares(user_id);
CREATE INDEX idx_user_shares_type ON user_shares(share_type);
CREATE INDEX idx_user_shares_platform ON user_shares(share_platform);
CREATE INDEX idx_user_shares_verified ON user_shares(verified);
CREATE INDEX idx_user_shares_created ON user_shares(created_at DESC);
CREATE INDEX idx_user_shares_content ON user_shares(content_id, share_type);

-- Create share_rewards table
CREATE TABLE IF NOT EXISTS share_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE NOT NULL,
  share_id UUID REFERENCES user_shares(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_amount INTEGER DEFAULT 0,
  reward_data JSONB DEFAULT '{}',
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_reward_type CHECK (
    reward_type IN ('points', 'tokens', 'nft', 'feature_unlock', 'badge', 'multiplier')
  ),
  CONSTRAINT positive_amount CHECK (reward_amount >= 0)
);

-- Create indexes for rewards
CREATE INDEX idx_share_rewards_user_id ON share_rewards(user_id);
CREATE INDEX idx_share_rewards_share_id ON share_rewards(share_id);
CREATE INDEX idx_share_rewards_claimed ON share_rewards(claimed);
CREATE INDEX idx_share_rewards_expires ON share_rewards(expires_at);

-- Create share_analytics view for easy reporting
CREATE OR REPLACE VIEW share_analytics AS
SELECT
  u.id as user_id,
  u.farcaster_username,
  u.wallet_address,
  COUNT(DISTINCT s.id) as total_shares,
  COUNT(DISTINCT CASE WHEN s.verified = true THEN s.id END) as verified_shares,
  SUM(s.points_awarded) as total_points,
  COUNT(DISTINCT s.share_type) as unique_share_types,
  COUNT(DISTINCT s.share_platform) as platforms_used,
  MAX(s.created_at) as last_share_at,
  MIN(s.created_at) as first_share_at
FROM unified_users u
LEFT JOIN user_shares s ON u.id = s.user_id
GROUP BY u.id, u.farcaster_username, u.wallet_address;

-- Create function to check share cooldown
CREATE OR REPLACE FUNCTION check_share_cooldown(
  p_user_id UUID,
  p_share_type VARCHAR,
  p_content_id VARCHAR,
  p_cooldown_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  last_share TIMESTAMP;
BEGIN
  SELECT MAX(created_at) INTO last_share
  FROM user_shares
  WHERE user_id = p_user_id
    AND share_type = p_share_type
    AND (content_id = p_content_id OR (content_id IS NULL AND p_content_id IS NULL));

  IF last_share IS NULL THEN
    RETURN TRUE; -- No previous share
  END IF;

  RETURN (NOW() - last_share) > (p_cooldown_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create function to award share points
CREATE OR REPLACE FUNCTION award_share_points(
  p_share_id UUID,
  p_base_points INTEGER,
  p_verified_bonus INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER;
  v_user_id UUID;
  v_verified BOOLEAN;
BEGIN
  -- Get share details
  SELECT user_id, verified INTO v_user_id, v_verified
  FROM user_shares
  WHERE id = p_share_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Share not found';
  END IF;

  -- Calculate total points
  total_points := p_base_points;
  IF v_verified THEN
    total_points := total_points + p_verified_bonus;
  END IF;

  -- Update share with points
  UPDATE user_shares
  SET points_awarded = total_points
  WHERE id = p_share_id;

  -- Create reward record
  INSERT INTO share_rewards (user_id, share_id, reward_type, reward_amount)
  VALUES (v_user_id, p_share_id, 'points', total_points);

  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_shares
-- Users can view their own shares
CREATE POLICY "Users can view own shares" ON user_shares
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can do everything
CREATE POLICY "Service role full access shares" ON user_shares
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for share_rewards
-- Users can view their own rewards
CREATE POLICY "Users can view own rewards" ON share_rewards
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can do everything
CREATE POLICY "Service role full access rewards" ON share_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON share_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION check_share_cooldown TO authenticated;
GRANT EXECUTE ON FUNCTION award_share_points TO service_role;

-- Insert sample share type configurations as reference
-- This is just documentation, actual configuration should be in application code
COMMENT ON TABLE user_shares IS 'Tracks all user sharing activities across platforms. Share types include: ritual (10 pts + 20 verified), contest (15 pts + 30 verified), rank (5 pts + 10 verified), checkin (5 pts + 15 verified), milestone (20 pts + 40 verified), contest_winner (50 pts + 100 verified)';

-- Create trigger to auto-expire old unclaimed rewards
CREATE OR REPLACE FUNCTION expire_old_rewards() RETURNS trigger AS $$
BEGIN
  UPDATE share_rewards
  SET claimed = false, expires_at = NOW()
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND claimed = false
    AND expires_at IS NULL;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expire_old_rewards
  AFTER INSERT ON share_rewards
  FOR EACH STATEMENT
  EXECUTE FUNCTION expire_old_rewards();