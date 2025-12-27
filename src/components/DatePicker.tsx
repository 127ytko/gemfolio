'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { Calendar, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const locale = language === 'ja' ? ja : enUS;
    const dateFormat = language === 'ja' ? 'yyyy年M月d日' : 'MMM d, yyyy';
    const defaultPlaceholder = language === 'ja' ? '日付を選択' : 'Select date';

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (date: Date | undefined) => {
        onChange(date);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Input Button */}
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center gap-2 bg-transparent text-left"
                >
                    <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                    <span className={`text-sm font-semibold ${value ? 'text-white' : 'text-slate-500'}`}>
                        {value ? format(value, dateFormat, { locale }) : (placeholder || defaultPlaceholder)}
                    </span>
                </button>
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Calendar Popup */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    <style>{`
                        .rdp {
                            --rdp-cell-size: 36px;
                            --rdp-accent-color: #f59e0b;
                            --rdp-background-color: #1e293b;
                            margin: 0;
                            padding: 12px;
                        }
                        .rdp-months {
                            justify-content: center;
                        }
                        .rdp-caption_label {
                            font-size: 14px;
                            font-weight: 600;
                            color: white;
                        }
                        .rdp-nav_button {
                            color: #94a3b8;
                        }
                        .rdp-nav_button:hover {
                            background-color: #334155;
                        }
                        .rdp-head_cell {
                            font-size: 11px;
                            font-weight: 500;
                            color: #64748b;
                            text-transform: uppercase;
                        }
                        .rdp-day {
                            color: #e2e8f0;
                            font-size: 13px;
                            border-radius: 8px;
                        }
                        .rdp-day:hover:not(.rdp-day_selected) {
                            background-color: #334155;
                        }
                        .rdp-day_selected {
                            background-color: var(--rdp-accent-color) !important;
                            color: #0f172a !important;
                            font-weight: 600;
                        }
                        .rdp-day_today:not(.rdp-day_selected) {
                            border: 1px solid #f59e0b;
                            color: #f59e0b;
                        }
                        .rdp-day_outside {
                            color: #475569;
                        }
                    `}</style>
                    <DayPicker
                        mode="single"
                        selected={value}
                        onSelect={handleSelect}
                        locale={locale}
                        showOutsideDays
                        fixedWeeks
                    />
                </div>
            )}
        </div>
    );
}
