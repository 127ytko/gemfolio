-- Migration: Add scrape_url column to assets table
-- Created: 2024-12-19
-- Purpose: Store price scraping target URL for each card

-- Add scrape_url column for price scraping target URL
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS scrape_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN assets.scrape_url IS 'URL for price scraping (e.g., TCG Raftel product page)';
