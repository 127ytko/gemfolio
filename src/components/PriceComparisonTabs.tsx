'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Clock } from 'lucide-react';
import { EXCHANGE_RATE } from '@/lib/constants';

interface PriceData {
    japanPrice: number;
    ebayPrice: number;
}

interface PriceComparisonTabsProps {
    rawPrices: PriceData;
    psa10Prices: PriceData;
    activeTab: 'Raw' | 'PSA10';
    onTabChange: (tab: 'Raw' | 'PSA10') => void;
    updatedAt?: string; // スクレイピング日時
}

export function PriceComparisonTabs({ rawPrices, psa10Prices, activeTab, onTabChange, updatedAt }: PriceComparisonTabsProps) {
    const [showJapanInfo, setShowJapanInfo] = useState(false);
    const { language } = useLanguage();

    const currentPrices = activeTab === 'Raw' ? rawPrices : psa10Prices;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return language === 'ja' ? '更新日: -' : 'Updated: -';
        const date = new Date(dateStr);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return language === 'ja' ? `更新日: ${y}/${m}/${d}` : `Updated: ${y}/${m}/${d}`;
    };

    const psa10UpdatedDate = language === 'ja' ? '更新日: 2025/12/27' : 'Updated: 2025/12/27';

    const t = {
        priceComparison: language === 'ja' ? '価格比較' : 'Price Comparison',
        japanMarket: language === 'ja' ? '日本市場価格 (¥)' : 'Japan Market (¥)',
        ebayPrice: language === 'ja' ? 'eBay価格 (USD)' : 'eBay Price (USD)',
        japanInfo: language === 'ja' ? '日本の主要カードショップの平均価格です。' : 'Avg. price from major card shops in Japan.',
        exchangeRate: language === 'ja' ? `為替レート: ¥${EXCHANGE_RATE} / USD` : `Exchange Rate: ¥${EXCHANGE_RATE} / USD`,
        comingSoon: language === 'ja' ? 'Coming Soon' : 'Coming Soon',
        rawMint: language === 'ja' ? '素体 (美品)' : 'Raw (Mint)',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Title */}
            <div className="px-4 pt-3 pb-2">
                <h2 className="text-sm font-semibold text-slate-400">{t.priceComparison}</h2>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => onTabChange('Raw')}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'Raw'
                        ? 'bg-slate-800 text-white border-b-2 border-amber-400'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                >
                    {t.rawMint}
                </button>
                <button
                    onClick={() => onTabChange('PSA10')}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'PSA10'
                        ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                >
                    PSA10
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    {/* Japan Market */}
                    <div className="bg-slate-800/50 rounded-lg p-3 relative">
                        <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-xs text-slate-500">{t.japanMarket}</p>
                            {activeTab === 'Raw' && (
                                <button
                                    onClick={() => setShowJapanInfo(!showJapanInfo)}
                                    className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 text-[10px] font-bold"
                                >
                                    ?
                                </button>
                            )}
                        </div>
                        {/* Accordion Info */}
                        {activeTab === 'Raw' && showJapanInfo && (
                            <div className="mb-2 p-2 bg-slate-700/50 rounded text-[10px] text-slate-300">
                                {t.japanInfo}
                            </div>
                        )}
                        {activeTab === 'Raw' ? (
                            <div className="flex items-baseline gap-2">
                                <p className="text-lg font-bold text-white">
                                    ¥{currentPrices.japanPrice.toLocaleString()}
                                </p>
                                <span className="text-xs text-slate-500">≒</span>
                                <p className="text-lg font-bold text-amber-400">
                                    ${Math.round(currentPrices.japanPrice / EXCHANGE_RATE).toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold text-slate-500">{t.comingSoon}</p>
                        )}
                        <p className="text-[10px] text-slate-600 text-right mt-2">
                            {activeTab === 'Raw' ? formatDate(updatedAt) : psa10UpdatedDate}
                        </p>
                    </div>

                    {/* eBay */}
                    <div className="bg-slate-800/50 rounded-lg p-3 relative">
                        <p className="text-xs text-slate-500 mb-1">{t.ebayPrice}</p>
                        {activeTab === 'Raw' ? (
                            <div className="flex items-baseline gap-2">
                                <p className="text-lg font-bold text-amber-400">
                                    ${currentPrices.ebayPrice.toLocaleString()}
                                </p>
                                <span className="text-xs text-slate-500">≒</span>
                                <p className="text-lg font-bold text-white">
                                    ¥{(currentPrices.ebayPrice * EXCHANGE_RATE).toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold text-slate-500">{t.comingSoon}</p>
                        )}
                        <p className="text-[10px] text-slate-600 text-right mt-2">
                            {activeTab === 'Raw' ? formatDate(updatedAt) : psa10UpdatedDate}
                        </p>
                    </div>
                </div>

                {/* Exchange Rate */}
                <p className="text-[10px] text-slate-500 text-right">{t.exchangeRate}</p>
            </div>
        </div>
    );
}
