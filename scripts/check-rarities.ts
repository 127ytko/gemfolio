import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const { data } = await supabase.from('cards').select('rarity_en');
    const unique = [...new Set(data?.map(c => c.rarity_en))];
    console.log('Rarity types:', unique);
}
check();
