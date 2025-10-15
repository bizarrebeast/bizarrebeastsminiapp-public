-- Hans' Coin Flip Database Schema
-- Migration: 006_hans_coin_flip.sql
-- Description: Complete database structure for Hans' Coin Flip gambling game

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Individual bets table
CREATE TABLE coin_flip_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Player info
  wallet_address TEXT NOT NULL,
  farcaster_fid INTEGER,
  farcaster_username TEXT,

  -- Bet details
  amount BIGINT NOT NULL, -- Amount in wei (10^18)
  choice TEXT NOT NULL CHECK (choice IN ('heads', 'tails')),

  -- Provably fair seeds
  client_seed_hash TEXT NOT NULL,
  client_seed TEXT, -- Revealed after bet placed
  server_seed_hash TEXT NOT NULL,
  server_seed TEXT, -- Revealed after bet resolved
  combined_hash TEXT,

  -- Result
  result TEXT CHECK (result IN ('heads', 'tails')),
  is_winner BOOLEAN,
  payout BIGINT DEFAULT 0,

  -- Streak context
  streak_level INTEGER DEFAULT 1,
  streak_multiplier NUMERIC(10,2) DEFAULT 1.0,
  cashed_out BOOLEAN DEFAULT FALSE,

  -- Transaction tracking
  bet_transaction_hash TEXT, -- Blockchain tx for bet
  payout_transaction_hash TEXT, -- Blockchain tx for payout

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'revealed', 'paid', 'failed')),

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revealed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT valid_amount CHECK (amount >= 1000000000000000000 AND amount <= 100000000000000000000),
  CONSTRAINT valid_payout CHECK (payout >= 0)
);

-- Indexes for performance
CREATE INDEX idx_bets_wallet ON coin_flip_bets(wallet_address);
CREATE INDEX idx_bets_created ON coin_flip_bets(created_at DESC);
CREATE INDEX idx_bets_status ON coin_flip_bets(status);
CREATE INDEX idx_bets_fid ON coin_flip_bets(farcaster_fid) WHERE farcaster_fid IS NOT NULL;

-- ============================================================================
-- LEADERBOARD TABLES
-- ============================================================================

-- All-time leaderboard
CREATE TABLE coin_flip_leaderboard (
  wallet_address TEXT PRIMARY KEY,

  -- Identity
  farcaster_username TEXT,
  farcaster_fid INTEGER,
  empire_tier TEXT,
  empire_rank INTEGER,

  -- Core stats
  total_flips INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,

  -- Financial stats (in wei)
  total_wagered BIGINT DEFAULT 0,
  total_won BIGINT DEFAULT 0,
  total_lost BIGINT DEFAULT 0,
  net_profit BIGINT DEFAULT 0,
  biggest_win BIGINT DEFAULT 0,
  biggest_loss BIGINT DEFAULT 0,

  -- Streak stats
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  best_cashout BIGINT DEFAULT 0,
  total_cashouts INTEGER DEFAULT 0,

  -- Time-based
  first_flip_at TIMESTAMPTZ,
  last_flip_at TIMESTAMPTZ,
  total_play_time INTEGER DEFAULT 0, -- minutes

  -- Calculated fields
  win_rate NUMERIC(5,2) DEFAULT 0,
  avg_bet BIGINT DEFAULT 0,
  avg_win BIGINT DEFAULT 0,
  avg_profit_per_flip BIGINT DEFAULT 0,

  -- Rankings (updated by cron job)
  rank_by_profit INTEGER,
  rank_by_volume INTEGER,
  rank_by_wins INTEGER,
  rank_by_streak INTEGER,
  rank_by_win_rate INTEGER,
  rank_by_biggest_win INTEGER,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- Leaderboard indexes
CREATE INDEX idx_leaderboard_profit ON coin_flip_leaderboard(net_profit DESC);
CREATE INDEX idx_leaderboard_volume ON coin_flip_leaderboard(total_wagered DESC);
CREATE INDEX idx_leaderboard_wins ON coin_flip_leaderboard(total_wins DESC);
CREATE INDEX idx_leaderboard_streak ON coin_flip_leaderboard(longest_streak DESC);
CREATE INDEX idx_leaderboard_win_rate ON coin_flip_leaderboard(win_rate DESC)
  WHERE total_flips >= 50;
CREATE INDEX idx_leaderboard_biggest_win ON coin_flip_leaderboard(biggest_win DESC);
CREATE INDEX idx_leaderboard_last_active ON coin_flip_leaderboard(last_flip_at DESC);
CREATE INDEX idx_leaderboard_username ON coin_flip_leaderboard(farcaster_username)
  WHERE farcaster_username IS NOT NULL;

-- Daily leaderboard
CREATE TABLE coin_flip_leaderboard_daily (
  date DATE NOT NULL,
  wallet_address TEXT NOT NULL,
  farcaster_username TEXT,
  total_flips INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  net_profit BIGINT DEFAULT 0,
  biggest_win BIGINT DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, wallet_address)
);

