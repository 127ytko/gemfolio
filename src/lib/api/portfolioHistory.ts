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
    days: number = 30
): Promise<PortfolioHistoryPoint[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .rpc('get_portfolio_history' as never, {
            p_user_id: userId,
            p_days: days
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
    total_value: number;
    total_cost: number;
    yesterday_value: number | null;
} | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('portfolio_value_history' as never)
        .select('total_value, total_cost, recorded_date')
        .eq('user_id', userId)
        .order('recorded_date', { ascending: false })
        .limit(2);

    if (error || !data || data.length === 0) {
        return null;
    }

    const records = data as { total_value: number; total_cost: number; recorded_date: string }[];

    return {
        total_value: records[0].total_value,
        total_cost: records[0].total_cost,
        yesterday_value: records.length > 1 ? records[1].total_value : null
    };
}
