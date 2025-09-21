require('dotenv').config({ path: '.env.local' });

async function fetchBizarreBeastData() {
  const apiKey = process.env.NEYNAR_API_KEY;

  if (!apiKey) {
    console.error('NEYNAR_API_KEY not found in environment variables');
    return;
  }

  console.log('Fetching data for @bizarrebeast from Neynar API...\n');

  try {
    // First, search by username
    const searchResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=bizarrebeast&limit=5`,
      {
        headers: {
          'api_key': apiKey,
          'accept': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Search API responded with ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search Results:');
    console.log('=' .repeat(60));

    if (searchData.result && searchData.result.users) {
      for (const user of searchData.result.users) {
        console.log(`\nUsername: @${user.username}`);
        console.log(`Display Name: ${user.display_name}`);
        console.log(`FID: ${user.fid}`);
        console.log(`Bio: ${user.profile?.bio?.text || 'N/A'}`);
        console.log(`Profile URL: ${user.pfp_url}`);
        console.log(`Follower Count: ${user.follower_count}`);
        console.log(`Following Count: ${user.following_count}`);

        if (user.verified_addresses?.eth_addresses?.length > 0) {
          console.log(`Verified Addresses: ${user.verified_addresses.eth_addresses.join(', ')}`);
        }

        // If this is the exact match, fetch more details
        if (user.username === 'bizarrebeast') {
          console.log('\n' + '=' .repeat(60));
          console.log('Found exact match! Fetching full profile...\n');

          const profileResponse = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user.fid}`,
            {
              headers: {
                'api_key': apiKey,
                'accept': 'application/json'
              }
            }
          );

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const fullUser = profileData.users?.[0];

            if (fullUser) {
              console.log('Full Profile Data:');
              console.log('=' .repeat(60));
              console.log(JSON.stringify(fullUser, null, 2));

              console.log('\n' + '=' .repeat(60));
              console.log('Summary for Database Update:');
              console.log('=' .repeat(60));
              console.log(`FID: ${fullUser.fid}`);
              console.log(`Username: ${fullUser.username}`);
              console.log(`Display Name: ${fullUser.display_name}`);
              console.log(`Profile Picture: ${fullUser.pfp_url}`);
              console.log(`Bio: ${fullUser.profile?.bio?.text || ''}`);
              console.log(`Verified Addresses: ${fullUser.verified_addresses?.eth_addresses?.join(', ') || 'None'}`);

              // Check if 0x3FDD6aFEd7a19990632468c7102219d051E685dB is in verified addresses
              const targetWallet = '0x3FDD6aFEd7a19990632468c7102219d051E685dB';
              const hasTargetWallet = fullUser.verified_addresses?.eth_addresses?.some(
                addr => addr.toLowerCase() === targetWallet.toLowerCase()
              );

              console.log(`\nHas wallet ${targetWallet}? ${hasTargetWallet ? 'YES ✓' : 'NO ✗'}`);

              if (!hasTargetWallet) {
                console.log('\n⚠️  The wallet 0x3FDD6aFEd7a19990632468c7102219d051E685dB is NOT verified with @bizarrebeast');
                console.log('This means either:');
                console.log('1. The wallet belongs to a different Farcaster account');
                console.log('2. The wallet is not verified with any Farcaster account');
              }
            }
          }
        }
      }
    } else {
      console.log('No users found with username "bizarrebeast"');
    }

    // Also search for the wallet address
    console.log('\n' + '=' .repeat(60));
    console.log('Searching for wallet 0x3FDD6aFEd7a19990632468c7102219d051E685dB...\n');

    const walletResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by-verification?address=0x3FDD6aFEd7a19990632468c7102219d051E685dB`,
      {
        headers: {
          'api_key': apiKey,
          'accept': 'application/json'
        }
      }
    );

    if (walletResponse.ok) {
      const walletData = await walletResponse.json();

      if (walletData.result?.user) {
        const user = walletData.result.user;
        console.log('Wallet is verified with Farcaster account:');
        console.log(`Username: @${user.username}`);
        console.log(`Display Name: ${user.display_name}`);
        console.log(`FID: ${user.fid}`);
        console.log(`Profile URL: ${user.pfp_url}`);
      } else {
        console.log('Wallet is not verified with any Farcaster account');
      }
    } else if (walletResponse.status === 404) {
      console.log('Wallet is not verified with any Farcaster account');
    } else {
      console.log(`Error checking wallet: ${walletResponse.status}`);
    }

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchBizarreBeastData();