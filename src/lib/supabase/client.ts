import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Get Supabase client for browser/client-side usage
 * Uses singleton pattern to reuse the same client instance
 */
export function getSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
    }

    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

    return supabaseClient;
}

/**
 * Alias for getSupabaseClient - for convenience
 */
export const supabase = () => getSupabaseClient();
