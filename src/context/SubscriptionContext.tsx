'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type SubscriptionTier = 'guest' | 'free' | 'premium';

interface SubscriptionContextType {
    tier: SubscriptionTier;
    loading: boolean;
    isPremium: boolean;
    canUseVault: boolean;
    canViewHistory: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Feature access by tier
const TIER_ACCESS = {
    guest: {
        canUseVault: false,
        canViewHistory: false,
    },
    free: {
        canUseVault: true,
        canViewHistory: false,
    },
    premium: {
        canUseVault: true,
        canViewHistory: true,
    },
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [tier, setTier] = useState<SubscriptionTier>('guest');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setTier('guest');
            setLoading(false);
            return;
        }

        // TODO: Fetch actual subscription status from Supabase
        // For now, set to 'free' for logged-in users
        const fetchSubscription = async () => {
            try {
                // In production, this would fetch from Supabase:
                // const { data } = await supabase
                //     .from('subscriptions')
                //     .select('*')
                //     .eq('user_id', user.id)
                //     .eq('status', 'active')
                //     .single();
                // 
                // if (data) {
                //     setTier('premium');
                // } else {
                //     setTier('free');
                // }

                // Demo: All logged-in users are 'free' tier
                setTier('free');
            } catch (error) {
                console.error('Error fetching subscription:', error);
                setTier('free');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [user, authLoading]);

    const access = TIER_ACCESS[tier];

    return (
        <SubscriptionContext.Provider
            value={{
                tier,
                loading,
                isPremium: tier === 'premium',
                canUseVault: access.canUseVault,
                canViewHistory: access.canViewHistory,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
