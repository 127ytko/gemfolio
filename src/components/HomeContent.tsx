'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Megaphone, Loader2 } from 'lucide-react';
import { TopPerformers } from '@/components/TopPerformers';
import { HomeSearchInput } from '@/components/HomeSearchInput';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getPortfolio } from '@/lib/api/portfolio';

interface TopPerformerCard {
    card_id: string;
    slug: string;
    name_en: string;
    name_ja?: string;
    card_number: string;
    set_name_en: string;
    set_name_ja?: string;
    rarity_en: string;
    image_url: string | null;
    price_avg: number;
    weekly_change: number;
}

export function HomeContent() {
    const { language } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    const [performers, setPerformers] = useState<TopPerformerCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        async function loadPerformers() {
            if (!user) {
                setLoading(false);
                setPerformers([]);
                return;
            }

            try {
                // Fetch user's portfolio
                const portfolio = await getPortfolio();

                // Extract unique cards
                const uniqueCardsMap = new Map();
                portfolio.forEach(entry => {
                    if (entry.cards && !uniqueCardsMap.has(entry.cards.card_id)) {
                        uniqueCardsMap.set(entry.cards.card_id, entry.cards);
                    }
                });

                // Sort by weekly change (descending) and take top 10
                const sortedCards = Array.from(uniqueCardsMap.values())
                    .sort((a, b) => (b.price_raw_change_weekly || 0) - (a.price_raw_change_weekly || 0))
                    .slice(0, 10);

                const mapped = sortedCards.map(card => ({
                    card_id: card.card_id,
                    slug: card.slug,
                    name_en: card.name_en,
                    name_ja: card.name_ja,
                    card_number: card.card_number,
                    set_name_en: card.set_name_en,
                    set_name_ja: card.set_name_ja,
                    rarity_en: card.rarity_en,
                    image_url: card.image_url,
                    price_avg: card.price_raw_avg || 0,
                    weekly_change: card.price_raw_change_weekly || 0,
                }));
                setPerformers(mapped);
            } catch (error) {
                console.error('Failed to load performers:', error);
            } finally {
                setLoading(false);
            }
        }

        loadPerformers();
    }, [user, authLoading]);

    const t = {
        heroTitle1: language === 'ja' ? 'リアルタイムで価格をトラッキング' : 'Track Real-time Prices',
        heroTitle2: language === 'ja' ? '日本から' : 'from JAPAN',
        heroDesc: language === 'ja'
            ? '日本市場とeBayの価格を比較。ワンピースカードのベストディールを見つけよう。'
            : 'Compare Japan market vs eBay prices. Find the best deals on One Piece cards.',
        latestNews: language === 'ja' ? '日本からの最新ニュース' : 'Latest News from Japan',
        newsDesc: language === 'ja' ? '日本市場の新商品リリース情報' : 'Product release information in Japan market',
        comingSoon: language === 'ja' ? '準備中...' : 'Coming soon...',
        noCards: language === 'ja'
            ? '表示できるカードがありません。カードを検索してみましょう！'
            : 'No cards available. Try searching for cards!',
        startSearching: language === 'ja' ? 'カードを探す' : 'Start Searching',
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section with Background */}
            <section className="relative px-4 pt-12 pb-8 text-center overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950" />

                {/* Content */}
                <div className="relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                        {t.heroTitle1}
                        <br />
                        <span className="text-amber-400">{t.heroTitle2}</span>
                    </h1>
                    <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                        {t.heroDesc}
                    </p>

                    {/* Search Bar */}
                    <HomeSearchInput />
                </div>
            </section>

            {/* TOP10 Performers */}
            <section className="px-4 py-6">
                {loading ? (
                    <div className="py-8 text-center">
                        <Loader2 size={24} className="animate-spin text-amber-400 mx-auto" />
                    </div>
                ) : (
                    <TopPerformers cards={performers} />
                )}
            </section>

            {/* Latest News from Japan */}
            <section className="px-4 py-6">
                <div className="mb-4">
                    <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        <Megaphone size={20} className="text-amber-400 md:w-6 md:h-6" />
                        {t.latestNews}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        {t.newsDesc}
                    </p>
                </div>
                {/* Announcement content placeholder */}
                <div className="py-8 text-center border border-dashed border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-500">{t.comingSoon}</p>
                </div>
            </section>

        </div>
    );
}
