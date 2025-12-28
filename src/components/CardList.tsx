'use client';

import Link from 'next/link';
import type { Card } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import { useExchangeRate } from '@/context/ExchangeRateContext';

interface CardListProps {
    cards: Card[];
}

export function CardList({ cards }: CardListProps) {
    return (
        <div className="space-y-2">
            {cards.map((card) => (
                <CardListItem key={card.card_id} card={card} />
            ))}
        </div>
    );
}

function CardListItem({ card }: { card: Card }) {
    const { language } = useLanguage();
    const { convertPrice } = useExchangeRate();

    // Select name and set based on language
    const cardName = language === 'ja'
        ? (card.name_ja || card.name_en)
        : (card.name_en || card.name_ja);

    const setName = language === 'ja'
        ? (card.set_name_ja || card.set_name_en)
        : (card.set_name_en || card.set_name_ja);

    // Use actual weekly change data or show placeholder
    const weeklyChange = card.price_raw_change_weekly ?? 0;
    const isPositive = weeklyChange >= 0;

    return (
        <Link
            href={`/card/${card.slug}`}
            className="flex items-start gap-2 p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
        >
            {/* Card Thumbnail - Fixed size */}
            <div className="w-14 h-20 flex-shrink-0 bg-slate-800 rounded-lg overflow-hidden">
                {card.image_url ? (
                    <img
                        src={card.image_url}
                        alt={cardName}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-[8px]">
                        No Image
                    </div>
                )}
            </div>

            {/* Card Info */}
            <div className="flex-1 min-w-0 py-0.5">
                {/* Row 1: Name + Like Button */}
                <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-semibold text-white line-clamp-1">
                        {cardName}
                    </h3>
                    <button className="flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors text-sm">
                        🤍
                    </button>
                </div>

                {/* Row 2: Card Number + Set Name */}
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-medium rounded flex-shrink-0">
                        {card.card_number}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">
                        {setName}
                    </span>
                </div>

                {/* Row 3: Price + Weekly Change */}
                <div className="flex items-center justify-between gap-1 mt-1.5">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">{language === 'ja' ? '価格' : 'Value'}</span>
                        <span className="text-base font-bold text-amber-400">
                            {language === 'ja'
                                ? `¥${card.price_raw_avg?.toLocaleString() ?? '-'}`
                                : `$${card.price_raw_avg ? convertPrice(card.price_raw_avg).toLocaleString() : '-'}`
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">{language === 'ja' ? '週間' : 'Weekly'}</span>
                        <span className={`text-base font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{weeklyChange.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
