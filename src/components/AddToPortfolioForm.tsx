'use client';

import { useState } from 'react';
import { X, Minus, Plus, Save, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DatePicker } from './DatePicker';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { addToPortfolio } from '@/lib/api/portfolio';
import { useExchangeRate } from '@/context/ExchangeRateContext';

interface AddToPortfolioFormProps {
    cardId: string;
    cardName: string;
    defaultPrice?: number;
}

type ConditionType = 'PSA10' | 'RAW';

export function AddToPortfolioForm({ cardId, cardName, defaultPrice = 0 }: AddToPortfolioFormProps) {
    const { language } = useLanguage();
    const { convertPrice, convertInput } = useExchangeRate();
    const formatWithComma = (value: number) => value.toLocaleString();
    const parseCommaNumber = (value: string) => value.replace(/,/g, '');

    // Convert price for display based on language
    const getDisplayPrice = (price: number) => {
        if (price <= 0) return '';
        if (language === 'ja') return formatWithComma(price);
        // Convert JPY to USD for display
        return formatWithComma(convertPrice(price));
    };

    const [purchasePrice, setPurchasePrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
    const [quantity, setQuantity] = useState(1);
    const [condition, setCondition] = useState<ConditionType>('RAW');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();
    const router = useRouter();

    const t = {
        condition: language === 'ja' ? '状態' : 'Condition',
        rawMint: language === 'ja' ? '素体 (美品)' : 'Raw (Mint)',
        quantity: language === 'ja' ? '枚数' : 'Quantity',
        purchasePrice: language === 'ja' ? '購入価格' : 'Purchase Price',
        purchaseDate: language === 'ja' ? '購入日' : 'Purchase Date',
        save: language === 'ja' ? 'ポートフォリオに追加' : 'Add to Portfolio',
        saving: language === 'ja' ? '追加中...' : 'Adding...',
        saved: language === 'ja' ? '追加完了!' : 'Added!',
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        if (rawValue === '') {
            setPurchasePrice('');
        } else {
            const numValue = parseInt(rawValue, 10);
            setPurchasePrice(formatWithComma(numValue));
        }
    };

    const handleClearPrice = () => {
        setPurchasePrice('');
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleIncrement = () => {
        setQuantity(quantity + 1);
    };

    const handleSave = async () => {
        if (!purchasePrice) return;

        // If not logged in, redirect to auth
        if (!user) {
            router.push('/auth');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const inputValue = parseFloat(parseCommaNumber(purchasePrice));
            let priceUsd = 0;
            let priceJpy = 0;

            if (language === 'ja') {
                // Input is in JPY
                priceJpy = inputValue;
                // Convert JPY to USD for storage
                priceUsd = convertInput(inputValue);
            } else {
                // Input is in USD
                priceUsd = inputValue;
                // Convert USD to JPY for storage
                priceJpy = convertPrice(inputValue);
            }

            await addToPortfolio({
                card_id: cardId,
                condition,
                quantity,
                purchase_price_usd: priceUsd,
                purchase_price_jpy: priceJpy,
                purchase_date: purchaseDate?.toISOString().split('T')[0] || null,
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            setPurchasePrice('');
        } catch (err) {
            console.error('Error saving to portfolio:', err);
            setError(language === 'ja' ? '保存に失敗しました' : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            {/* Responsive Grid: 1 col on small, 2 cols on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Condition */}
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 mb-1.5">{t.condition}</p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setCondition('RAW')}
                            className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${condition === 'RAW'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {t.rawMint}
                        </button>
                        <button
                            onClick={() => setCondition('PSA10')}
                            className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${condition === 'PSA10'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            PSA10
                        </button>
                    </div>
                </div>

                {/* Quantity */}
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 mb-1.5">{t.quantity}</p>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleDecrement}
                            disabled={quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors disabled:opacity-30"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-lg font-bold text-white">
                            {quantity}
                        </span>
                        <button
                            onClick={handleIncrement}
                            className="w-8 h-8 flex items-center justify-center bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* Purchase Price */}
                <div className="bg-slate-800/50 rounded-lg p-2.5 overflow-hidden">
                    <p className="text-[10px] text-slate-500 mb-1.5">{t.purchasePrice}</p>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-sm flex-shrink-0">
                            {language === 'ja' ? '¥' : '$'}
                        </span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={purchasePrice}
                            onChange={handlePriceChange}
                            placeholder="0"
                            className="flex-1 min-w-0 bg-transparent text-lg font-bold text-white placeholder:text-slate-600 focus:outline-none"
                        />
                        <button
                            onClick={handleClearPrice}
                            className={`flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors ${!purchasePrice ? 'opacity-30' : ''}`}
                            disabled={!purchasePrice}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Purchase Date */}
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 mb-1.5">{t.purchaseDate}</p>
                    <DatePicker
                        value={purchaseDate}
                        onChange={setPurchaseDate}
                    />
                </div>

                {/* Save Button - Full Width */}
                <button
                    onClick={handleSave}
                    disabled={saving || !purchasePrice}
                    className={`sm:col-span-2 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${saved
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                >
                    <Save size={16} />
                    {saving ? t.saving : saved ? t.saved : t.save}
                </button>
            </div>
        </div>
    );
}
