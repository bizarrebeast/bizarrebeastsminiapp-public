import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key for admin operations
// This bypasses Row Level Security (RLS) policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Only create the admin client if we have the service key
// Falls back to anon key if service key is not available
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Export a flag to check if we're using the service role
export const hasServiceRole = !!supabaseServiceKey;

if (!hasServiceRole) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.warn('⚠️ Admin operations may fail due to RLS policies');
  console.warn('⚠️ Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
}