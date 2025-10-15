import { Metadata } from 'next';
import FlipClient from './FlipClient';

const miniAppEmbed = {
  version: '1',
  imageUrl: 'https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/bizbe-coin-toss-ritual-banner.png',
  button: {
    title: "BizBe's BIZARRE Coin Toss",
    action: {
      type: 'launch_miniapp',
      url: 'https://bbapp.bizarrebeasts.io/flip',
      name: 'BizBe\'s Coin Toss',
      splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
      splashBackgroundColor: '#0A0A0A'
    }
  }
};

export const metadata: Metadata = {
  title: "BizBe's BIZARRE Coin Toss | BizarreBeasts",
  description: "Flip BizBe's coin! Heads or tails? Win streaks get 5x multipliers. Provably fair coin toss game.",
  openGraph: {
    title: "BizBe's BIZARRE Coin Toss",
    description: "Flip BizBe's coin! Heads or tails? Win streaks get 5x multipliers.",
    type: "website",
    url: "https://bbapp.bizarrebeasts.io/flip",
    siteName: "BizarreBeasts",
    images: [
      {
        url: "https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/bizbe-coin-toss-ritual-banner.png",
        width: 1200,
        height: 630,
        alt: "BizBe's BIZARRE Coin Toss",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BizBe's BIZARRE Coin Toss",
    description: "Flip BizBe's coin! Heads or tails? Win streaks get 5x multipliers.",
    images: ["https://bbapp.bizarrebeasts.io/assets/page-assets/banners/rituals-boxes/bizbe-coin-toss-ritual-banner.png"],
  },
  other: {
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed),
  },
};

export default function FlipPage() {
  return <FlipClient />;
}
