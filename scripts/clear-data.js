const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数を読み込む（dotenvは使わない前提で、.env.localを解析）
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
        console.error('Error loading .env.local:', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
    console.log('Clearing all data from database...');

    // Delete related tables first
    console.log('- Deleting portfolio entries...');
    const { error: portfolioError } = await supabase.from('portfolios').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (portfolioError) console.error('Error clearing portfolios:', portfolioError);

    console.log('- Deleting market prices (PSA10)...');
    const { error: psa10Error } = await supabase.from('market_prices_psa10').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (psa10Error) console.error('Error clearing market_prices_psa10:', psa10Error);

    console.log('- Deleting market prices (Raw)...');
    const { error: rawError } = await supabase.from('market_prices_raw').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (rawError) console.error('Error clearing market_prices_raw:', rawError);

    console.log('- Deleting favorites...');
    const { error: favError } = await supabase.from('favorites').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (favError) console.error('Error clearing favorites:', favError);

    // Delete cards last
    console.log('- Deleting cards...');
    const { error: cardsError } = await supabase.from('cards').delete().neq('card_id', '00000000-0000-0000-0000-000000000000');
    if (cardsError) console.error('Error clearing cards:', cardsError);

    console.log('Data cleanup complete!');
}

clearData();
