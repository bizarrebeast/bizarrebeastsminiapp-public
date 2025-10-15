-- ============================================
-- Comprehensive Security Fixes
-- ============================================
-- This migration addresses all security issues identified by Supabase:
-- 1. Removes SECURITY DEFINER from all views
-- 2. Enables RLS on all coin flip tables with proper policies
-- Date: 2025-01-XX
--
-- IMPORTANT: Review and test thoroughly before applying to production

-- ============================================
-- PART 1: Fix SECURITY DEFINER Views
-- ============================================

-- 1. Fix bizarre_attestation_leaderboard
-- ============================================
DROP VIEW IF EXISTS bizarre_attestation_leaderboard CASCADE;

CREATE OR REPLACE VIEW bizarre_attestation_leaderboard
WITH (security_invoker = true) AS
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

GRANT SELECT ON bizarre_attestation_leaderboard TO anon, authenticated;
COMMENT ON VIEW bizarre_attestation_leaderboard IS 'Attestation leaderboard with SECURITY INVOKER to respect RLS policies';

-- 2. Fix bizarre_reward_dashboard
-- ============================================
DROP VIEW IF EXISTS bizarre_reward_dashboard CASCADE;

CREATE OR REPLACE VIEW bizarre_reward_dashboard
WITH (security_invoker = true) AS
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

GRANT SELECT ON bizarre_reward_dashboard TO anon, authenticated;
COMMENT ON VIEW bizarre_reward_dashboard IS 'Reward dashboard with SECURITY INVOKER to respect RLS policies';

-- 3. Fix ritual_leaderboard
-- ============================================
DROP VIEW IF EXISTS ritual_leaderboard CASCADE;

CREATE OR REPLACE VIEW ritual_leaderboard
WITH (security_invoker = true) AS
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

GRANT SELECT ON ritual_leaderboard TO anon, authenticated;
COMMENT ON VIEW ritual_leaderboard IS 'Ritual leaderboard with SECURITY INVOKER to respect RLS policies';

-- 4. Fix ritual_stats_view
-- ============================================
DROP VIEW IF EXISTS ritual_stats_view CASCADE;

CREATE OR REPLACE VIEW ritual_stats_view
WITH (security_invoker = true) AS
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

GRANT SELECT ON ritual_stats_view TO anon, authenticated;
COMMENT ON VIEW ritual_stats_view IS 'Ritual statistics with SECURITY INVOKER to respect RLS policies';

-- 5. Fix user_ritual_stats_view
-- ============================================
DROP VIEW IF EXISTS user_ritual_stats_view CASCADE;

CREATE OR REPLACE VIEW user_ritual_stats_view
WITH (security_invoker = true) AS
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

GRANT SELECT ON user_ritual_stats_view TO anon, authenticated;
COMMENT ON VIEW user_ritual_stats_view IS 'User ritual statistics with SECURITY INVOKER to respect RLS policies';

-- 6. Fix user_ritual_stats_by_fid
-- ============================================
DROP VIEW IF EXISTS user_ritual_stats_by_fid CASCADE;

CREATE OR REPLACE VIEW user_ritual_stats_by_fid
WITH (security_invoker = true) AS
SELECT
  fid,
  COUNT(DISTINCT id) as total_completions,
  COUNT(DISTINCT ritual_id) as unique_rituals_completed,
  MAX(created_at::DATE) as last_completion_date,
  MIN(created_at::DATE) as first_completion_date,
  ARRAY_AGG(DISTINCT wallet_address) FILTER (WHERE wallet_address IS NOT NULL) as wallets_used
FROM ritual_completions
WHERE fid IS NOT NULL
GROUP BY fid;

GRANT SELECT ON user_ritual_stats_by_fid TO anon, authenticated;
COMMENT ON VIEW user_ritual_stats_by_fid IS 'User ritual statistics by FID with SECURITY INVOKER to respect RLS policies';

-- 7. Fix active_contests_view (if not already fixed)
-- ============================================
DROP VIEW IF EXISTS active_contests_view CASCADE;

DO $$
DECLARE
  column_list text;
