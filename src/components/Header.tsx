'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useLanguage } from '@/context/LanguageContext';

export function Header() {
    const { user, loading } = useAuth();
    const { isPremium } = useSubscription();
    const { language } = useLanguage();

    // Status button text
    const getStatusButton = () => {
        if (loading) {
            return (
                <div className="w-16 h-8 bg-slate-800 rounded-lg animate-pulse" />
            );
        }

        if (!user) {
            // Not logged in
            return (
                <Link
                    href="/login"
                    className="w-16 h-8 flex justify-center items-center bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                >
                    {language === 'ja' ? 'ログイン' : 'Login'}
                </Link>
            );
        }

        if (isPremium) {
            // Plan display disabled for now
            return null;
        }

        // Free plan - hidden for now
        return null;
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
            <div className="flex items-center justify-between px-4 py-2.5 max-w-7xl mx-auto">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg font-black text-amber-400 tracking-wide leading-tight">
                                GemFolio
                            </span>
                            <span className="px-1 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-bold rounded leading-none">
                                BETA
                            </span>
                        </div>
                        <span className="text-[9px] text-slate-400 tracking-wider">
                            TCG Portfolio Manager
                        </span>
                    </div>
                </Link>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    <LanguageToggle />
                    {getStatusButton()}
                </div>
            </div>
        </header>
    );
}
