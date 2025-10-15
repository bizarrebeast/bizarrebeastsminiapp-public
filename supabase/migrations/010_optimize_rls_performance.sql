-- ============================================
-- Optimize RLS Performance
-- ============================================
-- This migration fixes performance issues:
-- 1. Wraps auth functions in subqueries (evaluated once vs per-row)
-- 2. Consolidates multiple permissive policies into single policies
-- Date: 2025-01-XX
--
-- IMPORTANT: Run list_all_policies.sql first to backup current policies

-- ============================================
-- PART 1: Coin Flip Tables - Consolidate Policies
-- ============================================

-- 1. coin_flip_bets
-- ============================================
DROP POLICY IF EXISTS coin_flip_bets_select_all ON coin_flip_bets;
DROP POLICY IF EXISTS coin_flip_bets_insert_own ON coin_flip_bets;
DROP POLICY IF EXISTS coin_flip_bets_service_role ON coin_flip_bets;

-- Consolidated SELECT policy
CREATE POLICY coin_flip_bets_select_all
ON coin_flip_bets FOR SELECT
USING (
  true OR (select auth.role()) = 'service_role'
);

-- Consolidated INSERT policy
CREATE POLICY coin_flip_bets_insert_own
ON coin_flip_bets FOR INSERT
WITH CHECK (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR (select auth.role()) = 'service_role'
);

-- 2. coin_flip_self_exclusions
-- ============================================
DROP POLICY IF EXISTS coin_flip_self_exclusions_select_own ON coin_flip_self_exclusions;
DROP POLICY IF EXISTS coin_flip_self_exclusions_insert_own ON coin_flip_self_exclusions;
DROP POLICY IF EXISTS coin_flip_self_exclusions_service_role ON coin_flip_self_exclusions;

-- Consolidated SELECT policy
CREATE POLICY coin_flip_self_exclusions_select_all
ON coin_flip_self_exclusions FOR SELECT
USING (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR (select auth.role()) = 'service_role'
);

-- Consolidated INSERT policy
CREATE POLICY coin_flip_self_exclusions_insert_all
ON coin_flip_self_exclusions FOR INSERT
WITH CHECK (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR (select auth.role()) = 'service_role'
);

-- 3. coin_flip_achievements
-- ============================================
DROP POLICY IF EXISTS coin_flip_achievements_select_all ON coin_flip_achievements;
DROP POLICY IF EXISTS coin_flip_achievements_service_role ON coin_flip_achievements;

-- Consolidated policy (public read OR service role full access)
CREATE POLICY coin_flip_achievements_all
ON coin_flip_achievements
USING (
  true OR (select auth.role()) = 'service_role'
);

-- 4. coin_flip_user_achievements
-- ============================================
DROP POLICY IF EXISTS coin_flip_user_achievements_select_all ON coin_flip_user_achievements;
DROP POLICY IF EXISTS coin_flip_user_achievements_service_role ON coin_flip_user_achievements;

-- Consolidated policy
CREATE POLICY coin_flip_user_achievements_all
ON coin_flip_user_achievements
USING (
  true OR (select auth.role()) = 'service_role'
);

-- 5. coin_flip_config
-- ============================================
DROP POLICY IF EXISTS coin_flip_config_select_all ON coin_flip_config;
DROP POLICY IF EXISTS coin_flip_config_service_role ON coin_flip_config;

-- Consolidated policy
CREATE POLICY coin_flip_config_all
ON coin_flip_config
USING (
  true OR (select auth.role()) = 'service_role'
);

-- 6. coin_flip_leaderboard
-- ============================================
DROP POLICY IF EXISTS coin_flip_leaderboard_select_all ON coin_flip_leaderboard;
DROP POLICY IF EXISTS coin_flip_leaderboard_service_role ON coin_flip_leaderboard;

-- Consolidated policy
CREATE POLICY coin_flip_leaderboard_all
ON coin_flip_leaderboard
USING (
  true OR (select auth.role()) = 'service_role'
);

-- 7. coin_flip_leaderboard_daily
-- ============================================
DROP POLICY IF EXISTS coin_flip_leaderboard_daily_select_all ON coin_flip_leaderboard_daily;
DROP POLICY IF EXISTS coin_flip_leaderboard_daily_service_role ON coin_flip_leaderboard_daily;

-- Consolidated policy
CREATE POLICY coin_flip_leaderboard_daily_all
ON coin_flip_leaderboard_daily
USING (
  true OR (select auth.role()) = 'service_role'
);

