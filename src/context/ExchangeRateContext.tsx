'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLatestExchangeRate } from '@/lib/api/exchangeRate';

interface ExchangeRateContextType {
    rate: number;
    loading: boolean;
    convertPrice: (priceInJpy: number) => number; // JPY -> USD
    convertInput: (priceInUsd: number) => number; // USD -> JPY
}

const ExchangeRateContext = createContext<ExchangeRateContextType>({
    rate: 155, // Default fallback
    loading: true,
    convertPrice: (p) => p / 155,
    convertInput: (p) => p * 155,
});

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
    const [rate, setRate] = useState<number>(155);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const latestRate = await getLatestExchangeRate();
                setRate(latestRate);
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
