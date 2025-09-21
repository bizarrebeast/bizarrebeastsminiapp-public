require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBizarreBeast() {
  const bizarreBeastData = {
    fid: 357897,
    username: 'bizarrebeast',
    displayName: 'BizarreBeasts',
    pfpUrl: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/6f2cca88-a12a-4b50-8e70-08d7a8fd7c00/original',
    bio: 'Onchain Artist and Builder of /bizarrebeasts and /bizarrebeastsart.',
    verifiedAddresses: [
      '0x93db1b0ad7365ebab85f3ed98b055af579a589c2',
      '0x0ab453a7fd033401c51d02cbd38661fb0adb1d5d',
      '0x582f57e25fdf9cfe29a91d082dd97a71fe3725cb',
      '0x2bfbbc03c3e22903206239e7fd802e6726b19b25',
      '0x3fdd6afed7a19990632468c7102219d051e685db',
      '0xd35da0c9824ce664b106ac5a526221e5fa66f433'
    ]
  };

  const targetWallet = '0x3FDD6aFEd7a19990632468c7102219d051E685dB';

  console.log('Updating @bizarrebeast account data...\n');

  try {
    // First, check if there's a user with this wallet address
    const { data: walletUsers, error: walletError } = await supabase
      .from('unified_users')
      .select('*')
      .ilike('wallet_address', `%${targetWallet}%`);

    if (walletError) {
      console.error('Error fetching wallet users:', walletError);
      return;
    }

    console.log(`Found ${walletUsers?.length || 0} users with wallet ${targetWallet}`);

    // Check if there's a user with FID 357897
    const { data: fidUsers, error: fidError } = await supabase
      .from('unified_users')
      .select('*')
      .eq('farcaster_fid', bizarreBeastData.fid);

    if (fidError) {
      console.error('Error fetching FID users:', fidError);
      return;
    }

    console.log(`Found ${fidUsers?.length || 0} users with FID ${bizarreBeastData.fid}`);

    // Update strategy:
    // 1. If a user exists with the wallet, update with Farcaster data
    // 2. If a user exists with the FID, ensure wallet is linked
    // 3. If neither exists, create a new user

    if (walletUsers && walletUsers.length > 0) {
      // Update existing wallet user with Farcaster data
      for (const user of walletUsers) {
        console.log(`\nUpdating user ${user.id} with @bizarrebeast Farcaster data...`);

        const { data: updated, error: updateError } = await supabase
          .from('unified_users')
          .update({
            farcaster_fid: bizarreBeastData.fid,
            farcaster_username: bizarreBeastData.username,
            farcaster_display_name: bizarreBeastData.displayName,
            farcaster_pfp_url: bizarreBeastData.pfpUrl,
            farcaster_bio: bizarreBeastData.bio,
            verified_addresses: bizarreBeastData.verifiedAddresses,
            identities_linked: true,
            linked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Failed to update user ${user.id}:`, updateError);
        } else {
          console.log('Successfully updated user:');
          console.log(`- ID: ${updated.id}`);
          console.log(`- Wallet: ${updated.wallet_address}`);
          console.log(`- Username: ${updated.farcaster_username}`);
          console.log(`- Display Name: ${updated.farcaster_display_name}`);
        }
      }
    } else if (fidUsers && fidUsers.length > 0) {
      // Update existing FID user with wallet
      for (const user of fidUsers) {
        console.log(`\nUpdating user ${user.id} with wallet ${targetWallet}...`);

        const { data: updated, error: updateError } = await supabase
          .from('unified_users')
          .update({
            wallet_address: targetWallet.toLowerCase(),
            verified_addresses: bizarreBeastData.verifiedAddresses,
            identities_linked: true,
            linked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Failed to update user ${user.id}:`, updateError);
        } else {
          console.log('Successfully updated user:');
          console.log(`- ID: ${updated.id}`);
          console.log(`- Wallet: ${updated.wallet_address}`);
          console.log(`- Username: ${updated.farcaster_username}`);
        }
      }
    } else {
      // Create new user with both wallet and Farcaster data
      console.log('\nCreating new user with @bizarrebeast data...');

      const { data: newUser, error: createError } = await supabase
        .from('unified_users')
        .insert([{
          wallet_address: targetWallet.toLowerCase(),
          farcaster_fid: bizarreBeastData.fid,
          farcaster_username: bizarreBeastData.username,
          farcaster_display_name: bizarreBeastData.displayName,
          farcaster_pfp_url: bizarreBeastData.pfpUrl,
          farcaster_bio: bizarreBeastData.bio,
          verified_addresses: bizarreBeastData.verifiedAddresses,
          primary_identity: 'farcaster',
          identities_linked: true,
          linked_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user:', createError);
      } else {
        console.log('Successfully created user:');
        console.log(`- ID: ${newUser.id}`);
        console.log(`- Wallet: ${newUser.wallet_address}`);
        console.log(`- Username: ${newUser.farcaster_username}`);
        console.log(`- Display Name: ${newUser.farcaster_display_name}`);
      }
    }

    // Clean up any "Testuser" entries
    console.log('\nChecking for any "Testuser" entries to clean up...');
    const { data: testUsers, error: testError } = await supabase
      .from('unified_users')
      .select('*')
      .or('farcaster_display_name.eq.Testuser,farcaster_username.eq.testuser');

    if (testUsers && testUsers.length > 0) {
      console.log(`Found ${testUsers.length} users with "Testuser" display name`);
      for (const user of testUsers) {
        console.log(`- User ${user.id}: username=${user.farcaster_username}, display=${user.farcaster_display_name}`);
      }
    }

    console.log('\n✅ Update complete!');

  } catch (error) {
    console.error('Script error:', error);
  }
}

updateBizarreBeast();