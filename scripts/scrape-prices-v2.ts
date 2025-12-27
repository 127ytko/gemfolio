/**
 * GemFolio Price Scraper v2
 * ============================================
 * 3つのサイト(raftel, mercard, cardrush)から価格を取得
 * サーバー負荷軽減・検出回避のための配慮:
 * - ランダムな待機時間 (5-15秒)
 * - ランダムなUser-Agent
 * - リクエスト間隔を人間的に
 * - エラー時は長めのバックオフ
 * 
 * Usage: npx ts-node scripts/scrape-prices-v2.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Log file
const LOG_FILE = 'scrape-results.txt';

function log(message: string) {
    const timestamp = new Date().toLocaleString('ja-JP');
    const line = `[${timestamp}] ${message}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
}

// ============================================
// User-Agents (実際のブラウザを模倣)
// ============================================
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ============================================
// Sleep with random variation (人間的なタイミング)
// ============================================
function sleep(minMs: number, maxMs: number): Promise<void> {
    const ms = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Fetch with stealth settings
// ============================================
async function stealthFetch(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            },
        });

        if (!response.ok) {
            log(`  HTTP Error: ${response.status}`);
            return null;
        }

        return await response.text();
    } catch (error: any) {
        log(`  Fetch Error: ${error.message}`);
        return null;
    }
}

// ============================================
// Price Extractors (サイトごとに異なる)
// ============================================

// Raftel: tcg-raftel.com
function extractPriceRaftel(html: string): number | null {
    // パターン: 販売価格 XX,XXX円 など
    const patterns = [
        /販売価格\s*[:：]?\s*([0-9,]+)\s*円/i,
        /price[^>]*>[\s\S]*?([0-9,]+)\s*円/i,
        /([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\s*円\s*[\(（]税込/i,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const price = parseInt(match[1].replace(/,/g, ''), 10);
            if (price >= 100 && price <= 10000000) {
                return price;
            }
        }
    }
    return null;
}

// MerCard: mercardop.jp
function extractPriceMercard(html: string): number | null {
    const patterns = [
        /([0-9,]+)\s*円\s*[\(（]税込/i,
        /販売価格\s*[:：]?\s*([0-9,]+)\s*円/i,
        /class="[^"]*price[^"]*"[^>]*>[\s\S]*?([0-9,]+)/i,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const price = parseInt(match[1].replace(/,/g, ''), 10);
            if (price >= 100 && price <= 10000000) {
                return price;
            }
        }
    }
    return null;
}

// Card Rush: cardrush-op.jp
function extractPriceCardrush(html: string): number | null {
    const patterns = [
        /販売価格\s*[:：]?\s*([0-9,]+)\s*円/i,
        /([0-9,]+)\s*円\s*[\(（]税込[\)）]/i,
        /item[_-]?price[^>]*>[\s\S]*?([0-9,]+)/i,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const price = parseInt(match[1].replace(/,/g, ''), 10);
            if (price >= 100 && price <= 10000000) {
                return price;
            }
        }
    }
    return null;
}

// URLからサイトを判別して適切な抽出関数を選択
function extractPrice(html: string, url: string): number | null {
    if (url.includes('raftel')) {
        return extractPriceRaftel(html);
    } else if (url.includes('mercard')) {
        return extractPriceMercard(html);
    } else if (url.includes('cardrush')) {
        return extractPriceCardrush(html);
    }
    // フォールバック: すべてのパターンを試す
    return extractPriceRaftel(html) || extractPriceMercard(html) || extractPriceCardrush(html);
}

// ============================================
// Main Scraper
// ============================================

interface CardRow {
    card_id: string;
    card_number: string;
    name_ja: string | null;
    name_en: string | null;
    scrape_url_raw_1: string | null;
    scrape_url_raw_2: string | null;
    scrape_url_raw_3: string | null;
    scrape_url_psa10_1: string | null;
    scrape_url_psa10_2: string | null;
    scrape_url_psa10_3: string | null;
}

async function scrapeAllPrices() {
    // Clear log file
    fs.writeFileSync(LOG_FILE, `=== GemFolio Price Scraper ===\n`);
    fs.appendFileSync(LOG_FILE, `Started: ${new Date().toISOString()}\n\n`);

    log('🚀 Starting price scraper with stealth mode...');
    log('⏱️  Using random delays (5-15 sec) between requests\n');

    // Get all cards with scrape URLs
    const { data: cards, error } = await supabase
        .from('cards')
        .select(`
            card_id, card_number, name_ja, name_en,
            scrape_url_raw_1, scrape_url_raw_2, scrape_url_raw_3,
            scrape_url_psa10_1, scrape_url_psa10_2, scrape_url_psa10_3
        `)
        .order('card_id');

    if (error) {
        log(`❌ Database error: ${error.message}`);
        return;
    }

    // Filter cards with at least one scrape URL
    const cardsWithUrls = cards?.filter((c: CardRow) =>
        c.scrape_url_raw_1 || c.scrape_url_raw_2 || c.scrape_url_raw_3 ||
        c.scrape_url_psa10_1 || c.scrape_url_psa10_2 || c.scrape_url_psa10_3
    ) || [];

    log(`📦 Found ${cardsWithUrls.length} cards with scrape URLs\n`);

    let totalSuccess = 0;
    let totalFail = 0;

    for (let i = 0; i < cardsWithUrls.length; i++) {
        const card = cardsWithUrls[i] as CardRow;
        const cardName = card.name_en || card.name_ja || card.card_number;

        log(`\n[${i + 1}/${cardsWithUrls.length}] ${card.card_id} - ${cardName}`);

        const prices = {
            raw: [] as number[],
            psa10: [] as number[],
        };

        // Scrape Raw prices (up to 3 sources)
        const rawUrls = [card.scrape_url_raw_1, card.scrape_url_raw_2, card.scrape_url_raw_3].filter(Boolean);
        for (const url of rawUrls) {
            if (!url) continue;

            // Random delay before each request (5-15 seconds)
            await sleep(5000, 15000);

            log(`  📡 Fetching Raw: ${url.substring(0, 50)}...`);
            const html = await stealthFetch(url);

            if (html) {
                const price = extractPrice(html, url);
                if (price) {
                    prices.raw.push(price);
                    log(`    ✅ Price: ¥${price.toLocaleString()}`);
                } else {
                    log(`    ⚠️ Price not found in HTML`);
                }
            }
        }

        // Scrape PSA10 prices (up to 3 sources)
        const psa10Urls = [card.scrape_url_psa10_1, card.scrape_url_psa10_2, card.scrape_url_psa10_3].filter(Boolean);
        for (const url of psa10Urls) {
            if (!url) continue;

            // Random delay before each request
            await sleep(5000, 15000);

            log(`  📡 Fetching PSA10: ${url.substring(0, 50)}...`);
            const html = await stealthFetch(url);

            if (html) {
                const price = extractPrice(html, url);
                if (price) {
                    prices.psa10.push(price);
                    log(`    ✅ Price: ¥${price.toLocaleString()}`);
                } else {
                    log(`    ⚠️ Price not found in HTML`);
                }
            }
        }

        // Calculate averages and update DB
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (prices.raw.length > 0) {
            updateData.price_raw_avg = Math.round(prices.raw.reduce((a, b) => a + b, 0) / prices.raw.length);
            updateData.price_raw_low = Math.min(...prices.raw);
            updateData.price_raw_high = Math.max(...prices.raw);
            // Individual prices
            if (prices.raw[0]) updateData.price_raw_1 = prices.raw[0];
            if (prices.raw[1]) updateData.price_raw_2 = prices.raw[1];
            if (prices.raw[2]) updateData.price_raw_3 = prices.raw[2];
        }

        if (prices.psa10.length > 0) {
            updateData.price_psa10_avg = Math.round(prices.psa10.reduce((a, b) => a + b, 0) / prices.psa10.length);
            updateData.price_psa10_low = Math.min(...prices.psa10);
            updateData.price_psa10_high = Math.max(...prices.psa10);
            // Individual prices
            if (prices.psa10[0]) updateData.price_psa10_1 = prices.psa10[0];
            if (prices.psa10[1]) updateData.price_psa10_2 = prices.psa10[1];
            if (prices.psa10[2]) updateData.price_psa10_3 = prices.psa10[2];
        }

        // Only update if we got prices
        if (prices.raw.length > 0 || prices.psa10.length > 0) {
            const { error: updateError } = await supabase
                .from('cards')
                .update(updateData)
                .eq('card_id', card.card_id);

            if (updateError) {
                log(`  ❌ DB Update failed: ${updateError.message}`);
                totalFail++;
            } else {
                log(`  💾 Saved: Raw avg ¥${updateData.price_raw_avg?.toLocaleString() || '-'}, PSA10 avg ¥${updateData.price_psa10_avg?.toLocaleString() || '-'}`);
                totalSuccess++;
            }
        } else {
            log(`  ⏭️ No prices found, skipping DB update`);
            totalFail++;
        }

        // Extra delay between cards (adds natural variation)
        await sleep(3000, 8000);
    }

    log('\n========================================');
    log(`✅ Successfully updated: ${totalSuccess} cards`);
    log(`❌ Failed/Skipped: ${totalFail} cards`);
    log('========================================');
    log(`\n📄 Log saved to: ${LOG_FILE}`);
}

// Run
scrapeAllPrices().catch(err => {
    log(`\n💥 FATAL ERROR: ${err.message}`);
    console.error(err);
});
