const { createClient } = require('@supabase/supabase-js');

// Using service role key which bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Using anon key which respects RLS
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZXZjcGhsamZpYXJhemx2c25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDcwNzQsImV4cCI6MjA3MzYyMzA3NH0.QQ8K9U4b3u-D-M1OL5VKjK9343OvdbjMPBbcLNJ2hhE'
);

async function testFetch() {
  console.log('Testing contest fetching...\n');

  // Test with service role (bypasses RLS)
  console.log('1. With SERVICE ROLE key (bypasses RLS):');
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('contests')
    .select('id, name, status, is_test')
    .order('created_at', { ascending: false });

  if (adminError) {
    console.error('   Error:', adminError);
  } else {
    console.log(`   ✅ Found ${adminData.length} contests`);
    adminData.forEach(c => {
      console.log(`      - ${c.name} (${c.status}, test=${c.is_test})`);
    });
  }

  console.log('\n2. With ANON key (respects RLS):');
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('contests')
    .select('id, name, status, is_test')
    .order('created_at', { ascending: false });

  if (anonError) {
    console.error('   Error:', anonError);
  } else {
    console.log(`   ✅ Found ${anonData.length} contests`);
    anonData.forEach(c => {
      console.log(`      - ${c.name} (${c.status}, test=${c.is_test})`);
    });
  }

  console.log('\n3. Comparing results:');
  if (adminData && anonData) {
    if (adminData.length !== anonData.length) {
      console.log(`   ⚠️ RLS is limiting results: ${adminData.length} contests with admin key vs ${anonData.length} with anon key`);
      console.log('   Missing contests (blocked by RLS):');
      const anonIds = new Set(anonData.map(c => c.id));
      adminData.forEach(c => {
        if (!anonIds.has(c.id)) {
          console.log(`      - ${c.name}`);
        }
      });
    } else {
      console.log('   ✅ Same number of contests with both keys');
    }
  }
}

testFetch();