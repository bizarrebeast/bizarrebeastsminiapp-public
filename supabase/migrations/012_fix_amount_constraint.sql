-- Fix amount constraint to allow free flips (amount = 0)
-- The old betting version required amount > 0, but daily flips are free

ALTER TABLE coin_flip_bets
DROP CONSTRAINT IF EXISTS valid_amount;

-- Add new constraint that allows 0 for free flips
ALTER TABLE coin_flip_bets
ADD CONSTRAINT valid_amount CHECK (amount::numeric >= 0);
