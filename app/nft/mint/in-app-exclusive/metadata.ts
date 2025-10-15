import { Metadata } from 'next';

// Create the MiniAppEmbed structure for Farcaster sharing
const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/assets/nft/bizbe-booty-shaking-nft-banner.png',
  button: {
    title: 'Mint BizBe NFT',
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/nft/mint/in-app-exclusive',
      name: 'BizarreBeasts',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: "Mint BizBe's Booty Shake | BizarreBeasts In-App Exclusive",
  description: "Mint the first-ever BizarreBeasts In-App Exclusive NFT! Watch BizBe shake their legendary booty. Limited to 500 pieces. Dynamic pricing: 5M-20M $BB. 100% of proceeds used to fund community rewards, treasury drops, and token burns.",
  openGraph: {
    title: "BizBe's Booty Shake | In-App Exclusive NFT",
    description: "First In-App Exclusive NFT • Limited 500 Supply • Dynamic Pricing • $BB Tokens Only",
    type: 'website',
    url: 'https://bbapp.bizarrebeasts.io/nft/mint/in-app-exclusive',
    siteName: 'BizarreBeasts',
    images: [
      {
        url: 'https://bbapp.bizarrebeasts.io/assets/nft/bizbe-booty-shaking-nft-banner.png',
        width: 1200,
        height: 630,
        alt: "BizBe's Booty Shake NFT",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "BizBe's Booty Shake | In-App Exclusive NFT",
    description: "First In-App Exclusive NFT • Limited 500 • Mint with $BB Tokens",
    images: ['https://bbapp.bizarrebeasts.io/assets/nft/bizbe-booty-shaking-nft-banner.png'],
    creator: '@bizarrebeasts_',
  },
  other: {
    // MiniApp metadata for Farcaster sharing
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

    // Legacy frame metadata as fallback
    'fc:frame:image': 'https://bbapp.bizarrebeasts.io/assets/nft/bizbe-booty-shaking-nft-banner.png',
    'fc:frame:button:1': 'Mint BizBe NFT',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/nft/mint/in-app-exclusive',
  },
};
