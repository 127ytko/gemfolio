'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useExchangeRate } from '@/context/ExchangeRateContext';

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

interface TopPerformersProps {
    cards: TopPerformerCard[];
}

export function TopPerformers({ cards }: TopPerformersProps) {
    const { language } = useLanguage();
    const { user } = useAuth();

    const t = {
        title: language === 'ja' ? '値上がり率トップ10' : 'TOP10 Performers',
        desc: language === 'ja' ? 'コレクションの中で今週最も値上がりしたカード' : 'Your collections with the highest price increase',
        viewRanking: language === 'ja' ? 'ランキングを見る' : 'View Market Ranking',
    };

    return (
        <section>
            <div className="mb-4">
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-amber-400 md:w-6 md:h-6" />
                    {t.title}
                </h2>
                <p className="text-sm md:text-base text-slate-500 mt-1">
                    {t.desc}
                </p>
            </div>

            {cards.length > 0 ? (
                <>
                    {/* Horizontal Scroll */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4">
                        {cards.map((card, index) => (
                            <TopPerformerItem key={card.card_id} card={card} rank={index + 1} />
                        ))}
                    </div>

                    {/* View Ranking Button - Hidden as per user preference (My Portfolio Top10 doesn't need "View Market Ranking") */}
                    {/* <div className="flex justify-center mt-3"> ... </div> */}
                </>
            ) : (
                <div className="py-8 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                    <p className="text-sm text-slate-400 mb-4 px-4">
                        {user
                            ? (language === 'ja'
                                ? 'ポートフォリオにカードが登録されていません。保有カードを登録して値動きを確認しましょう！'
                                : 'No cards in your portfolio. Add cards to track their performance!')
                            : (language === 'ja'
                                ? 'ポートフォリオにカードが登録されていません。無料会員登録で保有カードの値動きを確認しましょう！'
                                : 'No cards in your portfolio. Sign up for free to track your card values!')}
                    </p>
                    <Link
                        href={user ? '/search' : '/auth'}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-lg transition-colors"
                    >
                        {user
                            ? (language === 'ja' ? 'カードを登録する' : 'Add Cards')
                            : (language === 'ja' ? '会員登録する（無料）' : 'Sign Up Free')}
                    </Link>
                </div>
            )}
        </section>
    );
}

function TopPerformerItem({ card, rank }: { card: TopPerformerCard; rank: number }) {
    const isPositive = card.weekly_change >= 0;
    const { language } = useLanguage();
    const { convertPrice } = useExchangeRate();

    const cardName = language === 'ja' ? (card.name_ja || card.name_en) : card.name_en;

    const t = {
        value: language === 'ja' ? '価格' : 'Value',
        weekly: language === 'ja' ? '週間' : 'Weekly',
        noImage: language === 'ja' ? '画像なし' : 'No Image',
    };

    // Stylish rank colors
    const getRankStyle = (r: number) => {
        if (r === 1) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/30';
        if (r === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900';
        if (r === 3) return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white';
        return 'bg-slate-700 text-slate-300';
    };

    return (
        <Link
            href={`/portfolio?edit=${card.card_id}`}
            className="flex-shrink-0 w-28 bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 transition-colors"
        >
            {/* Rank Badge + Card Image */}
            <div className="relative pt-2 px-2">
                <div className={`absolute top-1 left-1 z-10 w-6 h-6 flex items-center justify-center text-xs font-black rounded-full ${getRankStyle(rank)}`}>
                    {rank}
                </div>
                {/* Card Image - No background */}
                <div className="w-full h-24 flex items-center justify-center">
                    {card.image_url ? (
                        <img
                            src={card.image_url}
                            alt={cardName}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <span className="text-slate-600 text-[8px]">{t.noImage}</span>
                    )}
                </div>
            </div>

            {/* Card Info */}
            <div className="p-2">
                <h3 className="text-[10px] font-semibold text-white line-clamp-1 mb-0.5">
                    {cardName}
                </h3>
                <span className="inline-block px-1 py-0.5 bg-slate-800 text-slate-400 text-[8px] font-medium rounded mb-1">
                    {card.card_number}
                </span>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[7px] text-slate-500">{t.value}</span>
                        <span className="text-[10px] font-bold text-amber-400">
                            {language === 'ja'
                                ? `¥${card.price_avg.toLocaleString()}`
                                : `$${convertPrice(card.price_avg).toLocaleString()}`
                            }
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] text-slate-500">{t.weekly}</span>
                        <span className={`text-[9px] font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{card.weekly_change.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

