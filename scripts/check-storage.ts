import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.localを読む
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking bucket: card-images');
    const { data, error } = await supabase.storage.from('card-images').list('', { limit: 100 });
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(`Found ${data.length} files.`);
    if (data.length > 0) {
        console.log('First 10 files:', data.slice(0, 10).map(f => f.name));
    }
}
check();
