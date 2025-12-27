
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';

// .envファイルを読み込む (2つのパスをチェック)
const envPath = fs.existsSync(path.join(__dirname, '../.env'))
    ? path.join(__dirname, '../.env')
    : path.join(__dirname, '../.env.txt');

dotenv.config({ path: envPath });

// ▼ 環境変数
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[ERROR] .env file not found, or SUPABASE_URL / SERVICE_ROLE_KEY is not set.');
    process.exit(1);
}

// クライアント作成
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

// 📂 フォルダ構成
const IMAGES_DIR = path.join(__dirname, '../assets/cards');
const CSV_DIR = path.join(__dirname, '../data/import');

// エラーログファイル
const ERROR_LOG_FILE = path.join(__dirname, '../error-log.txt');
// ログファイル初期化
fs.writeFileSync(ERROR_LOG_FILE, `=== Sync Error Log (${new Date().toISOString()}) ===\n`, 'utf8');

// エラーをファイルに書き込むヘルパー
const logError = (message: string) => {
    fs.appendFileSync(ERROR_LOG_FILE, message + '\n', 'utf8');
    console.error(message); // コンソールにも出力
};

// ============================================
// ヘルパー: ディレクトリ内を再帰的に走査して全ファイルパスを取得
// ============================================
const getFilesRecursively = (dir: string): string[] => {
    let results: string[] = [];
    try {
        if (!fs.existsSync(dir)) return [];
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(getFilesRecursively(file));
            } else {
                // 画像ファイルのみ対象
                if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                    results.push(file);
                }
            }
        });
    } catch (e) {
        console.error(`Error reading directory ${dir}:`, e);
    }
    return results;
};

// ============================================
// メイン処理
// ============================================
const syncAll = async () => {
    console.log('🚀 Starting All-in-One Sync (Smart Mode)...');
    console.log(`Using Supabase URL: ${supabaseUrl}`);

    // --- Step 1: 画像のアップロード (再帰探索) ---
    console.log(`\n📂 Searching images in: ${IMAGES_DIR}`);
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`[ERROR] Image folder not found: ${IMAGES_DIR}`);
        // 画像がなくてもCSV登録は続ける場合はreturnしないが、今回は続行とする
    }

    const allImageFiles = getFilesRecursively(IMAGES_DIR);
    console.log(`   Found ${allImageFiles.length} images.`);

    const uploadedImages: Record<string, string> = {};

    for (const filePath of allImageFiles) {
        const fileName = path.basename(filePath);
        const fileBuffer = fs.readFileSync(filePath);

        // Supabase Storageへアップロード
        const { data, error } = await supabase.storage
            .from('card-images') // バケット名は固定
            .upload(fileName, fileBuffer, {
                contentType: 'image/png', // 簡易的にpng指定（拡張子から判定も可）
                upsert: true,
            });

        if (error && !error.message.includes('already exists')) {
            console.error(`   ❌ Failed to upload ${fileName}:`, error.message);
        }

        // Always get public URL (even if file already existed)
        const { data: publicUrlData } = supabase.storage
            .from('card-images')
            .getPublicUrl(fileName);

        uploadedImages[fileName] = publicUrlData.publicUrl;
    }
    console.log(`   ✅ Image scan/upload process completed.`);

    // --- Step 2: CSVデータの登録 (複数ファイル対応) ---
    console.log(`\n📑 Searching CSVs in: ${CSV_DIR}`);
    if (!fs.existsSync(CSV_DIR)) {
        console.error(`[ERROR] CSV folder not found: ${CSV_DIR}`);
        return;
    }

    const csvFiles = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
    console.log(`   Found ${csvFiles.length} CSV files: ${csvFiles.join(', ')}`);

    for (const csvFile of csvFiles) {
        console.log(`\n   Processing ${csvFile}...`);

        // Detect game_type from filename
        let gameType = 'one_piece'; // default
        const lowerFileName = csvFile.toLowerCase();
        if (lowerFileName.includes('pokemon') || lowerFileName.includes('pkm')) {
            gameType = 'pokemon';
        } else if (lowerFileName.includes('onepiece') || lowerFileName.includes('one_piece') || lowerFileName.includes('op')) {
            gameType = 'one_piece';
        }
        console.log(`   -> Detected game_type: ${gameType}`);

        const results: any[] = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(path.join(CSV_DIR, csvFile))
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('error', (err) => reject(err))
                .on('end', () => resolve(true));
        });

        console.log(`   -> ${results.length} rows found. Syncing to DB...`);

        let successCount = 0;
        let failCount = 0;

        for (const row of results) {
            // カラムマッピング
            const fileId = row.file_id || row.id;

            if (!fileId) continue;

            // 画像URLの紐付け
            let imageUrl = null;
            // 正確なマッチまたは 前方一致（拡張子なしで検索）
            const uploadedFileName = Object.keys(uploadedImages).find(name => name === `${fileId}.png` || name === `${fileId}.jpg` || name.startsWith(fileId + '.'));
            if (uploadedFileName) {
                imageUrl = uploadedImages[uploadedFileName];
            } else {
                // 画像がアップロードリストにない場合でも、URLを構築して保存しておく（後で画像入れた時のため）
                imageUrl = `${supabaseUrl}/storage/v1/object/public/card-images/${fileId}.jpg`;
            }

            // データの整形
            const dbRecord = {
                file_id: fileId,
                card_number: row.card_number,
                name_jp: row.name_jp,
                name_en: row.name_en,
                set_name_jp: row.set_name_jp,
                set_name_en: row.set_name_en,
                rarity_jp: row.rarity_jp,
                rarity_en: row.rarity_en,
                game_type: row.game_type || gameType, // Use CSV value or detect from filename
                scrape_url_raw: row.scrape_url_raw || row.scrape_url || row.scrape_url_gm, // Support multiple column names
                scrape_url_psa10: row.scrape_url_psa10,
                image_url: imageUrl,
                updated_at: new Date().toISOString()
            } as Record<string, any>;

            // 古いカラム(price_gm等)があれば入れるなど柔軟に
            if (row.price_gm) dbRecord.price_raw = parseInt(row.price_gm.replace(/,/g, ''), 10) || 0;
            if (row.price_psa10) dbRecord.price_psa10 = parseInt(row.price_psa10.replace(/,/g, ''), 10) || 0;

            const { error } = await supabase
                .from('assets')
                .upsert(dbRecord, {
                    onConflict: 'file_id',
                    ignoreDuplicates: false
                });

            if (error) {
                logError(`[ERROR] Inserting ${fileId}:`);
                logError(`  Message: ${error.message}`);
                logError(`  Code: ${error.code}`);
                logError(`  Details: ${error.details}`);
                logError(`  Hint: ${error.hint}`);
                failCount++;
            } else {
                successCount++;
                if (successCount % 10 === 0) process.stdout.write('.');
            }
        }
        console.log(`\n   ✅ Finished ${csvFile}: Success=${successCount}, Failed=${failCount}`);
    }

    // --- Step 3: 価格取得トリガー ---
    console.log('\n🤖 Triggering price scraper...');
    // update-prices関数を呼び出す
    try {
        const { data, error } = await supabase.functions.invoke('update-prices', {
            body: {},
        });

        if (error) {
            console.error('   ❌ Scraper trigger failed:', error);
        } else {
            console.log('   ✅ Scraper triggered successfully!');
        }
    } catch (e) {
        console.error('   ⚠️ Could not invoke function (CLI might not be configured or network issue).', e);
    }

    console.log('\n🎉 All operations completed!');
};

syncAll().catch(err => console.error('Fatal Error:', err));
