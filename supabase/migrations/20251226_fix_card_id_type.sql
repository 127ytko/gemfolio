-- ============================================
-- GemFolio Schema Fix - Change card_id to TEXT
-- 2024-12-26 - card_idはイラスト違いを区別するためTEXT型に変更
-- 例: OP01-120-00 (通常), OP01-120-prb01 (パラレル)
-- ============================================

-- Drop dependent views first
DROP VIEW IF EXISTS top_performers_psa10;
DROP VIEW IF EXISTS top_performers_raw;
DROP VIEW IF EXISTS portfolio_summary;

-- Drop dependent tables' foreign keys
ALTER TABLE market_prices_raw DROP CONSTRAINT IF EXISTS market_prices_raw_card_id_fkey;
ALTER TABLE market_prices_psa10 DROP CONSTRAINT IF EXISTS market_prices_psa10_card_id_fkey;
ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_card_id_fkey;
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_card_id_fkey;

-- Change card_id type in cards table
ALTER TABLE cards ALTER COLUMN card_id TYPE TEXT USING card_id::TEXT;

-- Change card_id type in related tables
ALTER TABLE market_prices_raw ALTER COLUMN card_id TYPE TEXT USING card_id::TEXT;
ALTER TABLE market_prices_psa10 ALTER COLUMN card_id TYPE TEXT USING card_id::TEXT;
ALTER TABLE portfolios ALTER COLUMN card_id TYPE TEXT USING card_id::TEXT;
ALTER TABLE favorites ALTER COLUMN card_id TYPE TEXT USING card_id::TEXT;

-- Re-add foreign keys
ALTER TABLE market_prices_raw 
    ADD CONSTRAINT market_prices_raw_card_id_fkey 
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE;

ALTER TABLE market_prices_psa10 
    ADD CONSTRAINT market_prices_psa10_card_id_fkey 
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE;

ALTER TABLE portfolios 
    ADD CONSTRAINT portfolios_card_id_fkey 
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE;

ALTER TABLE favorites 
    ADD CONSTRAINT favorites_card_id_fkey 
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE;

-- Recreate views
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
    p.user_id,
    COUNT(DISTINCT p.id) as total_items,
    SUM(p.quantity) as total_quantity,
    SUM(p.purchase_price * p.quantity) as total_cost,
    SUM(
        CASE 
            WHEN p.condition = 'RAW' THEN COALESCE(c.price_raw_avg, 0)
            WHEN p.condition = 'PSA10' THEN COALESCE(c.price_psa10_avg, 0)
            ELSE COALESCE(c.price_raw_avg, 0)
        END * p.quantity
    ) as total_value
FROM portfolios p
LEFT JOIN cards c ON p.card_id = c.card_id
GROUP BY p.user_id;

CREATE OR REPLACE VIEW top_performers_raw AS
SELECT 
    card_id,
    slug,
    card_number,
    name_ja,
    name_en,
    image_url,
    price_raw_avg as price_avg,
    price_raw_change_weekly as price_change_weekly,
    'RAW' as condition
FROM cards
WHERE price_raw_avg IS NOT NULL AND price_raw_change_weekly IS NOT NULL
ORDER BY price_raw_change_weekly DESC
LIMIT 10;

CREATE OR REPLACE VIEW top_performers_psa10 AS
SELECT 
    card_id,
    slug,
    card_number,
    name_ja,
    name_en,
    image_url,
    price_psa10_avg as price_avg,
    price_psa10_change_weekly as price_change_weekly,
    'PSA10' as condition
FROM cards
WHERE price_psa10_avg IS NOT NULL AND price_psa10_change_weekly IS NOT NULL
ORDER BY price_psa10_change_weekly DESC
LIMIT 10;
