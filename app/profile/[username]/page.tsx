import { Metadata } from 'next';
import ProfileClient from './ProfileClient';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  // Try to fetch user profile
  let displayName = username;
  let description = `View ${username}'s profile on BizarreBeasts`;

  try {
    const { data: profile } = await supabaseAdmin
      .from('empire_leaderboard')
      .select('display_name, empire_rank, empire_tier')
      .ilike('display_name', username)
      .single();

    if (profile) {
      displayName = profile.display_name || username;
      description = profile.empire_rank
        ? `${displayName} is rank #${profile.empire_rank} in the BizarreBeasts Empire!`
        : `View ${displayName}'s profile on BizarreBeasts`;
    }
  } catch (error) {
    // Fallback to default if profile not found
  }

  // Use dynamic OG image for profile
  const dynamicImageUrl = `https://bbapp.bizarrebeasts.io/api/og/profile/${username}`;

  // Create the MiniAppEmbed structure
  const miniAppEmbed = {
    version: '1',
    imageUrl: dynamicImageUrl,
    button: {
      title: '👤 View Profile',
      action: {
        type: 'launch_miniapp',
        url: `https://bbapp.bizarrebeasts.io/profile/${username}`,
        name: 'BizarreBeasts',
        splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
        splashBackgroundColor: '#0A0A0A'
      }
    }
  };

  return {
    title: `${displayName} | BizarreBeasts`,
    description,
    openGraph: {
      title: `${displayName} | BizarreBeasts`,
      description,
      type: 'profile',
      url: `https://bbapp.bizarrebeasts.io/profile/${username}`,
      siteName: 'BizarreBeasts',
      images: [
        {
          url: dynamicImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}'s Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} | BizarreBeasts`,
      description,
      images: [dynamicImageUrl],
      creator: '@bizarrebeasts_',
    },
    other: {
      // MiniApp metadata for Farcaster sharing
      'fc:miniapp': JSON.stringify(miniAppEmbed),
      'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

      // Legacy frame metadata as fallback
      'fc:frame:image': dynamicImageUrl,
      'fc:frame:button:1': '👤 View Profile',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': `https://bbapp.bizarrebeasts.io/profile/${username}`,
    },
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}