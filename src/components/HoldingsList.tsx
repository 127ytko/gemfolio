'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { EditHoldingModal } from './EditHoldingModal';
import { useLanguage } from '@/context/LanguageContext';
import { EXCHANGE_RATE } from '@/lib/constants';

interface HoldingEntry {
    entry_id: string;
    acquired_date: string;
    condition: 'PSA10' | 'RAW';
    quantity: number;
    purchase_price: number;
}

interface HoldingItem {
    card_id: string;
    slug: string;
    name_en: string;
    name_ja?: string;
    card_number: string;
    set_name_en: string;
    set_name_ja?: string;
    rarity_en: string;
    image_url: string | null;
    quantity: number;
    cost: number;
    current_value: number;
    acquired_date: string;
    entries: HoldingEntry[];
}

interface HoldingsListProps {
    holdings: HoldingItem[];
    initialEditCardId?: string | null;
}

type SortOption = 'date' | 'value' | 'profit';

export function HoldingsList({ holdings, initialEditCardId }: HoldingsListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [selectedCard, setSelectedCard] = useState<HoldingItem | null>(null);
    const { language } = useLanguage();

    // Auto-open edit modal when initialEditCardId is provided
    useEffect(() => {
        if (initialEditCardId) {
            const cardToEdit = holdings.find(h => h.card_id === initialEditCardId);
            if (cardToEdit) {
                setSelectedCard(cardToEdit);
            }
        }
    }, [initialEditCardId, holdings]);

    const t = {
        searchPlaceholder: language === 'ja' ? '保有カードを検索...' : 'Search holdings...',
        date: language === 'ja' ? '日付' : 'Date',
        value: language === 'ja' ? '評価額' : 'Value',
        profit: language === 'ja' ? '損益' : 'Profit',
        noMatch: language === 'ja' ? '該当するカードがありません' : 'No cards match your search',
        noHoldings: language === 'ja' ? '保有カードがありません' : 'No holdings yet',
    };

    const SORT_OPTIONS = [
        { value: 'date', label: t.date },
        { value: 'value', label: t.value },
        { value: 'profit', label: t.profit },
    ] as const;

    const filteredAndSortedHoldings = useMemo(() => {
        let result = holdings.filter((item) => {
            const name = language === 'ja' ? (item.name_ja || item.name_en) : item.name_en;
            const setName = language === 'ja' ? (item.set_name_ja || item.set_name_en) : item.set_name_en;
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.card_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                setName.toLowerCase().includes(searchQuery.toLowerCase());
        });

        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.acquired_date).getTime() - new Date(a.acquired_date).getTime();
                case 'value':
                    return b.current_value - a.current_value;
                case 'profit':
                    const profitRateA = a.cost > 0 ? ((a.current_value - a.cost) / a.cost) * 100 : 0;
                    const profitRateB = b.cost > 0 ? ((b.current_value - b.cost) / b.cost) * 100 : 0;
                    return profitRateB - profitRateA;
                default:
                    return 0;
            }
        });

        return result;
    }, [holdings, searchQuery, sortBy, language]);

    const handleSaveEntry = (entry_id: string, quantity: number, purchase_price: number) => {
        console.log('Save entry:', { entry_id, quantity, purchase_price });
        // TODO: API call to update entry
    };

    const handleDeleteEntry = (entry_id: string) => {
        console.log('Delete entry:', entry_id);
        // TODO: API call to delete entry
        setSelectedCard(null);
    };

    return (
        <div>
            {/* Search & Sort Bar */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-8 pr-8 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="relative flex-shrink-0">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="appearance-none pl-2 pr-5 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-[10px] text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Holdings List */}
            {filteredAndSortedHoldings.length > 0 ? (
                <div className="space-y-2">
                    {filteredAndSortedHoldings.map((item) => (
                        <HoldingListItem
                            key={item.card_id}
                            item={item}
                            onClick={() => setSelectedCard(item)}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center border border-dashed border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-500">
                        {searchQuery ? t.noMatch : t.noHoldings}
                    </p>
                </div>
            )}

            {/* Edit Modal */}
            {selectedCard && (
                <EditHoldingModal
                    isOpen={!!selectedCard}
                    onClose={() => setSelectedCard(null)}
                    card={{
                        card_id: selectedCard.card_id,
                        name_en: selectedCard.name_en,
                        name_ja: selectedCard.name_ja,
                        card_number: selectedCard.card_number,
                        set_name_en: selectedCard.set_name_en,
                        set_name_ja: selectedCard.set_name_ja,
                        rarity_en: selectedCard.rarity_en,
                        image_url: selectedCard.image_url,
                    }}
                    summary={{
                        current_value: selectedCard.current_value,
                        profit: selectedCard.current_value - selectedCard.cost,
                        profitPercent: selectedCard.cost > 0 ? ((selectedCard.current_value - selectedCard.cost) / selectedCard.cost) * 100 : 0,
                    }}
                    entries={selectedCard.entries}
                    onSave={handleSaveEntry}
                    onDelete={handleDeleteEntry}
                />
            )}
        </div>
    );
}

interface HoldingItemDisplayProps {
    item: HoldingItem;
    onClick: () => void;
}

function HoldingListItem({ item, onClick }: HoldingItemDisplayProps) {
    const profit = item.current_value - item.cost;
    const profitPercent = item.cost > 0 ? (profit / item.cost) * 100 : 0;
    const isPositive = profit >= 0;
    const { language } = useLanguage();

    const cardName = language === 'ja' ? (item.name_ja || item.name_en) : item.name_en;
    const setName = language === 'ja' ? (item.set_name_ja || item.set_name_en) : item.set_name_en;

    const t = {
        value: language === 'ja' ? '評価額' : 'Value',
        qty: language === 'ja' ? '数量' : 'Qty',
        profit: language === 'ja' ? '損益' : 'Profit',
        noImage: language === 'ja' ? '画像なし' : 'No Image',
    };

    return (
        <button
            onClick={onClick}
            className="w-full flex items-start gap-2 p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors text-left"
        >
            {/* Card Thumbnail */}
            <div className="w-14 h-20 flex-shrink-0 bg-slate-800 rounded-lg overflow-hidden">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={cardName}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-[8px]">
                        {t.noImage}
                    </div>
                )}
            </div>

            {/* Card Info */}
            <div className="flex-1 min-w-0 py-0.5">
                <h3 className="text-xs font-semibold text-white line-clamp-1">
                    {cardName}
                </h3>

                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-medium rounded flex-shrink-0">
                        {item.card_number}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">
                        {setName}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-1 mt-1.5">
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500">{t.value}</span>
                        <span className="text-sm font-bold text-amber-400">
                            {language === 'ja'
                                ? `¥${item.current_value.toLocaleString()}`
                                : `$${Math.round(item.current_value / EXCHANGE_RATE).toLocaleString()}`
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500">{language === 'ja' ? '保有数' : t.qty}</span>
                        <span className="text-xs font-semibold text-white">
                            {item.quantity}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-slate-500">{t.profit}</span>
                    <span className={`text-[10px] font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : '-'}
                        {language === 'ja'
                            ? `¥${Math.abs(profit).toLocaleString()}`
                            : `$${Math.round(Math.abs(profit) / EXCHANGE_RATE).toLocaleString()}`
                        }
                        {' '}({isPositive ? '+' : ''}{profitPercent.toFixed(0)}%)
                    </span>
                </div>
            </div>
        </button>
    );
}
