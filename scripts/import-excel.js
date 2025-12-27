const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Load environment variables directly from file
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env.local:', e.message);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
    process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Custom UUID generator
function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const EXCEL_PATH = path.join(__dirname, '../data/cardmaster-251225 - onepiece.xlsx');

async function importExcel() {
    console.log('🚀 Starting Excel Import (JS)...');
    console.log('⚠️  This script uses UPSERT - existing price history and portfolios are PRESERVED');

    // NOTE: We no longer delete existing data to preserve:
    // - User portfolios
    // - Price history (market_prices_raw, market_prices_psa10)
    // - Favorites
    // - Scraping results

    // 2. Read Excel
    console.log(`Reading Excel: ${EXCEL_PATH}`);
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} rows`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        try {
            // Mapping Logic from Excel columns to DB columns
            // Assuming Excel has columns like 'card_id', 'card_number', 'name_ja', etc.
            // Based on earlier check-excel.js output if available, or just generic mapping

            const cardData = {
                card_id: row.card_id || generateUuid(),
                card_number: row.card_number || row['Card Number'] || row['card_no'] || 'UNKNOWN',
                slug: row.slug || `${row.card_number}-${row.name_en || 'card'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),

                name_ja: row.name_ja || row['name_ja'] || null,
                name_en: row.name_en || row['name_en'] || null,

                set_name_ja: row.set_name_ja || row['set_name_ja'] || null,
                set_name_en: row.set_name_en || row['set_name_en'] || null,

                rarity_ja: row.rarity_ja || row['rarity_ja'] || null,
                rarity_en: row.rarity_en || row['rarity_en'] || null,

                // Scraping URLs
                scrape_url_raw_1: row['scrape_url_raw_1 raftel'] || row['scrape_url_raw_1'] || null,
                scrape_url_raw_2: row['scrape_url_raw_2 mercard'] || row['scrape_url_raw_2'] || null,
                scrape_url_raw_3: row['scrape_url_raw_3 cardrush'] || row['scrape_url_raw_3'] || null,

                scrape_url_psa10_1: row['scrape_url_psa10_1 raftel'] || row['scrape_url_psa10_1'] || null,
                scrape_url_psa10_2: row['scrape_url_psa10_2 mercard'] || row['scrape_url_psa10_2'] || null,
                scrape_url_psa10_3: row['scrape_url_psa10_3 cardrush'] || row['scrape_url_psa10_3'] || null,
            };

            if (cardData.card_number === 'UNKNOWN') {
                // Try to find any column that looks like card number
                // console.log('Row dump:', row); 
                continue;
            }

            const { error } = await supabase
                .from('cards')
                .upsert(cardData, { onConflict: 'card_id' });

            if (error) {
                // console.error(`Error inserting:`, error.message);
                errorCount++;
            } else {
                process.stdout.write('.');
                successCount++;
            }
        } catch (err) {
            errorCount++;
        }
    }

    console.log(`\n\nImport complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

importExcel();
