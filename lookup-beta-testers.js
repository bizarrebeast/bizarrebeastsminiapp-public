#!/usr/bin/env node

const usernames = [
  'siadude',
  'degencummunist.eth',
  'dribble',
  'listne2mm',
  'evogsr',
  'lisashin',
  'jinwoopark',
  'seonghyeon',
  'siablo',
  'jiablo',
  'pedronosandrine',
  'bbrown',
  'artstudio48',
  'heyake',
  'crezzang',
  'kateyarter',
  'sausagedad',
  'whittanyarter',
  'literalpanther',
  'mustycarlos',
  'bulgakov-vlad'
];

async function lookupUsers() {
  const results = [];

  for (const username of usernames) {
    // Clean username (remove @ if present, handle .eth)
    const cleanUsername = username.toLowerCase().replace('@', '').replace('.eth', '');

    try {
      const response = await fetch(`http://localhost:3002/api/neynar/username/${cleanUsername}`);

      if (!response.ok) {
        console.log(`❌ Failed to find: ${username}`);
        continue;
      }

      const data = await response.json();

      if (data.user) {
        const verifiedAddresses = data.user.verified_addresses?.eth_addresses || [];
        const primaryWallet = verifiedAddresses[0] || null;

        if (primaryWallet) {
          results.push({
            username: data.user.username,
            fid: data.user.fid,
            wallet: primaryWallet.toLowerCase(),
            allWallets: verifiedAddresses
          });

          console.log(`✅ ${data.user.username}: ${primaryWallet}`);
        } else {
          console.log(`⚠️  ${data.user.username}: No verified wallet`);
        }
      }
    } catch (error) {
      console.log(`❌ Error looking up ${username}:`, error.message);
    }
  }

  // Output formatted for beta testers list
  console.log('\n📋 Beta Testers List Format:\n');
  results.forEach(user => {
    console.log(`  '${user.wallet}', // @${user.username} (FID: ${user.fid})`);
  });

  console.log('\n📊 Summary:');
  console.log(`Total users found with wallets: ${results.length}`);

  return results;
}

// Run the lookup
lookupUsers().catch(console.error);