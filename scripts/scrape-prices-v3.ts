/**
 * GemFolio Price Scraper v3 - Cheerio Edition
 * ============================================
 * 静的HTMLサイト向けの高速スクレイパー
 * fetch + Cheerio で軽量・高速に価格取得
 * 
 * 対象サイト:
 * - tcg-raftel.com
 * - mercardop.jp  
 * - cardrush-op.jp
 * 
 * Usage: npx ts-node scripts/scrape-prices-v3.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const LOG_FILE = 'scrape-results-v3.txt';

function log(message: string) {
    const timestamp = new Date().toLocaleString('ja-JP');
    const line = `[${timestamp}] ${message}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
}

// ============================================
// User-Agents
// ============================================
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Sleep with random variation (2-5秒)
function sleep(minMs: number = 2000, maxMs: number = 5000): Promise<void> {
    const ms = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Fetch HTML
// ============================================
async function fetchHtml(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            log(`    HTTP ${response.status}`);
            return null;
        }

        return await response.text();
    } catch (error: any) {
        log(`    Error: ${error.message}`);
        return null;
    }
}

// ============================================
// Price Extractors using Cheerio
// ============================================

function extractPriceRaftel(html: string): number | null {
    const $ = cheerio.load(html);
    
    // Raftelのセレクタパターン
    const selectors = [
        '.item_detail_box .item_price', // 商品詳細の価格
        '.product-price',
        '.price',
        '[class*="price"]',
    ];
    
    for (const selector of selectors) {
        const text = $(selector).first().text();
        const price = parsePriceText(text);
        if (price) return price;
    }
    
    // フォールバック: HTML全体から価格パターンを検索
    const bodyText = $('body').text();
    return parsePriceFromText(bodyText);
}

function extractPriceMercard(html: string): number | null {
    const $ = cheerio.load(html);
    
    // Mercardのセレクタパターン
    const selectors = [
        '.product-detail-price',
        '.product_price',
        '.item-price',
        '[class*="price"]',
        '.detail-price',
    ];
    
    for (const selector of selectors) {
        const text = $(selector).first().text();
        const price = parsePriceText(text);
        if (price) return price;
    }
    
    const bodyText = $('body').text();
    return parsePriceFromText(bodyText);
}

function extractPriceCardrush(html: string): number | null {
    const $ = cheerio.load(html);
    
    // Card Rushのセレクタパターン
    const selectors = [
        '.item_detail_price',
        '.selling_price',
        '.product-price',
        '[class*="price"]',
        '.price-box',
    ];
    
    for (const selector of selectors) {
        const text = $(selector).first().text();
        const price = parsePriceText(text);
        if (price) return price;
    }
    
    const bodyText = $('body').text();
    return parsePriceFromText(bodyText);
}

// 価格テキストをパース
function parsePriceText(text: string): number | null {
    if (!text) return null;
    
    // "¥" または "円" を含むテキストから数字を抽出
    const match = text.match(/[¥￥]?\s*([0-9,]+)\s*円?/);
    if (match) {
        const price = parseInt(match[1].replace(/,/g, ''), 10);
        if (price >= 100 && price <= 50000000) {
            return price;
        }
    }
    return null;
}

// テキスト全体から販売価格を検索
function parsePriceFromText(text: string): number | null {
    // 販売価格パターン
    const patterns = [
        /販売価格\s*[:：]?\s*[¥￥]?\s*([0-9,]+)\s*円/,
        /([0-9]{1,3}(?:,[0-9]{3})+)\s*円\s*[\(（]税込/,
        /価格\s*[:：]?\s*[¥￥]?\s*([0-9,]+)/,
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const price = parseInt(match[1].replace(/,/g, ''), 10);
            if (price >= 100 && price <= 50000000) {
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
    // フォールバック
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
    fs.writeFileSync(LOG_FILE, `=== GemFolio Price Scraper v3 (Cheerio) ===\n`);
    fs.appendFileSync(LOG_FILE, `Started: ${new Date().toISOString()}\n\n`);

    log('🚀 Starting fast scraper with Cheerio...');
    log('⏱️  Using 2-5 sec delays between requests\n');

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

    const cardsWithUrls = cards?.filter((c: CardRow) => 
        c.scrape_url_raw_1 || c.scrape_url_raw_2 || c.scrape_url_raw_3 ||
        c.scrape_url_psa10_1 || c.scrape_url_psa10_2 || c.scrape_url_psa10_3
    ) || [];

    log(`📦 Found ${cardsWithUrls.length} cards with scrape URLs\n`);

    let totalSuccess = 0;
    let totalFail = 0;
    const startTime = Date.now();

    for (let i = 0; i < cardsWithUrls.length; i++) {
        const card = cardsWithUrls[i] as CardRow;
        const cardName = card.name_en || card.name_ja || card.card_number;
        
        log(`[${i + 1}/${cardsWithUrls.length}] ${card.card_id} - ${cardName}`);

        const prices = {
            raw: [] as number[],
            psa10: [] as number[],
        };

        // Scrape Raw prices
        const rawUrls = [card.scrape_url_raw_1, card.scrape_url_raw_2, card.scrape_url_raw_3].filter(Boolean) as string[];
        for (const url of rawUrls) {
            await sleep(2000, 5000);
            
            const siteName = url.includes('raftel') ? 'Raftel' : url.includes('mercard') ? 'Mercard' : 'CardRush';
            log(`  📡 ${siteName} (Raw)`);
            
            const html = await fetchHtml(url);
            if (html) {
                const price = extractPrice(html, url);
                if (price) {
                    prices.raw.push(price);
                    log(`    ✅ ¥${price.toLocaleString()}`);
                } else {
                    log(`    ⚠️ Price not found`);
                }
            }
        }

        // Scrape PSA10 prices
        const psa10Urls = [card.scrape_url_psa10_1, card.scrape_url_psa10_2, card.scrape_url_psa10_3].filter(Boolean) as string[];
        for (const url of psa10Urls) {
            await sleep(2000, 5000);
            
            const siteName = url.includes('raftel') ? 'Raftel' : url.includes('mercard') ? 'Mercard' : 'CardRush';
            log(`  📡 ${siteName} (PSA10)`);
            
            const html = await fetchHtml(url);
            if (html) {
                const price = extractPrice(html, url);
                if (price) {
                    prices.psa10.push(price);
                    log(`    ✅ ¥${price.toLocaleString()}`);
                } else {
                    log(`    ⚠️ Price not found`);
                }
            }
        }

        // Update DB
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (prices.raw.length > 0) {
            updateData.price_raw_avg = Math.round(prices.raw.reduce((a, b) => a + b, 0) / prices.raw.length);
            updateData.price_raw_low = Math.min(...prices.raw);
            updateData.price_raw_high = Math.max(...prices.raw);
            if (prices.raw[0]) updateData.price_raw_1 = prices.raw[0];
            if (prices.raw[1]) updateData.price_raw_2 = prices.raw[1];
            if (prices.raw[2]) updateData.price_raw_3 = prices.raw[2];
        }

        if (prices.psa10.length > 0) {
            updateData.price_psa10_avg = Math.round(prices.psa10.reduce((a, b) => a + b, 0) / prices.psa10.length);
            updateData.price_psa10_low = Math.min(...prices.psa10);
            updateData.price_psa10_high = Math.max(...prices.psa10);
            if (prices.psa10[0]) updateData.price_psa10_1 = prices.psa10[0];
            if (prices.psa10[1]) updateData.price_psa10_2 = prices.psa10[1];
            if (prices.psa10[2]) updateData.price_psa10_3 = prices.psa10[2];
        }

        if (prices.raw.length > 0 || prices.psa10.length > 0) {
            // 1. Update cards table with current prices
            const { error: updateError } = await supabase
                .from('cards')
                .update(updateData)
                .eq('card_id', card.card_id);

            if (updateError) {
                log(`  ❌ DB Error: ${updateError.message}`);
                totalFail++;
            } else {
                // 2. Save to price history tables
                const now = new Date().toISOString();
                
                // Save Raw price history
                if (prices.raw.length > 0) {
                    const { error: historyRawError } = await supabase
                        .from('market_prices_raw')
                        .insert({
                            card_id: card.card_id,
                            price_avg: updateData.price_raw_avg,
                            price_low: updateData.price_raw_low,
                            price_high: updateData.price_raw_high,
                            recorded_at: now,
                        });
                    
                    if (historyRawError) {
                        log(`    ⚠️ Raw history save failed: ${historyRawError.message}`);
                    }
                }
                
                // Save PSA10 price history
                if (prices.psa10.length > 0) {
                    const { error: historyPsa10Error } = await supabase
                        .from('market_prices_psa10')
                        .insert({
                            card_id: card.card_id,
                            price_avg: updateData.price_psa10_avg,
                            price_low: updateData.price_psa10_low,
                            price_high: updateData.price_psa10_high,
                            recorded_at: now,
                        });
                    
                    if (historyPsa10Error) {
                        log(`    ⚠️ PSA10 history save failed: ${historyPsa10Error.message}`);
                    }
                }
                
                log(`  💾 Saved: Raw ¥${updateData.price_raw_avg?.toLocaleString() || '-'} / PSA10 ¥${updateData.price_psa10_avg?.toLocaleString() || '-'} (+ history)`);
                totalSuccess++;
            }
        } else {
            log(`  ⏭️ No prices found`);
            totalFail++;
        }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    log('\n========================================');
    log(`✅ Successfully updated: ${totalSuccess} cards`);
    log(`❌ Failed/Skipped: ${totalFail} cards`);
    log(`⏱️  Total time: ${Math.floor(elapsed / 60)}分${elapsed % 60}秒`);
    log('========================================');
    log(`\n📄 Log saved to: ${LOG_FILE}`);
}

// Run
scrapeAllPrices().catch(err => {
    log(`\n💥 FATAL ERROR: ${err.message}`);
    console.error(err);
});
