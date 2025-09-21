-- Unified Authentication System Database Schema
-- This migration creates the necessary tables for the unified auth system
-- combining Farcaster (social) and Wallet (financial) identities

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS unified_users CASCADE;

-- ============================================
-- UNIFIED USERS TABLE
-- ============================================
-- Core table storing unified user profiles
CREATE TABLE unified_users (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Wallet identity
    wallet_address VARCHAR(42) UNIQUE,
    wallet_ens VARCHAR(255),

    -- Farcaster identity
    farcaster_fid INTEGER UNIQUE,
    farcaster_username VARCHAR(255),
    farcaster_display_name VARCHAR(255),
    farcaster_pfp_url TEXT,
    farcaster_bio TEXT,

    -- Verified addresses from Farcaster (JSON array of addresses)
    verified_addresses JSONB DEFAULT '[]'::jsonb,

    -- Identity linking
    primary_identity VARCHAR(20) CHECK (primary_identity IN ('wallet', 'farcaster', NULL)),
    identities_linked BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMPTZ,

    -- Empire protocol data (cached)
    empire_tier VARCHAR(20),
    empire_rank INTEGER,
    empire_score VARCHAR(50),
    empire_data_updated_at TIMESTAMPTZ,

    -- User preferences
    preferences JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ,

    -- Indexes for performance
    CONSTRAINT wallet_address_format CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$' OR wallet_address IS NULL)
);

-- Create indexes for performance
CREATE INDEX idx_unified_users_wallet_address ON unified_users(wallet_address);
CREATE INDEX idx_unified_users_farcaster_fid ON unified_users(farcaster_fid);
CREATE INDEX idx_unified_users_farcaster_username ON unified_users(farcaster_username);
CREATE INDEX idx_unified_users_verified_addresses ON unified_users USING GIN(verified_addresses);
CREATE INDEX idx_unified_users_created_at ON unified_users(created_at DESC);
CREATE INDEX idx_unified_users_last_login ON unified_users(last_login_at DESC);

-- ============================================
-- AUTH SESSIONS TABLE
-- ============================================
-- Manages user sessions with JWT tokens
CREATE TABLE auth_sessions (
    -- Session identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User reference
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,

    -- Session tokens
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,

    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ,

    -- Activity tracking
    last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
);

-- Create indexes for session management
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_session_token ON auth_sessions(session_token);
CREATE INDEX idx_auth_sessions_refresh_token ON auth_sessions(refresh_token);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX idx_auth_sessions_is_active ON auth_sessions(is_active) WHERE is_active = TRUE;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to auto-link accounts when verified addresses match
CREATE OR REPLACE FUNCTION auto_link_accounts()
RETURNS TRIGGER AS $$
DECLARE
    matching_user unified_users;
BEGIN
    -- Only proceed if we have both wallet and verified addresses
    IF NEW.wallet_address IS NOT NULL AND NEW.verified_addresses IS NOT NULL AND jsonb_array_length(NEW.verified_addresses) > 0 THEN
        -- Check if the wallet address is in the verified addresses
        IF NEW.verified_addresses @> to_jsonb(NEW.wallet_address) THEN
            -- Auto-link the accounts
            NEW.identities_linked = TRUE;
            NEW.linked_at = CURRENT_TIMESTAMP;
        END IF;
    END IF;

    -- Also check for existing users with matching addresses to link
    IF NEW.farcaster_fid IS NOT NULL AND NEW.verified_addresses IS NOT NULL THEN
        -- Look for users with wallet addresses in our verified list
        SELECT * INTO matching_user
        FROM unified_users
        WHERE id != NEW.id
        AND wallet_address IS NOT NULL
        AND NEW.verified_addresses @> to_jsonb(wallet_address)
        LIMIT 1;

        IF matching_user.id IS NOT NULL THEN
            -- We found a match, consider merging or flagging
            -- For now, we'll just log this in metadata
            NEW.metadata = jsonb_set(
                COALESCE(NEW.metadata, '{}'::jsonb),
                '{potential_duplicate}',
                to_jsonb(matching_user.id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE auth_sessions
    SET is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revoked_reason = 'Session expired'
    WHERE expires_at < CURRENT_TIMESTAMP
    AND is_active = TRUE;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_unified_users_updated_at
    BEFORE UPDATE ON unified_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_sessions_updated_at
    BEFORE UPDATE ON auth_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-link accounts
CREATE TRIGGER auto_link_accounts_trigger
    BEFORE INSERT OR UPDATE ON unified_users
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_accounts();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on tables
ALTER TABLE unified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY users_read_own ON unified_users
    FOR SELECT
    USING (
        auth.uid()::text = id::text
        OR
        EXISTS (
            SELECT 1 FROM auth_sessions
            WHERE auth_sessions.user_id = unified_users.id
            AND auth_sessions.is_active = TRUE
            AND auth_sessions.expires_at > CURRENT_TIMESTAMP
        )
    );

-- Policy: Users can update their own profile
CREATE POLICY users_update_own ON unified_users
    FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Policy: Service role can do everything (for API routes)
CREATE POLICY service_role_all_unified_users ON unified_users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Users can read their own sessions
CREATE POLICY users_read_own_sessions ON auth_sessions
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM unified_users
            WHERE auth.uid()::text = id::text
        )
    );

-- Policy: Service role can manage all sessions
CREATE POLICY service_role_all_sessions ON auth_sessions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================

-- Insert a test user with both identities linked
-- INSERT INTO unified_users (
--     wallet_address,
--     farcaster_fid,
--     farcaster_username,
--     farcaster_display_name,
--     verified_addresses,
--     identities_linked,
--     linked_at,
--     primary_identity
-- ) VALUES (
--     '0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9B',
--     12345,
--     'testuser',
--     'Test User',
--     '["0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9B"]'::jsonb,
--     true,
--     CURRENT_TIMESTAMP,
--     'farcaster'
-- );

-- ============================================
-- GRANTS (adjust based on your Supabase setup)
-- ============================================

-- Grant necessary permissions
GRANT ALL ON unified_users TO authenticated;
GRANT ALL ON auth_sessions TO authenticated;
GRANT ALL ON unified_users TO service_role;
GRANT ALL ON auth_sessions TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

-- Add table comments
COMMENT ON TABLE unified_users IS 'Stores unified user profiles combining wallet and Farcaster identities';
COMMENT ON TABLE auth_sessions IS 'Manages user authentication sessions with JWT tokens';

-- Add column comments
COMMENT ON COLUMN unified_users.wallet_address IS 'Ethereum wallet address (checksummed)';
COMMENT ON COLUMN unified_users.farcaster_fid IS 'Farcaster ID - unique identifier in Farcaster network';
COMMENT ON COLUMN unified_users.verified_addresses IS 'Array of wallet addresses verified through Farcaster';
COMMENT ON COLUMN unified_users.identities_linked IS 'Whether wallet and Farcaster identities are linked';
COMMENT ON COLUMN unified_users.primary_identity IS 'Which identity the user primarily uses (wallet or farcaster)';
COMMENT ON COLUMN auth_sessions.session_token IS 'JWT session token for authentication';
COMMENT ON COLUMN auth_sessions.refresh_token IS 'JWT refresh token for session renewal';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Run this migration in Supabase dashboard:
-- 1. Go to SQL Editor in Supabase Dashboard
-- 2. Create a new query
-- 3. Paste this entire file
-- 4. Run the query
-- 5. Verify tables were created in Table Editor