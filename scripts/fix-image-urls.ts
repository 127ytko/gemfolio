import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = 'card-images';

async function fixImageUrls() {
    console.log('Fetching files from storage...');
    const { data: files, error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1000 }); // Assuming < 1000 files

    if (storageError) {
        console.error('Storage Error:', storageError);
        return;
    }

    console.log(`Found ${files.length} files. Starting DB update...`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        // Filename example: "OP07-051-00.png" or "OP01-120-prb01.png"
        // Target Card Number: "OP07-051" or "OP01-120"

        // Match the pattern "XX00-000" at the start
        const match = file.name.match(/^([A-Z0-9]+-[0-9]+)/);

        if (!match) {
            console.warn(`Skipping ${file.name}: Could not parse card number`);
            continue;
        }

        const cardNumber = match[1];

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(file.name);

        // Update DB
        // We match exactly on card_number first.
        const { error: updateError } = await supabase
            .from('cards')
            .update({ image_url: publicUrl })
            .eq('card_number', cardNumber);

        if (updateError) {
            console.error(`Failed update for ${cardNumber}:`, updateError.message);
            failCount++;
        } else {
            console.log(`Updated ${cardNumber} -> ${publicUrl}`);
            successCount++;
        }
    }

    console.log('-----------------------------------');
    console.log(`Finished. Success: ${successCount}, Fail: ${failCount}`);
}

fixImageUrls();
