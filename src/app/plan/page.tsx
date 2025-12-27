'use client';

import { Crown, Check, Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

export default function PricingPage() {
    const { language } = useLanguage();
    const { user, signInWithGoogle } = useAuth();
    const { tier, isPremium } = useSubscription();

    const t = {
        title: language === 'ja' ? '料金プラン' : 'Pricing Plans',
        subtitle: language === 'ja'
            ? 'あなたに合ったプランを選んでください'
            : 'Choose the plan that works for you',
        free: language === 'ja' ? 'Free' : 'Free',
        premium: language === 'ja' ? 'Premium' : 'Premium',
        perMonth: language === 'ja' ? '/月' : '/mo',
        limitedOffer: language === 'ja' ? '期間限定' : 'Limited Offer',
        currentPlan: language === 'ja' ? '現在のプラン' : 'Current Plan',
        getStarted: language === 'ja' ? '無料で始める' : 'Get Started Free',
        upgrade: language === 'ja' ? 'アップグレード' : 'Upgrade Now',
        loginRequired: language === 'ja' ? 'ログインが必要です' : 'Login Required',
    };

    const freeFeatures = language === 'ja'
        ? [
            '相場データの閲覧',
            'カード検索',
            'Portfolio（コレクション管理）',
            '最大100枚まで登録',
        ]
        : [
            'View market prices',
            'Card search',
            'Portfolio (Collection management)',
            'Up to 100 cards',
        ];

    const premiumFeatures = language === 'ja'
        ? [
            'Freeプランの全機能',
            '過去の価格推移データ',
            '無制限のPortfolio登録',
            '価格アラート通知',
            'データエクスポート',
            '優先サポート',
        ]
        : [
            'All Free features',
            'Historical price data',
            'Unlimited Portfolio entries',
            'Price alert notifications',
            'Data export',
            'Priority support',
        ];

    const handleUpgrade = () => {
        // TODO: Implement Stripe checkout
        alert(language === 'ja' ? 'Stripe決済は準備中です' : 'Stripe checkout coming soon');
    };

    return (
        <div className="px-4 py-6 max-w-4xl mx-auto">
            {/* Header */}
            <section className="text-center mb-8">
                <h1 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                    <Crown size={28} className="text-amber-400" />
                    {t.title}
                </h1>
                <p className="text-sm text-slate-400 mt-2">{t.subtitle}</p>
            </section>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Free Plan */}
                <div className={`bg-slate-900 border rounded-2xl p-6 ${tier === 'free' ? 'border-amber-500' : 'border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">{t.free}</h2>
                        {tier === 'free' && (
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded">
                                {t.currentPlan}
                            </span>
                        )}
                    </div>
                    <div className="mb-6">
                        <span className="text-3xl font-black text-white">$0</span>
                        <span className="text-slate-500 text-sm">{t.perMonth}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                        {freeFeatures.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                <Check size={16} className="text-green-400 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    {!user ? (
                        <button
                            onClick={signInWithGoogle}
                            className="w-full py-3 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            {t.getStarted}
                        </button>
                    ) : tier === 'free' ? (
                        <button
                            disabled
                            className="w-full py-3 bg-slate-800 text-slate-500 text-sm font-semibold rounded-lg cursor-not-allowed"
                        >
                            {t.currentPlan}
                        </button>
                    ) : null}
                </div>

                {/* Premium Plan */}
                <div className={`bg-gradient-to-br from-amber-500/10 to-orange-500/10 border rounded-2xl p-6 relative overflow-hidden ${tier === 'premium' ? 'border-amber-500' : 'border-amber-500/50'}`}>
                    {/* Limited Offer Badge */}
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-lg">
                        {t.limitedOffer}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={20} className="text-amber-400" />
                        <h2 className="text-lg font-bold text-white">{t.premium}</h2>
                        {tier === 'premium' && (
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded ml-auto">
                                {t.currentPlan}
                            </span>
                        )}
                    </div>
                    <div className="mb-6">
                        <span className="text-slate-500 line-through text-lg mr-2">$12</span>
                        <span className="text-3xl font-black text-white">$8</span>
                        <span className="text-slate-400 text-sm">{t.perMonth}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                        {premiumFeatures.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                <Check size={16} className="text-amber-400 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    {!user ? (
                        <button
                            onClick={signInWithGoogle}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-sm font-bold rounded-lg hover:from-amber-400 hover:to-orange-400 transition-colors"
                        >
                            {t.loginRequired}
                        </button>
                    ) : tier === 'premium' ? (
                        <button
                            disabled
                            className="w-full py-3 bg-slate-800 text-slate-500 text-sm font-semibold rounded-lg cursor-not-allowed"
                        >
                            {t.currentPlan}
                        </button>
                    ) : (
                        <button
                            onClick={handleUpgrade}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-sm font-bold rounded-lg hover:from-amber-400 hover:to-orange-400 transition-colors"
                        >
                            {t.upgrade}
                        </button>
                    )}
                </div>
            </div>

            {/* FAQ or Additional Info */}
            <section className="mt-8 text-center">
                <p className="text-xs text-slate-500">
                    {language === 'ja'
                        ? 'いつでもキャンセル可能です。詳しくはプライバシーポリシーをご確認ください。'
                        : 'Cancel anytime. See our Privacy Policy for details.'}
                </p>
            </section>
        </div>
    );
}
