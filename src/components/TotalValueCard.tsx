'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/context/LanguageContext';
import { EXCHANGE_RATE } from '@/lib/constants';

// Dynamic import to avoid SSR issues with recharts
const ChartComponent = dynamic(() => import('./PortfolioChart'), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">Loading chart...</div>
});

interface TotalValueCardProps {
    totalValue: number;
    todayChange: number;
    todayChangePercent: number;
    totalCost: number;
    totalProfit: number;
    totalItems: number;
    currency?: string;
}

export function TotalValueCard({
    totalValue,
    todayChange,
    todayChangePercent,
    totalCost,
    totalProfit,
    totalItems,
    currency = 'USD',
}: TotalValueCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const isProfitPositive = totalProfit >= 0;
    const isTodayPositive = todayChange >= 0;
    const { language } = useLanguage();

    const t = {
        totalValue: language === 'ja' ? 'ポートフォリオ評価額' : 'Total Portfolio Value',
        dailyChange: language === 'ja' ? '日次変動' : 'Daily Change',
        items: language === 'ja' ? '保有数' : 'Items',
        invested: language === 'ja' ? '投資額' : 'Invested',
        estProfit: language === 'ja' ? '評価損益' : 'Est. Profit',
        viewHistory: language === 'ja' ? '履歴を見る' : 'View Portfolio History',
        portfolioHistory: language === 'ja' ? 'ポートフォリオ履歴' : 'Portfolio History',
        viewTotal: language === 'ja' ? '評価額を見る' : 'View Total Portfolio Value',
    };

    const formatCurrency = (value: number) => {
        if (language === 'ja') {
            return `¥${value.toLocaleString()}`;
        }
        return `$${Math.round(value / EXCHANGE_RATE).toLocaleString()}`;
    };

    return (
        <div className="relative h-[260px] sm:h-[240px] [perspective:1000px]">
            <div
                className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
            >
                {/* FRONT FACE */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                    <div className="h-full rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/5" />

                        <div className="relative h-full p-4 flex flex-col">
                            {/* Label */}
                            <p className="text-center text-[10px] font-semibold tracking-widest text-white/60 uppercase mb-1">
                                {t.totalValue}
                            </p>

                            {/* Main Value */}
                            <div className="text-center mb-2">
                                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    {formatCurrency(totalValue)}
                                </span>
                            </div>

                            {/* Daily Change */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <span className="text-[10px] sm:text-xs text-white/50">{t.dailyChange}</span>
                                <div className="flex items-center gap-1">
                                    {isTodayPositive ? (
                                        <TrendingUp size={14} className="text-green-400" />
                                    ) : (
                                        <TrendingDown size={14} className="text-red-400" />
                                    )}
                                    <span className={`text-sm sm:text-base font-bold ${isTodayPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isTodayPositive ? '+' : ''}{formatCurrency(todayChange)}
                                    </span>
                                    <span className={`text-[10px] sm:text-xs font-medium ${isTodayPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        ({isTodayPositive ? '+' : ''}{todayChangePercent.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>

                            {/* Summary Row - Mobile: vertical, Desktop: horizontal */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-4 py-2 border-t border-white/10">
                                <div className="flex items-center justify-between sm:justify-center sm:gap-2">
                                    <span className="text-[10px] text-white/50">{t.items}</span>
                                    <span className="text-sm font-bold text-white">{totalItems}</span>
                                </div>
                                <div className="hidden sm:block w-px h-5 bg-white/10" />
                                <div className="flex items-center justify-between sm:justify-center sm:gap-2 border-t sm:border-t-0 border-white/5 pt-1 sm:pt-0">
                                    <span className="text-[10px] text-white/50">{t.invested}</span>
                                    <span className="text-sm font-bold text-white">{formatCurrency(totalCost)}</span>
                                </div>
                                <div className="hidden sm:block w-px h-5 bg-white/10" />
                                <div className="flex items-center justify-between sm:justify-center sm:gap-2 border-t sm:border-t-0 border-white/5 pt-1 sm:pt-0">
                                    <span className="text-[10px] text-white/50">{t.estProfit}</span>
                                    <span className={`text-sm font-bold ${isProfitPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isProfitPositive ? '+' : ''}{formatCurrency(totalProfit)}
                                    </span>
                                </div>
                            </div>

                            {/* Flip Button */}
                            <div className="mt-auto pt-2 flex justify-center">
                                <button
                                    onClick={() => setIsFlipped(true)}
                                    className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-medium rounded-lg hover:bg-amber-500/30 transition-colors"
                                >
                                    <RotateCcw size={12} />
                                    {t.viewHistory}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BACK FACE */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="h-full rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/5" />

                        <div className="relative h-full p-4 flex flex-col">
                            {/* Label */}
                            <p className="text-center text-[10px] font-semibold tracking-widest text-white/60 uppercase mb-2">
                                {t.portfolioHistory}
                            </p>

                            {/* Chart Area */}
                            <div className="flex-1 min-h-[120px]">
                                <ChartComponent />
                            </div>

                            {/* Flip Back Button */}
                            <div className="mt-auto pt-2 flex justify-center">
                                <button
                                    onClick={() => setIsFlipped(false)}
                                    className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-medium rounded-lg hover:bg-amber-500/30 transition-colors"
                                >
                                    <RotateCcw size={12} />
                                    {t.viewTotal}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
