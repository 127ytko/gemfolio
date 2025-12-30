-- Add eBay price columns to cards table
-- Description: Adds columns to store eBay specific prices and urls

ALTER TABLE cards
ADD COLUMN IF NOT EXISTS price_ebay_raw NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_ebay_psa10 NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ebay_listing_url_raw TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ebay_listing_url_psa10 TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_ebay_scraped_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN cards.price_ebay_raw IS 'Average/Lowest eBay price for Raw condition (USD)';
COMMENT ON COLUMN cards.price_ebay_psa10 IS 'Average/Lowest eBay price for PSA10 condition (USD)';
COMMENT ON COLUMN cards.ebay_listing_url_raw IS 'URL to the eBay listing for Raw';
COMMENT ON COLUMN cards.ebay_listing_url_psa10 IS 'URL to the eBay listing for PSA10';
COMMENT ON COLUMN cards.last_ebay_scraped_at IS 'Timestamp when eBay prices were last updated';
