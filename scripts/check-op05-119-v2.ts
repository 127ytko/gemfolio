import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // DB Check
    const { data: dbCards } = await supabase.from('cards')
        .select('card_id, card_number, name_ja, image_url')
        .or('card_number.eq.OP05-119, slug.ilike.%OP05-119%');

    console.log('--- DB Records ---');
    dbCards?.forEach(c => {
        console.log(`ID: ${c.card_id}`);
        console.log(`Num: ${c.card_number}`);
        console.log(`Name: ${c.name_ja}`);
        console.log(`Img: ${c.image_url?.split('/').pop()}`);
        console.log('---');
    });

    // Storage Check
    const { data: files } = await supabase.storage.from('card-images').list('', { search: 'OP05-119' });
    console.log('\n--- Storage Files ---');
    files?.forEach(f => console.log(f.name));
}
check();
