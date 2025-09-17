-- Add test field to contests table
ALTER TABLE contests
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN contests.is_test IS 'Whether this is a test contest (excluded from production views by default)';

-- Optional: Mark existing test contests
-- UPDATE contests
-- SET is_test = true
-- WHERE name LIKE '%TEST%' OR name LIKE '%test%';