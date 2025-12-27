/**
 * GemFolio Card Import Script
 * 
 * 機能:
 * 1. CSVからカードデータを読み込み
 * 2. 画像フォルダから画像をSupabase Storageにアップロード
 * 3. image_url を生成してカードデータをDBに登録
 * 
 * 使用方法:
 * npx ts-node scripts/import-cards.ts [CSVファイルパス] [画像フォルダパス]
 * 
 * 例:
 * npx ts-node scripts/import-cards.ts data/my_cards.csv data/images
 * npx ts-node scripts/import-cards.ts data/opcg_2024.csv
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get paths from command line arguments or use defaults
const args = process.argv.slice(2);
const CSV_PATH = args[0] ? path.resolve(args[0]) : path.join(__dirname, '../data/cards.csv');
const IMAGES_DIR = args[1] ? path.resolve(args[1]) : path.join(__dirname, '../data/images');
const STORAGE_BUCKET = 'card-images';

console.log(`📄 CSV File: ${CSV_PATH}`);
console.log(`🖼️  Images Folder: ${IMAGES_DIR}\n`);

interface CardCSVRow {
    card_id: string;
    card_number: string;
    slug: string;
    name_ja: string;
    name_en: string;
    set_name_ja: string;
    set_name_en: string;
    rarity_ja: string;
    rarity_en: string;
    // CSV列名は店名付き（例: "scrape_url_raw_1 raftel"）
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
            fileSizeLimit: 5242880, // 5MB
        });
    }
}

async function findImageFile(cardId: string, cardName: string): Promise<string | null> {
    if (!fs.existsSync(IMAGES_DIR)) {
        console.warn(`Images directory not found: ${IMAGES_DIR}`);
        return null;
    }

    const files = fs.readdirSync(IMAGES_DIR);

    // Try to find image by card_id prefix
    const matchingFile = files.find(file =>
        file.startsWith(cardId) ||
        file.toLowerCase().includes(cardId.toLowerCase())
    );

    if (matchingFile) {
        return path.join(IMAGES_DIR, matchingFile);
    }

    // Try to find by card name
    const nameMatch = files.find(file =>
        file.toLowerCase().includes(cardName.toLowerCase().replace(/\s+/g, '_'))
    );

    return nameMatch ? path.join(IMAGES_DIR, nameMatch) : null;
}

async function uploadImage(cardId: string, imagePath: string): Promise<string | null> {
    try {
        const fileBuffer = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath);
        const fileName = `${cardId}${ext}`;

        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, fileBuffer, {
                contentType: `image/${ext.replace('.', '')}`,
                upsert: true,
            });

        if (error) {
            console.error(`Failed to upload ${fileName}:`, error.message);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        console.log(`✅ Uploaded: ${fileName}`);
        return urlData.publicUrl;
    } catch (err) {
        console.error(`Error uploading image:`, err);
        return null;
    }
}

async function importCards() {
    console.log('🚀 Starting card import...\n');

    // Check CSV exists
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV file not found: ${CSV_PATH}`);
        console.log('Please create data/cards.csv with your card data.');
        process.exit(1);
    }

    // Ensure storage bucket exists
    await ensureBucketExists();

    // Read and parse CSV
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records: CardCSVRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`📄 Found ${records.length} cards in CSV\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of records) {
        try {
            console.log(`Processing: ${row.card_number} - ${row.name_en || row.name_ja}`);

            // Find and upload image
            let imageUrl: string | null = null;
            const imagePath = await findImageFile(row.card_id, row.name_en || row.name_ja);

            if (imagePath) {
                imageUrl = await uploadImage(row.card_id, imagePath);
            } else {
                console.log(`  ⚠️ No image found for ${row.card_id}`);
            }

            // Prepare card data (CSV列名 → DB列名にマッピング)
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

            // Upsert to database
            const { error } = await supabase
                .from('cards')
                .upsert(cardData, { onConflict: 'card_id' });

            if (error) {
                console.error(`  ❌ DB Error: ${error.message}`);
                errorCount++;
            } else {
                console.log(`  ✅ Saved to database`);
                successCount++;
            }

        } catch (err) {
            console.error(`Error processing ${row.card_number}:`, err);
            errorCount++;
        }
    }

    console.log('\n========================================');
    console.log(`✅ Success: ${successCount} cards`);
    console.log(`❌ Errors: ${errorCount} cards`);
    console.log('========================================');
}

// Run
importCards().catch(console.error);