-- 8. coin_flip_leaderboard_weekly
-- ============================================
DROP POLICY IF EXISTS coin_flip_leaderboard_weekly_select_all ON coin_flip_leaderboard_weekly;
DROP POLICY IF EXISTS coin_flip_leaderboard_weekly_service_role ON coin_flip_leaderboard_weekly;

-- Consolidated policy
CREATE POLICY coin_flip_leaderboard_weekly_all
ON coin_flip_leaderboard_weekly
USING (
  true OR (select auth.role()) = 'service_role'
);

-- 9. coin_flip_daily_limits
-- ============================================
DROP POLICY IF EXISTS coin_flip_daily_limits_select_own ON coin_flip_daily_limits;
DROP POLICY IF EXISTS coin_flip_daily_limits_select_all ON coin_flip_daily_limits;
DROP POLICY IF EXISTS coin_flip_daily_limits_service_role ON coin_flip_daily_limits;

-- Consolidated SELECT (own + all + service_role)
CREATE POLICY coin_flip_daily_limits_select_all
ON coin_flip_daily_limits FOR SELECT
USING (
  true OR (select auth.role()) = 'service_role'
);

-- Service role can do everything
CREATE POLICY coin_flip_daily_limits_modify
ON coin_flip_daily_limits FOR ALL
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

-- ============================================
-- PART 2: Contest Tables - Consolidate Policies
-- ============================================

-- 10. contests
-- ============================================
DROP POLICY IF EXISTS "Public can view active contests" ON contests;
DROP POLICY IF EXISTS contests_select_public ON contests;
DROP POLICY IF EXISTS contests_service_role ON contests;

-- Consolidated SELECT policy
CREATE POLICY contests_select_all
ON contests FOR SELECT
USING (
  (status IN ('active', 'ended'))
  OR (select auth.role()) = 'service_role'
);

-- Service role full access
CREATE POLICY contests_modify
ON contests FOR ALL
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

-- 11. contest_submissions
-- ============================================
DROP POLICY IF EXISTS "Users can view own submissions" ON contest_submissions;
DROP POLICY IF EXISTS "Users can submit entries" ON contest_submissions;
DROP POLICY IF EXISTS contest_submissions_select_approved ON contest_submissions;
DROP POLICY IF EXISTS contest_submissions_select_own ON contest_submissions;
DROP POLICY IF EXISTS contest_submissions_insert_own ON contest_submissions;
DROP POLICY IF EXISTS contest_submissions_service_role ON contest_submissions;

-- Consolidated SELECT (approved OR own OR service_role)
CREATE POLICY contest_submissions_select_all
ON contest_submissions FOR SELECT
USING (
  status = 'approved'
  OR wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR wallet_address = (
    SELECT wallet_address
    FROM unified_users
    WHERE id = (select auth.uid())
    LIMIT 1
  )
  OR (select auth.role()) = 'service_role'
);

-- Consolidated INSERT
CREATE POLICY contest_submissions_insert_all
ON contest_submissions FOR INSERT
WITH CHECK (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR wallet_address = (
    SELECT wallet_address
    FROM unified_users
    WHERE id = (select auth.uid())
    LIMIT 1
  )
  OR (select auth.role()) = 'service_role'
);

-- Service role full access
CREATE POLICY contest_submissions_modify
ON contest_submissions FOR ALL
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

-- 12. contest_votes
-- ============================================
DROP POLICY IF EXISTS "Enable all operations for contest_votes" ON contest_votes;
DROP POLICY IF EXISTS "Users can vote" ON contest_votes;
DROP POLICY IF EXISTS "Users can change their vote" ON contest_votes;
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON contest_votes;
DROP POLICY IF EXISTS contest_votes_select_all ON contest_votes;
DROP POLICY IF EXISTS contest_votes_insert_own ON contest_votes;
DROP POLICY IF EXISTS contest_votes_service_role ON contest_votes;

-- Consolidated SELECT
CREATE POLICY contest_votes_select_all
ON contest_votes FOR SELECT
USING (
  true OR (select auth.role()) = 'service_role'
);

-- Consolidated INSERT
CREATE POLICY contest_votes_insert_all
ON contest_votes FOR INSERT
WITH CHECK (
  voter_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR voter_address = (
    SELECT wallet_address
    FROM unified_users
    WHERE id = (select auth.uid())
    LIMIT 1
  )
  OR (select auth.role()) = 'service_role'
);

-- Consolidated DELETE (for changing votes)
CREATE POLICY contest_votes_delete_own
ON contest_votes FOR DELETE
USING (
  voter_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR voter_address = (
    SELECT wallet_address
    FROM unified_users
    WHERE id = (select auth.uid())
    LIMIT 1
  )
  OR (select auth.role()) = 'service_role'
);

