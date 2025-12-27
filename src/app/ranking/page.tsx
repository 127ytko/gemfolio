'use client';

import { TrendingUp, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function RankingPage() {
    const { language } = useLanguage();

    const t = {
        title: language === 'ja' ? 'ランキング' : 'Ranking',
        comingSoon: language === 'ja' ? '準備中' : 'Coming Soon',
        description: language === 'ja'
            ? 'ランキング機能は現在開発中です。\n価格上昇率やお気に入り順などのランキング表示で、コレクション管理や売買に役立つ機能を準備しています。'
            : 'Ranking feature is currently under development.\nWe are preparing useful features for collection management and trading, such as price increase rates and favorites ranking.',
        stayTuned: language === 'ja' ? 'もうしばらくお待ちください。' : 'Please wait a moment.',
    };

    return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <section className="mb-6">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <TrendingUp size={24} className="text-amber-400" />
                    {t.title}
                </h1>
            </section>

            {/* Coming Soon Content */}
            <div className="flex flex-col items-center justify-center py-6">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                    <Clock size={40} className="text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                    {t.comingSoon}
                </h2>
                <p className="text-slate-400 text-center text-sm max-w-md whitespace-pre-line">
                    {t.description}
                </p>
                <p className="text-amber-400 text-sm font-medium mt-6">
                    {t.stayTuned}
                </p>
            </div>
        </div>
    );
}
