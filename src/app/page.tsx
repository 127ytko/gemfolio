import type { Metadata } from 'next';
import { HomeContent } from '@/components/HomeContent';

export const metadata: Metadata = {
  title: 'GemFolio - One Piece Card Price Tracker from Japan',
  description: 'Track One Piece Card Game prices in real-time. Compare Japan market prices with eBay listings. Find Manga Rare, Alt Art, and SP cards with the best arbitrage opportunities.',
};

export default function HomePage() {
  return <HomeContent />;
}
