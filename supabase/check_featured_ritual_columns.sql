-- Check the actual columns in featured_ritual_completions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'featured_ritual_completions'
ORDER BY ordinal_position;

-- Also check existing policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'featured_ritual_completions';
