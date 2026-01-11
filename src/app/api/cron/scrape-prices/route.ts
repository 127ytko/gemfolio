/**
 * Auto-Scaling Price Scraper with Self-Calling
 * ==================================
 * 1回のCronで全カード処理を完了
 * 
 * 動作:
 * 1. Cronが1回実行 (土曜 1:00 JST)
 * 2. 5カード処理後、残りがあれば自分自身を呼び出し
 * 3. 全カード完了まで自動継続
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { waitUntil } from '@vercel/functions';

export const runtime = 'nodejs';
export const maxDuration = 10;

const CRON_SECRET = process.env.CRON_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BATCH_SIZE = 15;

// 固定User-Agent
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ============================================
// Fetch HTML
// ============================================
async function fetchHtml(url: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ja-JP,ja;q=0.9',
            },
        });

        clearTimeout(timeoutId);
        if (!response.ok) return null;
        return await response.text();
    } catch {
        return null;
    }
}

// ============================================
// Price Extraction
// ============================================
function extractPrice(html: string): number | null {
    try {
        const $ = cheerio.load(html);
        const selectors = ['.item_detail_price', '.product-price', '.selling_price', '.price', '[class*="price"]'];

        for (const selector of selectors) {
            const text = $(selector).first().text();
            const match = text.match(/[¥￥]?\s*([0-9,]+)\s*円?/);
            if (match) {
                const price = parseInt(match[1].replace(/,/g, ''), 10);
                if (price >= 100 && price <= 50000000) return price;
            }
        }

        const bodyText = $('body').text();
        const patterns = [/販売価格\s*[:：]?\s*[¥￥]?\s*([0-9,]+)\s*円/, /([0-9]{1,3}(?:,[0-9]{3})+)\s*円\s*[\(（]税込/];

        for (const pattern of patterns) {
            const match = bodyText.match(pattern);
            if (match) {
                const price = parseInt(match[1].replace(/,/g, ''), 10);
                if (price >= 100 && price <= 50000000) return price;
            }
        }
        return null;
    } catch {
        return null;
    }
}

// ============================================
// Fetch single URL
// ============================================
async function fetchPrice(url: string, type: 'raw' | 'psa10'): Promise<{ type: 'raw' | 'psa10'; price: number | null }> {
    try {
        const html = await fetchHtml(url);
        const price = html ? extractPrice(html) : null;
        return { type, price };
    } catch {
        return { type, price: null };
    }
}

// ============================================
// Process single card
// ============================================
async function processCard(card: {
    card_id: string;
    scrape_url_raw_1: string | null;
    scrape_url_raw_2: string | null;
    scrape_url_raw_3: string | null;
    scrape_url_psa10_1: string | null;
    scrape_url_psa10_2: string | null;
    scrape_url_psa10_3: string | null;
}): Promise<{ raw: number[]; psa10: number[] }> {
    const prices = { raw: [] as number[], psa10: [] as number[] };

    try {
        const rawUrls = [card.scrape_url_raw_1, card.scrape_url_raw_2, card.scrape_url_raw_3].filter(Boolean) as string[];
        const psa10Urls = [card.scrape_url_psa10_1, card.scrape_url_psa10_2, card.scrape_url_psa10_3].filter(Boolean) as string[];

        const allResults = await Promise.all([
            ...rawUrls.map((url) => fetchPrice(url, 'raw')),
            ...psa10Urls.map((url) => fetchPrice(url, 'psa10')),
        ]);

        for (const result of allResults) {
            if (result.price) {
                prices[result.type].push(result.price);
            }
        }
    } catch {
        // エラーは無視
    }

    return prices;
}

// ============================================
// Trigger next batch using waitUntil
// ============================================
function triggerNextBatch(baseUrl: string): Promise<void> {
    return fetch(`${baseUrl}/api/cron/scrape-prices?chain=true`, {
        method: 'GET',
        headers: CRON_SECRET ? { 'Authorization': `Bearer ${CRON_SECRET}` } : {},
    }).then(() => {
        console.log('Chain call triggered successfully');
    }).catch((err) => {
        console.error('Chain call failed:', err);
    });
}

// ============================================
// Main Handler
// ============================================
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();
    const isChainCall = request.nextUrl.searchParams.get('chain') === 'true';

    // Get current state
    const { data: state } = await supabase
        .from('scraping_state')
        .select('*')
        .eq('id', 'current')
        .single();

    let currentOffset = state?.current_offset || 0;

    // Reset check (new week)
    if (state?.last_completed_at && !isChainCall) {
        const lastCompleted = new Date(state.last_completed_at);
        const daysSinceCompleted = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCompleted >= 6) {
            currentOffset = 0;
        }
    }

    // Get total card count
    const { count: totalCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .or('scrape_url_raw_1.not.is.null,scrape_url_psa10_1.not.is.null');

    // Already completed check
    if (currentOffset >= (totalCards || 0) && totalCards && totalCards > 0) {
        return NextResponse.json({
            success: true,
            message: 'Already completed for this week',
            totalCards,
            currentOffset,
        });
    }

    // Update exchange rates if this is the start of the batch (currentOffset == 0)
    if (currentOffset === 0) {
        try {
            const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (rateRes.ok) {
                const rateData = await rateRes.json();
                const usdToJpy = rateData.rates.JPY;
                const usdToEur = rateData.rates.EUR;
                const usdToGbp = rateData.rates.GBP;
                const jpyToUsd = 1 / usdToJpy;

                await supabase.from('exchange_rates').insert([
                    { base_currency: 'USD', target_currency: 'JPY', rate: usdToJpy },
                    { base_currency: 'USD', target_currency: 'EUR', rate: usdToEur },
                    { base_currency: 'USD', target_currency: 'GBP', rate: usdToGbp },
                    { base_currency: 'JPY', target_currency: 'USD', rate: jpyToUsd }
                ]);
                console.log('Exchange rates updated successfully');
            }
        } catch (e) {
            console.error('Failed to update exchange rates:', e);
        }
    }

    // Fetch batch
    const { data: cards, error } = await supabase
        .from('cards')
        .select(`
            card_id,
            scrape_url_raw_1, scrape_url_raw_2, scrape_url_raw_3,
            scrape_url_psa10_1, scrape_url_psa10_2, scrape_url_psa10_3
        `)
        .or('scrape_url_raw_1.not.is.null,scrape_url_psa10_1.not.is.null')
        .order('card_id')
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!cards || cards.length === 0) {
        await supabase
            .from('scraping_state')
            .upsert({
                id: 'current',
                current_offset: currentOffset,
                is_running: false,
                last_completed_at: now.toISOString(),
            });

        return NextResponse.json({
            success: true,
            message: 'Completed all cards',
            totalCards,
            processed: 0,
        });
    }

    // Mark as running
    await supabase
        .from('scraping_state')
        .upsert({
            id: 'current',
            current_offset: currentOffset,
            is_running: true,
            last_run_at: now.toISOString(),
        });

    let successCount = 0;
    const timestamp = now.toISOString();

    // Process cards
    const results = await Promise.all(cards.map(async (card) => {
        try {
            const prices = await processCard(card);

            if (prices.raw.length > 0 || prices.psa10.length > 0) {
                const updateData: Record<string, unknown> = { updated_at: timestamp };

                if (prices.raw.length > 0) {
                    updateData.price_raw_avg = Math.round(prices.raw.reduce((a, b) => a + b, 0) / prices.raw.length);
                    updateData.price_raw_low = Math.min(...prices.raw);
                    updateData.price_raw_high = Math.max(...prices.raw);
                }

                if (prices.psa10.length > 0) {
                    updateData.price_psa10_avg = Math.round(prices.psa10.reduce((a, b) => a + b, 0) / prices.psa10.length);
                    updateData.price_psa10_low = Math.min(...prices.psa10);
                    updateData.price_psa10_high = Math.max(...prices.psa10);
                }

                await supabase.from('cards').update(updateData).eq('card_id', card.card_id);

                try {
                    if (prices.raw.length > 0) {
                        await supabase.from('market_prices_raw').insert({
                            card_id: card.card_id,
                            price_avg: updateData.price_raw_avg,
                            price_low: updateData.price_raw_low,
                            price_high: updateData.price_raw_high,
                            recorded_at: timestamp,
                        });
                    }
                } catch {
                    // 履歴保存エラーは無視
                }

                return true;
            }
            return false;
        } catch {
            return false;
        }
    }));

    successCount = results.filter(Boolean).length;
    const nextOffset = currentOffset + cards.length;
    const hasMore = nextOffset < (totalCards || 0);

    // Update state
    await supabase
        .from('scraping_state')
        .upsert({
            id: 'current',
            current_offset: nextOffset,
            is_running: false,
            last_run_at: timestamp,
            ...(hasMore ? {} : { last_completed_at: timestamp }),
        });

    // ★ 残りがあれば次のバッチを自動呼び出し (waitUntilでバックグラウンド実行)
    if (hasMore) {
        const baseUrl = request.nextUrl.origin;
        waitUntil(triggerNextBatch(baseUrl));
    }

    return NextResponse.json({
        success: true,
        batch: {
            offset: currentOffset,
            processed: cards.length,
            updated: successCount,
        },
        progress: {
            current: nextOffset,
            total: totalCards,
            percentage: totalCards ? Math.round((nextOffset / totalCards) * 100) : 0,
            hasMore,
            chainTriggered: hasMore,
        },
        timestamp,
    });
}
