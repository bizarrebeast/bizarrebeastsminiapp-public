import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/empire-hero.png',
  button: {
    title: '🏆 View Leaderboard',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/empire',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'Empire Leaderboard | BizarreBeasts',
  description: 'Track your rank in the BizarreBeasts Empire! Climb the leaderboard and compete for the top spot.',
  openGraph: {
    title: 'Empire Leaderboard | BizarreBeasts',
    description: 'Track your rank in the BizarreBeasts Empire! Climb the leaderboard and compete for the top spot.',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/empire',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/farcaster-assets/empire-hero.png',
        width: 1200,
        height: 630,
        alt: 'BizarreBeasts Empire Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empire Leaderboard | BizarreBeasts',
    description: 'Track your rank in the BizarreBeasts Empire!',
    images: ['https://bbapp.bizarrebeasts.io/farcaster-assets/empire-hero.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/farcaster-assets/empire-hero.png',
    'fc:frame:button:1': '🏆 View Leaderboard',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/empire',
  },
};