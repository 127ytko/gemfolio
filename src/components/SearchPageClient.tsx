'use client';

import { Search as SearchIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SearchResultsHeaderProps {
    count: number;
    query: string;
}

export function SearchResultsHeader({ count, query }: SearchResultsHeaderProps) {
    const { t } = useLanguage();

    return (
        <span className="text-sm text-slate-400">
            <span className="text-2xl font-black text-white">{count}</span>{' '}
            {query
                ? t('search.resultsFor', { count: '', query }).replace(/^\d*\s*/, '')
                : t('search.results', { count: '' }).replace(/^\d*\s*/, '')
            }
        </span>
    );
}

export function SearchEmptyState({ query }: { query: string }) {
    const { t } = useLanguage();

    return (
        <div className="py-16 text-center border border-dashed border-slate-700 rounded-xl">
            <SearchIcon size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
                {query
                    ? t('search.noResultsFor', { query })
                    : t('search.noResults')
                }
            </p>
        </div>
    );
}

export function SearchPageTitle() {
    const { t } = useLanguage();

    return (
        <h1 className="text-xl font-black text-white flex items-center gap-2">
            <SearchIcon size={24} className="text-amber-400" />
            {t('search.title')}
        </h1>
    );
}
