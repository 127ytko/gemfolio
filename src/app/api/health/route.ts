import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET() {
    try {
        // Check environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                success: false,
                error: 'Missing environment variables',
                details: {
                    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '✅ Set' : '❌ Missing',
                }
            }, { status: 500 });
        }

        // Test Supabase connection
        const supabase = await getSupabaseServer();

        // Try a simple query (this will fail if connection is bad)
        const { data, error } = await supabase
            .from('cards')
            .select('card_id')
            .limit(1);

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Supabase query failed',
                details: {
                    NEXT_PUBLIC_SUPABASE_URL: '✅ Set',
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: '✅ Set',
                    connection: '❌ Failed',
                    message: error.message,
                }
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Supabase connection successful!',
            details: {
                NEXT_PUBLIC_SUPABASE_URL: '✅ Set',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: '✅ Set',
                connection: '✅ Connected',
                cardsTableExists: data !== null ? '✅ Yes' : '⚠️ Empty or not accessible',
                recordCount: data?.length ?? 0,
            }
        });

    } catch (err) {
        return NextResponse.json({
            success: false,
            error: 'Unexpected error',
            message: err instanceof Error ? err.message : 'Unknown error',
        }, { status: 500 });
    }
}
