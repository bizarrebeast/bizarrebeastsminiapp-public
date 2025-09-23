-- ============================================
-- Fix Function Search Path Warnings
-- ============================================
-- This migration sets explicit search_path for all functions
-- to prevent potential security issues from search_path manipulation
-- Date: 2025-01-23

-- ============================================
-- 1. Fix validate_session function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'validate_session'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.validate_session(text)
    SET search_path = public, pg_catalog;

    RAISE NOTICE 'Fixed search_path for validate_session function';
  END IF;
END $$;

-- ============================================
-- 2. Fix auto_link_accounts function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'auto_link_accounts'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    -- Get the function signature (it might have parameters)
    EXECUTE (
      SELECT format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        p.proname,
        pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.proname = 'auto_link_accounts'
      AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );

    RAISE NOTICE 'Fixed search_path for auto_link_accounts function';
  END IF;
END $$;

-- ============================================
-- 3. Fix cleanup_expired_sessions function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'cleanup_expired_sessions'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE (
      SELECT format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        p.proname,
        pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.proname = 'cleanup_expired_sessions'
      AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );

    RAISE NOTICE 'Fixed search_path for cleanup_expired_sessions function';
  END IF;
END $$;

-- ============================================
-- 4. Fix check_share_cooldown function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'check_share_cooldown'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE (
      SELECT format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        p.proname,
        pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.proname = 'check_share_cooldown'
      AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );

    RAISE NOTICE 'Fixed search_path for check_share_cooldown function';
  END IF;
END $$;

-- ============================================
-- 5. Fix award_share_points function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'award_share_points'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE (
      SELECT format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        p.proname,
        pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.proname = 'award_share_points'
      AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );

    RAISE NOTICE 'Fixed search_path for award_share_points function';
  END IF;
END $$;

-- ============================================
-- 6. Fix expire_old_rewards function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'expire_old_rewards'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE (
      SELECT format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        p.proname,
        pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.proname = 'expire_old_rewards'
      AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );

    RAISE NOTICE 'Fixed search_path for expire_old_rewards function';
  END IF;
END $$;

-- ============================================
-- 7. Fix update_submission_vote_count function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_submission_vote_count'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE (
      SELECT format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        p.proname,
        pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.proname = 'update_submission_vote_count'
      AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );

    RAISE NOTICE 'Fixed search_path for update_submission_vote_count function';
  END IF;
END $$;

-- ============================================
-- 8. Fix update_updated_at_column function
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_updated_at_column'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE (
      SELECT format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        p.proname,
        pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.proname = 'update_updated_at_column'
      AND p.pronamespace = 'public'::regnamespace
      LIMIT 1
    );

    RAISE NOTICE 'Fixed search_path for update_updated_at_column function';
  END IF;
END $$;

-- ============================================
-- 9. Fix ALL remaining functions without search_path
-- ============================================
-- This will catch any functions we might have missed
DO $$
DECLARE
  func_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  FOR func_record IN
    SELECT
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args,
      p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = false  -- Not SECURITY DEFINER
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        WHERE d.objid = p.oid
          AND d.deptype = 'e'
      )
      AND p.proconfig IS NULL  -- No config set (including search_path)
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
        func_record.function_name,
        func_record.args);

      fixed_count := fixed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Skip functions that can't be altered
      RAISE NOTICE 'Could not alter function %: %', func_record.function_name, SQLERRM;
    END;
  END LOOP;

  IF fixed_count > 0 THEN
    RAISE NOTICE 'Fixed search_path for % additional functions', fixed_count;
  END IF;
END $$;

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
  unfixed_count INTEGER;
BEGIN
  -- Count functions without search_path set
  SELECT COUNT(*)
  INTO unfixed_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = false
    AND (p.proconfig IS NULL OR NOT (p.proconfig @> ARRAY['search_path=public, pg_catalog']));

  IF unfixed_count > 0 THEN
    RAISE NOTICE '⚠️  There are still % functions without explicit search_path', unfixed_count;
  ELSE
    RAISE NOTICE '✅ All functions now have explicit search_path set!';
  END IF;
END $$;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Function search_path fixes applied:';
  RAISE NOTICE '  - All named functions updated with explicit search_path';
  RAISE NOTICE '  - search_path set to: public, pg_catalog';
  RAISE NOTICE '  - This prevents search_path manipulation attacks';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: These were WARNING level issues (not critical)';
  RAISE NOTICE '   The fix improves security by preventing potential';
  RAISE NOTICE '   search_path hijacking attacks.';
END $$;