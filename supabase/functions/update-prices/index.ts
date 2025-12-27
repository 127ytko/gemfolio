// Supabase Edge Function: update-prices
// Purpose: Batch update prices from scraping and log history
// Trigger: Supabase Cron or external scheduler (e.g. daily)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: Wait between requests to ideally avoid bans
const DELAY_BETWEEN_REQUESTS_MS = 3000 // 3 seconds

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        console.log('[update-prices] Starting batch price update (Raw + PSA10)...')

        // 1. Fetch cards with EITHER scrape_url_raw OR scrape_url_psa10
        const { data: cards, error: fetchError } = await supabase
            .from('assets')
            .select('file_id, scrape_url_raw, scrape_url_psa10, name')
            .or('scrape_url_raw.neq.null,scrape_url_psa10.neq.null')
            .order('file_id')

        if (fetchError) {
            throw new Error(`Failed to fetch cards: ${fetchError.message}`)
        }

        if (!cards || cards.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No cards with scrape URLs found',
                    updated: 0
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        console.log(`[update-prices] Found ${cards.length} cards to update`)
        const scrapeFunctionUrl = `${supabaseUrl}/functions/v1/scrape-price`

        const results: Array<{
            file_id: string
            name: string
            success: boolean
            price_raw?: number
            price_psa10?: number
            error?: string
        }> = []

        // 3. Process each card
        for (const card of cards) {
            console.log(`[update-prices] Processing: ${card.name} (${card.file_id})`)
            let rawPrice: number | null = null;
            let psa10Price: number | null = null;
            let errors: string[] = [];

            // --- A. Scrape Raw Price ---
            if (card.scrape_url_raw) {
                try {
                    const response = await fetch(scrapeFunctionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                        },
                        body: JSON.stringify({ url: card.scrape_url_raw })
                    })
                    const result = await response.json()
                    if (result.success && result.price) {
                        rawPrice = result.price;
                        console.log(`  > Raw: ¥${rawPrice?.toLocaleString()}`);
                    } else {
                        errors.push(`Raw: ${result.error || 'No price'}`);
                    }
                } catch (e) {
                    errors.push(`Raw Error: ${e instanceof Error ? e.message : 'Unknown'}`);
                }
                await sleep(DELAY_BETWEEN_REQUESTS_MS); // Wait
            }

            // --- B. Scrape PSA10 Price ---
            if (card.scrape_url_psa10) {
                try {
                    const response = await fetch(scrapeFunctionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                        },
                        body: JSON.stringify({ url: card.scrape_url_psa10 })
                    })
                    const result = await response.json()
                    if (result.success && result.price) {
                        psa10Price = result.price;
                        console.log(`  > PSA10: ¥${psa10Price?.toLocaleString()}`);
                    } else {
                        errors.push(`PSA10: ${result.error || 'No price'}`);
                    }
                } catch (e) {
                    errors.push(`PSA10 Error: ${e instanceof Error ? e.message : 'Unknown'}`);
                }
                await sleep(DELAY_BETWEEN_REQUESTS_MS); // Wait
            }

            // --- C. Update DB if we got at least one price ---
            if (rawPrice !== null || psa10Price !== null) {
                const updatePayload: any = { updated_at: new Date().toISOString() };
                if (rawPrice !== null) updatePayload.price_raw = rawPrice;
                if (psa10Price !== null) updatePayload.price_psa10 = psa10Price;

                // 1. Update Current Value in assets
                const { error: updateError } = await supabase
                    .from('assets')
                    .update(updatePayload)
                    .eq('file_id', card.file_id)

                if (updateError) {
                    console.error(`  Failure updating assets: ${updateError.message}`);
                }

                // 2. Insert into History
                const { error: historyError } = await supabase
                    .from('market_price_history')
                    .insert({
                        asset_id: card.file_id,
                        price_raw: rawPrice,     // can be null
                        price_psa10: psa10Price, // can be null
                        recorded_at: new Date().toISOString()
                    })

                if (historyError) {
                    console.error(`  Failure updating history: ${historyError.message}`);
                }

                results.push({
                    file_id: card.file_id,
                    name: card.name,
                    success: true,
                    price_raw: rawPrice || undefined,
                    price_psa10: psa10Price || undefined
                })
                console.log(`  ✓ Updated ${card.name}`);

            } else {
                // Failed both or no URLs
                results.push({
                    file_id: card.file_id,
                    name: card.name,
                    success: false,
                    error: errors.join(', ')
                })
                console.log(`  ✗ Failed: ${errors.join(', ')}`);
            }
        }

        // 4. Summary response
        const successful = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length

        return new Response(
            JSON.stringify({
                success: true,
                updated: successful,
                failed: failed,
                total: cards.length,
                results: results
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[update-prices] Fatal error: ${errorMessage}`)

        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            }
        )
    }
})
