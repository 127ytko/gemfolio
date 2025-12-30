'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import { useExchangeRate } from '@/context/ExchangeRateContext';

interface PriceDataPoint {
    date: string;
    ebay: number;
    japan: number;
}

interface PriceHistoryTabsProps {
    rawData: PriceDataPoint[];
    psa10Data: PriceDataPoint[];
    rawCurrentPrice: number;
    rawPriceChange: number;
    psa10CurrentPrice: number;
    psa10PriceChange: number;
    activeTab: 'Raw' | 'PSA10';
    onTabChange: (tab: 'Raw' | 'PSA10') => void;
}

export function PriceHistoryTabs({
    rawData,
    psa10Data,
    rawCurrentPrice,
    rawPriceChange,
    psa10CurrentPrice,
    psa10PriceChange,
    activeTab,
    onTabChange,
}: PriceHistoryTabsProps) {
    const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | 'All'>('1M');
    const { language } = useLanguage();
    const { rate } = useExchangeRate();

    // Source data: japan is in JPY, ebay is in USD (but derived from JPY in backend, so we recalculate)
    const sourceData = activeTab === 'Raw' ? rawData : psa10Data;

    // Transform data based on language and current rate
    // JA: Show both in JPY
    // EN: Show both in USD
    const currentData = sourceData.map(point => {
        const priceInUsd = Math.round(point.japan / rate);
        return {
            date: point.date,
            japan: language === 'ja' ? point.japan : priceInUsd,
            ebay: language === 'ja' ? Math.round(priceInUsd * rate) : priceInUsd,
        };
    });

    const currencySymbol = language === 'ja' ? '¥' : '$';
    const formatCurrency = (value: number) => `${currencySymbol}${value.toLocaleString()}`;

    const t = {
        priceHistory: language === 'ja' ? '価格推移' : 'Price History',
        comingSoon: language === 'ja' ? 'Coming Soon' : 'Coming Soon',
        comingSoonDesc: language === 'ja'
            ? 'PSA10価格推移データは現在準備中です。\nもうしばらくお待ちください。'
            : 'PSA10 price history data is currently being prepared.\nPlease wait a moment.',
        rawMint: language === 'ja' ? '素体 (美品)' : 'Raw (Mint)',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Title */}
            <div className="px-4 pt-3 pb-2">
                <h2 className="text-sm font-semibold text-slate-400">{t.priceHistory}</h2>
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
                {activeTab === 'PSA10' ? (
                    /* PSA10 - Coming Soon */
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <Clock size={24} className="text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            {t.comingSoon}
                        </h3>
                        <p className="text-slate-400 text-center text-xs whitespace-pre-line">
                            {t.comingSoonDesc}
                        </p>
                    </div>
                ) : (
                    /* Raw Price History */
                    <div>
                        {/* Time Range Selector */}
                        <div className="flex justify-end mb-3">
                            <div className="flex space-x-1">
                                {(['1W', '1M', '3M', 'All'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-full transition ${timeRange === range
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={currentData}>
                                    <defs>
                                        <linearGradient id="colorJapan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEbay" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />

                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#64748B' }}
                                        dy={10}
                                    />

                                    <YAxis
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#64748B' }}
                                        tickFormatter={(value) => formatCurrency(value)}
                                        width={50}
                                    />

                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1E293B',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                                        }}
                                        labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                                        itemStyle={{ fontSize: 12 }}
                                        formatter={(value) => formatCurrency(Number(value))}
                                    />

                                    {/* Japan Price */}
                                    <Area
                                        type="monotone"
                                        dataKey="japan"
                                        stroke="#F59E0B"
                                        strokeWidth={2}
                                        fill="url(#colorJapan)"
                                        name={language === 'ja' ? '日本市場価格' : 'Japan Market'}
                                    />

                                    {/* eBay Price */}
                                    <Area
                                        type="monotone"
                                        dataKey="ebay"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        fill="url(#colorEbay)"
                                        name="eBay"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-amber-500 rounded" />
                                <span className="text-[10px] text-slate-500">
                                    {language === 'ja' ? '日本市場価格' : 'Japan Market'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-blue-500 rounded" />
                                <span className="text-[10px] text-slate-500">eBay</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
