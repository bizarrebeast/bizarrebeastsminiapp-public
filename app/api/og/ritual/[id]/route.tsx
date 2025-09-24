import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getActiveCampaign } from '@/config/featured-ritual-config';

export const runtime = 'edge';

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
    title: "Believe in BizarreBeasts",
    description: "\"Believe\" in BizarreBeasts ($BB) on @productclank",
    image: "/assets/page-assets/banners/rituals-boxes/productclank-ritual-banner.png"
  },
  {
    id: 6,
    title: "Play BizarreBeasts games",
    description: "Play BizarreBeasts games powered by /remix",
    image: "/assets/page-assets/banners/rituals-boxes/games-ritual-banner.png"
  },
  {
    id: 7,
    title: "Rip a pack of cards",
    description: "Rip a pack of BizarreBeasts ($BBCP) cards on @vibemarket",
    image: "/assets/page-assets/banners/rituals-boxes/rip-cards-ritual-banner.png"
  },
  {
    id: 8,
    title: "Buy 1M $BB Tokens",
    description: "Grow your BizarreBeasts ($BB) bag and increase your rank on the empire leaderboard",
    image: "/assets/page-assets/banners/rituals-boxes/swap-bb-ritual-banner.png"
  },
  {
    id: 9,
    title: "Share your Leaderboard rank",
    description: "Show off your BizarreBeasts leaderboard rank and tier to the community, powered by $GLANKER!",
    image: "/assets/page-assets/banners/rituals-boxes/leaderboard-rank-rituals-bannker.png"
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if requesting featured ritual
    if (id === 'featured') {
      const featuredRitual = getActiveCampaign();

      if (featuredRitual) {
        const baseUrl = 'https://bbapp.bizarrebeasts.io';
        const imageUrl = `${baseUrl}${featuredRitual.image}`;

        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                backgroundColor: '#0A0A0A',
              }}
            >
              <img
                src={imageUrl}
                alt={featuredRitual.title}
                width={1200}
                height={630}
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
      }
    }

    const ritualId = parseInt(id);
    const ritual = rituals.find(r => r.id === ritualId);

    if (!ritual) {
      // Return default image if ritual not found
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 128,
              background: 'black',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            BizarreBeasts
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const baseUrl = 'https://bbapp.bizarrebeasts.io';
    const imageUrl = `${baseUrl}${ritual.image}`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: '#0A0A0A',
          }}
        >
          {/* Just the ritual banner image, full opacity, no overlays */}
          <img
            src={imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);

    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: 'black',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          👹 BizarreBeasts
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}