/**
 * Debug Price Scraper - Test a single URL
 */

import 'dotenv/config';

async function testScrape() {
    const url = 'https://www.cardrush-op.jp/product/2213';

    console.log('Fetching:', url);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en;q=0.5',
        },
    });

    const html = await response.text();

    // Save a portion to debug
    console.log('\n--- HTML snippet containing price ---');

    // Look for 販売価格 in the HTML
    const priceIndex = html.indexOf('販売価格');
    if (priceIndex >= 0) {
        console.log('Found 販売価格 at index:', priceIndex);
        console.log('Context:', html.substring(priceIndex, priceIndex + 100));
    } else {
        console.log('販売価格 NOT found in HTML!');

        // Check if HTML is encoded differently
        console.log('\nSearching for alternative patterns...');

        // Try hex encoded pattern for 販売価格
        const patterns = [
            /販売価格/,
            /price/i,
            /[\d,]+円/,
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                console.log(`Pattern ${pattern} found:`, match[0]);
            }
        }
    }

    // Also test regex directly
    console.log('\n--- Testing regex patterns ---');

    // Pattern 1
    const priceMatch = html.match(/販売価格[:：]\s*([\d,]+)円/);
    console.log('Pattern 1 (販売価格):', priceMatch ? `¥${priceMatch[1]}` : 'No match');

    // Pattern 2
    const yenMatch = html.match(/[¥￥]([\d,]+)/);
    console.log('Pattern 2 (¥ symbol):', yenMatch ? `¥${yenMatch[1]}` : 'No match');

    // Pattern 3 - more flexible
    const numYenMatch = html.match(/([\d,]+)円/g);
    if (numYenMatch) {
        console.log('Pattern 3 (XXX円):', numYenMatch.slice(0, 5));
    }
}

testScrape().catch(console.error);
