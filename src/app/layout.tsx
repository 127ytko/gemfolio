import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GemFolio - One Piece Card Price Tracker",
    template: "%s | GemFolio",
  },
  description: "Track One Piece Card Game prices. Compare Japan market vs eBay prices for Manga Rare, Alt Art, and more. Find the best arbitrage opportunities.",
  keywords: ["One Piece Card Game", "OPCG", "card prices", "Manga Rare", "eBay", "arbitrage", "price tracker"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GemFolio",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GemFolio",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        <Providers>
          <Header />
          <main className="pt-12 pb-20 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

