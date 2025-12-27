import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = 'card-images';

async function fixImageUrls() {
    console.log('Fetching cards from DB...');
    // Fetch all card IDs
    const { data: cards, error: dbError } = await supabase
        .from('cards')
        .select('card_id');

    if (dbError) {
        console.error('DB Error:', dbError);
        return;
    }

    console.log(`Found ${cards.length} cards. Mapping images by card_id...`);

    // List all files in storage
    const { data: files, error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1000 });

    if (storageError) {
        console.error('Storage Error:', storageError);
        return;
    }

    const fileMap = new Map(); // filename -> full filename
    files.forEach(f => fileMap.set(f.name, f.name));

    let successCount = 0;
    let failCount = 0;

    for (const card of cards) {
        // Construct filename candidates based on card_id
        const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
        let matchedFile = null;

        for (const ext of extensions) {
            const candidate = `${card.card_id}${ext}`;
            if (fileMap.has(candidate)) {
                matchedFile = candidate;
                break;
            }
        }

        if (matchedFile) {
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(matchedFile);

            const { error: updateError } = await supabase
                .from('cards')
                .update({ image_url: publicUrl })
                .eq('card_id', card.card_id);

            if (updateError) {
                console.error(`Failed update for ${card.card_id}:`, updateError.message);
                failCount++;
            } else {
                console.log(`Updated ${card.card_id} -> ${matchedFile}`);
                successCount++;
            }
        }
    }

    console.log('-----------------------------------');
    console.log(`Finished. Updated: ${successCount}, Failed: ${failCount}`);
}

fixImageUrls();
