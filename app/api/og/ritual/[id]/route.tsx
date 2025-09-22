import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const rituals = [
  {
    id: 1,
    title: "Create a BizarreBeasts meme! 👹🎨",
    description: "Create BB art and memes with the Sticker & Meme Creator!",
    image: "/assets/page-assets/banners/rituals-boxes/memes-ritual-banner.png"
  },
  {
    id: 2,
    title: "Fire Up Dexscreener! 🔥",
    description: "Support $BB on Dexscreener by hitting \"🚀\" and \"🔥\"!",
    image: "/assets/page-assets/banners/rituals-boxes/dexscreener-ritual-banner.png"
  },
  {
    id: 3,
    title: "Create your $BRND podium! 🏆",
    description: "Create your @brnd podium with $BB in 🥇 and share!",
    image: "/assets/page-assets/banners/rituals-boxes/brnd-ritual-banner.png"
  },
  {
    id: 4,
    title: "Send a #create GIVE! 🎨",
    description: "Send @bizarrebeast a #create GIVE in the Based Creator's Directory!",
    image: "/assets/page-assets/banners/rituals-boxes/create-banner.png"
  },
  {
    id: 5,
    title: "Watch $BB Chill Guy! 🎬",
    description: "Watch the $BB Chill Guy YouTube Video! Like, comment & subscribe!",
    image: "/assets/page-assets/banners/rituals-boxes/chill-guy-ritual-banner.png"
  },
  {
    id: 6,
    title: "Check /plausible! ✅",
    description: "Drop a post in the /plausible channel!",
    image: "/assets/page-assets/banners/rituals-boxes/plausible-ritual-banner.png"
  },
  {
    id: 7,
    title: "Mint on MintFun! 🌊",
    description: "Mint @bizarrebeast OG Art on MintFun!",
    image: "/assets/page-assets/banners/rituals-boxes/mintfun-ritual-banner.png"
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
            👹 BizarreBeasts
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