-- Find all function signatures for the problematic functions
SELECT
  n.nspname AS schema,
  p.proname AS name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_catalog.pg_get_function_arguments(p.oid) AS full_arguments
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('update_flip_stats', 'can_player_bet')
ORDER BY p.proname, p.oid;
