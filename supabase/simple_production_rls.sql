-- Simple Production RLS for unified_users
-- Since this table is just a cache of external data (Farcaster, wallet, blockchain)
-- users never directly modify it - all updates come from API syncs

-- Drop existing policies
DROP POLICY IF EXISTS unified_users_public_read ON unified_users;
DROP POLICY IF EXISTS unified_users_public_insert ON unified_users;
DROP POLICY IF EXISTS unified_users_public_update ON unified_users;
DROP POLICY IF EXISTS unified_users_no_delete ON unified_users;
DROP POLICY IF EXISTS unified_users_service_only ON unified_users;
DROP POLICY IF EXISTS unified_users_api_mutations ON unified_users;

-- ============================================
-- SIMPLE PRODUCTION POLICIES
-- ============================================

-- Policy 1: Everyone can read profiles (public profiles)
CREATE POLICY unified_users_public_read ON unified_users
    FOR SELECT
    USING (true);

-- Policy 2: Only API routes (service_role) can modify data
-- This is for syncing data from Farcaster/blockchain
CREATE POLICY unified_users_service_role_write ON unified_users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY unified_users_service_role_update ON unified_users
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 3: No deletes (we keep user history)
CREATE POLICY unified_users_no_delete ON unified_users
    FOR DELETE
    USING (false);

-- ============================================
-- PERMISSIONS
-- ============================================

-- Public can read profiles
GRANT SELECT ON unified_users TO anon;
GRANT SELECT ON unified_users TO authenticated;

-- Only service_role can write (for API sync operations)
GRANT INSERT, UPDATE ON unified_users TO service_role;

-- No one can delete
REVOKE DELETE ON unified_users FROM anon;
REVOKE DELETE ON unified_users FROM authenticated;
REVOKE DELETE ON unified_users FROM service_role;

-- ============================================
-- SESSIONS TABLE (Similar approach)
-- ============================================

DROP POLICY IF EXISTS auth_sessions_public_all ON auth_sessions;

-- Only service_role manages sessions
CREATE POLICY auth_sessions_service_only ON auth_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Revoke all access from public roles
REVOKE ALL ON auth_sessions FROM anon;
REVOKE ALL ON auth_sessions FROM authenticated;

-- Only service_role can manage sessions
GRANT ALL ON auth_sessions TO service_role;

-- ============================================
-- SUMMARY
-- ============================================
-- unified_users: Public read, service_role write
-- auth_sessions: service_role only
--
-- This is perfect for a read-only profile cache where:
-- - Anyone can view profiles (for sharing/discovery)
-- - Only API routes update data (from Farcaster/blockchain)
-- - Sessions are managed server-side only
-- ============================================