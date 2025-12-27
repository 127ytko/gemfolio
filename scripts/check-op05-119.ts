import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- DB Check ---');
    const { data: dbCards } = await supabase.from('cards')
        .select('card_id, card_number, name_en, name_ja, image_url')
        .eq('card_number', 'OP05-119');
    console.log(JSON.stringify(dbCards, null, 2));

    console.log('\n--- Storage Check ---');
    const { data: files } = await supabase.storage.from('card-images').list('', { search: 'OP05-119' });
    console.log(files ? files.map(f => f.name) : 'No files found');
}
check();
