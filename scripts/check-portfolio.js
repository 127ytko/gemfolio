const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables directly from file
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env.local:', e.message);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPortfolio() {
    console.log('Checking portfolios table...');

    const { data, error } = await supabase
        .from('portfolios')
        .select(`
            *,
            cards (
                name_en,
                name_ja,
                card_number
            )
        `);

    if (error) {
        console.error('Error fetching portfolios:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No portfolio entries found.');
    } else {
        console.log(`Found ${data.length} entries:`);
        data.forEach((entry, index) => {
            const cardName = entry.cards ? (entry.cards.name_ja || entry.cards.name_en) : 'Unknown Card';
            console.log(`${index + 1}. User: ${entry.user_id}`);
            console.log(`   Card: ${cardName} (${entry.cards?.card_number})`);
            console.log(`   Price: ${entry.purchase_price}, Qty: ${entry.quantity}, Condition: ${entry.condition}`);
            console.log('---');
        });
    }
}

checkPortfolio();
