import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // wait for connection
    await new Promise(r => setTimeout(r, 1000));

    const { count: rawCount } = await supabase.from('market_prices_raw').select('*', { count: 'exact', head: true });

    const { data: rawData } = await supabase.from('market_prices_raw').select('recorded_at').order('recorded_at', { ascending: false }).limit(1);

    console.log(`RESULT_RAW_COUNT:${rawCount}`);
    console.log(`RESULT_RAW_LATEST:${rawData?.[0]?.recorded_at ?? 'None'}`);
}
check();
