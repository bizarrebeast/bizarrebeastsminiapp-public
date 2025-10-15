-- Fix BIGINT overflow for large token amounts
-- Change balance columns from BIGINT to NUMERIC to handle large wei values

ALTER TABLE flip_player_balances
ALTER COLUMN total_won TYPE NUMERIC USING total_won::numeric,
ALTER COLUMN total_withdrawn TYPE NUMERIC USING total_withdrawn::numeric,
ALTER COLUMN pending_balance TYPE NUMERIC USING pending_balance::numeric;

ALTER TABLE flip_withdrawals
ALTER COLUMN amount TYPE NUMERIC USING amount::numeric;

-- Also fix payout in coin_flip_bets if needed
ALTER TABLE coin_flip_bets
ALTER COLUMN payout TYPE NUMERIC USING payout::numeric;
