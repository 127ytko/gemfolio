/**
 * Price Scraper for Card Rush
 * ============================================
 * Scrapes current prices from cardrush-op.jp and cardrush-pokemon.jp
 * Updates the assets table with latest prices
 * 
 * Usage: npx tsx scripts/scrape-prices.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Log file
const LOG_FILE = 'scrape-results.txt';

function log(message: string) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

// ============================================
// Helper Functions
// ============================================

/**
 * Fetch HTML content from URL with retry logic
 */
async function fetchWithRetry(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ja,en;q=0.5',
                },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            log(`  Retry ${i + 1}/${retries}`);
            if (i === retries - 1) throw error;
            await sleep(2000 * (i + 1)); // Exponential backoff
        }
    }
    throw new Error('Max retries reached');
}

/**
 * Extract price from Card Rush HTML
 */
function extractPrice(html: string): number | null {
    // Pattern: Look for digits followed by 円
    // The site format is: 販売価格: XXX,XXX円(税込)
    const patterns = [
        /販売価格[:：]\s*([\d,]+)円/,
        /([\d,]{4,})円\s*\(税込\)/,  // XXX,XXX円(税込)
        /([\d,]{4,})円/,              // XXX,XXX円
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const price = parseInt(match[1].replace(/,/g, ''), 10);
            if (price > 100) { // Sanity check - price should be more than 100 yen
                return price;
            }
        }
    }

    return null;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Main Scraper
// ============================================

async function scrapeCardPrices() {
    // Clear log file
    fs.writeFileSync(LOG_FILE, `=== Price Scraper Log - ${new Date().toISOString()} ===\n\n`);

    log('Starting price scraper...\n');

    // Get all cards with scrape URLs
    const { data: cards, error } = await supabase
        .from('assets')
        .select('id, file_id, name_jp, scrape_url_raw, scrape_url_psa10, price_raw, price_psa10')
        .is('user_id', null) // Only master data
        .not('scrape_url_raw', 'is', null);

    if (error) {
        log(`ERROR: Database error: ${error.message}`);
        return;
    }

    log(`Found ${cards?.length || 0} cards with scrape URLs\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < (cards?.length || 0); i++) {
        const card = cards![i];
        log(`[${i + 1}/${cards!.length}] ${card.file_id}`);

        let newPriceRaw: number | null = null;
        let newPricePsa10: number | null = null;

        // Scrape raw price
        if (card.scrape_url_raw) {
            try {
                const html = await fetchWithRetry(card.scrape_url_raw);
                newPriceRaw = extractPrice(html);
                if (newPriceRaw) {
                    log(`   Raw: ${newPriceRaw.toLocaleString()} JPY`);
                } else {
                    log(`   Raw: Price not found`);
                }
            } catch (err) {
                log(`   Raw: Failed to fetch`);
            }
        }

        // Scrape PSA10 price
        if (card.scrape_url_psa10) {
            try {
                await sleep(2000); // Rate limiting - 2 seconds
                const html = await fetchWithRetry(card.scrape_url_psa10);
                newPricePsa10 = extractPrice(html);
                if (newPricePsa10) {
                    log(`   PSA10: ${newPricePsa10.toLocaleString()} JPY`);
                } else {
                    log(`   PSA10: Price not found`);
                }
            } catch (err) {
                log(`   PSA10: Failed to fetch`);
            }
        }

        // Update database if we got new prices
        if (newPriceRaw || newPricePsa10) {
            const updateData: Record<string, any> = {
                updated_at: new Date().toISOString(),
            };
            if (newPriceRaw) updateData.price_raw = newPriceRaw;
            if (newPricePsa10) updateData.price_psa10 = newPricePsa10;

            const { error: updateError } = await supabase
                .from('assets')
                .update(updateData)
                .eq('id', card.id);

            if (updateError) {
                log(`   DB Update failed: ${updateError.message}`);
                failCount++;
            } else {
                successCount++;
            }
        } else {
            skippedCount++;
        }

        // Rate limiting - be nice to the server (2 seconds between cards)
        await sleep(2000);
        log('');
    }

    log('\n========================================');
    log(`SUCCESS Updated: ${successCount}`);
    log(`SKIPPED (no price found): ${skippedCount}`);
    log(`FAILED: ${failCount}`);
    log('========================================\n');

    log(`Log saved to: ${LOG_FILE}`);
}

// Run the scraper
scrapeCardPrices().catch(err => {
    log(`FATAL ERROR: ${err.message}`);
});
