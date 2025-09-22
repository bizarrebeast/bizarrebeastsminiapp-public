import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: contestId } = await params;

  try {
    // Fetch contest data server-side
    const { data: contest, error } = await supabaseAdmin
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (error || !contest) {
      // Return default metadata if contest not found
      return {
        title: 'Contest Not Found | BizarreBeasts',
        description: 'This contest could not be found. Check out other active contests on BizarreBeasts!',
      };
    }

    // Format prize info for description
    const prizeInfo = contest.prize_amount
      ? `Prize: ${contest.prize_amount} $BB`
      : contest.prize_type === 'nft'
      ? 'Prize: BIZARRE NFT'
      : '';

    // Format dates
    const endDate = contest.end_date
      ? new Date(contest.end_date).toLocaleDateString()
      : '';
    const dateInfo = endDate ? `Ends: ${endDate}` : '';

    // Build description
    const description = contest.description ||
      `Join the ${contest.name} on BizarreBeasts! ${prizeInfo} ${dateInfo}`.trim();

    // Use contest banner or default image
    const imageUrl = contest.banner_image_url ||
      'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png';

    // Create the MiniAppEmbed structure for Farcaster sharing
    const miniAppEmbed = {
      version: '1',
      imageUrl: imageUrl,
      button: {
        title: '🏆 Enter Contest',
        action: {
          type: 'launch_miniapp',
          url: `https://bbapp.bizarrebeasts.io/contests/${contestId}`,
          name: 'BizarreBeasts',
          splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
          splashBackgroundColor: '#0A0A0A'
        }
      }
    };

    return {
      title: `${contest.name} | BizarreBeasts`,
      description: description.substring(0, 160), // Limit description length
      openGraph: {
        title: contest.name,
        description: description,
        type: 'website',
        url: `https://bbapp.bizarrebeasts.io/contests/${contestId}`,
        siteName: 'BizarreBeasts',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: contest.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: contest.name,
        description: description,
        images: [imageUrl],
        creator: '@bizarrebeasts_',
      },
      other: {
        // MiniApp metadata for Farcaster sharing
        'fc:miniapp': JSON.stringify(miniAppEmbed),
        'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

        // Legacy frame metadata as fallback
        'fc:frame:image': imageUrl,
        'fc:frame:button:1': '🏆 Enter Contest',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `https://bbapp.bizarrebeasts.io/contests/${contestId}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for contest:', contestId, error);

    // Return default metadata on error
    return {
      title: 'Contest | BizarreBeasts',
      description: 'Join exciting contests on BizarreBeasts and win amazing prizes!',
      openGraph: {
        title: 'BizarreBeasts Contests',
        description: 'Join exciting contests on BizarreBeasts and win amazing prizes!',
        images: ['https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png'],
      },
    };
  }
}