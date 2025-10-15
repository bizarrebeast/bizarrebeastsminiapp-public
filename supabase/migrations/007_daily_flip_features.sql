-- Daily Flip Features Migration
-- Adds: Bonus Spins, Monthly Prize Drawings, Entry Tracking
-- Date: 2025-10-08

-- ============================================================================
-- BONUS SPINS SYSTEM
-- ============================================================================

-- Track bonus spins awarded to users
CREATE TABLE flip_bonus_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification (either wallet or FID required)
  wallet_address TEXT,
  farcaster_fid INTEGER,
  farcaster_username TEXT,

  -- Bonus details
  bonus_spins_remaining INTEGER DEFAULT 0,
  bonus_spins_awarded INTEGER DEFAULT 0,
  reason TEXT, -- "Community contest winner", "Technical compensation", etc.

  -- Admin tracking
  awarded_by TEXT, -- Admin wallet address
  awarded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Expiration (NULL = never expires)
  expires_at TIMESTAMPTZ,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  total_used INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints: Must have at least one identifier
  CHECK (wallet_address IS NOT NULL OR farcaster_fid IS NOT NULL),
  -- Only one record per wallet (use upsert to add more spins)
  UNIQUE(wallet_address),
  -- Only one record per FID (use upsert to add more spins)
  UNIQUE(farcaster_fid)
);

-- Indexes
CREATE INDEX idx_bonus_spins_wallet ON flip_bonus_spins(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_bonus_spins_fid ON flip_bonus_spins(farcaster_fid) WHERE farcaster_fid IS NOT NULL;
CREATE INDEX idx_bonus_spins_expires ON flip_bonus_spins(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_bonus_spins_remaining ON flip_bonus_spins(bonus_spins_remaining) WHERE bonus_spins_remaining > 0;

-- ============================================================================
-- MONTHLY PRIZE DRAWINGS
-- ============================================================================

-- Configure monthly prizes (admin sets these)
CREATE TABLE flip_monthly_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prize period
  month DATE NOT NULL UNIQUE, -- '2025-10-01' for October 2025

  -- Prize details
  prize_name TEXT NOT NULL,
  prize_description TEXT,
  prize_image_url TEXT,
  prize_value TEXT, -- Display text like "Unopened VibeCard Pack"

  -- Drawing configuration
  drawing_date TIMESTAMPTZ NOT NULL, -- When to announce winner
  entries_close_at TIMESTAMPTZ, -- Optional: stop accepting entries before drawing

  -- Winner information
  winner_wallet TEXT,
  winner_fid INTEGER,
  winner_username TEXT,
  winner_total_entries INTEGER,
  winner_announced_at TIMESTAMPTZ,

  -- Prize delivery
  prize_claimed BOOLEAN DEFAULT FALSE,
  prize_claimed_at TIMESTAMPTZ,
  prize_tx_hash TEXT, -- If on-chain delivery

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'drawn', 'claimed', 'completed', 'cancelled')),

  -- Metadata
  created_by TEXT, -- Admin wallet
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_monthly_prizes_month ON flip_monthly_prizes(month DESC);
CREATE INDEX idx_monthly_prizes_status ON flip_monthly_prizes(status);
CREATE INDEX idx_monthly_prizes_drawing_date ON flip_monthly_prizes(drawing_date);

-- Track monthly entries per user
CREATE TABLE flip_monthly_entries (
  id UUID DEFAULT gen_random_uuid(),

  -- User identification
  wallet_address TEXT NOT NULL,
  farcaster_fid INTEGER,
  farcaster_username TEXT,

  -- Entry tracking for specific month
  month DATE NOT NULL, -- '2025-10-01' for October
  total_entries INTEGER DEFAULT 0,
  flips_completed INTEGER DEFAULT 0, -- Total flips (should match entries 1:1)

  -- Breakdown by flip type
  daily_flips INTEGER DEFAULT 0, -- From daily free flips
  bonus_flips INTEGER DEFAULT 0, -- From bonus spins

  -- First/last flip this month
  first_flip_at TIMESTAMPTZ,
  last_flip_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (wallet_address, month)
);

-- Indexes
CREATE INDEX idx_monthly_entries_month ON flip_monthly_entries(month, total_entries DESC);
CREATE INDEX idx_monthly_entries_wallet ON flip_monthly_entries(wallet_address);
CREATE INDEX idx_monthly_entries_fid ON flip_monthly_entries(farcaster_fid) WHERE farcaster_fid IS NOT NULL;

