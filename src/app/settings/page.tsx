'use client';

import { useState, useEffect } from 'react';
import { Settings, Globe, Bell, Shield, User, LogOut, Crown, Zap, Download, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getUserProfile, updateDisplayName } from '@/lib/api/userProfile';

// PWA Install Prompt interface
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function SettingsPage() {
    const { language, setLanguage } = useLanguage();
    const { user, loading, signOut } = useAuth();
    const { tier, isPremium } = useSubscription();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // Profile Update State
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check login provider
    const isEmailProvider = user?.app_metadata?.provider === 'email';

    useEffect(() => {
        const loadProfile = async () => {
            if (user?.id) {
                const profile = await getUserProfile(user.id);
                if (profile?.display_name) {
                    setDisplayName(profile.display_name);
                } else if (user?.user_metadata?.full_name) {
                    setDisplayName(user.user_metadata.full_name);
                }
            }
            if (user?.email) {
                setNewEmail(user.email);
            }
        };
        loadProfile();
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

    // PWA Install Event Listener
    useEffect(() => {
        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Listen for beforeinstallprompt event (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

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
        deleteAccount: language === 'ja' ? 'アカウントを削除' : 'Delete Account',
        deleteAccountDesc: language === 'ja' ? 'アカウントと全てのデータを完全に削除します' : 'Permanently delete your account and all data',
        deleteConfirmTitle: language === 'ja' ? '本当に削除しますか？' : 'Are you sure?',
        deleteConfirmDesc: language === 'ja' ? 'この操作は取り消せません。アカウント、ポートフォリオ、お気に入り等のすべてのデータが完全に削除されます。' : 'This action cannot be undone. Your account, portfolio, favorites and all data will be permanently deleted.',
        deleteConfirmButton: language === 'ja' ? '削除する' : 'Delete',
        cancel: language === 'ja' ? 'キャンセル' : 'Cancel',
        deleting: language === 'ja' ? '削除中...' : 'Deleting...',
    };

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        setUpdateMessage(null);
        try {
            const supabase = getSupabaseClient();
            let hasUpdates = false;

            // Update display name in user_profiles table (persists after Google re-login)
            if (user?.id && displayName) {
                const success = await updateDisplayName(user.id, displayName);
                if (success) {
                    hasUpdates = true;
                }
            }

            // Allow email/password change only for email provider
            if (isEmailProvider) {
                const authUpdates: { email?: string; password?: string } = {};
                if (newEmail !== user?.email) {
                    authUpdates.email = newEmail;
                }
                if (newPassword) {
                    authUpdates.password = newPassword;
                }

                if (Object.keys(authUpdates).length > 0) {
                    const { error } = await supabase.auth.updateUser(authUpdates);
                    if (error) throw error;
                    hasUpdates = true;

                    if (authUpdates.email) {
                        setUpdateMessage({ type: 'success', text: t.emailConfirm });
                        setNewPassword('');
                        return;
                    }
                }
            }

            if (hasUpdates) {
                setUpdateMessage({ type: 'success', text: t.successUpdate });
                setNewPassword('');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setUpdateMessage({ type: 'error', text: t.errorUpdate });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const supabase = getSupabaseClient();

            // Get current session for authorization
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No session found');
            }

            // Call Edge Function to delete account
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete account');
            }

            // Force clear local storage items related to Supabase
            // This handles cases where signOut might not clear everything immediately
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                    localStorage.removeItem(key);
                }
            }

            // Use AuthContext signOut to update state and clear session
            await signOut();

            // Force hard reload to home to ensure clean state
            window.location.href = '/';
        } catch (error) {
            console.error('Error deleting account:', error);
            setIsDeleting(false);
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
                                onFocus={(e) => {
                                    // Prevent auto-scroll on mobile
                                    setTimeout(() => {
                                        e.target.scrollIntoView({ behavior: 'instant', block: 'nearest' });
                                    }, 100);
                                }}
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

                {/* Add to Home Screen */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Download size={20} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white">
                                    {language === 'ja' ? 'アプリをインストール' : 'Install App'}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {language === 'ja'
                                        ? 'ホーム画面に追加してアプリとして使用'
                                        : 'Add to home screen for app-like experience'}
                                </p>
                            </div>
                        </div>

                        {/* Android/PC: Show install button if available */}
                        {isInstallable && (
                            <button
                                onClick={handleInstallClick}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                {language === 'ja' ? 'アプリをインストール' : 'Install App'}
                            </button>
                        )}

                        {/* iOS: Show instructions */}
                        {isIOS && !isInstallable && (
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-2">
                                    {language === 'ja'
                                        ? 'iPhoneでインストールするには：'
                                        : 'To install on iPhone:'}
                                </p>
                                <div className="text-[10px] text-slate-500 space-y-1">
                                    <p>1. {language === 'ja' ? '画面下の共有ボタン（□↑）をタップ' : 'Tap the Share button (□↑) at the bottom'}</p>
                                    <p>2. {language === 'ja' ? '「ホーム画面に追加」を選択' : 'Select "Add to Home Screen"'}</p>
                                    <p>3. {language === 'ja' ? '「追加」をタップ' : 'Tap "Add"'}</p>
                                </div>
                            </div>
                        )}

                        {/* Already installed or not installable */}
                        {!isInstallable && !isIOS && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                <p className="text-xs text-green-400">
                                    {language === 'ja'
                                        ? '✓ アプリとしてインストール済み、または対応ブラウザでアクセスしてください'
                                        : '✓ Already installed as app, or access from a supported browser'}
                                </p>
                            </div>
                        )}
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

            {/* Delete Account Section - Only show for logged in users */}
            {user && (
                <div className="mt-4">
                    <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Trash2 size={20} className="text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-sm font-semibold text-red-400">{t.deleteAccount}</h2>
                                <p className="text-xs text-slate-500 mt-1">{t.deleteAccountDesc}</p>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                    {t.deleteAccount}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Copyright */}
            <div className="mt-8 text-center">
                <p className="text-xs text-slate-600">© 2025 GemFolio. All Rights Reserved.</p>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-bold text-white mb-2">{t.deleteConfirmTitle}</h3>
                        <p className="text-sm text-slate-400 mb-6">{t.deleteConfirmDesc}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                disabled={isDeleting}
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                disabled={isDeleting}
                            >
                                {isDeleting ? t.deleting : t.deleteConfirmButton}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

