-- ============================================
-- Fix SECURITY DEFINER Issues
-- ============================================
-- This migration fixes critical security issues identified by Supabase
-- where views and functions with SECURITY DEFINER bypass Row Level Security
-- Date: 2025-01-23

-- ============================================
-- 1. Fix contest_leaderboard view
-- ============================================
-- Drop the existing view first
DROP VIEW IF EXISTS contest_leaderboard CASCADE;

-- Recreate the view based on whether contest_votes table exists
DO $$
DECLARE
  has_image_caption boolean;
  has_contest_votes boolean;
BEGIN
  -- Check if image_caption column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contest_submissions'
      AND column_name = 'image_caption'
  ) INTO has_image_caption;

  -- Check if contest_votes table exists
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'contest_votes'
  ) INTO has_contest_votes;

  -- Create appropriate view based on what exists
  IF has_contest_votes THEN
    IF has_image_caption THEN
      -- Full view with votes and image_caption
      CREATE OR REPLACE VIEW contest_leaderboard
      WITH (security_invoker = true) AS
      SELECT
        s.contest_id,
        s.wallet_address,
        s.username,
        s.score,
        s.submitted_at,
        s.status,
        s.screenshot_url,
        s.metadata,
        s.image_caption,
        COALESCE(v.vote_count, 0) as vote_count,
        RANK() OVER (
          PARTITION BY s.contest_id
          ORDER BY
            CASE
              WHEN c.type IN ('creative', 'onboarding') THEN COALESCE(v.vote_count, 0)
              ELSE s.score
            END DESC,
            s.submitted_at ASC
        ) as rank
      FROM contest_submissions s
      JOIN contests c ON c.id = s.contest_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as vote_count
        FROM contest_votes
        GROUP BY submission_id
      ) v ON v.submission_id = s.id
      WHERE s.status = 'approved';
    ELSE
      -- View with votes but without image_caption
      CREATE OR REPLACE VIEW contest_leaderboard
      WITH (security_invoker = true) AS
      SELECT
        s.contest_id,
        s.wallet_address,
        s.username,
        s.score,
        s.submitted_at,
        s.status,
        s.screenshot_url,
        s.metadata,
        COALESCE(v.vote_count, 0) as vote_count,
        RANK() OVER (
          PARTITION BY s.contest_id
          ORDER BY
            CASE
              WHEN c.type IN ('creative', 'onboarding') THEN COALESCE(v.vote_count, 0)
              ELSE s.score
            END DESC,
            s.submitted_at ASC
        ) as rank
      FROM contest_submissions s
      JOIN contests c ON c.id = s.contest_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as vote_count
        FROM contest_votes
        GROUP BY submission_id
      ) v ON v.submission_id = s.id
      WHERE s.status = 'approved';
    END IF;
  ELSE
    IF has_image_caption THEN
      -- View without votes but with image_caption
      CREATE OR REPLACE VIEW contest_leaderboard
      WITH (security_invoker = true) AS
      SELECT
        s.contest_id,
        s.wallet_address,
        s.username,
        s.score,
        s.submitted_at,
        s.status,
        s.screenshot_url,
        s.metadata,
        s.image_caption,
        0 as vote_count,
        RANK() OVER (
          PARTITION BY s.contest_id
          ORDER BY s.score DESC, s.submitted_at ASC
        ) as rank
      FROM contest_submissions s
      WHERE s.status = 'approved';
    ELSE
      -- Basic view without votes or image_caption
      CREATE OR REPLACE VIEW contest_leaderboard
      WITH (security_invoker = true) AS
      SELECT
        s.contest_id,
        s.wallet_address,
        s.username,
        s.score,
        s.submitted_at,
        s.status,
        s.screenshot_url,
        s.metadata,
        0 as vote_count,
        RANK() OVER (
          PARTITION BY s.contest_id
          ORDER BY s.score DESC, s.submitted_at ASC
        ) as rank
      FROM contest_submissions s
      WHERE s.status = 'approved';
    END IF;
  END IF;

  RAISE NOTICE 'contest_leaderboard view created (has_votes: %, has_image_caption: %)', has_contest_votes, has_image_caption;
END $$;

-- Grant appropriate permissions
GRANT SELECT ON contest_leaderboard TO authenticated;
GRANT SELECT ON contest_leaderboard TO anon;

COMMENT ON VIEW contest_leaderboard IS 'Leaderboard view with SECURITY INVOKER to respect RLS policies';

-- ============================================
-- 2. Add RLS policies for contest_submissions table
-- ============================================
-- Enable RLS if not already enabled
ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS contest_submissions_select_policy ON contest_submissions;
DROP POLICY IF EXISTS contest_submissions_insert_policy ON contest_submissions;
DROP POLICY IF EXISTS contest_submissions_update_policy ON contest_submissions;

-- Policy: Anyone can view approved submissions
CREATE POLICY contest_submissions_select_approved
ON contest_submissions FOR SELECT
USING (status = 'approved');

-- Policy: Users can view their own submissions regardless of status
CREATE POLICY contest_submissions_select_own
ON contest_submissions FOR SELECT
USING (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR
  wallet_address = (
    SELECT wallet_address
    FROM unified_users
    WHERE id = auth.uid()
    LIMIT 1
  )
);

