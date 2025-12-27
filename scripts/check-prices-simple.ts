import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count } = await supabase.from('price_history').select('*', { count: 'exact', head: true });
    console.log('Total price records:', count);

    const { data } = await supabase.from('price_history').select('date').order('date', { ascending: false }).limit(1);
    console.log('Latest date:', data && data.length > 0 ? data[0].date : 'None');
}
check();
