-- Add tier-based daily flips system
-- Tracks which flip number this is (1st, 2nd, 3rd, etc.) for the day

ALTER TABLE coin_flip_bets
ADD COLUMN IF NOT EXISTS daily_flip_number INTEGER DEFAULT 1;

-- Add index for counting daily flips
CREATE INDEX IF NOT EXISTS idx_daily_flips_count
ON coin_flip_bets(wallet_address, daily_flip_date, is_free_daily_flip)
WHERE is_free_daily_flip = TRUE;

COMMENT ON COLUMN coin_flip_bets.daily_flip_number IS 'Which flip number for the day (1st, 2nd, 3rd, etc.) - used for tier-based limits';
