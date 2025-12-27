'use client';

import { useLanguage } from '@/context/LanguageContext';

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ja' : 'en');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="w-8 px-2 py-1 rounded-full border border-slate-600/50 text-slate-400 text-xs font-semibold tracking-wide hover:border-amber-500/50 hover:text-amber-400 transition-colors active:scale-95"
            aria-label="Toggle language"
        >
            {language === 'en' ? 'JP' : 'EN'}
        </button>
    );
}
