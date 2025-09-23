import { Metadata } from 'next';

// Ritual data (same as in the OG route)
const rituals = [
  {
    id: 1,
    title: "Create a BizarreBeasts meme",
    description: "Create BB art and memes with the Sticker & Meme Creator!",
    image: "/assets/page-assets/banners/rituals-boxes/memes-ritual-banner.png"
  },
  {
    id: 2,
    title: "Fire Up Dexscreener",
    description: "Support $BB on Dexscreener by hitting the rocket and fire buttons!",
    image: "/assets/page-assets/banners/rituals-boxes/dexscreener-ritual-banner.png"
  },
  {
    id: 3,
    title: "Create your $BRND podium",
    description: "Create your @brnd podium with $BB in first place and share!",
    image: "/assets/page-assets/banners/rituals-boxes/brnd-ritual-banner.png"
  },
  {
    id: 4,
    title: "Send a #create GIVE",
    description: "Send @bizarrebeast a #create GIVE in the Based Creator's Directory!",
    image: "/assets/page-assets/banners/rituals-boxes/create-give-ritual-banner.png"
  },
  {
    id: 5,
    title: "Play BizarreBeasts Games",
    description: "Play games and earn rewards in the BizarreBeasts ecosystem!",
    image: "/assets/page-assets/banners/rituals-boxes/games-ritual-banner.png"
  },
  {
    id: 6,
    title: "Vote on ProductClank",
    description: "Support BizarreBeasts on ProductClank with your vote!",
    image: "/assets/page-assets/banners/rituals-boxes/productclank-ritual-banner.png"
  },
  {
    id: 7,
    title: "Swap for $BB",
    description: "Get $BB tokens and join the BizarreBeasts community!",
    image: "/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png"
  }
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const params = await searchParams;
  const ritualId = params.r ? parseInt(params.r as string) : null;
  const ritual = ritualId ? rituals.find(r => r.id === ritualId) : null;

  // Use dynamic OG image if ritual ID is provided
  const ogImageUrl = ritual
    ? `https://bbapp.bizarrebeasts.io/api/og/ritual/${ritualId}`
    : 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png';

  // Customize title and description for specific ritual
  const title = ritual
    ? `${ritual.title} | BizarreBeasts`
    : 'Daily Rituals | BizarreBeasts';

  const description = ritual
    ? ritual.description
    : 'Complete daily rituals, check in, and earn $BB rewards! Build your streak and climb the leaderboard.';

  // Create the MiniAppEmbed structure for Farcaster sharing
  const miniAppEmbed = {
    version: '1',
    imageUrl: ogImageUrl,
    button: {
      title: '✅ Check In Daily',
      action: {
        type: 'launch_miniapp',
        url: ritual
          ? `https://bbapp.bizarrebeasts.io/rituals?r=${ritualId}`
          : 'https://bbapp.bizarrebeasts.io/rituals',
        name: 'BizarreBeasts',
        splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
        splashBackgroundColor: '#0A0A0A'
      }
    }
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: ritual
        ? `https://bbapp.bizarrebeasts.io/rituals?r=${ritualId}`
        : 'https://bbapp.bizarrebeasts.io/rituals',
      siteName: 'BizarreBeasts',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ritual ? ritual.title : 'BizarreBeasts Daily Rituals',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ritual ? ritual.description : 'Complete daily rituals, check in, and earn $BB rewards!',
      images: [ogImageUrl],
      creator: '@bizarrebeasts_',
    },
    other: {
      // MiniApp metadata for Farcaster sharing
      'fc:miniapp': JSON.stringify(miniAppEmbed),
      'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

      // Legacy frame metadata as fallback
      'fc:frame:image': ogImageUrl,
      'fc:frame:button:1': '✅ Check In Daily',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': ritual
        ? `https://bbapp.bizarrebeasts.io/rituals?r=${ritualId}`
        : 'https://bbapp.bizarrebeasts.io/rituals',
    },
  };
}