-- Policy: Users can insert their own submissions
CREATE POLICY contest_submissions_insert_own
ON contest_submissions FOR INSERT
WITH CHECK (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR
  wallet_address = (
    SELECT wallet_address
    FROM unified_users
    WHERE id = auth.uid()
    LIMIT 1
  )
);

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY contest_submissions_service_role
ON contest_submissions
USING (auth.role() = 'service_role');

-- ============================================
-- 3. Add RLS policies for contests table
-- ============================================
-- Enable RLS if not already enabled
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS contests_select_policy ON contests;

-- Policy: Anyone can view active and ended contests
CREATE POLICY contests_select_public
ON contests FOR SELECT
USING (status IN ('active', 'ended'));

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY contests_service_role
ON contests
USING (auth.role() = 'service_role');

-- ============================================
-- 4. Add RLS policies for contest_votes table (if it exists)
-- ============================================
-- Check if contest_votes table exists before adding policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contest_votes') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS contest_votes_select_policy ON contest_votes;
    DROP POLICY IF EXISTS contest_votes_insert_policy ON contest_votes;
    DROP POLICY IF EXISTS contest_votes_select_all ON contest_votes;
    DROP POLICY IF EXISTS contest_votes_insert_own ON contest_votes;
    DROP POLICY IF EXISTS contest_votes_service_role ON contest_votes;

    -- Policy: Anyone can view votes
    CREATE POLICY contest_votes_select_all
    ON contest_votes FOR SELECT
    USING (true);

    -- Policy: Users can insert their own votes
    CREATE POLICY contest_votes_insert_own
    ON contest_votes FOR INSERT
    WITH CHECK (
      voter_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      OR
      voter_address = (
        SELECT wallet_address
        FROM unified_users
        WHERE id = auth.uid()
        LIMIT 1
      )
    );

    -- Policy: Service role can do everything
    CREATE POLICY contest_votes_service_role
    ON contest_votes
    USING (auth.role() = 'service_role');

    RAISE NOTICE 'contest_votes table policies applied';
  ELSE
    RAISE NOTICE 'contest_votes table does not exist, skipping policies';
  END IF;
END $$;

-- ============================================
-- 5. Fix validate_session function (if it exists)
-- ============================================
-- Check if auth_sessions table exists before creating function
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auth_sessions') THEN
    -- Drop the existing function with SECURITY DEFINER if it exists
    DROP FUNCTION IF EXISTS validate_session(text);

    -- Recreate without SECURITY DEFINER and with better security
    CREATE OR REPLACE FUNCTION validate_session(session_token text)
    RETURNS uuid AS $func$
    DECLARE
        user_id_result uuid;
    BEGIN
        -- Only allow this function to be called with a valid session token
        IF session_token IS NULL OR length(session_token) < 10 THEN
            RETURN NULL;
        END IF;

        -- Check for valid session
        SELECT user_id INTO user_id_result
        FROM auth_sessions
        WHERE auth_sessions.session_token = validate_session.session_token
        AND auth_sessions.is_active = true
        AND auth_sessions.expires_at > CURRENT_TIMESTAMP
        LIMIT 1;

        RETURN user_id_result;
    END;
    $func$ LANGUAGE plpgsql SECURITY INVOKER;

    -- Add a comment explaining the security model
    COMMENT ON FUNCTION validate_session IS 'Validates session tokens - uses SECURITY INVOKER to respect caller permissions';

    RAISE NOTICE 'validate_session function updated';
  ELSE
    -- Just drop the function if it exists but the table doesn't
    DROP FUNCTION IF EXISTS validate_session(text);
    RAISE NOTICE 'auth_sessions table does not exist, validate_session function dropped if it existed';
  END IF;
END $$;

-- ============================================
-- 6. Create secure view for active contests
-- ============================================
-- Drop and recreate active_contests_view with SECURITY INVOKER
DROP VIEW IF EXISTS active_contests_view CASCADE;

-- Create view with dynamic columns based on what exists
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

  RAISE NOTICE 'active_contests_view created with columns: %', column_list;
END $$;

-- Grant permissions
GRANT SELECT ON active_contests_view TO authenticated;
GRANT SELECT ON active_contests_view TO anon;

COMMENT ON VIEW active_contests_view IS 'Active contests view with SECURITY INVOKER to respect RLS policies';

-- ============================================
-- 7. Verify RLS is enabled on all sensitive tables
-- ============================================
-- Enable RLS on tables that definitely exist
DO $$
BEGIN
  -- Core tables that should exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unified_users') THEN
    ALTER TABLE unified_users ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on unified_users';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auth_sessions') THEN
    ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on auth_sessions';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contests') THEN
    ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on contests';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contest_submissions') THEN
    ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on contest_submissions';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contest_winners') THEN
    ALTER TABLE contest_winners ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on contest_winners';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'onboarding_tasks') THEN
    ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on onboarding_tasks';
  END IF;

  -- Optional tables that may exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ritual_completions') THEN
    ALTER TABLE ritual_completions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on ritual_completions';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contest_cta_clicks') THEN
    ALTER TABLE contest_cta_clicks ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on contest_cta_clicks';
  END IF;
END $$;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Security fixes applied successfully:';
  RAISE NOTICE '  - contest_leaderboard view now uses SECURITY INVOKER';
  RAISE NOTICE '  - active_contests_view now uses SECURITY INVOKER';
  RAISE NOTICE '  - validate_session function now uses SECURITY INVOKER';
  RAISE NOTICE '  - RLS policies added for contest tables';
  RAISE NOTICE '  - RLS enabled on all sensitive tables';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Test your application thoroughly after applying these changes!';
END $$;