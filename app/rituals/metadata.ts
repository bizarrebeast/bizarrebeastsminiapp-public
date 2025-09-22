import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/rituals-hero.png',
  button: {
    title: '✅ Check In Daily',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/rituals',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'Daily Rituals | BizarreBeasts',
  description: 'Complete daily rituals, check in, and earn $BB rewards! Build your streak and climb the leaderboard.',
  openGraph: {
    title: 'Daily Rituals | BizarreBeasts',
    description: 'Complete daily rituals, check in, and earn $BB rewards! Build your streak and climb the leaderboard.',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/rituals',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/farcaster-assets/rituals-hero.png',
        width: 1200,
        height: 630,
        alt: 'BizarreBeasts Daily Rituals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Rituals | BizarreBeasts',
    description: 'Complete daily rituals, check in, and earn $BB rewards!',
    images: ['https://bbapp.bizarrebeasts.io/farcaster-assets/rituals-hero.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/farcaster-assets/rituals-hero.png',
    'fc:frame:button:1': '✅ Check In Daily',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/rituals',
  },
};