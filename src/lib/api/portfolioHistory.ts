import { getSupabaseClient } from '@/lib/supabase/client';

export interface PortfolioHistoryPoint {
    recorded_date: string;
    total_value: number;
    total_cost: number;
    daily_change: number;
    daily_change_percent: number;
}

/**
 * Get portfolio value history for chart display
 */
export async function getPortfolioHistory(
    userId: string,
    days: number = 30,
    currency: 'USD' | 'JPY' = 'USD'
): Promise<PortfolioHistoryPoint[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .rpc('get_portfolio_history' as never, {
            p_user_id: userId,
            p_days: days,
            p_currency: currency
        } as never);

    if (error) {
        console.error('Error fetching portfolio history:', error);
        return [];
    }

    return (data || []) as PortfolioHistoryPoint[];
}

/**
 * Record current portfolio snapshot (call this when portfolio changes)
 */
export async function recordPortfolioSnapshot(userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .rpc('record_portfolio_snapshot' as never, {
            p_user_id: userId
        } as never);

    if (error) {
        console.error('Error recording portfolio snapshot:', error);
        return false;
    }

    return true;
}

/**
 * Get latest portfolio value from history
 */
export async function getLatestPortfolioValue(userId: string): Promise<{
    total_value_jpy: number;
    total_cost_jpy: number;
    total_value_usd: number;
    total_cost_usd: number;
    recorded_date: string;
} | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('portfolio_value_history' as never)
        .select('total_value_jpy, total_cost_jpy, total_value_usd, total_cost_usd, recorded_date')
        .eq('user_id', userId)
        .order('recorded_date', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }

    const record = data[0] as any;

    return {
        total_value_jpy: record.total_value_jpy,
        total_cost_jpy: record.total_cost_jpy,
        total_value_usd: record.total_value_usd,
        total_cost_usd: record.total_cost_usd,
        recorded_date: record.recorded_date
    };
}