CREATE INDEX idx_daily_leaderboard_date ON coin_flip_leaderboard_daily(date DESC);
CREATE INDEX idx_daily_leaderboard_profit ON coin_flip_leaderboard_daily(date, net_profit DESC);

-- Weekly leaderboard
CREATE TABLE coin_flip_leaderboard_weekly (
  week_start DATE NOT NULL,
  wallet_address TEXT NOT NULL,
  farcaster_username TEXT,
  total_flips INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  net_profit BIGINT DEFAULT 0,
  biggest_win BIGINT DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (week_start, wallet_address)
);

CREATE INDEX idx_weekly_leaderboard_week ON coin_flip_leaderboard_weekly(week_start DESC);
CREATE INDEX idx_weekly_leaderboard_profit ON coin_flip_leaderboard_weekly(week_start, net_profit DESC);

-- ============================================================================
-- DAILY LIMITS TRACKING
-- ============================================================================

CREATE TABLE coin_flip_daily_limits (
  wallet_address TEXT NOT NULL,
  date DATE NOT NULL,

  -- Limits
  bets_count INTEGER DEFAULT 0,
  total_wagered BIGINT DEFAULT 0,
  total_won BIGINT DEFAULT 0,
  total_lost BIGINT DEFAULT 0,

  last_bet_at TIMESTAMPTZ,

  PRIMARY KEY (wallet_address, date)
);

CREATE INDEX idx_daily_limits_date ON coin_flip_daily_limits(date);
CREATE INDEX idx_daily_limits_wallet ON coin_flip_daily_limits(wallet_address);

-- ============================================================================
-- SELF-EXCLUSION
-- ============================================================================

CREATE TABLE coin_flip_self_exclusions (
  wallet_address TEXT PRIMARY KEY,

  exclusion_type TEXT NOT NULL CHECK (exclusion_type IN ('cooloff', 'self_exclude', 'permanent')),

  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,

  is_permanent BOOLEAN DEFAULT FALSE,
  can_override BOOLEAN DEFAULT FALSE,

  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exclusions_active ON coin_flip_self_exclusions(end_date);

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================

CREATE TABLE coin_flip_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'legendary')),
  condition_type TEXT NOT NULL,
  condition_value BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coin_flip_user_achievements (
  wallet_address TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (wallet_address, achievement_id),
  FOREIGN KEY (achievement_id) REFERENCES coin_flip_achievements(id)
);

CREATE INDEX idx_user_achievements_wallet ON coin_flip_user_achievements(wallet_address);
CREATE INDEX idx_user_achievements_unlocked ON coin_flip_user_achievements(unlocked_at DESC);

-- ============================================================================
-- GAME CONFIGURATION
-- ============================================================================

CREATE TABLE coin_flip_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Insert default configuration
INSERT INTO coin_flip_config (key, value, description) VALUES
  ('game_enabled', 'true', 'Master switch for the game'),
  ('min_bet', '"1000000000000000000"', 'Minimum bet in wei (1000 $BB)'),
  ('max_bet', '"100000000000000000000"', 'Maximum bet in wei (100K $BB)'),
  ('daily_limit', '"5000000000000000000000"', 'Daily wagering limit per wallet (5M $BB)'),
  ('max_payout', '"5000000000000000000000"', 'Maximum single payout (5M $BB)'),
  ('house_edge', '"0.02"', 'House edge as decimal (2%)'),
  ('house_profit_share', '"0.015"', 'House profit share (1.5%)'),
  ('burn_share', '"0.005"', 'Token burn share (0.5%)'),
  ('min_balance_to_play', '"5000000000000000000000"', 'Minimum $BB balance required (5M $BB)'),
  ('hot_wallet_address', '""', 'Hot wallet address for payouts'),
  ('cold_wallet_address', '""', 'Cold wallet address for fund storage'),
  ('burn_wallet_address', '""', 'Burn wallet address'),
  ('circuit_breaker_threshold', '"5000000000000000000000"', 'Pause game if fund below this (5M $BB)');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to atomically update player stats after each flip
