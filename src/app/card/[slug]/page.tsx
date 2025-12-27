import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import type { Card } from '@/types/database';
import { CardDetailClient } from '@/components/CardDetailClient';
import { EXCHANGE_RATE } from '@/lib/constants';

async function getCardData(slug: string): Promise<Card | null> {
    const supabase = await getSupabaseServer();
    const { data: card, error } = await supabase
        .from('cards')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !card) {
        return null;
    }

    return card;
}

async function getPriceHistory(cardId: string, type: 'raw' | 'psa10' = 'raw') {
    const supabase = await getSupabaseServer();
    const table = type === 'raw' ? 'market_prices_raw' : 'market_prices_psa10';

    const { data, error } = await supabase
        .from(table)
        .select('recorded_at, price_avg')
        .eq('card_id', cardId)
        .order('recorded_at', { ascending: true })
        .limit(12);

    if (error || !data) {
        return [];
    }

    return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const card = await getCardData(slug);

    if (!card) {
        return {
            title: 'Card Not Found',
        };
    }

    return {
        title: `${card.name_en || card.name_ja} (${card.card_number}) - ${card.rarity_en} Price`,
        description: `Check the latest price for ${card.name_en || card.name_ja} ${card.card_number} ${card.rarity_en}. Compare Japan vs eBay prices and find the best deal.`,
        openGraph: {
            title: `${card.name_en || card.name_ja} - ${card.rarity_en}`,
            description: `${card.card_number} from ${card.set_name_en}. Market Value: ¥${card.price_raw_avg ?? 0}`,
            images: card.image_url ? [{ url: card.image_url }] : [],
        },
    };
}

export default async function CardDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const card = await getCardData(slug);

    if (!card) {
        notFound();
    }

    // Fetch actual price history from database
    const [rawPriceHistory, psa10PriceHistory] = await Promise.all([
        getPriceHistory(card.card_id, 'raw'),
        getPriceHistory(card.card_id, 'psa10'),
    ]);

    // Current prices from card data
    const rawJapanPrice = card.price_raw_avg || 0;
    const rawEbayPrice = rawJapanPrice > 0 ? Math.round(rawJapanPrice / EXCHANGE_RATE) : 0; // Convert to USD estimate
    const psa10JapanPrice = card.price_psa10_avg || 0;
    const psa10EbayPrice = psa10JapanPrice > 0 ? Math.round(psa10JapanPrice / EXCHANGE_RATE) : 0;

    // Format chart data from price history
    const formatChartData = (history: { recorded_at: string; price_avg: number }[], ebayRate: number = EXCHANGE_RATE) => {
        if (history.length === 0) {
            return [];
        }

        return history.map(h => {
            const date = new Date(h.recorded_at);
            const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            return {
                date: dateStr,
                japan: h.price_avg,
                ebay: Math.round(h.price_avg / ebayRate),
            };
        });
    };

    const rawChartData = formatChartData(rawPriceHistory);
    const psa10ChartData = formatChartData(psa10PriceHistory);

    return (
        <CardDetailClient
            card={card}
            rawJapanPrice={rawJapanPrice}
            rawEbayPrice={rawEbayPrice}
            psa10JapanPrice={psa10JapanPrice}
            psa10EbayPrice={psa10EbayPrice}
            rawChartData={rawChartData}
            psa10ChartData={psa10ChartData}
        />
    );
}
