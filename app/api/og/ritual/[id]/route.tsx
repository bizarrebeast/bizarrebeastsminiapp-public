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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
            position: 'relative',
          }}
        >
          {/* Use ritual banner as background */}
          <img
            src={imageUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7,
            }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)',
              display: 'flex',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              padding: 40,
              maxWidth: 1000,
            }}
          >
            {/* Header */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#b9f2ff',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ display: 'flex' }}>Daily BIZARRE Ritual #{ritual.id}</span>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 20,
                textAlign: 'center',
                lineHeight: 1.2,
                display: 'flex',
              }}
            >
              {ritual.title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 28,
                color: '#e0e0e0',
                textAlign: 'center',
                marginBottom: 40,
                maxWidth: 800,
                lineHeight: 1.4,
                display: 'flex',
              }}
            >
              {ritual.description}
            </div>

            {/* Footer */}
            <div
              style={{
                position: 'absolute',
                bottom: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  color: '#808080',
                  display: 'flex',
                }}
              >
                Complete daily rituals at
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: 'white',
                  display: 'flex',
                }}
              >
                bbapp.bizarrebeasts.io/rituals
              </div>
            </div>
          </div>
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