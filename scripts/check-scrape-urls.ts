import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScrapeUrls() {
    console.log('Checking scrape URLs in database...\n');

    const { data, error } = await supabase
        .from('assets')
        .select('file_id, name_jp, scrape_url_raw, scrape_url_psa10')
        .not('scrape_url_raw', 'is', null)
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data?.length} cards with scrape URLs:\n`);
    for (const card of data || []) {
        console.log(`${card.file_id} (${card.name_jp})`);
        console.log(`  Raw: ${card.scrape_url_raw}`);
        console.log(`  PSA10: ${card.scrape_url_psa10 || 'N/A'}`);
        console.log('');
    }
}

checkScrapeUrls();
