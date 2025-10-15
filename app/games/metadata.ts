import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
  button: {
    title: '🎮 Play Games',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/games',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'Games | BizarreBeasts',
  description: 'Play 9 original BizarreBeasts games! 8 powered by Remix plus BizBe\'s exclusive Coin Toss. Adventures, puzzles, and treasures await in the BIZARRE gaming ecosystem.',
  openGraph: {
    title: 'BizarreBeasts Games',
    description: 'Play 9 original BizarreBeasts games! 8 powered by Remix plus BizBe\'s exclusive Coin Toss.',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/games',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
        width: 1200,
        height: 630,
        alt: 'BizarreBeasts Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BizarreBeasts Games',
    description: 'Play 9 original BizarreBeasts games! 8 powered by Remix plus BizBe\'s exclusive Coin Toss.',
    images: ['https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
    'fc:frame:button:1': '🎮 Play Games',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/games',
  },
};