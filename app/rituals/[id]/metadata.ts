import { Metadata } from 'next';

// Ritual data (same as in the OG route)
export const rituals = [
  {
    id: 1,
    title: "Create a BizarreBeasts meme",
    description: "Create BB art and memes with the Sticker & Meme Creator!",
    image: "/assets/page-assets/banners/rituals-boxes/memes-ritual-banner.png",
    actionUrl: "https://bbapp.bizarrebeasts.io/meme-generator"
  },
  {
    id: 2,
    title: "Fire Up Dexscreener",
    description: "Support $BB on Dexscreener by hitting the rocket and fire buttons!",
    image: "/assets/page-assets/banners/rituals-boxes/dexscreener-ritual-banner.png",
    actionUrl: "https://dexscreener.com/base/0x7f12d13b34f5f4f0a9449c16bcd42f0da47af4cf"
  },
  {
    id: 3,
    title: "Create your $BRND podium",
    description: "Create your @brnd podium with $BB in first place and share!",
    image: "/assets/page-assets/banners/rituals-boxes/brnd-ritual-banner.png",
    actionUrl: "https://brnd.wtf"
  },
  {
    id: 4,
    title: "Send a #create GIVE",
    description: "Send @bizarrebeast a #create GIVE in the Based Creator's Directory!",
    image: "/assets/page-assets/banners/rituals-boxes/create-give-ritual-banner.png",
    actionUrl: "https://directory.basedcreators.com"
  },
  {
    id: 5,
    title: "Believe in BizarreBeasts",
    description: "\"Believe\" in BizarreBeasts ($BB) on @productclank",
    image: "/assets/page-assets/banners/rituals-boxes/productclank-ritual-banner.png",
    actionUrl: "https://farcaster.xyz/miniapps/X_DQ70cYHoX0/productclank"
  },
  {
    id: 6,
    title: "Play BizarreBeasts games",
    description: "Play BizarreBeasts games powered by /remix",
    image: "/assets/page-assets/banners/rituals-boxes/games-ritual-banner.png",
    actionUrl: "https://farcaster.xyz/miniapps/WnoFPCHF5Z6e/treasure-quest"
  },
  {
    id: 7,
    title: "Rip a pack of cards",
    description: "Rip a pack of BizarreBeasts ($BBCP) cards on @vibemarket",
    image: "/assets/page-assets/banners/rituals-boxes/rip-cards-ritual-banner.png",
    actionUrl: "https://vibechain.com/market/bizarrebeasts?ref=BJT4EJBY0SJP"
  },
  {
    id: 8,
    title: "Buy 1M $BB Tokens",
    description: "Grow your BizarreBeasts ($BB) bag and increase your rank on the empire leaderboard",
    image: "/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png",
    actionUrl: "https://bbapp.bizarrebeasts.io/swap"
  },
  {
    id: 9,
    title: "Share your Leaderboard rank",
    description: "Show off your BizarreBeasts leaderboard rank and tier to the community, powered by $GLANKER!",
    image: "/assets/page-assets/banners/rituals-boxes/leaderboard-rank-rituals-bannker.png",
    actionUrl: "https://bbapp.bizarrebeasts.io/empire"
  },
  {
    id: 10,
    title: "Prove It",
    description: "Prove that you are BIZARRE onchain, forever!",
    image: "/assets/page-assets/banners/rituals-boxes/bizarre-attest-ritual-banner.png",
    actionUrl: "https://bbapp.bizarrebeasts.io/rituals/10"
  },
  {
    id: 11,
    title: "Play and win BizBe's BIZARRE Coin Toss",
    description: "Play and win BizBe's BIZARRE Coin Toss, then share your win!",
    image: "/assets/page-assets/banners/rituals-boxes/bizbe-coin-toss-ritual-banner.png",
    actionUrl: "https://bbapp.bizarrebeasts.io/flip"
  }
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;
  const ritualId = parseInt(id);
  const ritual = rituals.find(r => r.id === ritualId);

  if (!ritual) {
    return {
      title: 'Ritual Not Found | BizarreBeasts',
      description: 'This ritual does not exist.',
    };
  }

  // Use dynamic OG image for this specific ritual
  const ogImageUrl = `https://bbapp.bizarrebeasts.io/api/og/ritual/${ritualId}`;

  // Create the MiniAppEmbed structure for Farcaster sharing
  const miniAppEmbed = {
    version: '1',
    imageUrl: ogImageUrl,
    button: {
      title: '✨ Complete Ritual',
      action: {
        type: 'launch_miniapp',
        url: `https://bbapp.bizarrebeasts.io/rituals/${ritualId}`,
        name: 'BizarreBeasts',
        splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
        splashBackgroundColor: '#0A0A0A'
      }
    }
  };

  return {
    title: `${ritual.title} | BizarreBeasts`,
    description: ritual.description,
    openGraph: {
      title: ritual.title,
      description: ritual.description,
      type: 'website',
      url: `https://bbapp.bizarrebeasts.io/rituals/${ritualId}`,
      siteName: 'BizarreBeasts',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ritual.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ritual.title,
      description: ritual.description,
      images: [ogImageUrl],
      creator: '@bizarrebeasts_',
    },
    other: {
      // MiniApp metadata for Farcaster sharing
      'fc:miniapp': JSON.stringify(miniAppEmbed),
      'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

      // Legacy frame metadata as fallback
      'fc:frame:image': ogImageUrl,
      'fc:frame:button:1': '✨ Complete Ritual',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': `https://bbapp.bizarrebeasts.io/rituals/${ritualId}`,
    },
  };
}