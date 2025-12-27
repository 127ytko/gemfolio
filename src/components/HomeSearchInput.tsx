'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function HomeSearchInput() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push('/search');
        }
    };

    return (
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search card name (e.g. Luffy)"
                    className="w-56 sm:w-80 pl-8 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            <button
                type="submit"
                className="relative px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 text-xs font-bold tracking-wide rounded-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden group"
            >
                <span className="relative z-10">Search</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            </button>
        </form>
    );
}
