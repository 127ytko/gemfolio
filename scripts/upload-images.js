const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

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
const BUCKET_NAME = 'card-images';
// Argument 1: Image folder path (default: ./scripts/data/images)
const TARGET_DIR = process.argv[2] || path.join(__dirname, 'data', 'images');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SERVICE_ROLE_KEY are required in .env');
    console.error('Please create a .env file with your Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const getContentType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.webp': return 'image/webp';
        case '.gif': return 'image/gif';
        default: return 'application/octet-stream';
    }
};

async function uploadImages() {
    console.log('=========================================');
    console.log('GemFolio Image Uploader');
    console.log('=========================================');
    console.log(`Using Bucket: ${BUCKET_NAME}`);
    console.log(`Scanning directory: ${TARGET_DIR}`);

    if (!fs.existsSync(TARGET_DIR)) {
        console.error(`Directory not found: ${TARGET_DIR}`);
        console.log('Please create the directory and place your images inside.');
        return;
    }

    // Recursive function to get all files
    function getAllFiles(dirPath, arrayOfFiles) {
        let files = fs.readdirSync(dirPath);

        arrayOfFiles = arrayOfFiles || [];

        files.forEach(function (file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
            } else {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        });

        return arrayOfFiles;
    }

    const allFiles = getAllFiles(TARGET_DIR, []);
    const imageFiles = allFiles.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

    console.log(`Found ${imageFiles.length} image files in total (including subdirectories).`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const filePath of imageFiles) {
        // Extract filename for storage path (flattened or keep structure?)
        // User asked if folders are OK. Usually we want to flatten for simple ID lookup OR keep structure.
        // But the previous requirement was "file_id.jpg".
        // If we keep structure, the URL would be ".../pokemon/OP01.jpg".
        // But the sync script assumes ".../OP01.jpg".
        // So we should FLATTEN the structure: upload "pokemon/OP01.jpg" as "OP01.jpg" to the root of bucket.
        // WARNING: This assumes file names are unique across folders!

        const fileName = path.basename(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const contentType = getContentType(fileName);

        try {
            // Check if file exists in storage
            const { data: existingFiles } = await supabase
                .storage
                .from(BUCKET_NAME)
                .list('', { search: fileName, limit: 1 });

            const exists = existingFiles && existingFiles.find(f => f.name === fileName);

            if (exists) {
                console.log(`[SKIP] ${fileName} already exists.`);
                skipCount++;
                continue;
            }

            console.log(`[UPLOAD] Uploading ${fileName}...`);
            const { data, error } = await supabase
                .storage
                .from(BUCKET_NAME)
                .upload(fileName, fileBuffer, { // Upload to root with filename
                    contentType: contentType,
                    upsert: false
                });

            if (error) {
                console.error(`[ERROR] Failed to upload ${fileName}:`, error.message);
                failCount++;
            } else {
                const { data: publicData } = supabase
                    .storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(fileName);

                console.log(`[SUCCESS] URL: ${publicData.publicUrl}`);
                successCount++;
            }
        } catch (err) {
            console.error(`[ERROR] Unexpected error processing ${fileName}:`, err.message);
            failCount++;
        }
    }

    console.log('-----------------------------------------');
    console.log('Upload Summary:');
    console.log(`  Success: ${successCount}`);
    console.log(`  Skipped: ${skipCount}`);
    console.log(`  Failed:  ${failCount}`);
    console.log('-----------------------------------------');
}

uploadImages();
