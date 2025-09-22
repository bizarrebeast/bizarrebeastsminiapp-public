import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Props = {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: contestId, submissionId } = await params;

  try {
    // Fetch submission and contest data
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('contest_submissions')
      .select(`
        *,
        contest:contests (
          id,
          name,
          description,
          banner_image_url,
          gallery_enabled,
          prize_amount,
          prize_type
        )
      `)
      .eq('id', submissionId)
      .eq('contest_id', contestId)
      .single();

    if (submissionError || !submission || !submission.contest) {
      return {
        title: 'Submission Not Found | BizarreBeasts',
        description: 'This submission could not be found.',
      };
    }

    const contest = submission.contest;

    // Build title and description
    const title = submission.image_caption
      ? `${submission.image_caption} - ${contest.name} | BizarreBeasts`
      : `Entry by ${submission.display_name || 'Anonymous'} - ${contest.name} | BizarreBeasts`;

    const description = submission.image_caption ||
      `Vote for this entry in the ${contest.name} on BizarreBeasts!`;

    // Use submission image if it's a gallery contest, otherwise contest banner
    const imageUrl = (contest.gallery_enabled && submission.meme_image_url)
      ? submission.meme_image_url
      : (contest.banner_image_url || 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png');

    // Create the MiniAppEmbed structure for Farcaster sharing
    const miniAppEmbed = {
      version: '1',
      imageUrl: imageUrl,
      button: {
        title: '🗳️ Vote for Me!',
        action: {
          type: 'launch_miniapp',
          url: `https://bbapp.bizarrebeasts.io/contests/${contestId}#${submissionId}`,
          name: 'BizarreBeasts',
          splashImageUrl: 'https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png',
          splashBackgroundColor: '#0A0A0A'
        }
      }
    };

    return {
      title,
      description: description.substring(0, 160),
      openGraph: {
        title: submission.image_caption || `Entry by ${submission.display_name || 'Anonymous'}`,
        description,
        type: 'website',
        url: `https://bbapp.bizarrebeasts.io/contests/${contestId}/submission/${submissionId}`,
        siteName: 'BizarreBeasts',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 1200,
            alt: submission.image_caption || 'Contest Entry',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: submission.image_caption || `Entry by ${submission.display_name || 'Anonymous'}`,
        description,
        images: [imageUrl],
        creator: '@bizarrebeasts_',
        site: '@bizarrebeasts_',
      },
      other: {
        // MiniApp metadata for Farcaster sharing
        'fc:miniapp': JSON.stringify(miniAppEmbed),
        'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility

        // Legacy frame metadata as fallback
        'fc:frame:image': imageUrl,
        'fc:frame:image:aspect_ratio': '1:1',
        'fc:frame:button:1': '🗳️ Vote',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `https://bbapp.bizarrebeasts.io/contests/${contestId}#${submissionId}`,
        'fc:frame:button:2': '🏆 View Contest',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': `https://bbapp.bizarrebeasts.io/contests/${contestId}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'BizarreBeasts Contest',
      description: 'Join the contest on BizarreBeasts!',
    };
  }
}

export default async function SubmissionPage({ params }: Props) {
  const { id: contestId, submissionId } = await params;

  // Redirect to the main contest page with the submission hash
  // This ensures users see the submission in context with voting
  redirect(`/contests/${contestId}#${submissionId}`);
}