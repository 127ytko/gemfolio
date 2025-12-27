'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SearchInputProps {
    onSearch?: (query: string) => void;
}

export function SearchInput({ onSearch }: SearchInputProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { language } = useLanguage();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);

    // Sync with URL params on mount
    useEffect(() => {
        const q = searchParams.get('q') || '';
        setQuery(q);
        if (onSearch) {
            onSearch(q);
        }
    }, [searchParams, onSearch]);

    const handleChange = (value: string) => {
        setQuery(value);
        if (onSearch) {
            onSearch(value);
        }
        // Update URL without navigation
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set('q', value);
        } else {
            params.delete('q');
        }
        router.replace(`/search?${params.toString()}`, { scroll: false });
    };

    const handleClear = () => {
        setQuery('');
        if (onSearch) {
            onSearch('');
        }
        router.replace('/search', { scroll: false });
    };

    return (
        <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={language === 'ja' ? 'カードを検索' : 'Search cards, sets, or characters...'}
                className="w-full pl-9 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            {query && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    aria-label="Clear search"
                >
                    <X size={18} />
                </button>
            )}
        </div>
    );
}
