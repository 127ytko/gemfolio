'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { ExchangeRateProvider } from '@/context/ExchangeRateContext';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <SubscriptionProvider>
                <LanguageProvider>
                    <ExchangeRateProvider>
                        {children}
                    </ExchangeRateProvider>
                </LanguageProvider>
            </SubscriptionProvider>
        </AuthProvider>
    );
}
