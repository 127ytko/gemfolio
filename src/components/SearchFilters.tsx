'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const SETS = [
    'All', 'OP09', 'OP08', 'OP07', 'OP06', 'OP05', 'OP04', 'OP03', 'OP02', 'OP01',
    'ST19', 'ST18', 'ST17', 'ST16', 'ST15',
];

const RARITIES = [
    'All', 'Manga Rare', 'SP', 'SEC', 'Alt Art', 'SR', 'R', 'UC', 'C',
];

const HOT_KEYWORDS = ['Luffy', 'Zoro', 'Shanks', 'Manga Rare', 'OP09', 'Alt Art'];

export function SearchFilters() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSet, setActiveSet] = useState('All');
    const [activeRarity, setActiveRarity] = useState('All');
    const { language } = useLanguage();

    const t = {
        filters: language === 'ja' ? 'フィルター' : 'Filters',
        set: language === 'ja' ? '収録' : 'Set',
        rarity: language === 'ja' ? 'レアリティ' : 'Rarity',
        hotKeywords: language === 'ja' ? '人気の検索' : 'Hot Keywords',
        active: language === 'ja' ? '適用中' : 'Active',
        all: language === 'ja' ? 'すべて' : 'All',
    };

    return (
        <div className="mt-3">
            {/* Single Accordion Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800/50 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <SlidersHorizontal size={14} />
                    {t.filters}
                    {(activeSet !== 'All' || activeRarity !== 'All') && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded">
                            {t.active}
                        </span>
                    )}
                </span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Filter Content */}
            {isOpen && (
                <div className="mt-2 p-3 bg-slate-900/30 border border-slate-800 rounded-lg space-y-4">
                    {/* Set Filter */}
                    <div>
                        <h3 className="text-[10px] font-medium text-slate-500 mb-2">{t.set}</h3>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {SETS.map((set) => (
                                <button
                                    key={set}
                                    onClick={() => setActiveSet(set)}
                                    className={`px-2.5 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${activeSet === set
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                        }`}
                                >
                                    {set === 'All' ? t.all : set}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rarity Filter */}
                    <div>
                        <h3 className="text-[10px] font-medium text-slate-500 mb-2">{t.rarity}</h3>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {RARITIES.map((rarity) => (
                                <button
                                    key={rarity}
                                    onClick={() => setActiveRarity(rarity)}
                                    className={`px-2.5 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${activeRarity === rarity
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                        }`}
                                >
                                    {rarity === 'All' ? t.all : rarity}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hot Keywords */}
                    <div>
                        <h3 className="text-[10px] font-medium text-slate-500 mb-2">{t.hotKeywords}</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {HOT_KEYWORDS.map((term) => (
                                <a
                                    key={term}
                                    href={`/search?q=${encodeURIComponent(term)}`}
                                    className="px-2 py-1 bg-slate-700 text-slate-400 text-[10px] font-medium rounded-full hover:bg-slate-600 hover:text-slate-300 transition-colors"
                                >
                                    {term}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
