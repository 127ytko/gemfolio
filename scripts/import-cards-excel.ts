/**
 * GemFolio Card Import from Excel
 * ================================
 * Excelファイル(.xlsx)からカードデータをインポート
 * 文字化け問題を解消
 * 
 * Usage: npx ts-node scripts/import-cards-excel.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Paths
const EXCEL_PATH = path.join(__dirname, '../data/cardmaster-251225 - onepiece.xlsx');
const IMAGES_DIR = path.join(__dirname, '../data/images');
const STORAGE_BUCKET = 'card-images';

console.log(`📊 Excel File: ${EXCEL_PATH}`);
console.log(`🖼️  Images Folder: ${IMAGES_DIR}\n`);

interface CardRow {
    card_id: string;
    card_number: string;
    slug: string;
    name_ja: string;
    name_en: string;
    set_name_ja: string;
    set_name_en: string;
    rarity_ja: string;
    rarity_en: string;
    'scrape_url_raw_1 raftel'?: string;
    'scrape_url_raw_2 mercard'?: string;
    'scrape_url_raw_3 cardrush'?: string;
    'scrape_url_psa10_1 raftel'?: string;
    'scrape_url_psa10_2 mercard'?: string;
    'scrape_url_psa10_3 cardrush'?: string;
}

async function ensureBucketExists() {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
        console.log(`Creating bucket: ${STORAGE_BUCKET}`);
        await supabase.storage.createBucket(STORAGE_BUCKET, {
            public: true,
            fileSizeLimit: 5242880,
        });
    }
}

async function uploadImage(cardId: string): Promise<string | null> {
    // Find image file
    if (!fs.existsSync(IMAGES_DIR)) return null;

    const files = fs.readdirSync(IMAGES_DIR);
    const matchingFile = files.find(f => f.startsWith(cardId));

    if (!matchingFile) return null;

    const imagePath = path.join(IMAGES_DIR, matchingFile);

    try {
        const fileBuffer = fs.readFileSync(imagePath);
        const ext = path.extname(matchingFile);
        const fileName = `${cardId}${ext}`;

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, fileBuffer, {
                contentType: `image/${ext.replace('.', '')}`,
                upsert: true,
            });

        if (error) {
            console.log(`  ⚠️ Upload failed: ${error.message}`);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        console.log(`  ✅ Image uploaded: ${fileName}`);
        return urlData.publicUrl;
    } catch (err) {
        return null;
    }
}

async function importFromExcel() {
    console.log('🚀 Starting Excel import...\n');

    // Check file exists
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error(`Excel file not found: ${EXCEL_PATH}`);
        process.exit(1);
    }

    // Ensure bucket exists
    await ensureBucketExists();

    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const records: CardRow[] = XLSX.utils.sheet_to_json(sheet);

    console.log(`📊 Found ${records.length} cards in Excel\n`);

    // NOTE: We no longer delete existing data to preserve price history and portfolios
    // Cards will be upserted (updated if exists, inserted if new)

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const cardName = row.name_en || row.name_ja || row.card_number;

        console.log(`[${i + 1}/${records.length}] ${row.card_id} - ${cardName}`);

        // Upload image
        const imageUrl = await uploadImage(row.card_id);

        // Prepare card data with column mapping
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
            image_url: imageUrl,
            scrape_url_raw_1: row['scrape_url_raw_1 raftel'] || null,
            scrape_url_raw_2: row['scrape_url_raw_2 mercard'] || null,
            scrape_url_raw_3: row['scrape_url_raw_3 cardrush'] || null,
            scrape_url_psa10_1: row['scrape_url_psa10_1 raftel'] || null,
            scrape_url_psa10_2: row['scrape_url_psa10_2 mercard'] || null,
            scrape_url_psa10_3: row['scrape_url_psa10_3 cardrush'] || null,
        };

        // Insert to database
        const { error } = await supabase
            .from('cards')
            .upsert(cardData, { onConflict: 'card_id' });

        if (error) {
            console.log(`  ❌ DB Error: ${error.message}`);
            errorCount++;
        } else {
            console.log(`  ✅ Saved: ${row.name_ja || row.name_en}`);
            successCount++;
        }
    }

    console.log('\n========================================');
    console.log(`✅ Success: ${successCount} cards`);
    console.log(`❌ Errors: ${errorCount} cards`);
    console.log('========================================');
}

// Run
importFromExcel().catch(console.error);