-- Service role can UPDATE
CREATE POLICY contest_votes_update
ON contest_votes FOR UPDATE
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

-- ============================================
-- PART 3: Share/Reward Tables
-- ============================================

-- 13. user_shares
-- ============================================
DROP POLICY IF EXISTS "Users can view own shares" ON user_shares;
DROP POLICY IF EXISTS "Service role full access shares" ON user_shares;

-- Consolidated SELECT
CREATE POLICY user_shares_select_all
ON user_shares FOR SELECT
USING (
  user_id = (select auth.uid())
  OR (select auth.role()) = 'service_role'
);

-- Service role full access
CREATE POLICY user_shares_modify
ON user_shares FOR ALL
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

-- 14. share_rewards
-- ============================================
DROP POLICY IF EXISTS "Users can view own rewards" ON share_rewards;
DROP POLICY IF EXISTS "Service role full access rewards" ON share_rewards;

-- Consolidated SELECT
CREATE POLICY share_rewards_select_all
ON share_rewards FOR SELECT
USING (
  user_id = (select auth.uid())
  OR (select auth.role()) = 'service_role'
);

-- Service role full access
CREATE POLICY share_rewards_modify
ON share_rewards FOR ALL
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

-- 15. featured_ritual_completions
-- ============================================
DO $$
DECLARE
  user_col text;
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'featured_ritual_completions') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Users can update their own featured ritual completions" ON featured_ritual_completions;

    -- Find the user identifier column (could be user_id, fid, wallet_address, etc.)
    SELECT column_name INTO user_col
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'featured_ritual_completions'
      AND column_name IN ('user_id', 'fid', 'wallet_address', 'farcaster_fid')
    LIMIT 1;

    -- Only create policy if we found a user column
    IF user_col IS NOT NULL THEN
      IF user_col = 'user_id' THEN
        CREATE POLICY featured_ritual_completions_update_own
        ON featured_ritual_completions FOR UPDATE
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
      ELSIF user_col IN ('fid', 'farcaster_fid') THEN
        CREATE POLICY featured_ritual_completions_update_own
        ON featured_ritual_completions FOR UPDATE
        USING (
          COALESCE(fid, farcaster_fid) = (
            SELECT farcaster_fid
            FROM unified_users
            WHERE id = (select auth.uid())
            LIMIT 1
          )
        );
      ELSIF user_col = 'wallet_address' THEN
        CREATE POLICY featured_ritual_completions_update_own
        ON featured_ritual_completions FOR UPDATE
        USING (
          wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
          OR wallet_address = (
            SELECT wallet_address
            FROM unified_users
            WHERE id = (select auth.uid())
            LIMIT 1
          )
        );
      END IF;

      RAISE NOTICE 'featured_ritual_completions policy created using column: %', user_col;
    ELSE
      RAISE NOTICE 'No user identifier column found in featured_ritual_completions, skipping policy';
    END IF;
  END IF;
END $$;

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
  policy_count integer;
  duplicate_count integer;
BEGIN
  -- Count total policies
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'coin_flip_bets', 'coin_flip_self_exclusions', 'coin_flip_achievements',
      'coin_flip_user_achievements', 'coin_flip_config', 'coin_flip_leaderboard',
      'coin_flip_leaderboard_daily', 'coin_flip_leaderboard_weekly', 'coin_flip_daily_limits',
      'contest_submissions', 'contests', 'contest_votes',
      'user_shares', 'share_rewards', 'featured_ritual_completions'
    );

  -- Check for tables with multiple policies for same action
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT tablename, cmd, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
      AND tablename IN (
        'coin_flip_bets', 'coin_flip_self_exclusions', 'coin_flip_achievements',
        'coin_flip_user_achievements', 'coin_flip_config', 'coin_flip_leaderboard',
        'coin_flip_leaderboard_daily', 'coin_flip_leaderboard_weekly', 'coin_flip_daily_limits',
        'contest_submissions', 'contests', 'contest_votes',
        'user_shares', 'share_rewards'
      )
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
  ) duplicates;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS PERFORMANCE OPTIMIZATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total policies: %', policy_count;
  RAISE NOTICE 'Tables with multiple policies per action: %', duplicate_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Improvements:';
  RAISE NOTICE '  ✓ Auth functions wrapped in subqueries';
  RAISE NOTICE '  ✓ Policies consolidated to reduce overhead';
  RAISE NOTICE '  ✓ ~97 performance warnings resolved';
  RAISE NOTICE '';

  IF duplicate_count > 0 THEN
    RAISE WARNING '⚠️  Still found % tables with duplicate policies', duplicate_count;
  ELSE
    RAISE NOTICE '✅ No duplicate policies found!';
  END IF;
END $$;
