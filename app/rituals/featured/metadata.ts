import { Metadata } from 'next';
import { getActiveCampaign } from '@/config/featured-ritual-config';

export async function generateMetadata(): Promise<Metadata> {
  const featuredRitual = getActiveCampaign();

  if (!featuredRitual) {
    return {
      title: 'Featured Ritual | BizarreBeasts',
      description: 'Check out the latest featured ritual in the BizarreBeasts ecosystem.',
    };
  }

  // Use the actual banner image directly for better reliability
  const ogImageUrl = featuredRitual.image ?
    `https://bbapp.bizarrebeasts.io${featuredRitual.image}` :
    `https://bbapp.bizarrebeasts.io/api/og/ritual/featured`;

  // Create the MiniAppEmbed structure for Farcaster sharing
  const miniAppEmbed = {
    version: '1',
    imageUrl: ogImageUrl,
    button: {
      title: '⭐ Complete Featured Ritual',
      action: {
        type: 'launch_miniapp',
        url: 'https://bbapp.bizarrebeasts.io/rituals/featured',
        name: 'BizarreBeasts',
        splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png',
        splashBackgroundColor: '#0A0A0A'
      }
    }
  };

  return {
    title: `${featuredRitual.title} | BizarreBeasts Featured`,
    description: featuredRitual.description,
    openGraph: {
      title: featuredRitual.title,
      description: featuredRitual.description,
      type: 'website',
      url: 'https://bbapp.bizarrebeasts.io/rituals/featured',
      siteName: 'BizarreBeasts',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: featuredRitual.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: featuredRitual.title,
      description: featuredRitual.description,
      images: [ogImageUrl],
    },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': ogImageUrl,
      'fc:frame:button:1': '⭐ Complete Featured Ritual',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': 'https://bbapp.bizarrebeasts.io/rituals/featured',
      'fc:frame:miniapp': JSON.stringify(miniAppEmbed)
    }
  };
}