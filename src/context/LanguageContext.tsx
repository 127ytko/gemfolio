'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ja' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
    ja: {
        // ========== Header ==========
        'header.tagline': 'プレミアム資産管理',

        // ========== Navigation ==========
        'nav.top': 'トップ',
        'nav.search': '検索',
        'nav.ranking': 'トレンド',
        'nav.vault': 'ポートフォリオ',
        'nav.setting': '設定',

        // ========== Common ==========
        'common.loading': '読み込み中...',
        'common.error': 'エラー',
        'common.save': '保存',
        'common.cancel': 'キャンセル',
        'common.delete': '削除',
        'common.edit': '編集',
        'common.add': '追加',
        'common.back': '戻る',
        'common.next': '次へ',
        'common.close': '閉じる',
        'common.confirm': '確認',
        'common.yes': 'はい',
        'common.no': 'いいえ',
        'common.noData': 'データがありません',
        'common.viewAll': 'すべて見る',

        // ========== Search Page ==========
        'search.title': '検索',
        'search.placeholder': 'カード名、番号で検索...',
        'search.results': '{count}件のカードが見つかりました',
        'search.resultsFor': '「{query}」で{count}件',
        'search.noResults': 'カードが見つかりませんでした',
        'search.noResultsFor': '「{query}」に一致するカードがありません',
        'search.filters': 'フィルター',
        'search.sort': '並び替え',
        'search.sortByPrice': '価格順',
        'search.sortByName': '名前順',
        'search.sortByRecent': '新しい順',

        // ========== Card Details ==========
        'card.value': '価格',
        'card.weekly': '週間',
        'card.marketValue': '市場価格',
        'card.purchasePrice': '購入価格',
        'card.quantity': '数量',
        'card.condition': 'コンディション',
        'card.raw': 'Raw',
        'card.psa10': 'PSA10',
        'card.addToVault': 'ポートフォリオに追加',
        'card.viewOnEbay': 'eBayで見る',
        'card.priceHistory': '価格推移',
        'card.japanPrice': '国内価格',
        'card.ebayPrice': 'eBay価格',
        'card.noImage': '画像なし',
        'card.imageReference': '※画像は参考です',

        // ========== Portfolio ==========
        'portfolio.title': 'ポートフォリオ',
        'portfolio.myVault': 'マイポートフォリオ',
        'portfolio.totalValue': '総資産額',
        'portfolio.totalCost': '総投資額',
        'portfolio.totalProfit': '総利益',
        'portfolio.todayChange': '本日の変動',
        'portfolio.holdings': '保有カード',
        'portfolio.empty': 'ポートフォリオにカードがありません',
        'portfolio.addFirst': '最初のカードを追加しましょう',

        // ========== Ranking ==========
        'ranking.title': 'トレンド',
        'ranking.topPerformers': 'TOP10パフォーマー',
        'ranking.weeklyGainers': '週間上昇率',
        'ranking.weeklyLosers': '週間下落率',
        'ranking.mostPopular': '人気カード',

        // ========== Settings ==========
        'settings.title': '設定',
        'settings.language': '言語',
        'settings.currency': '通貨',
        'settings.notifications': '通知',
        'settings.emailNotifications': 'メール通知',
        'settings.account': 'アカウント',
        'settings.logout': 'ログアウト',
        'settings.deleteAccount': 'アカウント削除',
        'settings.plan': 'プラン',
        'settings.freePlan': '無料プラン',
        'settings.premiumPlan': 'プレミアムプラン',
        'settings.upgradePlan': 'アップグレード',

        // ========== Auth ==========
        'auth.login': 'ログイン',
        'auth.logout': 'ログアウト',
        'auth.signup': '新規登録',
        'auth.email': 'メールアドレス',
        'auth.password': 'パスワード',
        'auth.forgotPassword': 'パスワードを忘れた方',
        'auth.continueWithGoogle': 'Googleでログイン',
        'auth.continueWithApple': 'Appleでログイン',
        'auth.orContinueWith': 'または',

        // ========== Dashboard ==========
        'dashboard.welcome': 'おかえりなさい',
        'dashboard.summary': '資産サマリー',
        'dashboard.recentActivity': '最近のアクティビティ',
        'dashboard.quickAdd': 'カードを追加',

        // ========== Plan ==========
        'plan.title': 'プラン',
        'plan.free': '無料',
        'plan.premium': 'プレミアム',
        'plan.pro': 'プロ',
        'plan.currentPlan': '現在のプラン',
        'plan.upgrade': 'アップグレード',
        'plan.features': '機能',

        // ========== Privacy ==========
        'privacy.title': 'プライバシーポリシー',

        // ========== Errors ==========
        'error.loadingCards': 'カードの読み込みに失敗しました',
        'error.generic': 'エラーが発生しました',
        'error.notFound': 'ページが見つかりません',
    },
    en: {
        // ========== Header ==========
        'header.tagline': 'Premium Asset Manager',

        // ========== Navigation ==========
        'nav.top': 'Top',
        'nav.search': 'Search',
        'nav.ranking': 'Ranking',
        'nav.vault': 'Portfolio',
        'nav.setting': 'Setting',

        // ========== Common ==========
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.add': 'Add',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.close': 'Close',
        'common.confirm': 'Confirm',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.noData': 'No data available',
        'common.viewAll': 'View All',

        // ========== Search Page ==========
        'search.title': 'Search',
        'search.placeholder': 'Search by card name, number...',
        'search.results': '{count} cards found',
        'search.resultsFor': '{count} results for "{query}"',
        'search.noResults': 'No cards found',
        'search.noResultsFor': 'No cards found for "{query}"',
        'search.filters': 'Filters',
        'search.sort': 'Sort',
        'search.sortByPrice': 'By Price',
        'search.sortByName': 'By Name',
        'search.sortByRecent': 'Most Recent',

        // ========== Card Details ==========
        'card.value': 'Value',
        'card.weekly': 'Weekly',
        'card.marketValue': 'Market Value',
        'card.purchasePrice': 'Purchase Price',
        'card.quantity': 'Quantity',
        'card.condition': 'Condition',
        'card.raw': 'Raw',
        'card.psa10': 'PSA10',
        'card.addToVault': 'Add to Portfolio',
        'card.viewOnEbay': 'View on eBay',
        'card.priceHistory': 'Price History',
        'card.japanPrice': 'Japan Price',
        'card.ebayPrice': 'eBay Price',
        'card.noImage': 'No Image',
        'card.imageReference': 'Image for reference only',

        // ========== Portfolio ==========
        'portfolio.title': 'Portfolio',
        'portfolio.myVault': 'My Portfolio',
        'portfolio.totalValue': 'Total Value',
        'portfolio.totalCost': 'Total Cost',
        'portfolio.totalProfit': 'Total Profit',
        'portfolio.todayChange': "Today's Change",
        'portfolio.holdings': 'Holdings',
        'portfolio.empty': 'No cards in your portfolio',
        'portfolio.addFirst': 'Add your first card',

        // ========== Ranking ==========
        'ranking.title': 'Ranking',
        'ranking.topPerformers': 'TOP10 Performers',
        'ranking.weeklyGainers': 'Weekly Gainers',
        'ranking.weeklyLosers': 'Weekly Losers',
        'ranking.mostPopular': 'Most Popular',

        // ========== Settings ==========
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.currency': 'Currency',
        'settings.notifications': 'Notifications',
        'settings.emailNotifications': 'Email Notifications',
        'settings.account': 'Account',
        'settings.logout': 'Logout',
        'settings.deleteAccount': 'Delete Account',
        'settings.plan': 'Plan',
        'settings.freePlan': 'Free Plan',
        'settings.premiumPlan': 'Premium Plan',
        'settings.upgradePlan': 'Upgrade',

        // ========== Auth ==========
        'auth.login': 'Login',
        'auth.logout': 'Logout',
        'auth.signup': 'Sign Up',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.forgotPassword': 'Forgot Password?',
        'auth.continueWithGoogle': 'Continue with Google',
        'auth.continueWithApple': 'Continue with Apple',
        'auth.orContinueWith': 'or continue with',

        // ========== Dashboard ==========
        'dashboard.welcome': 'Welcome back',
        'dashboard.summary': 'Asset Summary',
        'dashboard.recentActivity': 'Recent Activity',
        'dashboard.quickAdd': 'Quick Add',

        // ========== Plan ==========
        'plan.title': 'Plan',
        'plan.free': 'Free',
        'plan.premium': 'Premium',
        'plan.pro': 'Pro',
        'plan.currentPlan': 'Current Plan',
        'plan.upgrade': 'Upgrade',
        'plan.features': 'Features',

        // ========== Privacy ==========
        'privacy.title': 'Privacy Policy',

        // ========== Errors ==========
        'error.loadingCards': 'Failed to load cards',
        'error.generic': 'An error occurred',
        'error.notFound': 'Page not found',
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ja');

    useEffect(() => {
        const saved = localStorage.getItem('gemfolio-language') as Language;
        if (saved && (saved === 'ja' || saved === 'en')) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('gemfolio-language', lang);
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        let text = translations[language][key] || key;

        // Replace parameters like {count}, {query}
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
            });
        }

        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
