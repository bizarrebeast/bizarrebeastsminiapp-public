require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function mergeBizarreBeastUsers() {
  console.log('Merging @bizarrebeast duplicate users...\n');

  const targetWallet = '0x3FDD6aFEd7a19990632468c7102219d051E685dB';
  const bizarreBeastFid = 357897;

  try {
    // Get all users with the target wallet
    const { data: walletUsers, error: walletError } = await supabase
      .from('unified_users')
      .select('*')
      .ilike('wallet_address', `%${targetWallet}%`)
      .order('created_at', { ascending: true });

    if (walletError) {
      console.error('Error fetching wallet users:', walletError);
      return;
    }

    // Get user with the FID
    const { data: fidUsers, error: fidError } = await supabase
      .from('unified_users')
      .select('*')
      .eq('farcaster_fid', bizarreBeastFid);

    if (fidError) {
      console.error('Error fetching FID user:', fidError);
      return;
    }

    console.log(`Found ${walletUsers?.length || 0} users with wallet ${targetWallet}`);
    console.log(`Found ${fidUsers?.length || 0} users with FID ${bizarreBeastFid}`);

    // Log all users
    console.log('\nWallet users:');
    walletUsers?.forEach(user => {
      console.log(`- ID: ${user.id}, FID: ${user.farcaster_fid}, Username: ${user.farcaster_username}, Created: ${user.created_at}`);
    });

    console.log('\nFID users:');
    fidUsers?.forEach(user => {
      console.log(`- ID: ${user.id}, Wallet: ${user.wallet_address}, Username: ${user.farcaster_username}`);
    });

    // Strategy: Keep the user with the FID, add wallet if missing, delete duplicates
    if (fidUsers && fidUsers.length > 0) {
      const primaryUser = fidUsers[0];
      console.log(`\nPrimary user (with FID): ${primaryUser.id}`);

      // Update primary user with wallet if missing
      if (!primaryUser.wallet_address || primaryUser.wallet_address.toLowerCase() !== targetWallet.toLowerCase()) {
        console.log('Adding wallet to primary user...');
        const { data: updated, error: updateError } = await supabase
          .from('unified_users')
          .update({
            wallet_address: targetWallet.toLowerCase(),
            identities_linked: true,
            linked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', primaryUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update primary user:', updateError);
        } else {
          console.log('Successfully updated primary user with wallet');
        }
      }

      // Delete duplicate wallet-only users
      const duplicates = walletUsers?.filter(u => u.id !== primaryUser.id) || [];
      if (duplicates.length > 0) {
        console.log(`\nDeleting ${duplicates.length} duplicate users...`);
        for (const dup of duplicates) {
          console.log(`Deleting duplicate user ${dup.id}...`);
          const { error: deleteError } = await supabase
            .from('unified_users')
            .delete()
            .eq('id', dup.id);

          if (deleteError) {
            console.error(`Failed to delete ${dup.id}:`, deleteError);
          } else {
            console.log(`Deleted ${dup.id}`);
          }
        }
      }
    } else if (walletUsers && walletUsers.length > 0) {
      // No FID user exists, update first wallet user with FID
      const primaryUser = walletUsers[0];
      console.log(`\nNo FID user found. Updating wallet user ${primaryUser.id} with @bizarrebeast data...`);

      const bizarreBeastData = {
        farcaster_fid: 357897,
        farcaster_username: 'bizarrebeast',
        farcaster_display_name: 'BizarreBeasts',
        farcaster_pfp_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/6f2cca88-a12a-4b50-8e70-08d7a8fd7c00/original',
        farcaster_bio: 'Onchain Artist and Builder of /bizarrebeasts and /bizarrebeastsart.',
        verified_addresses: [
          '0x93db1b0ad7365ebab85f3ed98b055af579a589c2',
          '0x0ab453a7fd033401c51d02cbd38661fb0adb1d5d',
          '0x582f57e25fdf9cfe29a91d082dd97a71fe3725cb',
          '0x2bfbbc03c3e22903206239e7fd802e6726b19b25',
          '0x3fdd6afed7a19990632468c7102219d051e685db',
          '0xd35da0c9824ce664b106ac5a526221e5fa66f433'
        ],
        identities_linked: true,
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: updated, error: updateError } = await supabase
        .from('unified_users')
        .update(bizarreBeastData)
        .eq('id', primaryUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update primary user:', updateError);
      } else {
        console.log('Successfully updated primary user with @bizarrebeast data');
        console.log(`- Username: ${updated.farcaster_username}`);
        console.log(`- Display Name: ${updated.farcaster_display_name}`);
      }

      // Delete other duplicate wallet users
      const duplicates = walletUsers.slice(1);
      if (duplicates.length > 0) {
        console.log(`\nDeleting ${duplicates.length} duplicate wallet users...`);
        for (const dup of duplicates) {
          console.log(`Deleting duplicate ${dup.id}...`);
          const { error: deleteError } = await supabase
            .from('unified_users')
            .delete()
            .eq('id', dup.id);

          if (deleteError) {
            console.error(`Failed to delete ${dup.id}:`, deleteError);
          } else {
            console.log(`Deleted ${dup.id}`);
          }
        }
      }
    }

    // Final check
    console.log('\n=== Final State ===');
    const { data: finalCheck } = await supabase
      .from('unified_users')
      .select('*')
      .or(`wallet_address.ilike.%${targetWallet}%,farcaster_fid.eq.${bizarreBeastFid}`);

    if (finalCheck && finalCheck.length > 0) {
      console.log(`Total users after merge: ${finalCheck.length}`);
      finalCheck.forEach(user => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Wallet: ${user.wallet_address}`);
        console.log(`  FID: ${user.farcaster_fid}`);
        console.log(`  Username: ${user.farcaster_username}`);
        console.log(`  Display: ${user.farcaster_display_name}`);
        console.log(`  Linked: ${user.identities_linked}`);
      });
    }

    console.log('\n✅ Merge complete!');

  } catch (error) {
    console.error('Script error:', error);
  }
}

mergeBizarreBeastUsers();