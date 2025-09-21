-- Fix to allow multiple submissions per wallet per contest

-- 1. First, drop the existing unique constraint
ALTER TABLE contest_submissions
DROP CONSTRAINT IF EXISTS contest_submissions_contest_id_wallet_address_key;

-- 2. Add a new constraint that allows multiple submissions
-- This ensures uniqueness per submission ID but allows multiple entries per wallet
-- (The id column should already have a primary key constraint, so no action needed)

-- 3. Optionally, add an index for performance (without uniqueness)
CREATE INDEX IF NOT EXISTS idx_contest_submissions_wallet_contest
ON contest_submissions(contest_id, wallet_address);

-- Verify the change
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'contest_submissions';