const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');

dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testImport() {
    console.log('=== Test Import Script ===');

    // Read CSV
    const csvPath = 'data/cardmaster-251225 - onepiece.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = csv.parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Found ${records.length} records in CSV`);
    console.log('First record columns:', Object.keys(records[0]));
    console.log('First record:', JSON.stringify(records[0], null, 2));

    // Try to insert first record
    const row = records[0];

    const cardData = {
        card_id: row.card_id,
        card_number: row.card_number,
        slug: row.slug,
        name_ja: row.name_ja || null,
        name_en: row.name_en || null,
        set_name_ja: row.set_name_ja || null,
        set_name_en: row.set_name_en || null,
        rarity_ja: row.rarity_ja || null,
        rarity_en: row.rarity_en || null,
        image_url: null,
        scrape_url_raw_1: row.scrape_url_raw_1 || null,
        scrape_url_raw_2: row.scrape_url_raw_2 || null,
        scrape_url_raw_3: row.scrape_url_raw_3 || null,
        scrape_url_psa10_1: row.scrape_url_psa10_1 || null,
        scrape_url_psa10_2: row.scrape_url_psa10_2 || null,
        scrape_url_psa10_3: row.scrape_url_psa10_3 || null,
    };

    console.log('\nCard data to insert:', JSON.stringify(cardData, null, 2));

    const { data, error } = await supabase
        .from('cards')
        .upsert(cardData, { onConflict: 'card_id' });

    if (error) {
        console.log('\nDB Error:', error);
    } else {
        console.log('\nInsert successful!', data);
    }

    // Check count
    const { count } = await supabase.from('cards').select('*', { count: 'exact', head: true });
    console.log('\nTotal cards in DB:', count);
}

testImport().catch(console.error);
