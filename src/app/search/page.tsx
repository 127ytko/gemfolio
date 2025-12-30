import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { SearchFilters } from '@/components/SearchFilters';
import { CardList } from '@/components/CardList';
import { SearchPageTitle, SearchResultsHeader, SearchEmptyState } from '@/components/SearchPageClient';
import { getSupabaseServer } from '@/lib/supabase';
import { ForceScrollToTop } from '@/components/ForceScrollToTop';

export const metadata: Metadata = {
    title: 'Search - Find One Piece Cards',
    description: 'Search for One Piece Card Game cards by name, card number, or set. Find prices, compare Japan vs eBay, and discover deals.',
};

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || '';

    // Fetch cards from Supabase
    const supabase = await getSupabaseServer();

    let cardsQuery = supabase
        .from('cards')
        .select('*')
        .order('price_raw_avg', { ascending: false, nullsFirst: false })
        .limit(50);

    // Apply search filter if query exists
    if (query) {
        cardsQuery = cardsQuery.or(`name_en.ilike.%${query}%,name_ja.ilike.%${query}%,card_number.ilike.%${query}%,set_name_en.ilike.%${query}%`);
    }

    const { data: cards, error } = await cardsQuery;

    return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
            <ForceScrollToTop />
            {/* Header */}
            <section className="mb-6">
                <SearchPageTitle />
            </section>

            {/* Search Input */}
            <Suspense fallback={<div className="h-12 bg-slate-800 rounded-xl animate-pulse" />}>
                <SearchInput />
            </Suspense>

            {/* Filters (Sort, Set, Rarity, Hot Keywords) */}
            <SearchFilters />

            {/* Card List */}
            <section className="mt-6">
                <div className="flex items-center justify-between mb-3">
                    <SearchResultsHeader count={cards?.length ?? 0} query={query} />
                </div>

                {error ? (
                    <div className="py-8 text-center text-red-400">
                        Error loading cards: {error.message}
                    </div>
                ) : cards && cards.length > 0 ? (
                    <CardList cards={cards} />
                ) : (
                    <SearchEmptyState query={query} />
                )}
            </section>
        </div>
    );
}
