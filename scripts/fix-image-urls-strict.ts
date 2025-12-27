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
    // Fetch all card numbers
    const { data: cards, error: dbError } = await supabase
        .from('cards')
        .select('card_id, card_number');

    if (dbError) {
        console.error('DB Error:', dbError);
        return;
    }

    console.log(`Found ${cards.length} cards. Checking storage for "-00" images...`);

    // List all files in storage (assuming < 1000 for now, or paginate if needed)
    // storage.list() default limit is 100. Need to increase.
    const { data: files, error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1000 });

    if (storageError) {
        console.error('Storage Error:', storageError);
        return;
    }

    const fileSet = new Set(files.map(f => f.name));
    let successCount = 0;
    let failCount = 0;

    for (const card of cards) {
        // Strict mapping: card_number + "-00.png" (or .jpg, etc)
        const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
        let foundFile = null;

        for (const ext of extensions) {
            const candidate = `${card.card_number}-00${ext}`;
            if (fileSet.has(candidate)) {
                foundFile = candidate;
                break;
            }
        }

        if (foundFile) {
            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(foundFile);

            // Update DB
            const { error: updateError } = await supabase
                .from('cards')
                .update({ image_url: publicUrl })
                .eq('card_id', card.card_id);

            if (updateError) {
                console.error(`Failed update for ${card.card_number}:`, updateError.message);
                failCount++;
            } else {
                console.log(`Updated ${card.card_number} -> ${foundFile}`);
                successCount++;
            }
        } else {
            // console.log(`No "-00" image found for ${card.card_number}`);
        }
    }

    console.log('-----------------------------------');
    console.log(`Finished. Updated: ${successCount}, Failed: ${failCount}`);
}

fixImageUrls();
