'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { Card } from '@/types/database';
import { AddToPortfolioForm } from '@/components/AddToPortfolioForm';
import { CardPriceSection } from '@/components/CardPriceSection';

interface CardDetailClientProps {
    card: Card;
    rawJapanPrice: number;
    rawEbayPrice: number;
    psa10JapanPrice: number;
    psa10EbayPrice: number;
    rawChartData: Array<{ date: string; ebay: number; japan: number }>;
    psa10ChartData: Array<{ date: string; ebay: number; japan: number }>;
}

export function CardDetailClient({
    card,
    rawJapanPrice,
    rawEbayPrice,
    psa10JapanPrice,
    psa10EbayPrice,
    rawChartData,
    psa10ChartData,
}: CardDetailClientProps) {
    const { language, t } = useLanguage();

    // Select name, set, rarity based on language
    const cardName = language === 'ja'
        ? (card.name_ja || card.name_en)
        : (card.name_en || card.name_ja);

    const setName = language === 'ja'
        ? (card.set_name_ja || card.set_name_en)
        : (card.set_name_en || card.set_name_ja);

    const rarity = language === 'ja'
        ? (card.rarity_ja || card.rarity_en)
        : (card.rarity_en || card.rarity_ja);

    return (
        <div className="max-w-3xl mx-auto">
            {/* Fixed Back Button - Below Header */}
            <div className="fixed top-14 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-4 py-2">
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        {t('common.back')}
                    </Link>
                </div>
            </div>

            {/* Spacer for fixed header + back button */}
            <div className="h-12" />

            {/* Card Name + Rarity, Number, Set - Above Image */}
            <div className="px-4 mb-4 text-center">
                <h1 className="text-xl font-black text-white mb-2">
                    {cardName}
                </h1>
                {/* Number · Rarity · Set - One Line */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 font-semibold rounded">
                        {card.card_number}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400 font-medium">
                        {rarity}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 truncate max-w-[180px]">
                        {setName}
                    </span>
                </div>
            </div>

            {/* Card Image */}
            <div className="px-4 mb-4">
                <div className="relative aspect-[63/88] max-w-[240px] mx-auto bg-slate-800 rounded-xl overflow-hidden">
                    {card.image_url ? (
                        <img
                            src={card.image_url}
                            alt={`${cardName} - ${card.card_number}`}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                            {t('card.noImage')}
                        </div>
                    )}
                </div>
                <p className="text-[9px] text-slate-600 text-center mt-2">
                    {t('card.imageReference')}
                </p>
                <p className="text-[8px] text-slate-600 text-center mt-1 leading-tight">
                    {language === 'ja'
                        ? '©尾田栄一郎／集英社 ©尾田栄一郎／集英社・フジテレビ・東映アニメーション'
                        : '©Eiichiro Oda/Shueisha ©Eiichiro Oda/Shueisha, Toei Animation'}
                </p>
            </div>

            {/* Add to Vault Form */}
            <div className="px-4 mb-6">
                <AddToPortfolioForm
                    cardId={card.card_id}
                    cardName={cardName || ''}
                    defaultPrice={card.price_raw_avg || 0}
                />
            </div>

            {/* Price Comparison & History (synced tabs) */}
            <CardPriceSection
                rawPrices={{ japanPrice: rawJapanPrice, ebayPrice: rawEbayPrice }}
                psa10Prices={{ japanPrice: psa10JapanPrice, ebayPrice: psa10EbayPrice }}
                rawChartData={rawChartData}
                psa10ChartData={psa10ChartData}
                rawCurrentPrice={rawEbayPrice}
                rawPriceChange={12.5}
                psa10CurrentPrice={psa10EbayPrice}
                psa10PriceChange={18.2}
                updatedAt={card.updated_at || undefined}
            />

            {/* eBay CTA */}
            <div className="px-4 pb-8">
                <a
                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.card_number + ' ' + (card.name_en || '') + ' ' + (card.rarity_en || '') + ' Japanese')}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339135615&toolid=10001&customid=gemfolio`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors active:scale-[0.98]"
                >
                    <ExternalLink size={18} />
                    {t('card.viewOnEbay')}
                </a>
                <p className="text-[10px] text-slate-500 text-center mt-2">
                    {language === 'ja'
                        ? '新しいタブで開きます。購入時にコミッションが発生する場合があります。'
                        : 'Opens in a new tab. We may earn a commission from purchases.'}
                </p>
            </div>
        </div>
    );
}
