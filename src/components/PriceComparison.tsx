'use client';

import { useState } from 'react';
import { EXCHANGE_RATE } from '@/lib/constants';

interface PriceComparisonProps {
    japanPrice: number;
    ebayPrice: number;
    condition: 'Raw' | 'PSA10';
}

export function PriceComparison({ japanPrice, ebayPrice, condition }: PriceComparisonProps) {
    const [showJapanInfo, setShowJapanInfo] = useState(false);

    const conditionLabel = condition === 'Raw' ? 'Raw (Mint)' : 'PSA10';
    const conditionColor = condition === 'Raw'
        ? 'bg-slate-700 text-slate-300'
        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30';

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            {/* Header with Badge */}
            <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-slate-400">Price Comparison</h2>
                <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${conditionColor}`}>
                    {conditionLabel}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {/* Japan Market */}
                <div className="bg-slate-800/50 rounded-lg p-3 relative">
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs text-slate-500">Japan Market (¥)</p>
                        <button
                            onClick={() => setShowJapanInfo(!showJapanInfo)}
                            className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 text-[10px] font-bold"
                        >
                            ?
                        </button>
                    </div>
                    {/* Accordion Info */}
                    {showJapanInfo && (
                        <div className="mb-2 p-2 bg-slate-700/50 rounded text-[10px] text-slate-300">
                            Avg. price from major card shops in Japan.
                        </div>
                    )}
                    <div className="flex items-baseline gap-2">
                        <p className="text-lg font-bold text-white">
                            ¥{japanPrice.toLocaleString()}
                        </p>
                        <span className="text-xs text-slate-500">≒</span>
                        <p className="text-lg font-bold text-amber-400">
                            ${Math.round(japanPrice / EXCHANGE_RATE)}
                        </p>
                    </div>
                    <p className="text-[9px] text-slate-600 text-right mt-2">Updated: Dec 23, 2024</p>
                </div>

                {/* eBay */}
                <div className="bg-slate-800/50 rounded-lg p-3 relative">
                    <p className="text-xs text-slate-500 mb-1">eBay Price (USD)</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-lg font-bold text-amber-400">
                            ${ebayPrice}
                        </p>
                        <span className="text-xs text-slate-500">≒</span>
                        <p className="text-lg font-bold text-white">
                            ¥{(ebayPrice * EXCHANGE_RATE).toLocaleString()}
                        </p>
                    </div>
                    <p className="text-[9px] text-slate-600 text-right mt-2">Updated: Dec 23, 2024</p>
                </div>
            </div>

            {/* Exchange Rate */}
            <p className="text-[10px] text-slate-500 text-right">Exchange Rate: ¥{EXCHANGE_RATE} / USD</p>
        </div>
    );
}
