'use client';

import { useState } from 'react';
import { PriceComparisonTabs } from './PriceComparisonTabs';
import { PriceHistoryTabs } from './PriceHistoryTabs';

interface PriceData {
    japanPrice: number;
    ebayPrice: number;
}

interface PriceDataPoint {
    date: string;
    ebay: number;
    japan: number;
}

interface CardPriceSectionProps {
    rawPrices: PriceData;
    psa10Prices: PriceData;
    rawChartData: PriceDataPoint[];
    psa10ChartData: PriceDataPoint[];
    rawCurrentPrice: number;
    rawPriceChange: number;
    psa10CurrentPrice: number;
    psa10PriceChange: number;
    updatedAt?: string;
}

export function CardPriceSection({
    rawPrices,
    psa10Prices,
    rawChartData,
    psa10ChartData,
    rawCurrentPrice,
    rawPriceChange,
    psa10CurrentPrice,
    psa10PriceChange,
    updatedAt,
}: CardPriceSectionProps) {
    const [activeTab, setActiveTab] = useState<'Raw' | 'PSA10'>('Raw');

    return (
        <>
            {/* Price Comparison (Tabs) */}
            <div className="px-4 mb-6">
                <PriceComparisonTabs
                    rawPrices={rawPrices}
                    psa10Prices={psa10Prices}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    updatedAt={updatedAt}
                />
            </div>

            {/* Price History (Tabs with Chart) */}
            <div className="px-4 mb-6">
                <PriceHistoryTabs
                    rawData={rawChartData}
                    psa10Data={psa10ChartData}
                    rawCurrentPrice={rawCurrentPrice}
                    rawPriceChange={rawPriceChange}
                    psa10CurrentPrice={psa10CurrentPrice}
                    psa10PriceChange={psa10PriceChange}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </div>
        </>
    );
}
