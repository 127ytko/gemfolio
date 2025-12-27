/**
 * Daily Price Collection Script
 * ============================================
 * 毎日実行して価格履歴を蓄積するためのスクリプト
 * 
 * 機能:
 * - カードラッシュから最新価格をスクレイピング
 * - assets テーブルの現在価格を更新
 * - market_price_history テーブルに履歴を追加
 * 
 * 使用方法:
 *   npx tsx scripts/collect-daily-prices.ts
 * 
 * 推奨: 毎日 AM 6:00 JST に Cron 実行
 *   - Vercel Cron: vercel.json で設定
 *   - GitHub Actions: .github/workflows/daily-price.yml で設定
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// ============================================
// Configuration
// ============================================
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CONFIG = {
    LOG_FILE: 'collect-prices-log.txt',
    RATE_LIMIT_MS: 2000,        // 2 seconds between requests
    MAX_RETRIES: 3,              // Retry count for failed requests
    BATCH_SIZE: 50,              // Process in batches
};

// ============================================
// Logger
// ============================================
function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

// ============================================
// Helper Functions
// ============================================

async function fetchWithRetry(url: string, retries = CONFIG.MAX_RETRIES): Promise<string> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ja,en;q=0.5',
                    'Referer': 'https://www.google.com/',
                },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(CONFIG.RATE_LIMIT_MS * (i + 1));
        }
    }
    throw new Error('Max retries reached');
}

function extractPrice(html: string): number | null {
    const patterns = [
        /販売価格[:：]\s*([\d,]+)円/,
        /([\d,]{3,})円\s*\(税込\)/,
        /([\d,]{3,})円/,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const price = parseInt(match[1].replace(/,/g, ''), 10);
            if (price > 50) { // Sanity check
                return price;
            }
        }
    }
    return null;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Price Data Types
// ============================================
interface CardData {
    id: string;
    file_id: string;
    name_jp: string;
    scrape_url_raw: string | null;
    scrape_url_psa10: string | null;
}

interface PriceResult {
    file_id: string;
    price_raw: number | null;
    price_psa10: number | null;
    success: boolean;
}

// ============================================
// Main Collection Function
// ============================================

async function scrapeCardPrice(card: CardData): Promise<PriceResult> {
    let priceRaw: number | null = null;
    let pricePsa10: number | null = null;

    // Scrape raw price
    if (card.scrape_url_raw) {
        try {
            const html = await fetchWithRetry(card.scrape_url_raw);
            priceRaw = extractPrice(html);
        } catch (err) {
            log(`  [${card.file_id}] Raw scrape failed`);
        }
    }

    // Scrape PSA10 price (if available)
    if (card.scrape_url_psa10) {
        try {
            await sleep(CONFIG.RATE_LIMIT_MS);
            const html = await fetchWithRetry(card.scrape_url_psa10);
            pricePsa10 = extractPrice(html);
        } catch (err) {
            log(`  [${card.file_id}] PSA10 scrape failed`);
        }
    }

    return {
        file_id: card.file_id,
        price_raw: priceRaw,
        price_psa10: pricePsa10,
        success: priceRaw !== null || pricePsa10 !== null,
    };
}

async function updateAssetPrice(cardId: string, priceRaw: number | null, pricePsa10: number | null) {
    const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
    };
    if (priceRaw !== null) updateData.price_raw = priceRaw;
    if (pricePsa10 !== null) updateData.price_psa10 = pricePsa10;

    const { error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('file_id', cardId)
        .is('user_id', null);

    if (error) {
        log(`  DB Update Error for ${cardId}: ${error.message}`);
    }
}

async function insertPriceHistory(fileId: string, priceRaw: number | null, pricePsa10: number | null) {
    const { error } = await supabase
        .from('market_price_history')
        .insert({
            asset_id: fileId,
            price_raw: priceRaw,
            price_psa10: pricePsa10,
            recorded_at: new Date().toISOString(),
        });

    if (error) {
        log(`  History Insert Error for ${fileId}: ${error.message}`);
    }
}

// ============================================
// Main Entry Point
// ============================================

async function collectDailyPrices() {
    // Initialize log file
    fs.writeFileSync(CONFIG.LOG_FILE, `=== Daily Price Collection - ${new Date().toISOString()} ===\n\n`);

    log('Starting daily price collection...');
    log('');

    // Get all cards with scrape URLs (master data only)
    const { data: cards, error } = await supabase
        .from('assets')
        .select('id, file_id, name_jp, scrape_url_raw, scrape_url_psa10')
        .is('user_id', null)
        .not('scrape_url_raw', 'is', null);

    if (error) {
        log(`ERROR: Failed to fetch cards: ${error.message}`);
        process.exit(1);
    }

    if (!cards || cards.length === 0) {
        log('No cards found with scrape URLs.');
        process.exit(0);
    }

    log(`Found ${cards.length} cards to process`);
    log('');

    // Statistics
    let successCount = 0;
    let failCount = 0;
    let historyInsertCount = 0;

    // Process each card
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as unknown as CardData;
        const progress = `[${i + 1}/${cards.length}]`;

        // Scrape prices
        const result = await scrapeCardPrice(card);

        if (result.success) {
            // Update current price in assets table
            await updateAssetPrice(card.file_id, result.price_raw, result.price_psa10);

            // Insert into price history
            await insertPriceHistory(card.file_id, result.price_raw, result.price_psa10);

            const priceInfo = [];
            if (result.price_raw) priceInfo.push(`Raw: ¥${result.price_raw.toLocaleString()}`);
            if (result.price_psa10) priceInfo.push(`PSA10: ¥${result.price_psa10.toLocaleString()}`);

            log(`${progress} ${card.file_id}: ${priceInfo.join(', ')}`);
            successCount++;
            historyInsertCount++;
        } else {
            log(`${progress} ${card.file_id}: No price found`);
            failCount++;
        }

        // Rate limiting
        await sleep(CONFIG.RATE_LIMIT_MS);
    }

    // Summary
    log('');
    log('========================================');
    log('COLLECTION COMPLETE');
    log('========================================');
    log(`Total cards processed: ${cards.length}`);
    log(`Success: ${successCount}`);
    log(`Failed: ${failCount}`);
    log(`History records inserted: ${historyInsertCount}`);
    log('========================================');
    log(`Log saved to: ${CONFIG.LOG_FILE}`);

    // Return exit code for CI/CD
    if (failCount > cards.length * 0.5) {
        log('WARNING: More than 50% of cards failed. Check scrape URLs.');
        process.exit(1);
    }
}

// Run
collectDailyPrices().catch(err => {
    log(`FATAL ERROR: ${err.message}`);
    process.exit(1);
});
