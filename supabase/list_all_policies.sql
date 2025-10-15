-- List all RLS policies to understand what needs to be consolidated
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'coin_flip_bets',
    'coin_flip_self_exclusions',
    'coin_flip_achievements',
    'coin_flip_user_achievements',
    'coin_flip_config',
    'coin_flip_leaderboard',
    'coin_flip_leaderboard_daily',
    'coin_flip_leaderboard_weekly',
    'coin_flip_daily_limits',
    'contest_submissions',
    'contests',
    'contest_votes',
    'user_shares',
    'share_rewards',
    'featured_ritual_completions'
  )
ORDER BY tablename, cmd, policyname;
