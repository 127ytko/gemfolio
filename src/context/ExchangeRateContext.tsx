'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLatestExchangeRate, DEFAULT_RATE } from '@/lib/api/exchangeRate';

interface ExchangeRateContextType {
    rate: number;
    loading: boolean;
    convertPrice: (priceInJpy: number) => number; // JPY -> USD
    convertInput: (priceInUsd: number) => number; // USD -> JPY
}

const ExchangeRateContext = createContext<ExchangeRateContextType>({
    rate: DEFAULT_RATE, // Default fallback
    loading: true,
    convertPrice: (p) => p / DEFAULT_RATE,
    convertInput: (p) => p * DEFAULT_RATE,
});

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
    const [rate, setRate] = useState<number>(DEFAULT_RATE);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                // 1. Try to load processed cache first for immediate display
                // (Only works on client side)
                if (typeof window !== 'undefined') {
                    const cached = localStorage.getItem('exchange_rate_cache');
                    if (cached) {
                        const parsed = parseFloat(cached);
                        if (!isNaN(parsed) && parsed > 0) {
                            setRate(parsed);
                        }
                    }
                }

                // 2. Fetch latest from DB
                const latestRate = await getLatestExchangeRate();

                if (latestRate !== null) {
                    setRate(latestRate);
                    // Update cache
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('exchange_rate_cache', latestRate.toString());
                    }
                }
            } catch (err) {
                console.error('Failed to init exchange rate', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRate();
    }, []);

    const convertPrice = (priceInJpy: number) => {
        return Math.round(priceInJpy / rate);
    };

    const convertInput = (priceInUsd: number) => {
        return Math.round(priceInUsd * rate);
    };

    return (
        <ExchangeRateContext.Provider value={{ rate, loading, convertPrice, convertInput }}>
            {children}
        </ExchangeRateContext.Provider>
    );
}

export const useExchangeRate = () => useContext(ExchangeRateContext);
