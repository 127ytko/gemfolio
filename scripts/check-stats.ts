import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStats() {
    // Total cards
    const { count: totalCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null);

    // Cards with scrape URL
    const { count: withUrlCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .not('scrape_url_raw', 'is', null);

    // Cards with price
    const { count: withPriceCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .not('price_raw', 'is', null);

    console.log('=== Database Stats ===');
    console.log(`Total master cards: ${totalCount}`);
    console.log(`Cards with scrape URL: ${withUrlCount}`);
    console.log(`Cards with price data: ${withPriceCount}`);
}

checkStats();
