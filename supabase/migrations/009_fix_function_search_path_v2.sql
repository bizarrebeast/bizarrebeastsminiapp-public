-- ============================================
-- Fix Function Search Path Security (v2)
-- ============================================
-- This migration fixes mutable search_path warnings
-- Uses CASCADE to handle all overloads
-- Date: 2025-01-XX

-- ============================================
-- PART 1: Drop all existing overloads
-- ============================================

-- Drop all update_flip_stats overloads
DO $$
DECLARE
  func_rec RECORD;
BEGIN
  FOR func_rec IN
    SELECT
      p.oid::regprocedure::text AS full_signature
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_flip_stats'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_rec.full_signature);
    RAISE NOTICE 'Dropped: %', func_rec.full_signature;
  END LOOP;
END $$;

-- Drop all can_player_bet overloads
DO $$
DECLARE
  func_rec RECORD;
BEGIN
  FOR func_rec IN
    SELECT
      p.oid::regprocedure::text AS full_signature
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'can_player_bet'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_rec.full_signature);
    RAISE NOTICE 'Dropped: %', func_rec.full_signature;
  END LOOP;
END $$;

-- ============================================
-- PART 2: Recreate functions with search_path
-- ============================================

-- 1. Fix calculate_attestation_streak
-- ============================================
CREATE OR REPLACE FUNCTION calculate_attestation_streak(p_wallet_address TEXT)
RETURNS TABLE(current_streak INT, best_streak INT)
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- 2. Fix update_attestation_stats
-- ============================================
CREATE OR REPLACE FUNCTION update_attestation_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- 3. Fix check_attestation_milestones
-- ============================================
CREATE OR REPLACE FUNCTION check_attestation_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- 4. Fix update_flip_stats
-- ============================================
CREATE FUNCTION update_flip_stats(
  p_wallet TEXT,
  p_fid INTEGER,
  p_username TEXT,
  p_won BOOLEAN,
  p_amount NUMERIC,
  p_payout NUMERIC,
  p_streak INTEGER,
  p_cashed_out BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_profit NUMERIC;
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
$$;

-- 5. Fix can_player_bet
-- ============================================
CREATE FUNCTION can_player_bet(
  p_wallet TEXT,
  p_amount BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
  fixed_count integer;
  total_expected integer := 5;
BEGIN
  -- Count functions with search_path set
  SELECT COUNT(*)
  INTO fixed_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'calculate_attestation_streak',
      'update_attestation_stats',
      'check_attestation_milestones',
      'update_flip_stats',
      'can_player_bet'
    )
    AND array_to_string(p.proconfig, ',') ILIKE '%search_path%';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FUNCTION SEARCH_PATH FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Functions with search_path locked: % / %', fixed_count, total_expected;
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Protection against search path injection attacks enabled';
END $$;
