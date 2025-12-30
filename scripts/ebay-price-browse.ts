/**
 * eBay Price Fetching Script (Browse API)
 * 実践的なロジックを組み込んだ価格取得スクリプト
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const LOG_FILE = 'scripts/ebay-browse-log.txt';
// ログファイルは維持（追記モードにするか、テスト毎に消すかはお好みで。今回はリセット）
fs.writeFileSync(LOG_FILE, '');

function log(message: string) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

// アフィリエイト設定
const AFFILIATE_CAMP_ID = '5339135615';
const AFFILIATE_CUSTOM_ID = 'gemfolio';
const EXCHANGE_RATE = 150.0; // 仮の為替レート

// カード情報の型定義
interface CardInfo {
    card_number: string;
    name_en: string | null;
    slug: string;
    price_raw_yen: number | null;
    price_psa10_yen: number | null;
}

/**
 * Client Credentials Flow でアクセストークンを取得
 */
async function getAccessToken(): Promise<string | null> {
    const appId = process.env.EBAY_APP_ID;
    const certId = process.env.EBAY_CERT_ID;

    if (!appId || !certId) {
        log('❌ Error: EBAY_APP_ID or EBAY_CERT_ID is missing in .env.local');
        return null;
    }

    const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

    try {
        const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        });

        if (!res.ok) {
            log(`❌ Token Error: ${await res.text()}`);
            return null;
        }

        const data = await res.json();
        return data.access_token;
    } catch (error: any) {
        log(`❌ Token Request Failed: ${error.message}`);
        return null;
    }
}

/**
 * eBayから価格を取得する関数
 */
async function fetchEbayPrice(card: CardInfo, type: 'RAW' | 'PSA10', token: string) {
    const baseUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

    // 1. クエリ構築
    // キーワード: 型番 + (JP, Japanese)
    let query = `${card.card_number} (JP, Japanese)`;

    // Manga Rare対応
    if (card.slug.includes('manga')) {
        query += ' (Manga, Super Parallel)';
    }

    // 英語名があれば追加（ただしMangaなどは型番+Mangaで十分な場合もあるが、精度向上のため追加）
    if (card.name_en) {
        // 名前が長すぎるとノイズになることがあるので注意が必要だが、基本は含める
        query += ` ${card.name_en}`;
    }

    // 除外ワード（必須）
    query += ' -proxy -replica -digital -playset -English -EN';

    // 状態別条件
    if (type === 'RAW') {
        // 鑑定品を除外
        query += ' -PSA -BGS -CGC -ARS -graded -slab';
    } else {
        // PSA10指定
        query += ' PSA 10';
    }

    // 2. パラメータ設定
    const params = new URLSearchParams({
        q: query,
        category_ids: '183454', // TCGカテゴリー
        limit: '10', // 上位10件取得してフィルタ
        sort: 'price', // 安い順 (最安値を探すため)
        filter: 'buyingOptions:{FIXED_PRICE}', // 即決価格のみ
    });

    try {
        log(`\n--- Fetching ${type} Price for ${card.card_number} ---`);
        log(`Query: ${query}`);

        const res = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${AFFILIATE_CAMP_ID},affiliateReferenceId=${AFFILIATE_CUSTOM_ID}`
            }
        });

        if (!res.ok) {
            log(`❌ API Error: ${res.status} ${await res.text()}`);
            return;
        }

        const data = await res.json();
        const items = data.itemSummaries || [];

        if (items.length === 0) {
            log('⚠️ No items found.');
            return;
        }

        // 3. バリデーションと集計
        const validItems: any[] = [];
        const referencePriceYen = type === 'RAW' ? card.price_raw_yen : card.price_psa10_yen;

        // 基準価格がない場合はバリデーションできないので警告しつつ全通し、またはスキップ
        const thresholdYen = referencePriceYen ? referencePriceYen * 0.5 : 0;

        if (referencePriceYen) {
            log(`Validation: Must be > ¥${thresholdYen.toLocaleString()} (approx $${Math.round(thresholdYen / EXCHANGE_RATE)})`);
        }

        for (const item of items) {
            const priceObj = item.price;
            if (!priceObj || priceObj.currency !== 'USD') continue;

            const priceUsd = parseFloat(priceObj.value);
            const priceYen = priceUsd * EXCHANGE_RATE;
            const itemUrl = item.itemAffiliateWebUrl || item.itemWebUrl;

            // バリデーション: 日本円価格の50%以下ならスキップ
            if (thresholdYen > 0 && priceYen < thresholdYen) {
                log(`  ❌ Skipped Low Price: $${priceUsd} (¥${Math.round(priceYen)}) - ${item.title.substring(0, 30)}...`);
                continue;
            }

            // 有効データ
            validItems.push({
                priceUsd,
                priceYen,
                title: item.title,
                url: itemUrl
            });
            log(`  ✅ Found: $${priceUsd} (¥${Math.round(priceYen)}) - ${item.title.substring(0, 30)}...`);
        }

        // 結果計算（平均値など）
        if (validItems.length > 0) {
            // 安い順ソートされているので、validItems[0] が「有効な最安値」
            // しかし平均を取りたい場合は平均を計算
            const avgUsd = validItems.reduce((sum, item) => sum + item.priceUsd, 0) / validItems.length;
            const minUsd = Math.min(...validItems.map(i => i.priceUsd));
            const maxUsd = Math.max(...validItems.map(i => i.priceUsd));

            log(`💰 Result (${validItems.length} items):`);
            log(`   Avg: $${Math.round(avgUsd)}`);
            log(`   Min: $${minUsd}`);
            log(`   Max: $${maxUsd}`);

            // 最安値のアフィリエイトリンクを表示（例）
            log(`   Low Link: ${validItems[0].url}`);
        } else {
            log('⚠️ No valid items left after validation.');
        }

    } catch (error: any) {
        log(`❌ Error: ${error.message}`);
    }
}

// テスト実行用データ
const SAMPLE_CARD: CardInfo = {
    card_number: 'OP07-051',
    name_en: 'Boa Hancock',
    slug: 'op07-051-boa-hancock-sr', // mangaを含まない通常版のテストも兼ねて
    price_raw_yen: 8000,
    price_psa10_yen: 20000
};

// Manga版のテストデータ
const MANGA_CARD: CardInfo = {
    card_number: 'OP07-051',
    name_en: 'Boa Hancock',
    slug: 'op07-051-boa-hancock-manga', // manga判定テスト
    price_raw_yen: 150000, // 高額
    price_psa10_yen: 250000
};

async function main() {
    const token = await getAccessToken();
    if (!token) return;

    log('=================================');
    log('Test 1: Normal Card (SR)');
    await fetchEbayPrice(SAMPLE_CARD, 'RAW', token);
    await fetchEbayPrice(SAMPLE_CARD, 'PSA10', token);

    log('=================================');
    log('Test 2: Manga Rare');
    await fetchEbayPrice(MANGA_CARD, 'RAW', token);
    await fetchEbayPrice(MANGA_CARD, 'PSA10', token);
}

main().catch(console.error);
