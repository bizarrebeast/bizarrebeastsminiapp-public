-- Fix RLS Policies for unified_users table
-- This fixes the 500 errors by allowing public access for upserts
-- and using proper service role access

-- First, drop existing restrictive policies
DROP POLICY IF EXISTS users_read_own ON unified_users;
DROP POLICY IF EXISTS users_update_own ON unified_users;
DROP POLICY IF EXISTS service_role_all_unified_users ON unified_users;

-- Create new, more permissive policies for development
-- NOTE: Make these more restrictive for production

-- Policy: Allow public read access to all profiles
-- This allows profile pages to work
CREATE POLICY unified_users_public_read ON unified_users
    FOR SELECT
    USING (true);  -- Allow all reads for now

-- Policy: Allow public insert for new users
-- This allows new users to create profiles
CREATE POLICY unified_users_public_insert ON unified_users
    FOR INSERT
    WITH CHECK (true);  -- Allow inserts

-- Policy: Allow users to update based on matching wallet or farcaster
-- Since we don't have auth.uid(), we allow updates where the user
-- provides matching credentials
CREATE POLICY unified_users_public_update ON unified_users
    FOR UPDATE
    USING (true)  -- For dev, allow all updates
    WITH CHECK (true);  -- For dev, allow all updates

-- Policy: No public deletes
CREATE POLICY unified_users_no_delete ON unified_users
    FOR DELETE
    USING (false);

-- Also fix the auth_sessions table policies
DROP POLICY IF EXISTS users_read_own_sessions ON auth_sessions;
DROP POLICY IF EXISTS service_role_all_sessions ON auth_sessions;

-- Allow public operations on sessions for now
CREATE POLICY auth_sessions_public_all ON auth_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions for anonymous access
-- This is what allows the app to work without Supabase Auth
GRANT ALL ON unified_users TO anon;
GRANT ALL ON auth_sessions TO anon;
GRANT ALL ON unified_users TO authenticated;
GRANT ALL ON auth_sessions TO authenticated;

-- Make sure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- PRODUCTION RECOMMENDATIONS
-- ============================================
-- For production, you should:
-- 1. Use API keys with service_role for server-side operations
-- 2. Implement proper JWT validation in your API routes
-- 3. Update RLS policies to check session tokens
-- 4. Consider using Supabase Auth for better security

-- Example production policy (commented out):
-- CREATE POLICY unified_users_with_session ON unified_users
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM auth_sessions
--             WHERE auth_sessions.user_id = unified_users.id
--             AND auth_sessions.is_active = true
--             AND auth_sessions.expires_at > now()
--             AND auth_sessions.session_token = current_setting('app.session_token', true)
--         )
--     );