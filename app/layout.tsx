import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { FarcasterSDK } from "@/components/FarcasterSDK";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://bbapp.bizarrebeasts.io'),
  title: "BizarreBeasts ($BB)",
  description: "The OFFICIAL BizarreBeasts app! Create BizarreBeasts memes, play games, swap BB tokens, collect art, win contests, and join the most BIZARRE community in web3!",
  keywords: "BizarreBeasts, meme generator, Farcaster, Base, Web3",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "BizarreBeasts",
    description: "Create memes, play games, swap, collect art, and win contests in web3's most BIZARRE community!",
    type: "website",
    url: "https://bbapp.bizarrebeasts.io",
    siteName: "BizarreBeasts",
    images: [
      {
        url: "https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png",
        width: 1200,
        height: 630,
        alt: "BizarreBeasts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BizarreBeasts",
    description: "Create memes, play games, swap, collect art, and win contests in web3's most BIZARRE community!",
    images: ["https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png"],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png",
      button: {
        title: "BizarreBeasts ($BB)",
        action: {
          type: "launch_miniapp",
          name: "BizarreBeasts",
          url: "https://bbapp.bizarrebeasts.io",
          splashImageUrl: "https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png",
          splashBackgroundColor: "#f967c6"
        }
      }
    }),
    'fc:frame': JSON.stringify({
      version: "1",
      imageUrl: "https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png",
      button: {
        title: "BizarreBeasts ($BB)",
        action: {
          type: "launch_miniapp",
          name: "BizarreBeasts",
          url: "https://bbapp.bizarrebeasts.io",
          splashImageUrl: "https://bbapp.bizarrebeasts.io/farcaster-assets/splash.png",
          splashBackgroundColor: "#f967c6"
        }
      }
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-bg text-white min-h-screen antialiased`}>
        <FarcasterSDK />
        <LayoutWrapper>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </LayoutWrapper>
      </body>
    </html>
  );
}
