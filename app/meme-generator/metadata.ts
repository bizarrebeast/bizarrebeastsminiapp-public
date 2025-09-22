import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/meme-creator-hero.png',
  button: {
    title: '🎨 Create Meme',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/meme-generator',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: 'Meme Generator | BizarreBeasts',
  description: 'Create epic BIZARRE memes with our collection of stickers, backgrounds, and effects!',
  openGraph: {
    title: 'Meme Generator | BizarreBeasts',
    description: 'Create epic BIZARRE memes with our collection of stickers, backgrounds, and effects!',
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/meme-generator',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/farcaster-assets/meme-creator-hero.png',
        width: 1200,
        height: 630,
        alt: 'BizarreBeasts Meme Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meme Generator | BizarreBeasts',
    description: 'Create epic BIZARRE memes!',
    images: ['https://bbapp.bizarrebeasts.io/farcaster-assets/meme-creator-hero.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/farcaster-assets/meme-creator-hero.png',
    'fc:frame:button:1': '🎨 Create Meme',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/meme-generator',
  },
};