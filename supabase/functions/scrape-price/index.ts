// Supabase Edge Function: scrape-price
// Purpose: Fetch price from TCG Raftel product pages
// Stage 1: Basic scraper (no cache, minimal error handling)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json()

        // URL validation - only allow tcg-raftel.com
        if (!url || !url.includes('tcg-raftel.com')) {
            throw new Error('Target URL must be from tcg-raftel.com')
        }

        console.log(`[scrape-price] Scraping: ${url}`)

        // Fetch the page with User-Agent
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GemFolio-Bot/0.1 (Personal Collection Tracker)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            }
        })

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Price extraction logic for TCG Raftel
        // HTML Structure:
        // <p class="selling_price">
        //   <span class="price_label" id="price_label">販売価格</span>
        //   <span class="colon">:</span>
        //   <span class="figure" id="pricech">84,800<span class="currency_label">円</span></span>
        //   <span class="tax_label">(税込)</span>
        // </p>

        let priceText = ""

        // Method 1: Look for #pricech (most reliable for TCG Raftel)
        const pricechEl = $('#pricech')
        if (pricechEl.length > 0) {
            priceText = pricechEl.text().trim()
            console.log(`[scrape-price] Found #pricech: "${priceText}"`)
        }

        // Method 2: Look for .selling_price .figure
        if (!priceText) {
            const figureEl = $('.selling_price .figure')
            if (figureEl.length > 0) {
                priceText = figureEl.text().trim()
                console.log(`[scrape-price] Found .selling_price .figure: "${priceText}"`)
            }
        }

        // Method 3: Look for .selling_price and extract number
        if (!priceText) {
            const sellingPriceEl = $('.selling_price')
            if (sellingPriceEl.length > 0) {
                priceText = sellingPriceEl.text().trim()
                console.log(`[scrape-price] Found .selling_price: "${priceText}"`)
            }
        }

        // Method 4: Search for "販売価格" pattern in all text
        if (!priceText) {
            const bodyText = $('body').text()
            const priceMatch = bodyText.match(/販売価格[^\d]*(\d[\d,]+)/)
            if (priceMatch) {
                priceText = priceMatch[1]
                console.log(`[scrape-price] Found via regex: "${priceText}"`)
            }
        }

        console.log(`[scrape-price] Raw price text found: "${priceText}"`)

        // Parse the price (remove non-numeric characters)
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10)

        if (isNaN(price) || price === 0) {
            throw new Error(`Price could not be parsed from HTML. Raw text: "${priceText}"`)
        }

        console.log(`[scrape-price] Parsed price: ${price}`)

        return new Response(
            JSON.stringify({
                success: true,
                price,
                raw_text: priceText,
                scraped_at: new Date().toISOString()
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            },
        )

    } catch (error) {
        console.error(`[scrape-price] Error: ${error.message}`)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400
            },
        )
    }
})
