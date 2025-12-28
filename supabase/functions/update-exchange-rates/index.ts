import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Fetch latest rates from external API
        // Using ExchangeRate-API (Free, no key required for base endpoint)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const data = await response.json()

        // Extract required rates
        const usdToJpy = data.rates.JPY
        const usdToEur = data.rates.EUR
        const usdToGbp = data.rates.GBP

        // Also calculate JPY base rates
        const jpyToUsd = 1 / usdToJpy

        console.log(`Fetched rates: USD/JPY=${usdToJpy}, USD/EUR=${usdToEur}`)

        // 2. Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 3. Update database
        const ratesToInsert = [
            { base_currency: 'USD', target_currency: 'JPY', rate: usdToJpy },
            { base_currency: 'USD', target_currency: 'EUR', rate: usdToEur },
            { base_currency: 'USD', target_currency: 'GBP', rate: usdToGbp },
            { base_currency: 'JPY', target_currency: 'USD', rate: jpyToUsd }
        ]

        // Use upsert to update if recorded_at collision (though less likely with new timestamp)
        // Actually we want to keep history, but for the app's "current rate" usage,
        // we might want a way to get the *latest* easily.
        // The current table constraint is UNIQUE(base_currency, target_currency, recorded_at).
        // So simple insert adds a new history record.

        const { error } = await supabase
            .from('exchange_rates')
            .insert(ratesToInsert)

        if (error) throw error

        return new Response(
            JSON.stringify({ success: true, rates: ratesToInsert }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error updating rates:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
