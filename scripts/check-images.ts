import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingImages() {
    // Get all EB cards
    const { data: cards, error } = await supabase
        .from('assets')
        .select('file_id, card_number, name_en, image_url')
        .or('card_number.ilike.EB%,card_number.ilike.OP01%')
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Cards and their image URLs:\n');
    for (const card of cards || []) {
        console.log(`${card.file_id} (${card.card_number} - ${card.name_en})`);
        console.log(`  -> ${card.image_url}\n`);
    }
}

checkMissingImages();