CREATE OR REPLACE FUNCTION update_flip_stats(
  p_wallet TEXT,
  p_fid INTEGER,
  p_username TEXT,
  p_won BOOLEAN,
  p_amount BIGINT,
  p_payout BIGINT,
  p_streak INTEGER,
  p_cashed_out BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_profit BIGINT;
BEGIN
  -- Calculate profit/loss
  v_profit := CASE WHEN p_won THEN p_payout - p_amount ELSE -p_amount END;

  -- Update all-time leaderboard
  INSERT INTO coin_flip_leaderboard (
    wallet_address,
    farcaster_fid,
    farcaster_username,
    total_flips,
    total_wins,
    total_losses,
    total_wagered,
    total_won,
    total_lost,
    net_profit,
    biggest_win,
    biggest_loss,
    current_streak,
    longest_streak,
    best_cashout,
    total_cashouts,
    first_flip_at,
    last_flip_at
  ) VALUES (
    p_wallet,
    p_fid,
    p_username,
    1,
    CASE WHEN p_won THEN 1 ELSE 0 END,
    CASE WHEN NOT p_won THEN 1 ELSE 0 END,
    p_amount,
    CASE WHEN p_won THEN p_payout ELSE 0 END,
    CASE WHEN NOT p_won THEN p_amount ELSE 0 END,
    v_profit,
    CASE WHEN p_won THEN p_payout ELSE 0 END,
    CASE WHEN NOT p_won THEN p_amount ELSE 0 END,
    p_streak,
    p_streak,
    CASE WHEN p_cashed_out THEN p_payout ELSE 0 END,
    CASE WHEN p_cashed_out THEN 1 ELSE 0 END,
    NOW(),
    NOW()
  )
  ON CONFLICT (wallet_address) DO UPDATE SET
    farcaster_fid = COALESCE(p_fid, coin_flip_leaderboard.farcaster_fid),
    farcaster_username = COALESCE(p_username, coin_flip_leaderboard.farcaster_username),
    total_flips = coin_flip_leaderboard.total_flips + 1,
    total_wins = coin_flip_leaderboard.total_wins + CASE WHEN p_won THEN 1 ELSE 0 END,
    total_losses = coin_flip_leaderboard.total_losses + CASE WHEN NOT p_won THEN 1 ELSE 0 END,
    total_wagered = coin_flip_leaderboard.total_wagered + p_amount,
    total_won = coin_flip_leaderboard.total_won + CASE WHEN p_won THEN p_payout ELSE 0 END,
    total_lost = coin_flip_leaderboard.total_lost + CASE WHEN NOT p_won THEN p_amount ELSE 0 END,
    net_profit = coin_flip_leaderboard.net_profit + v_profit,
    biggest_win = GREATEST(coin_flip_leaderboard.biggest_win, CASE WHEN p_won THEN p_payout ELSE 0 END),
    biggest_loss = GREATEST(coin_flip_leaderboard.biggest_loss, CASE WHEN NOT p_won THEN p_amount ELSE 0 END),
    current_streak = p_streak,
    longest_streak = GREATEST(coin_flip_leaderboard.longest_streak, p_streak),
    best_cashout = CASE WHEN p_cashed_out
      THEN GREATEST(coin_flip_leaderboard.best_cashout, p_payout)
      ELSE coin_flip_leaderboard.best_cashout END,
    total_cashouts = coin_flip_leaderboard.total_cashouts + CASE WHEN p_cashed_out THEN 1 ELSE 0 END,
    last_flip_at = NOW(),
    updated_at = NOW();

  -- Recalculate derived fields
  UPDATE coin_flip_leaderboard
  SET
    win_rate = CASE WHEN total_flips > 0
      THEN ROUND((total_wins::NUMERIC / total_flips) * 100, 2)
      ELSE 0 END,
    avg_bet = CASE WHEN total_flips > 0
      THEN total_wagered / total_flips
      ELSE 0 END,
    avg_win = CASE WHEN total_wins > 0
      THEN total_won / total_wins
      ELSE 0 END,
    avg_profit_per_flip = CASE WHEN total_flips > 0
      THEN net_profit / total_flips
      ELSE 0 END
  WHERE wallet_address = p_wallet;

  -- Update daily limits
  INSERT INTO coin_flip_daily_limits (
    wallet_address,
    date,
    bets_count,
    total_wagered,
    total_won,
    total_lost,
    last_bet_at
  ) VALUES (
    p_wallet,
    CURRENT_DATE,
    1,
    p_amount,
    CASE WHEN p_won THEN p_payout ELSE 0 END,
    CASE WHEN NOT p_won THEN p_amount ELSE 0 END,
    NOW()
  )
  ON CONFLICT (wallet_address, date) DO UPDATE SET
    bets_count = coin_flip_daily_limits.bets_count + 1,
    total_wagered = coin_flip_daily_limits.total_wagered + p_amount,
    total_won = coin_flip_daily_limits.total_won + CASE WHEN p_won THEN p_payout ELSE 0 END,
    total_lost = coin_flip_daily_limits.total_lost + CASE WHEN NOT p_won THEN p_amount ELSE 0 END,
    last_bet_at = NOW();

  -- Update daily leaderboard
  INSERT INTO coin_flip_leaderboard_daily (
    date,
    wallet_address,
    farcaster_username,
    total_flips,
    total_wins,
    net_profit,
    biggest_win,
    longest_streak
  ) VALUES (
    CURRENT_DATE,
    p_wallet,
    p_username,
    1,
    CASE WHEN p_won THEN 1 ELSE 0 END,
    v_profit,
    CASE WHEN p_won THEN p_payout ELSE 0 END,
    p_streak
  )
  ON CONFLICT (date, wallet_address) DO UPDATE SET
    farcaster_username = COALESCE(p_username, coin_flip_leaderboard_daily.farcaster_username),
    total_flips = coin_flip_leaderboard_daily.total_flips + 1,
    total_wins = coin_flip_leaderboard_daily.total_wins + CASE WHEN p_won THEN 1 ELSE 0 END,
    net_profit = coin_flip_leaderboard_daily.net_profit + v_profit,
    biggest_win = GREATEST(coin_flip_leaderboard_daily.biggest_win, CASE WHEN p_won THEN p_payout ELSE 0 END),
    longest_streak = GREATEST(coin_flip_leaderboard_daily.longest_streak, p_streak),
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- Function to check if player can bet (not self-excluded, under daily limit)
CREATE OR REPLACE FUNCTION can_player_bet(
  p_wallet TEXT,
  p_amount BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_excluded BOOLEAN;
  v_daily_total BIGINT;
  v_daily_limit BIGINT;
BEGIN
  -- Check self-exclusion
  SELECT EXISTS(
    SELECT 1 FROM coin_flip_self_exclusions
    WHERE wallet_address = p_wallet
    AND end_date > NOW()
  ) INTO v_excluded;

  IF v_excluded THEN
    RETURN FALSE;
  END IF;

  -- Check daily limit
  SELECT COALESCE((value->>>0)::BIGINT, 5000000000000000000000)
  INTO v_daily_limit
  FROM coin_flip_config
  WHERE key = 'daily_limit';

  SELECT COALESCE(total_wagered, 0)
  INTO v_daily_total
  FROM coin_flip_daily_limits
  WHERE wallet_address = p_wallet
  AND date = CURRENT_DATE;

  IF (v_daily_total + p_amount) > v_daily_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED ACHIEVEMENTS
-- ============================================================================

INSERT INTO coin_flip_achievements (id, name, description, icon, tier, condition_type, condition_value) VALUES
  ('first_win', 'First Win', 'Win your first flip', '🎉', 'bronze', 'wins', 1),
  ('profit_100k', 'First 100K', 'Reach 100,000 $BB net profit', '💰', 'bronze', 'profit', 100000),
  ('profit_1m', 'Millionaire', 'Reach 1,000,000 $BB net profit', '💎', 'gold', 'profit', 1000000),
  ('profit_10m', 'Whale Status', 'Reach 10,000,000 $BB net profit', '🐋', 'legendary', 'profit', 10000000),
  ('streak_3', 'On Fire', 'Achieve a 3-win streak', '🔥', 'bronze', 'streak', 3),
  ('streak_5', 'Unstoppable', 'Achieve a 5-win streak', '⚡', 'silver', 'streak', 5),
  ('streak_10', 'Legendary', 'Achieve a 10-win streak', '👑', 'legendary', 'streak', 10),
  ('volume_10m', 'High Roller', 'Wager 10M $BB total', '🎰', 'silver', 'volume', 10000000),
  ('volume_100m', 'Degenerate', 'Wager 100M $BB total', '😅', 'legendary', 'volume', 100000000),
  ('wins_100', 'Centurion', 'Win 100 flips', '⚔️', 'bronze', 'wins', 100),
  ('wins_1000', 'Master Flipper', 'Win 1,000 flips', '🎖️', 'gold', 'wins', 1000);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE coin_flip_bets IS 'Individual coin flip bets with provably fair verification';
COMMENT ON TABLE coin_flip_leaderboard IS 'All-time player statistics and rankings';
COMMENT ON TABLE coin_flip_leaderboard_daily IS 'Daily leaderboard (resets at midnight UTC)';
COMMENT ON TABLE coin_flip_leaderboard_weekly IS 'Weekly leaderboard (resets Monday)';
COMMENT ON TABLE coin_flip_daily_limits IS 'Track daily betting limits per wallet';
COMMENT ON TABLE coin_flip_self_exclusions IS 'Self-exclusion and responsible gambling controls';
COMMENT ON TABLE coin_flip_achievements IS 'Achievement definitions';
COMMENT ON TABLE coin_flip_user_achievements IS 'Player achievement unlocks';
COMMENT ON TABLE coin_flip_config IS 'Game configuration and parameters';
