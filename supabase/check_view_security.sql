-- Check actual security invoker settings on views
SELECT
  c.relname as viewname,
  CASE
    WHEN c.relkind = 'v' THEN 'view'
    ELSE c.relkind::text
  END as type,
  CASE
    WHEN pg_catalog.pg_has_role(c.relowner, 'USAGE') THEN
      (SELECT array_to_string(c.reloptions, ', ')
       FROM pg_class
       WHERE oid = c.oid)
    ELSE NULL
  END as options,
  CASE
    WHEN (SELECT array_to_string(c.reloptions, ', ')
          FROM pg_class
          WHERE oid = c.oid) ILIKE '%security_invoker=true%' THEN '✅ SECURITY INVOKER'
    WHEN (SELECT array_to_string(c.reloptions, ', ')
          FROM pg_class
          WHERE oid = c.oid) ILIKE '%security_invoker=false%' THEN '❌ SECURITY DEFINER'
    WHEN (SELECT array_to_string(c.reloptions, ', ')
          FROM pg_class
          WHERE oid = c.oid) IS NULL THEN '⚠️ NO SETTING (defaults to DEFINER)'
    ELSE '❓ UNKNOWN'
  END as status
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
ORDER BY c.relname;
