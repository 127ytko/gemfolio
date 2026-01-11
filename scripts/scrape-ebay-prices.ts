/**
 * script: scrape-ebay-prices.ts
 * Description: Fetches eBay prices for all cards in the database and updates them.
 * Usage: npx ts-node scripts/scrape-ebay-prices.ts
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const LOG_FILE = 'scripts/ebay-scrape-log.txt';
// Reset log file
fs.writeFileSync(LOG_FILE, '');

function log(message: string) {
    const timestamp = new Date().toISOString();
    const msg = `[${timestamp}] ${message}`;
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Config
const AFFILIATE_CAMP_ID = '5339135615';
const AFFILIATE_CUSTOM_ID = 'gemfolio';
const EXCHANGE_RATE = 150.0; // Fixed for now, or fetch dynamically if needed
const BATCH_SIZE = 10; // Process cards in batches
const WAIT_MS = 2000; // Wait between cards to respect rate limits

// Constants
const CATEGORY_ID_TCG = '183454';

// Environment Check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for writes
const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !EBAY_APP_ID || !EBAY_CERT_ID) {
    log('❌ Error: Missing environment variables.');
    process.exit(1);
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Card {
    card_id: string;
    card_number: string;
    name_en: string | null;
    rarity_en: string | null;
    slug: string;
    price_raw_avg: number | null; // JPY for validation
    price_psa10_avg: number | null;
}

// Helper: Sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Append affiliate parameters to any eBay URL
function appendAffiliateParams(url: string): string {
    try {
        const urlObj = new URL(url);
        // Remove existing affiliate params if any
        urlObj.searchParams.delete('mkcid');
        urlObj.searchParams.delete('mkrid');
        urlObj.searchParams.delete('siteid');
        urlObj.searchParams.delete('campid');
        urlObj.searchParams.delete('toolid');
        urlObj.searchParams.delete('customid');
        // Add our affiliate params
        urlObj.searchParams.set('mkcid', '1');
        urlObj.searchParams.set('mkrid', '711-53200-19255-0');
        urlObj.searchParams.set('siteid', '0');
        urlObj.searchParams.set('campid', AFFILIATE_CAMP_ID);
        urlObj.searchParams.set('toolid', '10001');
        urlObj.searchParams.set('customid', AFFILIATE_CUSTOM_ID);
        return urlObj.toString();
    } catch {
        // If URL parsing fails, return original
        return url;
    }
}

// Helper: Get eBay Access Token
async function getAccessToken(): Promise<string | null> {
    const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
    try {
        const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.access_token;
    } catch (e: any) {
        log(`❌ Token Error: ${e.message}`);
        return null;
    }
}

// Helper: Fetch Price for Single Card & Condition
async function fetchSingleEbayPrice(
    token: string,
    card: Card,
    type: 'RAW' | 'PSA10',
    referencePriceYen: number | null
): Promise<{ priceUsd: number; priceYen: number; url: string } | null> {
    const baseUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

    // Build Query
    // Format: カード番号 レアリティ Japanese/JP -除外ワード
    let query = `${card.card_number}`;

    // Add rarity if available
    if (card.rarity_en) {
        query += ` ${card.rarity_en}`;
    }

    // Add Japanese identifier
    query += ' (Japanese, JP)';

    // Condition-specific terms and exclusions
    if (type === 'RAW') {
        query += ' -ars -psa -bgs -cgc';
    } else {
        query += ' PSA10 -ars -bgs -cgc';
    }

    const params = new URLSearchParams({
        q: query,
        category_ids: CATEGORY_ID_TCG,
        limit: '10',
        sort: 'price', // Cheapest first
        filter: 'buyingOptions:{FIXED_PRICE}',
    });

    try {
        const res = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${AFFILIATE_CAMP_ID},affiliateReferenceId=${AFFILIATE_CUSTOM_ID}`
            }
        });

        if (!res.ok) {
            log(`  ❌ API Error (${card.card_number} ${type}): ${res.status}`);
            return null;
        }

        const data = await res.json();
        const items = data.itemSummaries || [];
        if (items.length === 0) return null;

        // Validation Threshold
        const thresholdYen = referencePriceYen ? referencePriceYen * 0.5 : 0;

        // Find first valid item
        for (const item of items) {
            const priceObj = item.price;
            if (!priceObj || priceObj.currency !== 'USD') continue;

            const priceUsd = parseFloat(priceObj.value);
            const priceYen = priceUsd * EXCHANGE_RATE;

            // Validation
            if (thresholdYen > 0 && priceYen < thresholdYen) {
                // Too cheap, skip
                continue;
            }

            // Found valid item
            const baseUrl = item.itemAffiliateWebUrl || item.itemWebUrl;
            // Ensure affiliate parameters are always present
            const itemUrl = appendAffiliateParams(baseUrl);
            return { priceUsd, priceYen, url: itemUrl };
        }

    } catch (e: any) {
        log(`  ❌ Fetch Error: ${e.message}`);
    }
    return null;
}

// Main Process
async function main() {
    log('🚀 Starting eBay Price Scraper...');

    const token = await getAccessToken();
    if (!token) {
        log('❌ Failed to get access token. Exiting.');
        return;
    }

    // Fetch Cards from DB
    // Assuming price_raw_avg and price_psa10_avg are stored in JPY based on previous context ("price_raw_yen")
    // If they are USD, we need to adjust Exchange Rate logic.
    // Based on previous script "price_raw_avg" was used to display 120,000 etc, so it's likely JPY.
    const { data: cards, error } = await supabase
        .from('cards')
        .select('card_id, card_number, name_en, rarity_en, slug, price_raw_avg, price_psa10_avg')
        .order('card_id');

    if (error || !cards) {
        log(`❌ DB Error: ${error?.message}`);
        return;
    }

    log(`Testing with ${cards.length} cards...`);

    let processedRequestCount = 0;

    for (const card of cards) {
        log(`>>> Processing: ${card.card_number} (${card.slug})`);

        // RAW Price
        const rawResult = await fetchSingleEbayPrice(token, card, 'RAW', card.price_raw_avg);
        // PSA10 Price
        const psa10Result = await fetchSingleEbayPrice(token, card, 'PSA10', card.price_psa10_avg);

        // Update DB
        const updatePayload: any = {
            last_ebay_scraped_at: new Date().toISOString()
        };

        if (rawResult) {
            log(`   RAW: $${rawResult.priceUsd} (¥${Math.round(rawResult.priceYen)})`);
            updatePayload.price_ebay_raw = rawResult.priceUsd;
            updatePayload.ebay_listing_url_raw = rawResult.url;
        } else {
            log(`   RAW: Not found or skipped`);
        }

        if (psa10Result) {
            log(`   PSA10: $${psa10Result.priceUsd} (¥${Math.round(psa10Result.priceYen)})`);
            updatePayload.price_ebay_psa10 = psa10Result.priceUsd;
            updatePayload.ebay_listing_url_psa10 = psa10Result.url;
        } else {
            log(`   PSA10: Not found or skipped`);
        }

        // Perform Update
        const { error: updateError } = await supabase
            .from('cards')
            .update(updatePayload)
            .eq('card_id', card.card_id);

        if (updateError) {
            log(`   ❌ Update Error: ${updateError.message}`);
        } else {
            log(`   ✅ DB Updated`);
        }

        // Rate Limit Waiting
        processedRequestCount += 2;
        if (processedRequestCount >= BATCH_SIZE) {
            log('   💤 Cooling down...');
            await sleep(WAIT_MS);
            processedRequestCount = 0;
        } else {
            await sleep(500); // minimal wait
        }
    }

    log('🎉 Scraping Completed!');
}

main().catch(console.error);
