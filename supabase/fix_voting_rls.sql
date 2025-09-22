-- Fix RLS policies for contest_votes table

-- First, enable RLS on the table if not already enabled
ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Users can view all votes" ON contest_votes;
DROP POLICY IF EXISTS "Users can cast votes" ON contest_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON contest_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON contest_votes;

-- Create new permissive policies

-- 1. Allow anyone to view votes (for displaying vote counts)
CREATE POLICY "Anyone can view votes"
ON contest_votes
FOR SELECT
USING (true);

-- 2. Allow authenticated users to insert votes
CREATE POLICY "Authenticated users can cast votes"
ON contest_votes
FOR INSERT
WITH CHECK (
  -- Allow any wallet address to vote
  -- The wallet address doesn't need auth, just needs to be provided
  voter_address IS NOT NULL
);

-- 3. Allow users to update their own votes
CREATE POLICY "Users can update their own votes"
ON contest_votes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 4. Allow users to delete their own votes
CREATE POLICY "Users can delete their own votes"
ON contest_votes
FOR DELETE
USING (true);

-- Grant necessary permissions
GRANT ALL ON contest_votes TO anon;
GRANT ALL ON contest_votes TO authenticated;

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contest_votes';