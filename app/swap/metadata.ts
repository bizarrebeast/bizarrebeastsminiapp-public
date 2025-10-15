import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png',
  button: {
    title: '🔄 Swap $BB',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/swap',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'Swap $BB | BizarreBeasts',
  description: 'Swap ETH for $BB tokens directly in Farcaster! Native token swaps with live price charts.',
  openGraph: {
    title: 'Swap $BB | BizarreBeasts',
    description: 'Swap ETH for $BB tokens directly in Farcaster! Native token swaps with live price charts.',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/swap',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png',
        width: 1200,
        height: 630,
        alt: 'Swap $BB Tokens',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Swap $BB | BizarreBeasts',
    description: 'Swap ETH for $BB tokens directly in Farcaster!',
    images: ['https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png',
    'fc:frame:button:1': '🔄 Swap $BB',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/swap',
  },
};