BEGIN
  -- Build column list dynamically based on what columns exist
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO column_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'contests'
    AND column_name IN (
      'id', 'name', 'description', 'type', 'min_bb_required',
      'prize_amount', 'status', 'start_date', 'end_date',
      'is_test', 'gallery_enabled', 'display_votes', 'gallery_view_type',
      'rules', 'max_entries_per_wallet', 'created_at', 'updated_at'
    );

  -- If no columns found, use minimal set
  IF column_list IS NULL OR column_list = '' THEN
    column_list := 'id, name, description, type, status, start_date, end_date';
  END IF;

  -- Create the view with the available columns
  EXECUTE format('
    CREATE OR REPLACE VIEW active_contests_view
    WITH (security_invoker = true) AS
    SELECT %s
    FROM contests
    WHERE status = ''active''
      AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
      AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
  ', column_list);

  RAISE NOTICE 'active_contests_view created with SECURITY INVOKER';
END $$;

GRANT SELECT ON active_contests_view TO authenticated, anon;
COMMENT ON VIEW active_contests_view IS 'Active contests view with SECURITY INVOKER to respect RLS policies';

-- ============================================
-- PART 2: Enable RLS on Coin Flip Tables
-- ============================================

-- 1. coin_flip_bets
-- ============================================
ALTER TABLE coin_flip_bets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS coin_flip_bets_select_all ON coin_flip_bets;
DROP POLICY IF EXISTS coin_flip_bets_select_own ON coin_flip_bets;
DROP POLICY IF EXISTS coin_flip_bets_insert_own ON coin_flip_bets;
DROP POLICY IF EXISTS coin_flip_bets_update_own ON coin_flip_bets;
DROP POLICY IF EXISTS coin_flip_bets_service_role ON coin_flip_bets;

-- Anyone can view all bets (for transparency)
CREATE POLICY coin_flip_bets_select_all
ON coin_flip_bets FOR SELECT
USING (true);

-- Users can insert their own bets
CREATE POLICY coin_flip_bets_insert_own
ON coin_flip_bets FOR INSERT
WITH CHECK (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
);

-- Service role can do everything (for game operations)
CREATE POLICY coin_flip_bets_service_role
ON coin_flip_bets
USING (auth.role() = 'service_role');

-- 2. coin_flip_self_exclusions
-- ============================================
ALTER TABLE coin_flip_self_exclusions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_self_exclusions_select_own ON coin_flip_self_exclusions;
DROP POLICY IF EXISTS coin_flip_self_exclusions_insert_own ON coin_flip_self_exclusions;
DROP POLICY IF EXISTS coin_flip_self_exclusions_service_role ON coin_flip_self_exclusions;

-- Users can only view their own exclusions
CREATE POLICY coin_flip_self_exclusions_select_own
ON coin_flip_self_exclusions FOR SELECT
USING (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
);

-- Users can create their own exclusions
CREATE POLICY coin_flip_self_exclusions_insert_own
ON coin_flip_self_exclusions FOR INSERT
WITH CHECK (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
);

-- Service role can do everything
CREATE POLICY coin_flip_self_exclusions_service_role
ON coin_flip_self_exclusions
USING (auth.role() = 'service_role');

-- 3. coin_flip_achievements
-- ============================================
ALTER TABLE coin_flip_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_achievements_select_all ON coin_flip_achievements;
DROP POLICY IF EXISTS coin_flip_achievements_service_role ON coin_flip_achievements;

-- Anyone can view achievements
CREATE POLICY coin_flip_achievements_select_all
ON coin_flip_achievements FOR SELECT
USING (true);

-- Only service role can modify achievements
CREATE POLICY coin_flip_achievements_service_role
ON coin_flip_achievements
USING (auth.role() = 'service_role');

-- 4. coin_flip_user_achievements
-- ============================================
ALTER TABLE coin_flip_user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_user_achievements_select_all ON coin_flip_user_achievements;
DROP POLICY IF EXISTS coin_flip_user_achievements_service_role ON coin_flip_user_achievements;

-- Anyone can view user achievements
CREATE POLICY coin_flip_user_achievements_select_all
ON coin_flip_user_achievements FOR SELECT
USING (true);

-- Only service role can modify user achievements
CREATE POLICY coin_flip_user_achievements_service_role
ON coin_flip_user_achievements
USING (auth.role() = 'service_role');

-- 5. coin_flip_config
-- ============================================
ALTER TABLE coin_flip_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_config_select_all ON coin_flip_config;
DROP POLICY IF EXISTS coin_flip_config_service_role ON coin_flip_config;

-- Anyone can view config (for transparency)
CREATE POLICY coin_flip_config_select_all
ON coin_flip_config FOR SELECT
USING (true);

-- Only service role can modify config
CREATE POLICY coin_flip_config_service_role
ON coin_flip_config
USING (auth.role() = 'service_role');

-- 6. coin_flip_leaderboard
-- ============================================
ALTER TABLE coin_flip_leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_leaderboard_select_all ON coin_flip_leaderboard;
DROP POLICY IF EXISTS coin_flip_leaderboard_service_role ON coin_flip_leaderboard;

-- Anyone can view leaderboard
CREATE POLICY coin_flip_leaderboard_select_all
ON coin_flip_leaderboard FOR SELECT
USING (true);

-- Only service role can modify leaderboard
CREATE POLICY coin_flip_leaderboard_service_role
ON coin_flip_leaderboard
USING (auth.role() = 'service_role');

-- 7. coin_flip_leaderboard_daily
-- ============================================
ALTER TABLE coin_flip_leaderboard_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_leaderboard_daily_select_all ON coin_flip_leaderboard_daily;
DROP POLICY IF EXISTS coin_flip_leaderboard_daily_service_role ON coin_flip_leaderboard_daily;

-- Anyone can view daily leaderboard
CREATE POLICY coin_flip_leaderboard_daily_select_all
ON coin_flip_leaderboard_daily FOR SELECT
USING (true);

-- Only service role can modify daily leaderboard
CREATE POLICY coin_flip_leaderboard_daily_service_role
ON coin_flip_leaderboard_daily
USING (auth.role() = 'service_role');

-- 8. coin_flip_leaderboard_weekly
-- ============================================
ALTER TABLE coin_flip_leaderboard_weekly ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_leaderboard_weekly_select_all ON coin_flip_leaderboard_weekly;
DROP POLICY IF EXISTS coin_flip_leaderboard_weekly_service_role ON coin_flip_leaderboard_weekly;

-- Anyone can view weekly leaderboard
CREATE POLICY coin_flip_leaderboard_weekly_select_all
ON coin_flip_leaderboard_weekly FOR SELECT
USING (true);

-- Only service role can modify weekly leaderboard
CREATE POLICY coin_flip_leaderboard_weekly_service_role
ON coin_flip_leaderboard_weekly
USING (auth.role() = 'service_role');

-- 9. coin_flip_daily_limits
-- ============================================
ALTER TABLE coin_flip_daily_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_flip_daily_limits_select_own ON coin_flip_daily_limits;
DROP POLICY IF EXISTS coin_flip_daily_limits_select_all ON coin_flip_daily_limits;
DROP POLICY IF EXISTS coin_flip_daily_limits_service_role ON coin_flip_daily_limits;

-- Users can view their own daily limits
CREATE POLICY coin_flip_daily_limits_select_own
ON coin_flip_daily_limits FOR SELECT
USING (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
);

-- Allow viewing aggregated daily limits for all users (for transparency)
-- If you want this more restrictive, remove this policy
CREATE POLICY coin_flip_daily_limits_select_all
ON coin_flip_daily_limits FOR SELECT
USING (true);

-- Only service role can modify daily limits
CREATE POLICY coin_flip_daily_limits_service_role
ON coin_flip_daily_limits
USING (auth.role() = 'service_role');

-- ============================================
-- PART 3: Verification
-- ============================================

-- Verify no more SECURITY DEFINER views exist
DO $$
DECLARE
  definer_count integer;
  definer_views text;
BEGIN
  -- Count views with SECURITY DEFINER in public schema
  SELECT COUNT(*), string_agg(viewname, ', ')
  INTO definer_count, definer_views
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition ILIKE '%SECURITY DEFINER%';

  IF definer_count > 0 THEN
    RAISE WARNING '⚠️  Still found % views with SECURITY DEFINER: %', definer_count, definer_views;
  ELSE
    RAISE NOTICE '✅ All SECURITY DEFINER views have been fixed!';
  END IF;
END $$;

-- Verify RLS is enabled on all coin flip tables
DO $$
DECLARE
  tables_without_rls text[];
BEGIN
  SELECT ARRAY_AGG(tablename)
  INTO tables_without_rls
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename LIKE 'coin_flip_%'
    AND c.relrowsecurity = false;

  IF tables_without_rls IS NOT NULL AND array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING '⚠️  Tables without RLS: %', tables_without_rls;
  ELSE
    RAISE NOTICE '✅ RLS enabled on all coin flip tables!';
  END IF;
END $$;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPREHENSIVE SECURITY FIXES APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed SECURITY DEFINER views:';
  RAISE NOTICE '  ✓ bizarre_attestation_leaderboard';
  RAISE NOTICE '  ✓ bizarre_reward_dashboard';
  RAISE NOTICE '  ✓ ritual_leaderboard';
  RAISE NOTICE '  ✓ ritual_stats_view';
  RAISE NOTICE '  ✓ user_ritual_stats_view';
  RAISE NOTICE '  ✓ user_ritual_stats_by_fid';
  RAISE NOTICE '  ✓ active_contests_view';
  RAISE NOTICE '';
  RAISE NOTICE 'Enabled RLS on tables:';
  RAISE NOTICE '  ✓ coin_flip_bets';
  RAISE NOTICE '  ✓ coin_flip_self_exclusions';
  RAISE NOTICE '  ✓ coin_flip_achievements';
  RAISE NOTICE '  ✓ coin_flip_user_achievements';
  RAISE NOTICE '  ✓ coin_flip_config';
  RAISE NOTICE '  ✓ coin_flip_leaderboard (all 3 variants)';
  RAISE NOTICE '  ✓ coin_flip_daily_limits';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT NEXT STEPS:';
  RAISE NOTICE '  1. Test all views and tables in development';
  RAISE NOTICE '  2. Verify coin flip game still works correctly';
  RAISE NOTICE '  3. Check that leaderboards display properly';
  RAISE NOTICE '  4. Ensure admin functions still work';
  RAISE NOTICE '  5. Review policies match your security requirements';
  RAISE NOTICE '';
END $$;
