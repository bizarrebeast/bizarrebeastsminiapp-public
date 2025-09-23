const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySecurityFixes() {
  console.log('🔍 Verifying Supabase Security Fixes\n');
  console.log('=' .repeat(50));

  try {
    // 1. Check if views exist and are accessible
    console.log('\n1️⃣ Checking view accessibility:');

    // Test contest_leaderboard view
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('contest_leaderboard')
      .select('*')
      .limit(1);

    if (leaderboardError) {
      console.log('❌ contest_leaderboard view error:', leaderboardError.message);
    } else {
      console.log('✅ contest_leaderboard view is accessible');
      console.log('   Records found:', leaderboard?.length || 0);
    }

    // Test active_contests_view
    const { data: activeContests, error: activeContestsError } = await supabase
      .from('active_contests_view')
      .select('*')
      .limit(1);

    if (activeContestsError) {
      console.log('❌ active_contests_view error:', activeContestsError.message);
    } else {
      console.log('✅ active_contests_view is accessible');
      console.log('   Active contests found:', activeContests?.length || 0);
    }

    // 2. Check RLS status on tables
    console.log('\n2️⃣ Checking RLS status on tables:');

    const tables = [
      'contests',
      'contest_submissions',
      'contest_votes',
      'contest_winners',
      'unified_users',
      'auth_sessions',
      'onboarding_tasks',
      'user_onboarding_progress',
      'ritual_completions'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.rpc('check_table_rls', {
        table_name: table
      }).single().catch(() => ({ data: null, error: 'Function not available' }));

      if (data) {
        console.log(`   ${table}: RLS ${data.rls_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      }
    }

    // 3. Test data access patterns
    console.log('\n3️⃣ Testing data access patterns:');

    // Test contest submissions access
    const { data: submissions, error: submissionsError } = await supabase
      .from('contest_submissions')
      .select('id, wallet_address, status')
      .eq('status', 'approved')
      .limit(5);

    if (submissionsError) {
      console.log('❌ Error accessing contest_submissions:', submissionsError.message);
    } else {
      console.log('✅ Can access approved contest_submissions');
      console.log('   Approved submissions found:', submissions?.length || 0);
    }

    // Test contest votes access
    const { data: votes, error: votesError } = await supabase
      .from('contest_votes')
      .select('*')
      .limit(5);

    if (votesError) {
      console.log('❌ Error accessing contest_votes:', votesError.message);
    } else {
      console.log('✅ Can access contest_votes');
      console.log('   Votes found:', votes?.length || 0);
    }

    // 4. Check for SECURITY DEFINER in database
    console.log('\n4️⃣ Checking for SECURITY DEFINER usage:');

    const { data: secDefViews, error: secDefError } = await supabase
      .rpc('check_security_definer')
      .catch(() => ({
        data: null,
        error: 'Cannot check - need to create the function first'
      }));

    if (secDefError) {
      console.log('   ⚠️  Cannot automatically check SECURITY DEFINER usage');
      console.log('   Run this SQL in Supabase dashboard to check:');
      console.log(`
      SELECT
        schemaname,
        viewname,
        definition
      FROM pg_views
      WHERE definition LIKE '%SECURITY DEFINER%'
        AND schemaname = 'public';
      `);
    } else if (secDefViews && secDefViews.length > 0) {
      console.log('   ⚠️  Found views/functions with SECURITY DEFINER:');
      secDefViews.forEach(item => {
        console.log(`      - ${item.name}`);
      });
    } else {
      console.log('   ✅ No SECURITY DEFINER found in views');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Security verification complete!\n');
    console.log('📝 Next steps:');
    console.log('1. Apply the migration: supabase/fix_security_definer_issues.sql');
    console.log('2. Test your application thoroughly');
    console.log('3. Monitor for any access issues');
    console.log('4. Check Supabase dashboard for security warnings');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Helper function to create RLS check (run this in Supabase SQL editor first)
const createRLSCheckFunction = `
CREATE OR REPLACE FUNCTION check_table_rls(table_name text)
RETURNS TABLE(rls_enabled boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT relrowsecurity
  FROM pg_class
  WHERE relname = table_name
    AND relnamespace = 'public'::regnamespace;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_security_definer()
RETURNS TABLE(name text, type text) AS $$
BEGIN
  RETURN QUERY
  SELECT
    proname::text as name,
    'function'::text as type
  FROM pg_proc
  WHERE prosecdef = true
    AND pronamespace = 'public'::regnamespace
  UNION ALL
  SELECT
    viewname::text as name,
    'view'::text as type
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%';
END;
$$ LANGUAGE plpgsql;
`;

console.log('📋 First, create these helper functions in Supabase SQL Editor:\n');
console.log(createRLSCheckFunction);
console.log('\n' + '=' .repeat(50));
console.log('\nThen run: node verify_security_fixes.js\n');

// Run verification if helper functions exist
verifySecurityFixes();