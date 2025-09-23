-- ============================================
-- Fix Remaining SECURITY DEFINER Views
-- ============================================
-- This migration fixes the remaining views with SECURITY DEFINER
-- Date: 2025-01-23

-- ============================================
-- 1. Fix share_analytics view
-- ============================================
DROP VIEW IF EXISTS share_analytics CASCADE;

-- Check if user_shares table exists before creating view
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_shares') THEN
    CREATE OR REPLACE VIEW share_analytics
    WITH (security_invoker = true) AS
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

    -- Grant permissions
    GRANT SELECT ON share_analytics TO authenticated;
    GRANT SELECT ON share_analytics TO anon;

    RAISE NOTICE 'share_analytics view updated with SECURITY INVOKER';
  ELSE
    RAISE NOTICE 'user_shares table does not exist, share_analytics view not created';
  END IF;
END $$;

-- ============================================
-- 2. Fix contest_voting_results view
-- ============================================
DROP VIEW IF EXISTS contest_voting_results CASCADE;

-- Check if contest_votes table exists before creating view
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contest_votes') THEN
    -- Check if vote_count column exists in contest_submissions
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contest_submissions'
        AND column_name = 'vote_count'
    ) THEN
      -- Create view with cached_votes column
      CREATE OR REPLACE VIEW contest_voting_results
      WITH (security_invoker = true) AS
      SELECT
        cs.id as submission_id,
        cs.contest_id,
        cs.wallet_address,
        cs.username,
        cs.score,
        cs.screenshot_url,
        cs.metadata,
        cs.status,
        cs.submitted_at,
        COALESCE(cv.vote_count, 0) as votes,
        cs.vote_count as cached_votes
      FROM contest_submissions cs
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as vote_count
        FROM contest_votes
        GROUP BY submission_id
      ) cv ON cs.id = cv.submission_id
      WHERE cs.status = 'approved';
    ELSE
      -- Create view without cached_votes column
      CREATE OR REPLACE VIEW contest_voting_results
      WITH (security_invoker = true) AS
      SELECT
        cs.id as submission_id,
        cs.contest_id,
        cs.wallet_address,
        cs.username,
        cs.score,
        cs.screenshot_url,
        cs.metadata,
        cs.status,
        cs.submitted_at,
        COALESCE(cv.vote_count, 0) as votes,
        0 as cached_votes
      FROM contest_submissions cs
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as vote_count
        FROM contest_votes
        GROUP BY submission_id
      ) cv ON cs.id = cv.submission_id
      WHERE cs.status = 'approved';
    END IF;

    -- Grant permissions
    GRANT SELECT ON contest_voting_results TO authenticated;
    GRANT SELECT ON contest_voting_results TO anon;

    RAISE NOTICE 'contest_voting_results view updated with SECURITY INVOKER';
  ELSE
    -- Create basic view without votes if contest_votes doesn't exist
    CREATE OR REPLACE VIEW contest_voting_results
    WITH (security_invoker = true) AS
    SELECT
      cs.id as submission_id,
      cs.contest_id,
      cs.wallet_address,
      cs.username,
      cs.score,
      cs.screenshot_url,
      cs.metadata,
      cs.status,
      cs.submitted_at,
      0 as votes,
      0 as cached_votes
    FROM contest_submissions cs
    WHERE cs.status = 'approved';

    -- Grant permissions
    GRANT SELECT ON contest_voting_results TO authenticated;
    GRANT SELECT ON contest_voting_results TO anon;

    RAISE NOTICE 'contest_voting_results view created without votes (contest_votes table does not exist)';
  END IF;
END $$;

-- ============================================
-- 3. Verify no more SECURITY DEFINER views exist
-- ============================================
DO $$
DECLARE
  definer_count integer;
BEGIN
  -- Count views with SECURITY DEFINER
  SELECT COUNT(*)
  INTO definer_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%';

  IF definer_count > 0 THEN
    RAISE WARNING 'There are still % views with SECURITY DEFINER in the public schema', definer_count;
  ELSE
    RAISE NOTICE '✅ All SECURITY DEFINER views have been fixed!';
  END IF;
END $$;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Security fixes for remaining views applied successfully:';
  RAISE NOTICE '  - share_analytics view now uses SECURITY INVOKER';
  RAISE NOTICE '  - contest_voting_results view now uses SECURITY INVOKER';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Test your application to ensure:';
  RAISE NOTICE '  - Share analytics still displays correctly';
  RAISE NOTICE '  - Contest voting results are accessible';
  RAISE NOTICE '  - No permission errors occur';
END $$;