const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
if (fs.existsSync(path.join(process.cwd(), '.env'))) {
    dotenv.config();
} else if (fs.existsSync(path.join(process.cwd(), '.env.txt'))) {
    dotenv.config({ path: '.env.txt' });
    console.log('Loaded credentials from .env.txt');
} else {
    dotenv.config();
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

// Default Path (can be file or directory)
const TARGET_PATH = process.argv[2] || './scripts/data';
// Table name to sync to.
const TABLE_NAME = 'assets';

console.log('--- Debug Info ---');
console.log(`SUPABASE_URL: ${SUPABASE_URL ? SUPABASE_URL.substring(0, 10) + '...' : 'MISSING'}`);
console.log(`SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? 'Present (Length: ' + SERVICE_ROLE_KEY.length + ')' : 'MISSING'}`);
console.log(`Target Path: ${TARGET_PATH}`);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SERVICE_ROLE_KEY are required in .env');
    process.exit(1);
}

let supabase;
try {
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
} catch (error) {
    console.error('Failed to initialize Supabase client:', error.message);
    process.exit(1);
}

// Base URL for storage
const STORAGE_BUCKET = 'card-images';
const IMAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`;

function getCsvFiles(dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'images') { // Skip images folder just in case
                arrayOfFiles = getCsvFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (file.toLowerCase().endsWith('.csv')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function processCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => rows.push(data))
            .on('end', () => resolve(rows))
            .on('error', (err) => reject(err));
    });
}

async function syncAssets() {
    console.log('=========================================');
    console.log('GemFolio Data Syncer');
    console.log('=========================================');
    console.log(`Target Path: ${TARGET_PATH}`);

    let targetFiles = [];

    if (fs.existsSync(TARGET_PATH)) {
        if (fs.statSync(TARGET_PATH).isDirectory()) {
            targetFiles = getCsvFiles(TARGET_PATH, []);
        } else if (TARGET_PATH.toLowerCase().endsWith('.csv')) {
            targetFiles.push(TARGET_PATH);
        }
    } else {
        console.error(`Path not found: ${TARGET_PATH}`);
        return;
    }

    if (targetFiles.length === 0) {
        console.log('No CSV files found.');
        return;
    }

    console.log(`Found ${targetFiles.length} CSV file(s):`);
    targetFiles.forEach(f => console.log(` - ${path.basename(f)}`));

    let totalSuccess = 0;
    let totalFail = 0;

    for (const file of targetFiles) {
        console.log(`\nProcessing ${path.basename(file)}...`);
        try {
            const rows = await processCsvFile(file);
            console.log(`Parsed ${rows.length} rows.`);

            for (const row of rows) {
                const id = row.file_id || row.id;

                if (!id) {
                    continue;
                }

                // Construct Image URL
                // Check if row has 'image_ext' or similar, else default to .jpg
                // Also can check if 'image_name' is provided.
                // Defaulting to id.jpg as per previous req.
                const imageUrl = `${IMAGE_BASE_URL}${id}.jpg`;

                const dbRecord = {
                    ...row,
                    file_id: id,
                    image_url: imageUrl,
                    updated_at: new Date().toISOString()
                };

                delete dbRecord.id;

                // console.log(`[SYNC] Processing ${id}...`); // Reduced log spam

                const { error } = await supabase
                    .from(TABLE_NAME)
                    .upsert(dbRecord, {
                        onConflict: 'file_id',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error(`[ERROR] Failed to sync ${id}:`, error.message);
                    totalFail++;
                } else {
                    process.stdout.write('.'); // Progress dot
                    totalSuccess++;
                }
            }
        } catch (err) {
            console.error(`Error processing file ${file}:`, err);
        }
    }

    console.log('\n-----------------------------------------');
    console.log('Sync Summary (All Files):');
    console.log(`  Success: ${totalSuccess}`);
    console.log(`  Failed:  ${totalFail}`);
    console.log('-----------------------------------------');
}

syncAssets();
