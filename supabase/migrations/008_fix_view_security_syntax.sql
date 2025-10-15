-- ============================================
-- Fix View Security Settings - Corrected Syntax
-- ============================================
-- This migration fixes the security_invoker syntax
-- Correct syntax is: WITH (security_invoker=on)
-- Not: WITH (security_invoker = true)
-- Date: 2025-01-XX

-- 1. Fix bizarre_attestation_leaderboard
-- ============================================
DROP VIEW IF EXISTS bizarre_attestation_leaderboard CASCADE;

CREATE VIEW bizarre_attestation_leaderboard
WITH (security_invoker=on) AS
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

-- 2. Fix bizarre_reward_dashboard
-- ============================================
DROP VIEW IF EXISTS bizarre_reward_dashboard CASCADE;

CREATE VIEW bizarre_reward_dashboard
WITH (security_invoker=on) AS
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

-- 3. Fix ritual_stats_view
-- ============================================
DROP VIEW IF EXISTS ritual_stats_view CASCADE;

CREATE VIEW ritual_stats_view
WITH (security_invoker=on) AS
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

-- 4. Fix user_ritual_stats_view
-- ============================================
DROP VIEW IF EXISTS user_ritual_stats_view CASCADE;

CREATE VIEW user_ritual_stats_view
WITH (security_invoker=on) AS
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

-- 5. Fix ritual_leaderboard (recreate after user_ritual_stats_view)
-- ============================================
DROP VIEW IF EXISTS ritual_leaderboard CASCADE;

CREATE VIEW ritual_leaderboard
WITH (security_invoker=on) AS
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

-- 6. Fix user_ritual_stats_by_fid
-- ============================================
DROP VIEW IF EXISTS user_ritual_stats_by_fid CASCADE;

CREATE VIEW user_ritual_stats_by_fid
WITH (security_invoker=on) AS
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

-- 7. Fix active_contests_view
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
    CREATE VIEW active_contests_view
    WITH (security_invoker=on) AS
    SELECT %s
    FROM contests
    WHERE status = ''active''
      AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
      AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
  ', column_list);

  RAISE NOTICE 'active_contests_view created with security_invoker=on';
END $$;

GRANT SELECT ON active_contests_view TO authenticated, anon;

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
  fixed_count integer;
  total_expected integer := 7;
BEGIN
  -- Count views with security_invoker=on
  SELECT COUNT(*)
  INTO fixed_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.relname IN (
      'bizarre_attestation_leaderboard',
      'bizarre_reward_dashboard',
      'ritual_leaderboard',
      'ritual_stats_view',
      'user_ritual_stats_view',
      'user_ritual_stats_by_fid',
      'active_contests_view'
    )
    AND array_to_string(c.reloptions, ',') ILIKE '%security_invoker%';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VIEW SECURITY SETTINGS FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Views with security_invoker=on: % / %', fixed_count, total_expected;

  IF fixed_count = total_expected THEN
    RAISE NOTICE '✅ All views correctly configured!';
  ELSE
    RAISE WARNING '⚠️  Only % of % views configured. Check manually.', fixed_count, total_expected;
  END IF;
END $$;
