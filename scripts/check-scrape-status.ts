import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log('--- Checking Scraping Status ---');

    // 1. Check scraping_state or logs if exists
    // Attempting to query 'scraping_settings' or 'scraping_logs' if known, but let's check recent price history first.
    
    // 2. Check latest price history
    const { data: latestPrices, error: priceError } = await supabase
        .from('price_history')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

    if (priceError) {
        console.error('Error fetching price_history:', priceError.message);
    } else {
        console.log(`Latest Price Entries:`);
        if (latestPrices.length === 0) {
            console.log('  No price history found.');
        } else {
            latestPrices.forEach(p => {
                console.log(`  Date: ${p.date}, CardID: ${p.card_id}, Valid: ${p.is_valid}`);
            });
        }
    }
    
    // 3. Check scraping state/logs table if possible
    // Assuming table name 'scraping_state' from the SQL file visible in context
    const { data: states, error: stateError } = await supabase
        .from('scraping_state')
        .select('*')
        .order('last_run_at', { ascending: false })
        .limit(5);
        
    if (stateError) {
        // Table might not exist or permission error
        console.log('Could not fetch scraping_state (might not exist):', stateError.message);
    } else {
        console.log('\nScraping State:');
        states.forEach(s => {
            console.log(`  ID: ${s.id}, Last Run: ${s.last_run_at}, Status: ${s.status}, Next Run: ${s.next_run_at}`);
        });
    }

    // 4. Check scraping logs if exists
    const { data: logs, error: logsError } = await supabase
        .from('scraping_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);

    if (!logsError && logs) {
        console.log('\nScraping Logs:');
        logs.forEach(l => {
            console.log(`  Started: ${l.started_at}, Finished: ${l.completed_at}, Status: ${l.status}, Cards: ${l.cards_processed}`);
        });
    }
}

checkStatus();
