-- ================================================
-- BIZARRE ATTESTATIONS SYSTEM
-- Complete database migration for ritual #10
-- ================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. PRIMARY ATTESTATION RECORDS
-- ================================================
CREATE TABLE IF NOT EXISTS bizarre_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    farcaster_fid INTEGER,
    username TEXT,
    tx_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    gas_price DECIMAL,
    contract_version INTEGER DEFAULT 1,
    contract_address TEXT,
    attestation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent multiple attestations per day per wallet
    UNIQUE(wallet_address, attestation_date)
);

-- ================================================
-- 2. AGGREGATED USER STATISTICS
-- ================================================
CREATE TABLE IF NOT EXISTS bizarre_attestation_stats (
    wallet_address TEXT PRIMARY KEY,
    farcaster_fid INTEGER,
    username TEXT,
    total_attestations INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_attestation_date DATE,
    first_attestation_date DATE,
    total_rewards_earned DECIMAL DEFAULT 0,
    nfts_earned JSONB DEFAULT '[]',
    milestone_badges JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. FLEXIBLE REWARD TRACKING
-- ================================================
CREATE TABLE IF NOT EXISTS attestation_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('BB_TOKEN', 'NFT', 'BADGE', 'MULTIPLIER')),
    reward_amount DECIMAL,
    reward_metadata JSONB,
    milestone INTEGER,
    tx_hash TEXT,
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. ANALYTICS TRACKING
-- ================================================
CREATE TABLE IF NOT EXISTS attestation_analytics (
    date DATE PRIMARY KEY,
    unique_attesters INTEGER DEFAULT 0,
    total_attestations INTEGER DEFAULT 0,
    new_attesters INTEGER DEFAULT 0,
    avg_gas_cost DECIMAL,
    total_gas_spent DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 5. PERFORMANCE INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_attestations_wallet ON bizarre_attestations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_attestations_date ON bizarre_attestations(attestation_date DESC);
CREATE INDEX IF NOT EXISTS idx_attestations_tx ON bizarre_attestations(tx_hash);
CREATE INDEX IF NOT EXISTS idx_attestations_wallet_date ON bizarre_attestations(wallet_address, attestation_date DESC);

CREATE INDEX IF NOT EXISTS idx_stats_total_desc ON bizarre_attestation_stats(total_attestations DESC);
CREATE INDEX IF NOT EXISTS idx_stats_streak_desc ON bizarre_attestation_stats(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_stats_wallet ON bizarre_attestation_stats(wallet_address);

CREATE INDEX IF NOT EXISTS idx_rewards_wallet ON attestation_rewards(wallet_address, claimed);
CREATE INDEX IF NOT EXISTS idx_rewards_unclaimed ON attestation_rewards(claimed) WHERE claimed = FALSE;
CREATE INDEX IF NOT EXISTS idx_rewards_milestone ON attestation_rewards(milestone);

-- ================================================
-- 6. LEADERBOARD VIEW
-- ================================================
CREATE OR REPLACE VIEW attestation_leaderboard AS
SELECT
    s.wallet_address,
    s.username,
    s.farcaster_fid,
    s.total_attestations,
    s.current_streak,
    s.best_streak,
    s.last_attestation_date,
    s.total_rewards_earned,
    s.milestone_badges,
    ROW_NUMBER() OVER (ORDER BY s.total_attestations DESC, s.current_streak DESC) as rank
FROM bizarre_attestation_stats s
WHERE s.total_attestations > 0
ORDER BY s.total_attestations DESC, s.current_streak DESC;

-- ================================================
-- 7. STREAK CALCULATION FUNCTION
-- ================================================
CREATE OR REPLACE FUNCTION calculate_attestation_streak(p_wallet_address TEXT)
RETURNS TABLE (current_streak INT, best_streak INT) AS $$
DECLARE
    v_current_streak INT := 0;
    v_best_streak INT := 0;
    v_temp_streak INT := 1;
    v_prev_date DATE;
    v_curr_date DATE;
    v_first_iteration BOOLEAN := TRUE;
BEGIN
    FOR v_curr_date IN
        SELECT attestation_date
        FROM bizarre_attestations
        WHERE wallet_address = p_wallet_address
        ORDER BY attestation_date DESC
    LOOP
        IF v_first_iteration THEN
            v_current_streak := 1;
            v_first_iteration := FALSE;
        ELSIF v_prev_date - v_curr_date = 1 THEN
            v_temp_streak := v_temp_streak + 1;
            IF v_current_streak = 1 THEN
                v_current_streak := v_temp_streak;
            END IF;
        ELSE
            v_best_streak := GREATEST(v_best_streak, v_temp_streak);
            v_temp_streak := 1;
        END IF;
        v_prev_date := v_curr_date;
    END LOOP;

    v_best_streak := GREATEST(v_best_streak, v_temp_streak, v_current_streak);

    RETURN QUERY SELECT v_current_streak, v_best_streak;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. UPDATE STATS TRIGGER
-- ================================================
CREATE OR REPLACE FUNCTION update_attestation_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_streaks RECORD;
BEGIN
    -- Get current user data
    SELECT * INTO v_streaks FROM calculate_attestation_streak(NEW.wallet_address);

    -- Upsert stats
    INSERT INTO bizarre_attestation_stats (
        wallet_address,
        farcaster_fid,
        username,
        total_attestations,
        current_streak,
        best_streak,
        last_attestation_date,
        first_attestation_date,
        updated_at
    ) VALUES (
        NEW.wallet_address,
        NEW.farcaster_fid,
        NEW.username,
        1,
        1,
        1,
        NEW.attestation_date,
        NEW.attestation_date,
        NOW()
    )
    ON CONFLICT (wallet_address) DO UPDATE SET
        farcaster_fid = COALESCE(NEW.farcaster_fid, bizarre_attestation_stats.farcaster_fid),
        username = COALESCE(NEW.username, bizarre_attestation_stats.username),
        total_attestations = bizarre_attestation_stats.total_attestations + 1,
        current_streak = v_streaks.current_streak,
        best_streak = v_streaks.best_streak,
        last_attestation_date = NEW.attestation_date,
        updated_at = NOW();

    -- Update analytics
    INSERT INTO attestation_analytics (
        date,
        unique_attesters,
        total_attestations,
        new_attesters,
        avg_gas_cost
    ) VALUES (
        NEW.attestation_date,
        1,
        1,
        CASE WHEN (SELECT COUNT(*) FROM bizarre_attestations WHERE wallet_address = NEW.wallet_address) = 1 THEN 1 ELSE 0 END,
        NEW.gas_price
    )
    ON CONFLICT (date) DO UPDATE SET
        total_attestations = attestation_analytics.total_attestations + 1,
        new_attesters = attestation_analytics.new_attesters +
            CASE WHEN (SELECT COUNT(*) FROM bizarre_attestations WHERE wallet_address = NEW.wallet_address) = 1 THEN 1 ELSE 0 END,
        avg_gas_cost = (attestation_analytics.avg_gas_cost * attestation_analytics.total_attestations + NEW.gas_price) /
            (attestation_analytics.total_attestations + 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_attestation_stats ON bizarre_attestations;
CREATE TRIGGER trigger_update_attestation_stats
AFTER INSERT ON bizarre_attestations
FOR EACH ROW
EXECUTE FUNCTION update_attestation_stats();

-- ================================================
-- 9. MILESTONE CHECK FUNCTION
-- ================================================
CREATE OR REPLACE FUNCTION check_attestation_milestones(p_wallet_address TEXT)
RETURNS TABLE (milestone INT, achieved BOOLEAN, reward_type TEXT, reward_amount DECIMAL) AS $$
DECLARE
    v_stats RECORD;
BEGIN
    SELECT * INTO v_stats FROM bizarre_attestation_stats WHERE wallet_address = p_wallet_address;

    -- 7-day streak milestone
    IF v_stats.current_streak >= 7 THEN
        RETURN QUERY SELECT 7, TRUE, 'BB_TOKEN'::TEXT, 100::DECIMAL;
    END IF;

    -- 14-day streak milestone
    IF v_stats.current_streak >= 14 THEN
        RETURN QUERY SELECT 14, TRUE, 'BB_TOKEN'::TEXT, 250::DECIMAL;
    END IF;

    -- 30-day streak milestone
    IF v_stats.current_streak >= 30 THEN
        RETURN QUERY SELECT 30, TRUE, 'NFT'::TEXT, 1::DECIMAL;
    END IF;

    -- 100 total attestations milestone
    IF v_stats.total_attestations >= 100 THEN
        RETURN QUERY SELECT 100, TRUE, 'BADGE'::TEXT, 1::DECIMAL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 10. RPC FUNCTIONS FOR API
-- ================================================

-- Get user attestation stats
CREATE OR REPLACE FUNCTION get_user_attestation_stats(p_wallet_address TEXT)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'wallet_address', s.wallet_address,
        'username', s.username,
        'total_attestations', s.total_attestations,
        'current_streak', s.current_streak,
        'best_streak', s.best_streak,
        'last_attestation_date', s.last_attestation_date,
        'rank', l.rank,
        'can_attest_today', NOT EXISTS(
            SELECT 1 FROM bizarre_attestations
            WHERE wallet_address = p_wallet_address
            AND attestation_date = CURRENT_DATE
        ),
        'milestones', s.milestone_badges
    ) INTO v_result
    FROM bizarre_attestation_stats s
    LEFT JOIN attestation_leaderboard l ON l.wallet_address = s.wallet_address
    WHERE s.wallet_address = p_wallet_address;

    RETURN COALESCE(v_result, json_build_object(
        'wallet_address', p_wallet_address,
        'total_attestations', 0,
        'current_streak', 0,
        'best_streak', 0,
        'rank', 0,
        'can_attest_today', true
    ));
END;
$$ LANGUAGE plpgsql;

-- Get leaderboard with pagination
CREATE OR REPLACE FUNCTION get_attestation_leaderboard(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(row_to_json(l))
        FROM (
            SELECT * FROM attestation_leaderboard
            LIMIT p_limit
            OFFSET p_offset
        ) l
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 11. GRANT PERMISSIONS
-- ================================================
-- Grant permissions to authenticated users
GRANT SELECT ON bizarre_attestations TO authenticated;
GRANT INSERT ON bizarre_attestations TO authenticated;
GRANT SELECT ON bizarre_attestation_stats TO authenticated;
GRANT SELECT ON attestation_rewards TO authenticated;
GRANT SELECT ON attestation_analytics TO authenticated;
GRANT SELECT ON attestation_leaderboard TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_attestation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_attestation_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION check_attestation_milestones TO authenticated;

-- ================================================
-- 12. ROW LEVEL SECURITY (Optional)
-- ================================================
ALTER TABLE bizarre_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestation_rewards ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own attestations
CREATE POLICY "Users can insert own attestations" ON bizarre_attestations
    FOR INSERT TO authenticated
    WITH CHECK (wallet_address = auth.jwt() ->> 'wallet_address');

-- Everyone can view attestations
CREATE POLICY "Everyone can view attestations" ON bizarre_attestations
    FOR SELECT TO authenticated
    USING (true);

-- Users can only view their own rewards
CREATE POLICY "Users can view own rewards" ON attestation_rewards
    FOR SELECT TO authenticated
    USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- ================================================
-- 13. INITIAL TEST DATA (Optional - Comment out for production)
-- ================================================
/*
-- Insert test attestation
INSERT INTO bizarre_attestations (
    wallet_address,
    username,
    tx_hash,
    block_number,
    attestation_date
) VALUES (
    '0x1234567890123456789012345678901234567890',
    'TestUser',
    '0xtest123',
    1000000,
    CURRENT_DATE
);

-- Check if stats were updated
SELECT * FROM bizarre_attestation_stats;
SELECT * FROM attestation_leaderboard;
*/

-- ================================================
-- Migration complete!
-- Run this in your Supabase SQL editor
-- ================================================