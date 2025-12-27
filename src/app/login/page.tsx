'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
    const router = useRouter();
    const { language } = useLanguage();
    const { signInWithEmail, signUp, resetPassword, signInWithGoogle } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const t = {
        login: language === 'ja' ? 'ログイン' : 'Login',
        signup: language === 'ja' ? '新規登録' : 'Sign Up',
        forgotPassword: language === 'ja' ? 'パスワードを忘れた方' : 'Forgot Password',
        resetPassword: language === 'ja' ? 'パスワードをリセット' : 'Reset Password',
        email: language === 'ja' ? 'メールアドレス' : 'Email',
        password: language === 'ja' ? 'パスワード' : 'Password',
        displayName: language === 'ja' ? '表示名' : 'Display Name',
        or: language === 'ja' ? 'または' : 'or',
        googleLogin: language === 'ja' ? 'Googleでログイン' : 'Sign in with Google',
        noAccount: language === 'ja' ? 'アカウントをお持ちでない方' : "Don't have an account?",
        hasAccount: language === 'ja' ? 'すでにアカウントをお持ちの方' : 'Already have an account?',
        backToLogin: language === 'ja' ? 'ログインに戻る' : 'Back to Login',
        resetSent: language === 'ja' ? 'パスワードリセットのメールを送信しました' : 'Password reset email sent',
        signupSuccess: language === 'ja' ? '確認メールを送信しました。メールを確認してください。' : 'Confirmation email sent. Please check your email.',
        errorInvalidCredentials: language === 'ja' ? 'メールアドレスまたはパスワードが正しくありません' : 'Invalid email or password',
        errorEmailInUse: language === 'ja' ? 'このメールアドレスは既に登録されています' : 'This email is already registered',
        errorWeakPassword: language === 'ja' ? 'パスワードは6文字以上で入力してください' : 'Password must be at least 6 characters',
        errorGeneric: language === 'ja' ? 'エラーが発生しました。もう一度お試しください。' : 'An error occurred. Please try again.',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await signInWithEmail(email, password);
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        setError(t.errorInvalidCredentials);
                    } else {
                        setError(t.errorGeneric);
                    }
                } else {
                    router.push('/settings');
                }
            } else if (mode === 'signup') {
                const { error } = await signUp(email, password, displayName);
                if (error) {
                    if (error.message.includes('already registered')) {
                        setError(t.errorEmailInUse);
                    } else if (error.message.includes('Password')) {
                        setError(t.errorWeakPassword);
                    } else {
                        setError(t.errorGeneric);
                    }
                } else {
                    setMessage(t.signupSuccess);
                }
            } else if (mode === 'forgot') {
                const { error } = await resetPassword(email);
                if (error) {
                    setError(t.errorGeneric);
                } else {
                    setMessage(t.resetSent);
                }
            }
        } catch {
            setError(t.errorGeneric);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch {
            setError(t.errorGeneric);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {/* Fixed Back Button - Below Header */}
            <div className="fixed top-14 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-sm">
                <div className="max-w-md mx-auto px-4 py-2">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        {language === 'ja' ? '戻る' : 'Back'}
                    </button>
                </div>
            </div>

            {/* Spacer for fixed header + back button */}
            <div className="h-12" />

            {/* Content */}
            <div className="px-4 py-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-white">
                        {mode === 'login' && t.login}
                        {mode === 'signup' && t.signup}
                        {mode === 'forgot' && t.resetPassword}
                    </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t.displayName}</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder={language === 'ja' ? 'ユーザー名を入力' : 'Enter your name'}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">{t.email}</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder={language === 'ja' ? 'メールアドレスを入力' : 'Enter your email'}
                            />
                        </div>
                    </div>

                    {mode !== 'forgot' && (
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t.password}</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder={language === 'ja' ? 'パスワードを入力' : 'Enter your password'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error/Success messages */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <p className="text-xs text-green-400">{message}</p>
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-amber-500 text-slate-950 text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {mode === 'login' && t.login}
                        {mode === 'signup' && t.signup}
                        {mode === 'forgot' && t.resetPassword}
                    </button>

                    {/* Forgot password link */}
                    {mode === 'login' && (
                        <button
                            type="button"
                            onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {t.forgotPassword}
                        </button>
                    )}
                </form>

                {/* Divider */}
                {mode !== 'forgot' && (
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-xs text-slate-500">{t.or}</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>
                )}

                {/* Google Login */}
                {mode !== 'forgot' && (
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {t.googleLogin}
                    </button>
                )}

                {/* Mode switch */}
                <div className="mt-6 text-center">
                    {mode === 'login' && (
                        <p className="text-xs text-slate-500">
                            {t.noAccount}{' '}
                            <button
                                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                                className="text-amber-400 hover:text-amber-300"
                            >
                                {t.signup}
                            </button>
                        </p>
                    )}
                    {mode === 'signup' && (
                        <p className="text-xs text-slate-500">
                            {t.hasAccount}{' '}
                            <button
                                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                                className="text-amber-400 hover:text-amber-300"
                            >
                                {t.login}
                            </button>
                        </p>
                    )}
                    {mode === 'forgot' && (
                        <button
                            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                            className="text-xs text-amber-400 hover:text-amber-300"
                        >
                            {t.backToLogin}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
