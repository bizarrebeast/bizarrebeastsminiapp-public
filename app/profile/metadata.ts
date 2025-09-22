import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
  button: {
    title: '👤 My Profile',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/profile',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'My Profile | BizarreBeasts',
  description: 'View your BizarreBeasts profile, stats, and achievements!',
  openGraph: {
    title: 'My Profile | BizarreBeasts',
    description: 'View your BizarreBeasts profile, stats, and achievements!',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/profile',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
        width: 1200,
        height: 630,
        alt: 'BizarreBeasts Profile',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Profile | BizarreBeasts',
    description: 'View your BizarreBeasts profile, stats, and achievements!',
    images: ['https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
    'fc:frame:button:1': '👤 My Profile',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/profile',
  },
};