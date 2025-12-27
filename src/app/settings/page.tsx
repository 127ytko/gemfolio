'use client';

import { useState, useEffect } from 'react';
import { Settings, Globe, Bell, Shield, User, LogOut, Crown, Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function SettingsPage() {
    const { language, setLanguage } = useLanguage();
    const { user, loading, signOut } = useAuth();
    const { tier, isPremium } = useSubscription();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    // Profile Update State
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Check login provider
    const isEmailProvider = user?.app_metadata?.provider === 'email';

    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setDisplayName(user.user_metadata.full_name);
        }
        if (user?.email) {
            setNewEmail(user.email);
        }
    }, [user]);

    useEffect(() => {
        // Check current notification permission
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            const saved = localStorage.getItem('gemfolio-notifications');
            if (saved === 'true' && Notification.permission === 'granted') {
                setNotificationsEnabled(true);
            }
        }
    }, []);

    const handleNotificationToggle = async () => {
        if (!('Notification' in window)) {
            alert(language === 'ja' ? 'このブラウザは通知に対応していません' : 'This browser does not support notifications');
            return;
        }

        if (notificationsEnabled) {
            // Turn off
            setNotificationsEnabled(false);
            localStorage.setItem('gemfolio-notifications', 'false');
        } else {
            // Request permission
            if (Notification.permission === 'granted') {
                setNotificationsEnabled(true);
                localStorage.setItem('gemfolio-notifications', 'true');
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    localStorage.setItem('gemfolio-notifications', 'true');
                    // Show test notification
                    new Notification('GemFolio', {
                        body: language === 'ja' ? '通知が有効になりました！' : 'Notifications enabled!',
                        icon: '/favicon.ico',
                    });
                }
            }
        }
    };

    // Translations
    const t = {
        title: language === 'ja' ? '設定' : 'Settings',
        account: language === 'ja' ? 'アカウント' : 'Account',
        notLoggedIn: language === 'ja' ? 'ログインしていません' : 'Not logged in',
        login: language === 'ja' ? 'ログイン' : 'Login',
        logout: language === 'ja' ? 'ログアウト' : 'Logout',
        plan: language === 'ja' ? 'プラン' : 'Plan',
        freePlan: language === 'ja' ? 'Freeプラン' : 'Free Plan',
        premiumPlan: language === 'ja' ? 'Premiumプラン' : 'Premium Plan',
        upgrade: language === 'ja' ? 'アップグレード' : 'Upgrade',
        language: language === 'ja' ? '言語' : 'Language',
        languageDesc: language === 'ja' ? '表示言語を選択する' : 'Choose your preferred language',
        notifications: language === 'ja' ? '通知' : 'Notifications',
        notificationsDesc: language === 'ja' ? '価格アラートと更新情報を受け取る' : 'Get price alerts and updates',
        notificationsBlocked: language === 'ja' ? 'ブラウザ設定でブロックされています' : 'Blocked by browser settings',
        privacy: language === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy',
        privacyDesc: language === 'ja' ? '個人情報の取り扱いについて' : 'How we handle your data',
        save: language === 'ja' ? '保存' : 'Save',
        saving: language === 'ja' ? '保存中...' : 'Saving...',
        successUpdate: language === 'ja' ? 'プロフィールを更新しました' : 'Profile updated successfully',
        errorUpdate: language === 'ja' ? '更新に失敗しました' : 'Failed to update profile',
        emailConfirm: language === 'ja' ? '新しいメールアドレスを確認してください' : 'Please check your email to confirm',
        emailChangeDesc: language === 'ja' ? '変更すると確認メールが送信されます' : 'A confirmation email will be sent',
        googleAccount: language === 'ja' ? 'Googleアカウントで管理されています' : 'Managed by Google Account',
    };

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        setUpdateMessage(null);
        try {
            const supabase = getSupabaseClient();
            const updates: { data?: { full_name: string }; email?: string; password?: string } = {};

            if (displayName !== user?.user_metadata?.full_name) {
                updates.data = { full_name: displayName };
            }

            // Allow email/password change only for email provider
            if (isEmailProvider) {
                if (newEmail !== user?.email) {
                    updates.email = newEmail;
                }
                if (newPassword) {
                    updates.password = newPassword;
                }
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.auth.updateUser(updates);
                if (error) throw error;

                if (updates.email) {
                    setUpdateMessage({ type: 'success', text: t.emailConfirm });
                } else {
                    setUpdateMessage({ type: 'success', text: t.successUpdate });
                }
                setNewPassword(''); // Clear password field
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setUpdateMessage({ type: 'error', text: t.errorUpdate });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <section className="mb-6">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <Settings size={24} className="text-amber-400" />
                    {t.title}
                </h1>
            </section>

            {/* User Profile Section */}
            {loading ? (
                <section className="mb-6">
                    <div className="flex flex-col items-center justify-center gap-4 py-6">
                        <div className="w-20 h-20 bg-slate-800 rounded-full animate-pulse" />
                        <div className="h-8 bg-slate-800 rounded w-24 animate-pulse" />
                    </div>
                </section>
            ) : user ? (
                <section className="mb-6">
                    {/* Avatar + Logout centered */}
                    <div className="flex items-center justify-center gap-4 pt-2 pb-4">
                        {user.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                                <User size={40} className="text-amber-400" />
                            </div>
                        )}
                        <button
                            onClick={signOut}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors bg-slate-800 rounded-lg"
                        >
                            <LogOut size={14} />
                            {t.logout}
                        </button>
                    </div>

                    {/* Profile Edit Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">
                                {language === 'ja' ? 'ユーザーネーム' : 'Username'}
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={language === 'ja' ? '名前を入力' : 'Enter your name'}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">
                                {language === 'ja' ? 'メールアドレス' : 'Email'}
                            </label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                disabled={!isEmailProvider}
                                className={`w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors ${!isEmailProvider ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <p className="text-[10px] text-slate-600 mt-1">
                                {isEmailProvider ? t.emailChangeDesc : t.googleAccount}
                            </p>
                        </div>

                        {isEmailProvider && (
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                    {language === 'ja' ? 'パスワード' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                />
                                <p className="text-[10px] text-slate-600 mt-1">
                                    {language === 'ja' ? '変更する場合のみ入力' : 'Enter only if changing'}
                                </p>
                            </div>
                        )}

                        {updateMessage && (
                            <div className={`text-xs p-2 rounded ${updateMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {updateMessage.text}
                            </div>
                        )}

                        <button
                            onClick={handleUpdateProfile}
                            disabled={isUpdating}
                            className="w-full py-2 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? t.saving : t.save}
                        </button>
                    </div>
                </section>
            ) : (
                <section className="mb-6">
                    <div className="flex items-center justify-center gap-4 pt-2 pb-4">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                            <User size={40} className="text-slate-500" />
                        </div>
                        <a
                            href="/login"
                            className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors"
                        >
                            {t.login}
                        </a>
                    </div>
                </section>
            )}

            {/* Subscription Plan - Removed per request */}


            {/* Settings List */}
            <div className="space-y-4">
                {/* Language Setting */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Globe size={20} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white">{t.language}</h2>
                                <p className="text-xs text-slate-500">{t.languageDesc}</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-800 rounded-lg overflow-hidden self-end sm:self-auto">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-4 py-2 text-xs font-semibold transition-colors ${language === 'en'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('ja')}
                                className={`px-4 py-2 text-xs font-semibold transition-colors ${language === 'ja'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                JP
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications Setting */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Bell size={20} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white">{t.notifications}</h2>
                                <p className="text-xs text-slate-500">
                                    {notificationPermission === 'denied'
                                        ? t.notificationsBlocked
                                        : t.notificationsDesc}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleNotificationToggle}
                            disabled={notificationPermission === 'denied'}
                            className={`relative w-12 h-6 rounded-full transition-colors self-end sm:self-auto flex-shrink-0 ${notificationsEnabled
                                ? 'bg-amber-500'
                                : 'bg-slate-700'
                                } ${notificationPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Links */}
            <div className="space-y-4 mt-4">
                {/* Privacy Policy */}
                <a
                    href="/privacy"
                    className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Shield size={20} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white">{t.privacy}</h2>
                                <p className="text-xs text-slate-500">{t.privacyDesc}</p>
                            </div>
                        </div>
                        <span className="text-slate-500 text-lg">›</span>
                    </div>
                </a>
            </div>

            {/* Copyright */}
            <div className="mt-8 text-center">
                <p className="text-xs text-slate-600">© 2025 GemFolio. All Rights Reserved.</p>
            </div>
        </div>
    );
}

