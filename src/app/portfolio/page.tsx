'use client';

import { useState, useEffect, Suspense } from 'react';
import { Layers, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TotalValueCard } from '@/components/TotalValueCard';
import { HoldingsList } from '@/components/HoldingsList';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getPortfolio, getPortfolioSummary } from '@/lib/api/portfolio';

interface HoldingItem {
    card_id: string;
    slug: string;
    name_en: string;
    name_ja: string;
    card_number: string;
    set_name_en: string;
    set_name_ja: string;
    rarity_en: string;
    image_url: string | null;
    quantity: number;
    cost: number;
    current_value: number;
    acquired_date: string;
    entries: {
        entry_id: string;
        acquired_date: string;
        condition: 'PSA10' | 'RAW';
        quantity: number;
        purchase_price: number;
    }[];
}

export default function VaultPage() {
    return (
        <Suspense fallback={<VaultPageLoading />}>
            <VaultPageContent />
        </Suspense>
    );
}

function VaultPageLoading() {
    return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
            <div className="py-16 text-center">
                <Loader2 size={40} className="text-amber-400 mx-auto mb-4 animate-spin" />
                <p className="text-sm text-slate-400">Loading...</p>
            </div>
        </div>
    );
}

function VaultPageContent() {
    const { t, language } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const editCardId = searchParams.get('edit');

    const [holdings, setHoldings] = useState<HoldingItem[]>([]);
    const [summary, setSummary] = useState({
        totalValue: 0,
        todayChange: 0,
        todayChangePercent: 0,
        totalCost: 0,
        totalProfit: 0,
        totalItems: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPortfolio() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const [portfolioData, summaryData] = await Promise.all([
                    getPortfolio(),
                    getPortfolioSummary(),
                ]);

                // Group by card_id and transform data
                const groupedHoldings: Record<string, HoldingItem> = {};

                for (const entry of portfolioData) {
                    const card = entry.cards;
                    if (!card) continue;

                    const cardId = entry.card_id;
                    const currentPrice = entry.condition === 'RAW'
                        ? card.price_raw_avg || 0
                        : card.price_psa10_avg || 0;

                    if (!groupedHoldings[cardId]) {
                        groupedHoldings[cardId] = {
                            card_id: cardId,
                            slug: card.slug,
                            name_en: card.name_en,
                            name_ja: card.name_ja,
                            card_number: card.card_number,
                            set_name_en: card.set_name_en,
                            set_name_ja: card.set_name_ja,
                            rarity_en: card.rarity_en,
                            image_url: card.image_url,
                            quantity: 0,
                            cost: 0,
                            current_value: 0,
                            acquired_date: entry.purchase_date || entry.created_at,
                            entries: [],
                        };
                    }

                    groupedHoldings[cardId].quantity += entry.quantity;
                    groupedHoldings[cardId].cost += entry.purchase_price * entry.quantity;
                    groupedHoldings[cardId].current_value += currentPrice * entry.quantity;
                    groupedHoldings[cardId].entries.push({
                        entry_id: entry.id,
                        acquired_date: entry.purchase_date || entry.created_at,
                        condition: entry.condition as 'PSA10' | 'RAW',
                        quantity: entry.quantity,
                        purchase_price: entry.purchase_price,
                    });
                }

                setHoldings(Object.values(groupedHoldings));
                setSummary({
                    totalValue: summaryData.totalValue,
                    todayChange: summaryData.todayChange,
                    todayChangePercent: summaryData.todayChangePercent,
                    totalCost: summaryData.totalCost,
                    totalProfit: summaryData.totalProfit,
                    totalItems: summaryData.totalItems,
                });
            } catch (error) {
                console.error('Failed to load portfolio:', error);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            loadPortfolio();
        }
    }, [user, authLoading]);

    // Show login prompt if not authenticated
    if (!authLoading && !user) {
        return (
            <div className="px-4 py-6 max-w-7xl mx-auto">
                <section className="mb-6">
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <Layers size={24} className="text-amber-400" />
                        {t('portfolio.myVault')}
                    </h1>
                </section>

                <div className="py-12 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/30">
                    <Layers size={48} className="text-amber-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-3">
                        {language === 'ja' ? 'ポートフォリオを始めよう' : 'Start Your Portfolio'}
                    </h2>
                    <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto px-4">
                        {language === 'ja'
                            ? '無料会員登録で、保有カードの価格変動をリアルタイムでトラッキングできます。'
                            : 'Sign up for free to track your card collection value in real-time.'}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-lg transition-colors"
                    >
                        {language === 'ja' ? '無料で始める' : 'Get Started Free'}
                    </Link>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading || authLoading) {
        return (
            <div className="px-4 py-6 max-w-7xl mx-auto">
                <section className="mb-6">
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <Layers size={24} className="text-amber-400" />
                        {t('portfolio.myVault')}
                    </h1>
                </section>

                <div className="py-16 text-center">
                    <Loader2 size={40} className="text-amber-400 mx-auto mb-4 animate-spin" />
                    <p className="text-sm text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <section className="mb-6">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <Layers size={24} className="text-amber-400" />
                    {t('portfolio.myVault')}
                </h1>
            </section>

            {/* Total Value Card */}
            <section className="mb-6">
                <TotalValueCard
                    totalValue={summary.totalValue}
                    todayChange={summary.todayChange}
                    todayChangePercent={summary.todayChangePercent}
                    totalCost={summary.totalCost}
                    totalProfit={summary.totalProfit}
                    totalItems={summary.totalItems}
                />
            </section>

            {holdings.length > 0 ? (
                <>
                    {/* Holdings Section */}
                    <section className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-slate-400">{language === 'ja' ? '保有カード' : 'Collections'}</h2>
                            <Link
                                href="/search"
                                className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg text-slate-900 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </Link>
                        </div>

                        {/* Holdings List */}
                        <HoldingsList holdings={holdings} initialEditCardId={editCardId} />
                    </section>
                </>
            ) : (
                /* Empty State */
                <div className="py-16 text-center border border-dashed border-slate-700 rounded-xl">
                    <Layers size={40} className="text-slate-600 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-white mb-2">
                        {t('portfolio.empty')}
                    </h2>
                    <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                        {t('portfolio.addFirst')}
                    </p>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                        {t('card.addToVault')}
                    </Link>
                </div>
            )}
        </div>
    );
}
