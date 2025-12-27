const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// UUID生成
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Load env
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_CARDS = [
    {
        card_id: uuidv4(),
        card_number: 'OP02-013',
        slug: 'op02-013-portgas-d-ace-manga',
        name_ja: 'ポートガス・D・エース',
        name_en: 'Portgas D. Ace',
        set_name_ja: '頂上決戦',
        set_name_en: 'Paramount War',
        rarity_en: 'Manga Rare',
        price_raw_avg: 850.00,
        price_raw_change_weekly: 12.5,
        image_url: 'https://img.yuyutei.jp/card_image/op/02/13.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP03-122',
        slug: 'op03-122-sogeking-manga',
        name_ja: 'そげキング',
        name_en: 'Sogeking',
        set_name_ja: '強大な敵',
        set_name_en: 'Pillars of Strength',
        rarity_en: 'Manga Rare',
        price_raw_avg: 420.00,
        price_raw_change_weekly: 8.2,
        image_url: 'https://img.yuyutei.jp/card_image/op/03/122.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP05-060',
        slug: 'op05-060-monkey-d-luffy-manga',
        name_ja: 'モンキー・D・ルフィ',
        name_en: 'Monkey D. Luffy',
        set_name_ja: '新時代の主役',
        set_name_en: 'Awakening of the New Era',
        rarity_en: 'Manga Rare',
        price_raw_avg: 2800.00,
        price_raw_change_weekly: 5.4,
        image_url: 'https://img.yuyutei.jp/card_image/op/05/60.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP05-074',
        slug: 'op05-074-eustass-kid-manga',
        name_ja: 'ユースタス・キッド',
        name_en: 'Eustass Kid',
        set_name_ja: '新時代の主役',
        set_name_en: 'Awakening of the New Era',
        rarity_en: 'Manga Rare',
        price_raw_avg: 950.00,
        price_raw_change_weekly: 4.1,
        image_url: 'https://img.yuyutei.jp/card_image/op/05/74.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP08-118',
        slug: 'op08-118-silvers-rayleigh-manga',
        name_ja: 'シルバーズ・レイリー',
        name_en: 'Silvers Rayleigh',
        set_name_ja: '二つの伝説',
        set_name_en: 'Two Legends',
        rarity_en: 'Manga Rare',
        price_raw_avg: 1100.00,
        price_raw_change_weekly: 3.8,
        image_url: 'https://img.yuyutei.jp/card_image/op/08/118.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP09-001',
        slug: 'op09-001-shanks-manga',
        name_ja: 'シャンクス',
        name_en: 'Shanks',
        set_name_ja: '新たなる皇帝',
        set_name_en: 'The Four Emperors',
        rarity_en: 'Manga Rare',
        price_raw_avg: 1500.00,
        price_raw_change_weekly: 2.5,
        image_url: 'https://img.yuyutei.jp/card_image/op/09/001.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP01-001',
        slug: 'op01-001-roronoa-zoro-leader',
        name_ja: 'ロロノア・ゾロ',
        name_en: 'Roronoa Zoro',
        set_name_ja: 'ROMANCE DAWN',
        set_name_en: 'ROMANCE DAWN',
        rarity_en: 'Leader',
        price_raw_avg: 150.00,
        price_raw_change_weekly: -1.2,
        image_url: 'https://img.yuyutei.jp/card_image/op/01/001.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP02-004',
        slug: 'op02-004-edward-newgate-leader',
        name_ja: 'エドワード・ニューゲート',
        name_en: 'Edward Newgate',
        set_name_ja: '頂上決戦',
        set_name_en: 'Paramount War',
        rarity_en: 'Leader',
        price_raw_avg: 120.00,
        price_raw_change_weekly: -0.5,
        image_url: 'https://img.yuyutei.jp/card_image/op/02/004.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP09-004',
        slug: 'op09-004-lim',
        name_ja: 'リム',
        name_en: 'Lim',
        set_name_ja: '新たなる皇帝',
        set_name_en: 'The Four Emperors',
        rarity_en: 'SR',
        price_raw_avg: 45.00,
        price_raw_change_weekly: 15.2,
        image_url: 'https://img.yuyutei.jp/card_image/op/09/004.jpg'
    },
    {
        card_id: uuidv4(),
        card_number: 'OP01-016',
        slug: 'op01-016-nami',
        name_ja: 'ナミ',
        name_en: 'Nami',
        set_name_ja: 'ROMANCE DAWN',
        set_name_en: 'ROMANCE DAWN',
        rarity_en: 'R',
        price_raw_avg: 25.00,
        price_raw_change_weekly: 0.8,
        image_url: 'https://img.yuyutei.jp/card_image/op/01/016.jpg'
    }
];

async function restoreData() {
    console.log('Restoring demo data...');

    for (const card of DEMO_CARDS) {
        const { error } = await supabase.from('cards').upsert(card, { onConflict: 'slug' });
        if (error) {
            console.error(`Error adding ${card.name_en}:`, error.message);
        } else {
            console.log(`✅ Added ${card.name_en}`);
        }
    }

    console.log('Restoration complete!');
}

restoreData();
