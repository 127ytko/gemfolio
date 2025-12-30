import { getSupabaseClient } from '@/lib/supabase/client';
import type { CardCondition } from '@/types/database';

// Portfolio entry with card data
interface PortfolioEntry {
    id: string;
    user_id: string;
    card_id: string;
    condition: CardCondition;
    quantity: number;
    purchase_price_usd: number;
    purchase_price_jpy: number | null;
    purchase_date: string | null;
    created_at: string;
    updated_at: string;
    cards?: {
        card_id: string;
        slug: string;
        card_number: string;
        name_ja: string;
        name_en: string;
        set_name_ja: string;
        set_name_en: string;
        rarity_en: string;
        image_url: string | null;
        price_raw_avg: number | null;
        price_psa10_avg: number | null;
        price_raw_change_weekly?: number | null;
    };
}

// ポートフォリオにカードを追加
export async function addToPortfolio(data: {
    card_id: string;
    condition: CardCondition;
    quantity: number;
    purchase_price_usd: number;
    purchase_price_jpy: number | null;
    purchase_date?: string | null;
}) {
    const supabase = getSupabaseClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        throw new Error('User not authenticated');
    }

    // Use any type to bypass strict typing issues with Supabase client
    const { data: portfolio, error } = await (supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: PortfolioEntry | null; error: Error | null }> } } } })
        .from('portfolios')
        .insert({
            user_id: userData.user.id,
            card_id: data.card_id,
            condition: data.condition,
            quantity: data.quantity,
            purchase_price_usd: data.purchase_price_usd,
            purchase_price_jpy: data.purchase_price_jpy,
            purchase_date: data.purchase_date || null,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return portfolio;
}

// ユーザーのポートフォリオを取得
export async function getPortfolio(): Promise<PortfolioEntry[]> {
    const supabase = getSupabaseClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return [];
    }

    const { data, error } = await (supabase as unknown as { from: (table: string) => { select: (query: string) => { eq: (col: string, val: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: PortfolioEntry[] | null; error: Error | null }> } } } })
        .from('portfolios')
        .select(`
            *,
            cards (
                card_id,
                slug,
                card_number,
                name_ja,
                name_en,
                set_name_ja,
                set_name_en,
                rarity_en,
                image_url,
                price_raw_avg,
                price_psa10_avg,
                price_raw_change_weekly
            )
        `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

// ポートフォリオエントリを更新
export async function updatePortfolioEntry(
    entryId: string,
    updates: {
        condition?: CardCondition;
        quantity?: number;
        purchase_price_usd?: number;
        purchase_price_jpy?: number | null;
        purchase_date?: string | null;
    }
) {
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: PortfolioEntry | null; error: Error | null }> } } } } })
        .from('portfolios')
        .update(updates)
        .eq('id', entryId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// ポートフォリオエントリを削除
export async function deletePortfolioEntry(entryId: string) {
    const supabase = getSupabaseClient();

    const { error } = await (supabase as unknown as { from: (table: string) => { delete: () => { eq: (col: string, val: string) => Promise<{ error: Error | null }> } } })
        .from('portfolios')
        .delete()
        .eq('id', entryId);

    if (error) {
        throw error;
    }
}

// ポートフォリオのサマリーを計算
export async function getPortfolioSummary() {
    const portfolio = await getPortfolio();

    let totalCost = 0;
    let totalValue = 0;
    let totalItems = 0;

    for (const entry of portfolio) {
        const card = entry.cards;
        const currentPrice = entry.condition === 'RAW'
            ? card?.price_raw_avg || 0
            : card?.price_psa10_avg || 0;

        totalCost += entry.purchase_price_usd * entry.quantity;
        totalValue += currentPrice * entry.quantity;
        totalItems += entry.quantity;
    }

    const totalProfit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
        totalItems,
        totalCost,
        totalValue,
        totalProfit,
        profitPercent,
        todayChange: 0, // TODO: Calculate from price history
        todayChangePercent: 0,
    };
}
