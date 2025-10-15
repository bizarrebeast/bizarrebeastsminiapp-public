import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/tip-bb-ritual-banner.png',
  button: {
    title: '💸 Tip $BB',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/tip',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'Tip $BB | BizarreBeasts',
  description: 'Send $BB tokens to other Farcaster users! Support the community with native token tipping.',
  openGraph: {
    title: 'Tip $BB | BizarreBeasts',
    description: 'Send $BB tokens to other Farcaster users! Support the community with native token tipping.',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/tip',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/tip-bb-ritual-banner.png',
        width: 1200,
        height: 630,
        alt: 'Tip $BB Tokens',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tip $BB | BizarreBeasts',
    description: 'Send $BB tokens to other Farcaster users!',
    images: ['https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/tip-bb-ritual-banner.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/tip-bb-ritual-banner.png',
    'fc:frame:button:1': '💸 Tip $BB',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/tip',
  },
};
