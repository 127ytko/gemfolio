import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as dotenv from 'dotenv';
// import { v4 as uuidv4 } from 'uuid'; // v4が使えない場合は自前の関数で

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Custom UUID generator just in case
function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const EXCEL_PATH = path.join(__dirname, '../data/cardmaster-251225 - onepiece.xlsx');

async function importExcel() {
    console.log('🚀 Starting Excel Import...');

    // 1. Clear existing data
    console.log('Cleaning up existing data...');
    await supabase.from('portfolios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('market_prices_raw').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('market_prices_psa10').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cards').delete().neq('card_id', '00000000-0000-0000-0000-000000000000');

    // 2. Read Excel
    console.log(`Reading Excel: ${EXCEL_PATH}`);
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} rows`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows as any[]) {
        try {
            // Excelのカラム名に合わせてマッピング調整
            // 例: row['Card Number'] や row['Name'] など。
            // 実際のカラム名に合わせて調整が必要。
            // ここでは推測される一般的なキーを使用し、値がない場合はrow全体をダンプして確認しながら調整を推奨するが、
            // 今回は一発で通すために柔軟にマッピングする。

            const cardData = {
                card_id: row.card_id || generateUuid(), // IDがあれば使う、なければ生成
                card_number: row.card_number || row['Card Number'] || row['品番'] || 'UNKNOWN',
                slug: row.slug || `${row.card_number}-${row.name_en || 'card'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),

                name_ja: row.name_ja || row['Name JA'] || row['商品名'] || null,
                name_en: row.name_en || row['Name EN'] || row['English Name'] || null,

                set_name_ja: row.set_name_ja || row['Set JA'] || row['収録'] || null,
                set_name_en: row.set_name_en || row['Set EN'] || null,

                rarity_ja: row.rarity_ja || row['Rarity JA'] || row['レアリティ'] || null,
                rarity_en: row.rarity_en || row['Rarity EN'] || null,

                image_url: row.image_url || null,

                // Scraping URLs (マッピングは先ほどのログを参考に調整するが、一旦汎用的に)
                scrape_url_raw_1: row['scrape_url_raw_1 raftel'] || row['scrape_url_raw_1'] || null,
                scrape_url_raw_2: row['scrape_url_raw_2 mercard'] || row['scrape_url_raw_2'] || null,
                scrape_url_raw_3: row['scrape_url_raw_3 cardrush'] || row['scrape_url_raw_3'] || null,

                scrape_url_psa10_1: row['scrape_url_psa10_1 raftel'] || row['scrape_url_psa10_1'] || null,
                scrape_url_psa10_2: row['scrape_url_psa10_2 mercard'] || row['scrape_url_psa10_2'] || null,
                scrape_url_psa10_3: row['scrape_url_psa10_3 cardrush'] || row['scrape_url_psa10_3'] || null,
            };

            // 必須フィールドのチェック
            if (!cardData.card_number || cardData.card_number === 'UNKNOWN') {
                console.warn('Skipping row with missing card number:', row);
                continue;
            }

            const { error } = await supabase
                .from('cards')
                .upsert(cardData, { onConflict: 'card_id' }); // もしくは card_number/slugで重複チェック

            if (error) {
                console.error(`Error inserting ${cardData.card_number}:`, error.message);
                errorCount++;
            } else {
                process.stdout.write('.');
                successCount++;
            }

        } catch (err) {
            console.error('Error processing row:', err);
            errorCount++;
        }
    }

    console.log(`\n\nImport complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

importExcel().catch(console.error);
