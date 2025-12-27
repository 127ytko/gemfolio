import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPrices() {
    console.log('Current prices in database:\n');

    const { data, error } = await supabase
        .from('assets')
        .select('file_id, name_jp, price_raw, price_psa10, updated_at')
        .is('user_id', null)
        .not('price_raw', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(15);

    if (error) {
        console.error('Error:', error);
        return;
    }

    for (const card of data || []) {
        console.log(`${card.file_id} (${card.name_jp})`);
        console.log(`  Raw: ¥${card.price_raw?.toLocaleString() || 'N/A'}`);
        console.log(`  PSA10: ¥${card.price_psa10?.toLocaleString() || 'N/A'}`);
        console.log(`  Updated: ${card.updated_at}`);
        console.log('');
    }
}

checkPrices();
