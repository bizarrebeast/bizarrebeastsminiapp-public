import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BizarreBeasts Miniapp",
  description: "Create memes, play games, and join the BizarreBeasts community",
  keywords: "BizarreBeasts, meme generator, Farcaster, Base, Web3",
  openGraph: {
    title: "BizarreBeasts Miniapp",
    description: "Create memes, play games, and join the BizarreBeasts community",
    type: "website",
    url: "https://app.bizarrebeasts.io",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BizarreBeasts Miniapp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BizarreBeasts Miniapp",
    description: "Create memes, play games, and join the BizarreBeasts community",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen antialiased`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
