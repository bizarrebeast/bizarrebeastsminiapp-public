-- Production RLS Policies for unified_users table
-- This implements secure policies using session-based authentication
-- WITHOUT relying on Supabase Auth

-- ============================================
-- APPROACH 1: Using Service Role in API Routes
-- ============================================
-- The most secure approach is to use the service_role key
-- only in server-side API routes (never exposed to client)

-- First, ensure RLS is enabled
ALTER TABLE unified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Drop development policies
DROP POLICY IF EXISTS unified_users_public_read ON unified_users;
DROP POLICY IF EXISTS unified_users_public_insert ON unified_users;
DROP POLICY IF EXISTS unified_users_public_update ON unified_users;
DROP POLICY IF EXISTS unified_users_no_delete ON unified_users;
DROP POLICY IF EXISTS auth_sessions_public_all ON auth_sessions;

-- ============================================
-- PRODUCTION POLICIES - OPTION 1: API-ONLY ACCESS
-- ============================================
-- This approach only allows the service_role to access data
-- All client requests go through your Next.js API routes

-- Policy: Only service role can access unified_users
CREATE POLICY unified_users_service_only ON unified_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Only service role can access sessions
CREATE POLICY auth_sessions_service_only ON auth_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Revoke direct access from anon and authenticated roles
REVOKE ALL ON unified_users FROM anon;
REVOKE ALL ON auth_sessions FROM anon;
REVOKE ALL ON unified_users FROM authenticated;
REVOKE ALL ON auth_sessions FROM authenticated;

-- ============================================
-- PRODUCTION POLICIES - OPTION 2: SESSION-BASED
-- ============================================
-- This approach allows direct database access with session validation
-- Requires passing session token as a custom claim

-- First, create a function to validate sessions
CREATE OR REPLACE FUNCTION validate_session(session_token text)
RETURNS uuid AS $$
DECLARE
    user_id_result uuid;
BEGIN
    SELECT user_id INTO user_id_result
    FROM auth_sessions
    WHERE auth_sessions.session_token = validate_session.session_token
    AND auth_sessions.is_active = true
    AND auth_sessions.expires_at > CURRENT_TIMESTAMP;

    RETURN user_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can read their own profile with valid session
CREATE POLICY unified_users_read_with_session ON unified_users
    FOR SELECT
    USING (
        -- Check if request includes valid session token
        id = validate_session(
            current_setting('request.headers', true)::json->>'x-session-token'
        )
        OR
        -- Allow reading public profiles (username, display name, pfp)
        true -- You might want to limit which columns are readable
    );

-- Policy: Users can update their own profile with valid session
CREATE POLICY unified_users_update_with_session ON unified_users
    FOR UPDATE
    USING (
        id = validate_session(
            current_setting('request.headers', true)::json->>'x-session-token'
        )
    )
    WITH CHECK (
        id = validate_session(
            current_setting('request.headers', true)::json->>'x-session-token'
        )
    );

-- Policy: New users can insert with proper credentials
CREATE POLICY unified_users_insert_with_auth ON unified_users
    FOR INSERT
    WITH CHECK (
        -- Only allow inserts through API routes (service_role)
        -- OR with valid Farcaster/wallet proof (implement your logic)
        current_setting('request.headers', true)::json->>'x-auth-type' IN ('farcaster', 'wallet')
    );

-- Policy: No deletes allowed (soft delete via API)
CREATE POLICY unified_users_no_delete ON unified_users
    FOR DELETE
    USING (false);

-- ============================================
-- RECOMMENDED PRODUCTION SETUP
-- ============================================

/*
1. USE API ROUTES FOR ALL MUTATIONS
   - Create API routes in /app/api/auth/*
   - Use service_role key ONLY in API routes (server-side)
   - Never expose service_role key to client

2. IMPLEMENT SESSION VALIDATION
   - Generate secure session tokens (JWT or random)
   - Store in auth_sessions table with expiry
   - Validate on each request

3. CLIENT-SIDE SETUP
   - Use anon key for client-side Supabase client
   - Include session token in headers
   - All mutations go through API routes

Example API route structure:
*/

-- Example: How your Next.js API would use service role
/*
// app/api/auth/profile/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  // Get session token from header
  const sessionToken = request.headers.get('x-session-token')

  // Validate session
  const { data: session } = await supabase
    .from('auth_sessions')
    .select('user_id')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('unified_users')
    .select('*')
    .eq('id', session.user_id)
    .single()

  return Response.json(profile)
}
*/

-- ============================================
-- OPTION 3: HYBRID APPROACH (RECOMMENDED)
-- ============================================
-- Public reads, authenticated writes

-- Drop previous policies first
DROP POLICY IF EXISTS unified_users_read_with_session ON unified_users;
DROP POLICY IF EXISTS unified_users_update_with_session ON unified_users;
DROP POLICY IF EXISTS unified_users_insert_with_auth ON unified_users;

-- Policy: Anyone can read public profile data
CREATE POLICY unified_users_public_profiles ON unified_users
    FOR SELECT
    USING (true); -- Or limit to specific columns

-- Policy: Only API routes can insert/update/delete
CREATE POLICY unified_users_api_mutations ON unified_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant read access to anon for public profiles
GRANT SELECT ON unified_users TO anon;
GRANT SELECT ON unified_users TO authenticated;

-- Keep mutations restricted to service_role (API routes)
REVOKE INSERT, UPDATE, DELETE ON unified_users FROM anon;
REVOKE INSERT, UPDATE, DELETE ON unified_users FROM authenticated;

-- ============================================
-- SECURITY BEST PRACTICES
-- ============================================

/*
1. NEVER expose service_role key to client
2. Implement rate limiting in API routes
3. Add request validation and sanitization
4. Use HTTPS only in production
5. Implement CSRF protection
6. Add audit logging for sensitive operations
7. Regular security audits
8. Implement proper session expiry and rotation
9. Use secure session token generation (crypto.randomBytes)
10. Consider implementing refresh tokens
*/

-- ============================================
-- MONITORING
-- ============================================

-- Create an audit log table for tracking changes
CREATE TABLE IF NOT EXISTS unified_users_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES unified_users(id),
    action VARCHAR(50),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Index for audit queries
CREATE INDEX idx_unified_users_audit_user_id ON unified_users_audit(user_id);
CREATE INDEX idx_unified_users_audit_changed_at ON unified_users_audit(changed_at DESC);