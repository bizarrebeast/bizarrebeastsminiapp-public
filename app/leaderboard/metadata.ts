import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
  button: {
    title: '🏆 View Leaderboard',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/leaderboard',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'Leaderboard | BizarreBeasts',
  description: 'View the top players in BizarreBeasts! Compete for the top spot and earn rewards.',
  openGraph: {
    title: 'Leaderboard | BizarreBeasts',
    description: 'View the top players in BizarreBeasts! Compete for the top spot and earn rewards.',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/leaderboard',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
        width: 1200,
        height: 630,
        alt: 'BizarreBeasts Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leaderboard | BizarreBeasts',
    description: 'View the top players in BizarreBeasts!',
    images: ['https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
    'fc:frame:button:1': '🏆 View Leaderboard',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/leaderboard',
  },
};