'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { signInWithEmail, signUp, signInWithGoogle } = useAuth();
    const { language } = useLanguage();
    const router = useRouter();

    const t = {
        login: language === 'ja' ? 'ログイン' : 'Login',
        signup: language === 'ja' ? '新規登録' : 'Sign Up',
        email: language === 'ja' ? 'メールアドレス' : 'Email',
        password: language === 'ja' ? 'パスワード' : 'Password',
        continueWithGoogle: language === 'ja' ? 'Googleで続ける' : 'Continue with Google',
        orContinueWith: language === 'ja' ? 'または' : 'or continue with',
        noAccount: language === 'ja' ? 'アカウントをお持ちでない方' : "Don't have an account?",
        hasAccount: language === 'ja' ? '既にアカウントをお持ちの方' : 'Already have an account?',
        signupSuccess: language === 'ja' ? '確認メールを送信しました。メールをご確認ください。' : 'Confirmation email sent. Please check your email.',
        loginError: language === 'ja' ? 'メールアドレスまたはパスワードが正しくありません' : 'Invalid email or password',
        signupError: language === 'ja' ? '登録中にエラーが発生しました' : 'Error during registration',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (mode === 'login') {
                const { error } = await signInWithEmail(email, password);
                if (error) {
                    setError(t.loginError);
                } else {
                    router.push('/portfolio');
                }
            } else {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(t.signupError);
                } else {
                    setSuccess(t.signupSuccess);
                }
            }
        } catch {
            setError(mode === 'login' ? t.loginError : t.signupError);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch {
            setError('Google sign in failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-black text-amber-400">
                        GemFolio
                    </Link>
                    <p className="text-sm text-slate-400 mt-2">
                        {mode === 'login' ? t.login : t.signup}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {t.continueWithGoogle}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-slate-700" />
                        <span className="text-xs text-slate-500">{t.orContinueWith}</span>
                        <div className="flex-1 h-px bg-slate-700" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">{t.email}</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">{t.password}</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error/Success Message */}
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-400">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-sm text-green-400">
                                {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {mode === 'login' ? t.login : t.signup}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <p className="text-center text-sm text-slate-400 mt-6">
                        {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login');
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-amber-400 hover:underline font-medium"
                        >
                            {mode === 'login' ? t.signup : t.login}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