-- Winner history (separate from prizes table for historical tracking)
CREATE TABLE flip_monthly_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Winner details
  month DATE NOT NULL UNIQUE, -- Only one winner per month
  wallet_address TEXT NOT NULL,
  farcaster_fid INTEGER,
  farcaster_username TEXT,

  -- Prize details
  prize_name TEXT NOT NULL,
  prize_description TEXT,
  total_entries INTEGER NOT NULL,

  -- Drawing info
  total_participants INTEGER, -- How many people entered
  total_pool_entries INTEGER, -- Total entries across all users
  winning_entry_number INTEGER, -- Which entry number won (for transparency)

  -- Dates
  drawn_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,

  -- Delivery
  prize_tx_hash TEXT,
  delivery_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_monthly_winners_month ON flip_monthly_winners(month DESC);
CREATE INDEX idx_monthly_winners_wallet ON flip_monthly_winners(wallet_address);

-- ============================================================================
-- BANKING SYSTEM (Accumulate winnings, withdraw when ready)
-- ============================================================================

-- Track accumulated winnings per user
CREATE TABLE flip_player_balances (
  wallet_address TEXT PRIMARY KEY,
  farcaster_fid INTEGER,
  farcaster_username TEXT,

  -- Balance tracking (in wei)
  total_won BIGINT DEFAULT 0, -- Lifetime winnings
  total_withdrawn BIGINT DEFAULT 0, -- Lifetime withdrawals
  pending_balance BIGINT DEFAULT 0, -- Current unclaimed balance

  -- Withdrawal info
  last_withdrawal_at TIMESTAMPTZ,
  total_withdrawals INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_player_balances_pending ON flip_player_balances(pending_balance DESC) WHERE pending_balance > 0;
CREATE INDEX idx_player_balances_fid ON flip_player_balances(farcaster_fid) WHERE farcaster_fid IS NOT NULL;

-- Withdrawal history
CREATE TABLE flip_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  wallet_address TEXT NOT NULL,
  amount BIGINT NOT NULL, -- Amount in wei

  -- Transaction info
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  tx_hash TEXT, -- Blockchain transaction hash

  -- Metadata
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_withdrawals_wallet ON flip_withdrawals(wallet_address, requested_at DESC);
CREATE INDEX idx_withdrawals_status ON flip_withdrawals(status) WHERE status != 'completed';

-- ============================================================================
-- UPDATE EXISTING COIN_FLIP_BETS TABLE
-- ============================================================================

-- Add columns to track free daily flips vs future betting flips
ALTER TABLE coin_flip_bets
ADD COLUMN IF NOT EXISTS is_free_daily_flip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_bonus_flip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS daily_flip_date DATE;

-- Indexes for daily flip tracking
CREATE INDEX IF NOT EXISTS idx_daily_flips_wallet_date
ON coin_flip_bets(wallet_address, daily_flip_date)
WHERE is_free_daily_flip = TRUE;

CREATE INDEX IF NOT EXISTS idx_daily_flips_fid_date
ON coin_flip_bets(farcaster_fid, daily_flip_date)
WHERE is_free_daily_flip = TRUE AND farcaster_fid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bonus_flips
ON coin_flip_bets(wallet_address, created_at)
WHERE is_bonus_flip = TRUE;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if user can flip today (considers daily + bonus spins)
CREATE OR REPLACE FUNCTION can_flip_today(
  p_wallet TEXT,
  p_fid INTEGER DEFAULT NULL
)
RETURNS TABLE(
  can_flip BOOLEAN,
  has_bonus_spins BOOLEAN,
  bonus_spins_remaining INTEGER,
  daily_flip_used BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_daily_flip_exists BOOLEAN;
  v_bonus_record RECORD;
BEGIN
  -- Check if daily flip already used
  SELECT EXISTS(
    SELECT 1 FROM coin_flip_bets
    WHERE daily_flip_date = v_today
    AND is_free_daily_flip = TRUE
    AND (
      (p_wallet IS NOT NULL AND wallet_address = p_wallet) OR
      (p_fid IS NOT NULL AND farcaster_fid = p_fid)
    )
  ) INTO v_daily_flip_exists;

  -- Check for bonus spins
  SELECT *
  INTO v_bonus_record
  FROM flip_bonus_spins
  WHERE bonus_spins_remaining > 0
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (
    (p_wallet IS NOT NULL AND wallet_address = p_wallet) OR
    (p_fid IS NOT NULL AND farcaster_fid = p_fid)
  )
  LIMIT 1;

  -- Return result
  IF v_bonus_record.bonus_spins_remaining > 0 THEN
    -- Has bonus spins - can flip regardless of daily status
    RETURN QUERY SELECT
      TRUE,
      TRUE,
      v_bonus_record.bonus_spins_remaining,
      v_daily_flip_exists,
      'Bonus spin available'::TEXT;
  ELSIF NOT v_daily_flip_exists THEN
    -- No bonus, but daily flip available
    RETURN QUERY SELECT
      TRUE,
      FALSE,
      0,
      FALSE,
      'Daily flip available'::TEXT;
  ELSE
    -- No flips available
    RETURN QUERY SELECT
      FALSE,
      FALSE,
      0,
      TRUE,
      'Already flipped today, no bonus spins'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment monthly entries after each flip
CREATE OR REPLACE FUNCTION increment_monthly_entries(
  p_wallet TEXT,
  p_fid INTEGER,
  p_username TEXT,
  p_is_bonus BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  v_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_entry_id UUID;
BEGIN
  -- Upsert monthly entry
  INSERT INTO flip_monthly_entries (
    wallet_address,
    farcaster_fid,
    farcaster_username,
    month,
    total_entries,
    flips_completed,
    daily_flips,
    bonus_flips,
    first_flip_at,
    last_flip_at
  ) VALUES (
    p_wallet,
    p_fid,
    p_username,
    v_month,
    1, -- total_entries
    1, -- flips_completed
    CASE WHEN NOT p_is_bonus THEN 1 ELSE 0 END, -- daily_flips
    CASE WHEN p_is_bonus THEN 1 ELSE 0 END, -- bonus_flips
    NOW(),
    NOW()
  )
  ON CONFLICT (wallet_address, month) DO UPDATE SET
    total_entries = flip_monthly_entries.total_entries + 1,
    flips_completed = flip_monthly_entries.flips_completed + 1,
    daily_flips = flip_monthly_entries.daily_flips + CASE WHEN NOT p_is_bonus THEN 1 ELSE 0 END,
    bonus_flips = flip_monthly_entries.bonus_flips + CASE WHEN p_is_bonus THEN 1 ELSE 0 END,
    farcaster_fid = COALESCE(p_fid, flip_monthly_entries.farcaster_fid),
    farcaster_username = COALESCE(p_username, flip_monthly_entries.farcaster_username),
    last_flip_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Function to use a bonus spin (decrement counter)
CREATE OR REPLACE FUNCTION use_bonus_spin(
  p_wallet TEXT,
  p_fid INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE flip_bonus_spins
  SET
    bonus_spins_remaining = bonus_spins_remaining - 1,
    last_used_at = NOW(),
    total_used = total_used + 1,
    updated_at = NOW()
  WHERE bonus_spins_remaining > 0
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (
    (p_wallet IS NOT NULL AND wallet_address = p_wallet) OR
    (p_fid IS NOT NULL AND farcaster_fid = p_fid)
  );

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED OCTOBER 2025 PRIZE
-- ============================================================================

INSERT INTO flip_monthly_prizes (
  month,
  prize_name,
  prize_description,
  prize_value,
  prize_image_url,
  drawing_date,
  status,
  created_by
) VALUES (
  '2025-10-01',
  'Unopened VibeCard Pack',
  'Win an unopened pack of VibeCards from the exclusive collection. One lucky winner will be selected from all October flips!',
  'Unopened VibeCard Pack',
  '/assets/page-assets/banners/rituals-boxes/rip-cards-ritual-banner.png',
  '2025-11-03 21:00:00+00', -- November 3rd, 9pm UTC
  'active',
  'system'
)
ON CONFLICT (month) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE flip_bonus_spins IS 'Admin-awarded bonus spins for users';
COMMENT ON TABLE flip_monthly_prizes IS 'Monthly prize configurations set by admins';
COMMENT ON TABLE flip_monthly_entries IS 'Track user entries into monthly prize drawings';
COMMENT ON TABLE flip_monthly_winners IS 'Historical record of monthly drawing winners';
COMMENT ON TABLE flip_player_balances IS 'Track accumulated unclaimed winnings per player';
COMMENT ON TABLE flip_withdrawals IS 'Withdrawal history and pending withdrawals';

COMMENT ON COLUMN coin_flip_bets.is_free_daily_flip IS 'TRUE if this was a free daily flip (not a betting flip)';
COMMENT ON COLUMN coin_flip_bets.is_bonus_flip IS 'TRUE if this used a bonus spin';
COMMENT ON COLUMN coin_flip_bets.daily_flip_date IS 'Date of daily flip for tracking one-per-day limit';

COMMENT ON FUNCTION can_flip_today IS 'Check if user has available flips today (daily or bonus)';
COMMENT ON FUNCTION increment_monthly_entries IS 'Increment monthly entry count after each flip';
COMMENT ON FUNCTION use_bonus_spin IS 'Decrement bonus spin counter after use';
