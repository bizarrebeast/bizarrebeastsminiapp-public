-- Mark existing test contests as test
-- This will mark any contest with "test" in the name as a test contest

UPDATE contests
SET is_test = true
WHERE
  LOWER(name) LIKE '%test%'
  OR name LIKE '%🎮 TEST:%'
  OR name LIKE '%TEST %'
  OR name = 'Mega Game Challenge' -- Add specific contest names here if needed
  OR name = 'TEST 4'
  OR name = 'TEST 2'
  OR name = 'TEST 3';

-- View which contests were marked as test
SELECT id, name, is_test, status, created_at
FROM contests
WHERE is_test = true
ORDER BY created_at DESC;

-- Optional: Delete all test contest submissions
-- WARNING: This will permanently delete data!
-- DELETE FROM contest_submissions
-- WHERE contest_id IN (
--   SELECT id FROM contests WHERE is_test = true
-- );