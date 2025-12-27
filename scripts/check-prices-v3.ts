import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking market_prices_raw...');
    const { count: rawCount } = await supabase.from('market_prices_raw').select('*', { count: 'exact', head: true });
    console.log('Raw Records:', rawCount);

    const { data: rawData } = await supabase.from('market_prices_raw').select('recorded_at').order('recorded_at', { ascending: false }).limit(1);
    console.log('Latest Raw:', rawData?.[0]?.recorded_at ?? 'None');

    console.log('\nChecking market_prices_psa10...');
    const { count: psaCount } = await supabase.from('market_prices_psa10').select('*', { count: 'exact', head: true });
    console.log('PSA10 Records:', psaCount);

    const { data: psaData } = await supabase.from('market_prices_psa10').select('recorded_at').order('recorded_at', { ascending: false }).limit(1);
    console.log('Latest PSA10:', psaData?.[0]?.recorded_at ?? 'None');
}

check();
