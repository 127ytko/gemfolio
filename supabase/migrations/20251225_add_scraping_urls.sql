-- ============================================
-- GemFolio Schema Update - Add Scraping URLs
-- 2024-12-25 - Add 6 scraping URLs (3 Raw + 3 PSA10)
-- ============================================

-- Add scraping URL columns for Raw (3 sites)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scrape_url_raw_1 TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scrape_url_raw_2 TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scrape_url_raw_3 TEXT;

-- Add scraping URL columns for PSA10 (3 sites)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scrape_url_psa10_1 TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scrape_url_psa10_2 TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scrape_url_psa10_3 TEXT;

-- Add individual price columns for Raw (3 sites)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_raw_1 DECIMAL(12, 2);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_raw_2 DECIMAL(12, 2);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_raw_3 DECIMAL(12, 2);

-- Add individual price columns for PSA10 (3 sites)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_psa10_1 DECIMAL(12, 2);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_psa10_2 DECIMAL(12, 2);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_psa10_3 DECIMAL(12, 2);

-- Remove old scraping URL columns if they exist
ALTER TABLE cards DROP COLUMN IF EXISTS scrape_url_raw;
ALTER TABLE cards DROP COLUMN IF EXISTS scrape_url_psa10;
