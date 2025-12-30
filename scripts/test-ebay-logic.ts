import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const LOG_FILE = 'scripts/ebay-test-log.txt';
// ログファイルをリセット
fs.writeFileSync(LOG_FILE, '');

function log(message: string) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

// テスト用カード情報（例: OP05-119 Luffy Manga Rare）
// 必要に応じて変更してください
const TEST_CARD = {
    cardNumber: 'OP07-051',
    nameEn: 'Boa Hancock',
    rarity: 'SR', // 必要に応じて SP や AA (Alt Art) に変更
    // 日本市場価格（JPY）- 仮設定
    japanPriceRaw: 8000,
    japanPricePsa10: 20000,
};

// 仮の為替レート (1 USD = ? JPY)
const EXCHANGE_RATE = 150.0;

async function testEbayApi() {
    const appId = process.env.EBAY_APP_ID;
    if (!appId) {
        log('❌ Error: EBAY_APP_ID is missing in .env.local');
        log('Please add your eBay App ID to .env.local file like:');
        log('EBAY_APP_ID=YourAppIdHere');
        return;
    }

    log(`🔎 Searching eBay for: ${TEST_CARD.cardNumber} ${TEST_CARD.nameEn} ${TEST_CARD.rarity}`);
    log(`💱 Exchange Rate: 1 USD = ${EXCHANGE_RATE} JPY`);

    // 基本キーワード: 番号 + 名前 + レアリティ + (Japanese OR JP) + (英語版除外)
    const baseKeywords = `${TEST_CARD.cardNumber} ${TEST_CARD.nameEn} ${TEST_CARD.rarity} (Japanese, JP) -English -EN`;

    // 1. Raw検索
    // -PSA -BGS -CGC -ARS -slab で鑑定品を除外
    const rawKeywords = `${baseKeywords} -PSA -BGS -CGC -ARS -graded -slab`;
    await searchEbay(appId, rawKeywords, 'RAW', TEST_CARD.japanPriceRaw);

    // 2. PSA10検索
    const psa10Keywords = `${baseKeywords} PSA 10`;
    await searchEbay(appId, psa10Keywords, 'PSA10', TEST_CARD.japanPricePsa10);
}

async function searchEbay(appId: string, keywords: string, type: string, referencePriceJpy: number) {
    const url = 'https://svcs.ebay.com/services/search/FindingService/v1';

    // eBay Finding API Parameters
    const params = new URLSearchParams({
        'OPERATION-NAME': 'findItemsByKeywords', // まずは現在出品中で確認
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': 'true',
        'keywords': keywords,
        // 'itemFilter(0).name': 'SoldItemsOnly',  // 一旦無効化
        // 'itemFilter(0).value': 'true',
        'sortOrder': 'EndTimeSoonest',
        'paginationInput.entriesPerPage': '10'
    });

    try {
        const res = await fetch(`${url}?${params.toString()}`);
        if (!res.ok) {
            const errorBody = await res.text();
            log(`HTTP Error: ${res.status} ${res.statusText}`);
            log(`Response: ${errorBody.substring(0, 500)}`);
            return;
        }

        const data = await res.json();

        // レスポンスの解析 (findItemsByKeywordsResponse)
        const resp = data.findItemsByKeywordsResponse?.[0] || data.findCompletedItemsResponse?.[0];
        if (resp?.ack?.[0] !== 'Success') {
            log(`eBay API Error: ${resp?.errorMessage?.[0]?.error?.[0]?.message?.[0] || JSON.stringify(resp?.errorMessage)}`);
            return;
        }

        const items = resp.searchResult?.[0]?.item || [];
        log(`\n--- ${type} Results (${items.length} items found) ---`);
        log(`Keywords: "${keywords}"`);
        log(`Filter Reference: > 50% of ¥${referencePriceJpy.toLocaleString()} (approx $${Math.round((referencePriceJpy * 0.5) / EXCHANGE_RATE)})`);

        const prices: number[] = [];
        let skippedCount = 0;

        items.forEach((item: any) => {
            const title = item.title?.[0];
            const sellingStatus = item.sellingStatus?.[0];
            const listingInfo = item.listingInfo?.[0];

            // 価格取得 (USD換算値があればそれを使う)
            const priceVal = parseFloat(sellingStatus?.currentPrice?.[0]?.__value__);
            const currency = sellingStatus?.currentPrice?.[0]?.['@currencyId'];
            const convertedVal = parseFloat(sellingStatus?.convertedCurrentPrice?.[0]?.__value__);
            const convertedCurrency = sellingStatus?.convertedCurrentPrice?.[0]?.['@currencyId'];

            // 基本的にconvertedCurrentPrice (USD) を使用
            let finalPriceUsd = 0;
            if (convertedCurrency === 'USD') {
                finalPriceUsd = convertedVal;
            } else if (currency === 'USD') {
                finalPriceUsd = priceVal;
            } else {
                // USD以外でUSD換算もない場合はスキップ（あまりないはず）
                return;
            }

            const date = listingInfo?.endTime?.[0];
            const displayDate = new Date(date).toLocaleDateString();

            // 異常値フィルタ (日本市場価格の50%以下は除外)
            const estimatedJpy = finalPriceUsd * EXCHANGE_RATE;
            const thresholdJpy = referencePriceJpy * 0.5;

            if (estimatedJpy < thresholdJpy) {
                log(`[${displayDate}] ❌ $${finalPriceUsd} (¥${Math.round(estimatedJpy)}) - Skipped (Too low) -> ${title.substring(0, 30)}...`);
                skippedCount++;
            } else {
                log(`[${displayDate}] ✅ $${finalPriceUsd} (¥${Math.round(estimatedJpy)}) -> ${title.substring(0, 40)}...`);
                prices.push(finalPriceUsd);
            }
        });

        if (prices.length > 0) {
            const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            log(`\n💰 Statistics (Used ${prices.length} / Skipped ${skippedCount}):`);
            log(`   Average: $${avg} (¥${Math.round(avg * EXCHANGE_RATE).toLocaleString()})`);
            log(`   Range:   $${min} - $${max}`);
        } else {
            log(`\n⚠️ No valid sales data found (All filtered or empty).`);
        }

    } catch (error: any) {
        log(`Script Error: ${error.message}`);
    }
}

testEbayApi().catch(err => log(err));
