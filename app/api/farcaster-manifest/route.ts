import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    version: "1",
    name: "BizarreBeasts Miniapp",
    homeUrl: "https://app.bizarrebeasts.io",
    iconUrl: "https://app.bizarrebeasts.io/farcaster-assets/icon.png",
    splashImageUrl: "https://app.bizarrebeasts.io/farcaster-assets/splash.png",
    splashBackgroundColor: "#0A0A0A"
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}