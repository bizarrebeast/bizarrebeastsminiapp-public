const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixVotingRLS() {
  console.log('Fixing RLS policies for contest_votes table...\n');

  const sql = fs.readFileSync('./supabase/fix_voting_rls.sql', 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log('Executing:', statement.substring(0, 50) + '...');

    const { data, error } = await supabase.rpc('execute_sql', {
      query: statement + ';'
    }).catch(err => {
      // If RPC doesn't exist, try direct query
      return { error: 'RPC not available' };
    });

    if (error) {
      // Try alternative approach using service key
      console.log('Note: Direct SQL execution requires Supabase Dashboard or CLI');
      console.log('Please run the following SQL in your Supabase SQL editor:\n');
      console.log('```sql');
      console.log(statement + ';');
      console.log('```\n');
    } else {
      console.log('✅ Success\n');
    }
  }

  console.log('\n=== MANUAL FIX REQUIRED ===');
  console.log('Since direct SQL execution is not available via JS client,');
  console.log('please go to your Supabase Dashboard:');
  console.log('1. Go to: https://supabase.com/dashboard/project/dtevcphljfiarazlvsnf/sql');
  console.log('2. Run the SQL from: supabase/fix_voting_rls.sql');
  console.log('3. This will fix the RLS policies and allow voting to work');
  console.log('\nAlternatively, here is the simplified fix:\n');

  const quickFix = `
-- Quick fix for voting RLS
ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view all votes" ON contest_votes;
DROP POLICY IF EXISTS "Users can cast votes" ON contest_votes;

-- Create simple permissive policy for all operations
CREATE POLICY "Enable all operations for contest_votes"
ON contest_votes
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON contest_votes TO anon;
GRANT ALL ON contest_votes TO authenticated;
`;

  console.log('```sql');
  console.log(quickFix);
  console.log('```');
}

fixVotingRLS();