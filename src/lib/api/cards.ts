import { getSupabaseClient } from '@/lib/supabase/client';

interface CardData {
    card_id: string;
    slug: string;
    card_number: string;
    name_ja: string;
    name_en: string;
    set_name_ja: string;
    set_name_en: string;
    rarity_ja: string;
    rarity_en: string;
    image_url: string | null;
    price_raw_avg: number | null;
    price_psa10_avg: number | null;
    price_raw_change_weekly: number | null;
    price_psa10_change_weekly: number | null;
    updated_at: string;
}

// TOP10 Performers (highest weekly change)
export async function getTopPerformers(limit: number = 10): Promise<CardData[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
            select: (query: string) => {
                order: (col: string, opts: { ascending: boolean; nullsFirst?: boolean }) => {
                    limit: (n: number) => Promise<{ data: CardData[] | null; error: Error | null }>
                }
            }
        }
    })
        .from('cards')
        .select('*')
        .order('price_raw_change_weekly', { ascending: false, nullsFirst: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching top performers:', error);
        return [];
    }

    return data || [];
}

// Get single card by slug
export async function getCardBySlug(slug: string): Promise<CardData | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
            select: (query: string) => {
                eq: (col: string, val: string) => {
                    single: () => Promise<{ data: CardData | null; error: Error | null }>
                }
            }
        }
    })
        .from('cards')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching card:', error);
        return null;
    }

    return data;
}

// Search cards
export async function searchCards(query: string, limit: number = 20): Promise<CardData[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
            select: (query: string) => {
                or: (filter: string) => {
                    limit: (n: number) => Promise<{ data: CardData[] | null; error: Error | null }>
                }
            }
        }
    })
        .from('cards')
        .select('*')
        .or(`name_en.ilike.%${query}%,name_ja.ilike.%${query}%,card_number.ilike.%${query}%`)
        .limit(limit);

    if (error) {
        console.error('Error searching cards:', error);
        return [];
    }

    return data || [];
}

// Get all cards (for search page)
export async function getAllCards(limit: number = 100): Promise<CardData[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
            select: (query: string) => {
                order: (col: string, opts: { ascending: boolean }) => {
                    limit: (n: number) => Promise<{ data: CardData[] | null; error: Error | null }>
                }
            }
        }
    })
        .from('cards')
        .select('*')
        .order('card_number', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching cards:', error);
        return [];
    }

    return data || [];
}

// Get price history for a card
export async function getPriceHistory(cardId: string, type: 'raw' | 'psa10' = 'raw') {
    const supabase = getSupabaseClient();
    const table = type === 'raw' ? 'market_prices_raw' : 'market_prices_psa10';

    const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
            select: (query: string) => {
                eq: (col: string, val: string) => {
                    order: (col: string, opts: { ascending: boolean }) => Promise<{ data: { recorded_at: string; price_avg: number }[] | null; error: Error | null }>
                }
            }
        }
    })
        .from(table)
        .select('recorded_at, price_avg')
        .eq('card_id', cardId)
        .order('recorded_at', { ascending: true });

    if (error) {
        console.error('Error fetching price history:', error);
        return [];
    }

    return data || [];
}
