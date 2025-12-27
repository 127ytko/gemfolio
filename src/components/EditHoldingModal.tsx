'use client';

import { useState } from 'react';
import { X, Minus, Plus, Save, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { DatePicker } from './DatePicker';
import { useLanguage } from '@/context/LanguageContext';
import { EXCHANGE_RATE } from '@/lib/constants';

interface HoldingEntry {
    entry_id: string;
    acquired_date: string;
    condition: 'PSA10' | 'RAW';
    quantity: number;
    purchase_price: number;
}

interface EditHoldingModalProps {
    isOpen: boolean;
    onClose: () => void;
    card: {
        card_id: string;
        name_en: string;
        name_ja?: string;
        card_number: string;
        set_name_en: string;
        set_name_ja?: string;
        rarity_en: string;
        image_url: string | null;
    };
    summary?: {
        current_value: number;
        profit: number;
        profitPercent: number;
    };
    entries: HoldingEntry[];
    onSave: (entry_id: string, quantity: number, purchase_price: number, acquired_date: string) => void;
    onDelete: (entry_id: string) => void;
}

export function EditHoldingModal({
    isOpen,
    onClose,
    card,
    entries,
    onSave,
    onDelete,
    summary,
}: EditHoldingModalProps) {
    const { language } = useLanguage();

    const t = {
        title: language === 'ja' ? '編集' : 'Edit',
        condition: language === 'ja' ? '状態' : 'Condition',
        quantity: language === 'ja' ? '枚数' : 'Qty',
        purchasePrice: language === 'ja' ? '購入価格' : 'Purchase Price',
        purchaseDate: language === 'ja' ? '購入日' : 'Purchase Date',
        edit: language === 'ja' ? '編集' : 'Edit',
        delete: language === 'ja' ? '削除' : 'Delete',
        cancel: language === 'ja' ? 'キャンセル' : 'Cancel',
        save: language === 'ja' ? '保存' : 'Save',
        noImage: language === 'ja' ? '画像なし' : 'No Image',
        value: language === 'ja' ? '評価額' : 'Value',
        profit: language === 'ja' ? '損益' : 'Profit',
    };

    const cardName = language === 'ja' ? (card.name_ja || card.name_en) : card.name_en;
    const setName = language === 'ja' ? (card.set_name_ja || card.set_name_en) : card.set_name_en;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-20">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md max-h-full mx-4 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-base font-bold text-white">{t.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Card Info */}
                    <div className="flex gap-3 mb-4">
                        {/* Card Image */}
                        <div className="w-20 h-28 flex-shrink-0 bg-slate-800 rounded-lg overflow-hidden">
                            {card.image_url ? (
                                <img
                                    src={card.image_url}
                                    alt={card.name_en}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                                    {t.noImage}
                                </div>
                            )}
                        </div>

                        {/* Card Details */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white line-clamp-2 mb-1">
                                {cardName}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 font-medium rounded">
                                    {card.card_number}
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="text-amber-400 font-medium">
                                    {card.rarity_en}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 truncate">
                                {setName}
                            </p>
                        </div>
                    </div>

                    {/* Summary Section */}
                    {summary && (
                        <div className="flex gap-3 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-500 mb-0.5">{t.value}</p>
                                <p className="text-xl font-bold text-amber-400">
                                    {language === 'ja'
                                        ? `¥${summary.current_value.toLocaleString()}`
                                        : `$${Math.round(summary.current_value / EXCHANGE_RATE).toLocaleString()}`
                                    }
                                </p>
                            </div>
                            <div className="w-px bg-slate-700/50 self-stretch" />
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-500 mb-0.5">{t.profit}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <p className={`text-xl font-bold ${summary.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {summary.profit >= 0 ? '+' : '-'}
                                        {language === 'ja'
                                            ? `¥${Math.abs(summary.profit).toLocaleString()}`
                                            : `$${Math.round(Math.abs(summary.profit) / EXCHANGE_RATE).toLocaleString()}`
                                        }
                                    </p>
                                    <span className={`text-xs font-medium ${summary.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ({summary.profit >= 0 ? '+' : ''}{summary.profitPercent.toFixed(0)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Holdings Entries */}
                    <div className="space-y-3">
                        {entries.map((entry) => (
                            <HoldingEntryCard
                                key={entry.entry_id}
                                entry={entry}
                                t={t}
                                language={language}
                                onSave={(quantity, price, date) => onSave(entry.entry_id, quantity, price, date)}
                                onDelete={() => onDelete(entry.entry_id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HoldingEntryCard({
    entry,
    t,
    language,
    onSave,
    onDelete,
}: {
    entry: HoldingEntry;
    t: Record<string, string>;
    language: string;
    onSave: (quantity: number, purchase_price: number, acquired_date: string) => void;
    onDelete: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [quantity, setQuantity] = useState(entry.quantity);

    // Initial price conversion based on language
    const initialPrice = language === 'ja'
        ? entry.purchase_price
        : Math.round(entry.purchase_price / EXCHANGE_RATE);

    const [purchasePrice, setPurchasePrice] = useState(initialPrice.toString());
    const [acquiredDate, setAcquiredDate] = useState<Date | undefined>(
        entry.acquired_date ? new Date(entry.acquired_date) : undefined
    );
    const [saving, setSaving] = useState(false);

    const locale = language === 'ja' ? ja : enUS;
    const dateFormat = language === 'ja' ? 'yyyy年M月d日' : 'MMM d, yyyy';

    const handleSave = async () => {
        setSaving(true);

        let priceToSave = parseFloat(purchasePrice) || 0;
        // Convert back to JPY if saving in USD/English mode
        if (language !== 'ja') {
            priceToSave = Math.round(priceToSave * EXCHANGE_RATE);
        }

        await onSave(
            quantity,
            priceToSave,
            acquiredDate?.toISOString() || entry.acquired_date
        );
        setSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setQuantity(entry.quantity);
        // Reset price based on current language
        const resetPrice = language === 'ja'
            ? entry.purchase_price
            : Math.round(entry.purchase_price / EXCHANGE_RATE);
        setPurchasePrice(resetPrice.toString());
        setAcquiredDate(entry.acquired_date ? new Date(entry.acquired_date) : undefined);
        setIsEditing(false);
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return format(date, dateFormat, { locale });
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500">
                    {formatDisplayDate(entry.acquired_date)}
                </span>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                    >
                        <Pencil size={10} />
                        {t.edit}
                    </button>
                )}
            </div>

            {/* Condition + Quantity */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{t.condition}</span>
                    <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-medium rounded">
                        {entry.condition === 'PSA10' ? 'PSA10' : 'Raw (Mint)'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{t.quantity}</span>
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                            >
                                <Minus size={10} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-white">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                            >
                                <Plus size={10} />
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs font-semibold text-white">{entry.quantity}</span>
                    )}
                </div>
            </div>

            {/* Purchase Price */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500">{t.purchasePrice}</span>
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-xs">{language === 'ja' ? '¥' : '$'}</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value.replace(/[^0-9.]/g, ''))}
                            className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-amber-500/50"
                        />
                    </div>
                ) : (
                    <span className="text-xs font-semibold text-white">
                        {language === 'ja'
                            ? `¥${entry.purchase_price.toLocaleString()}`
                            : `$${Math.round(entry.purchase_price / EXCHANGE_RATE).toLocaleString()}`
                        }
                    </span>
                )}
            </div>

            {/* Purchase Date (Editing Mode) */}
            {isEditing && (
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-slate-500">{t.purchaseDate}</span>
                    <div className="bg-slate-700 border border-slate-600 rounded px-2 py-1">
                        <DatePicker
                            value={acquiredDate}
                            onChange={setAcquiredDate}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {isEditing && (
                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={onDelete}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 size={12} />
                        {t.delete}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-2 bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                        <Save size={12} />
                        {saving ? '...' : t.save}
                    </button>
                </div>
            )}
        </div>
    );
}
