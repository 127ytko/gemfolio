'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <SubscriptionProvider>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </SubscriptionProvider>
        </AuthProvider>
    );
}
