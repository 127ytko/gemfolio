import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Demo card data matching actual Supabase schema
const demoCards = [
    {
        card_id: 'demo-001-luffy-manga',
        card_number: 'OP09-119',
        slug: 'op09-119-luffy-manga',
        name_ja: 'モンキー・D・ルフィ',
        name_en: 'Monkey D. Luffy',
        set_name_ja: '新時代の主役',
        set_name_en: 'Wings of the Captain',
        rarity_ja: 'マンガレア',
        rarity_en: 'Manga Rare',
        image_url: 'https://placehold.co/252x352/1e293b/fbbf24?text=OP09-119',
        price_avg: 180,
    },
    {
        card_id: 'demo-002-zoro-alt',
        card_number: 'OP08-118',
        slug: 'op08-118-zoro-alt',
        name_ja: 'ロロノア・ゾロ',
        name_en: 'Roronoa Zoro',
        set_name_ja: '二つの伝説',
        set_name_en: 'Two Legends',
        rarity_ja: 'パラレル',
        rarity_en: 'Alt Art',
        image_url: 'https://placehold.co/252x352/1e293b/22c55e?text=OP08-118',
        price_avg: 95,
    },
    {
        card_id: 'demo-003-shanks-sec',
        card_number: 'OP09-120',
        slug: 'op09-120-shanks-sec',
        name_ja: 'シャンクス',
        name_en: 'Shanks',
        set_name_ja: '新時代の主役',
        set_name_en: 'Wings of the Captain',
        rarity_ja: 'シークレット',
        rarity_en: 'SEC',
        image_url: 'https://placehold.co/252x352/1e293b/ef4444?text=OP09-120',
        price_avg: 140,
    },
];

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert demo cards (upsert on slug)
        const { data, error } = await supabase
            .from('cards')
            .upsert(demoCards, {
                onConflict: 'slug',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
                hint: error.hint,
                code: error.code,
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Inserted ${data?.length ?? 0} demo cards`,
            data: data,
        });

    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Send a POST request to this endpoint to seed demo data',
        cards: demoCards.map(c => ({ name: c.name_en, card_number: c.card_number })),
    });
}
