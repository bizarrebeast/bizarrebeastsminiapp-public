-- ============================================
-- Verification Queries for Security Fixes
-- ============================================

-- 1. Check for any remaining SECURITY DEFINER views
SELECT
  schemaname,
  viewname,
  CASE WHEN definition ILIKE '%SECURITY DEFINER%' THEN '❌ HAS SECURITY DEFINER' ELSE '✅ OK' END as status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'bizarre_attestation_leaderboard',
    'bizarre_reward_dashboard',
    'ritual_leaderboard',
    'ritual_stats_view',
    'user_ritual_stats_view',
    'user_ritual_stats_by_fid',
    'active_contests_view'
  )
ORDER BY viewname;

-- 2. Verify RLS is enabled on all coin flip tables
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename LIKE 'coin_flip_%'
ORDER BY tablename;

-- 3. Count policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'coin_flip_%'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 4. List all coin flip policies for review
SELECT
  tablename,
  policyname,
  cmd as command,
  CASE
    WHEN qual IS NOT NULL THEN 'USING clause present'
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK present'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'coin_flip_%'
ORDER BY tablename, policyname;

-- 5. Quick summary
SELECT
  'Total Views Fixed' as metric,
  COUNT(*) as count
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'bizarre_attestation_leaderboard',
    'bizarre_reward_dashboard',
    'ritual_leaderboard',
    'ritual_stats_view',
    'user_ritual_stats_view',
    'user_ritual_stats_by_fid',
    'active_contests_view'
  )
  AND definition NOT ILIKE '%SECURITY DEFINER%'

UNION ALL

SELECT
  'Coin Flip Tables with RLS' as metric,
  COUNT(*) as count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename LIKE 'coin_flip_%'
  AND rowsecurity = true;
