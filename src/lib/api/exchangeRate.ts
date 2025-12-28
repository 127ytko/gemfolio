import { getSupabaseClient } from '@/lib/supabase/client';

export interface ExchangeRate {
    rate: number;
    updated_at: string;
}

// Default fallback rate if API fails
const DEFAULT_RATE = 155;

/**
 * Get latest USD to JPY exchange rate
 */
export async function getLatestExchangeRate(): Promise<number> {
    const supabase = getSupabaseClient();

    try {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('rate')
            .eq('base_currency', 'USD')
            .eq('target_currency', 'JPY')
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.warn('Error fetching exchange rate, using default:', error);
            return DEFAULT_RATE;
        }

        const record = data as { rate: number } | null;
        return record?.rate ?? DEFAULT_RATE;
    } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
        return DEFAULT_RATE;
    }
}
