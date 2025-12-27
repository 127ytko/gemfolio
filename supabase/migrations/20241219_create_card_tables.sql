-- Migration: Create card_master and price_cache tables
-- Created: 2024-12-19
-- Purpose: Server-side card master data and price caching for scraping

-- ============================================
-- Table: card_master
-- Purpose: Server-side master data for all cards
-- ============================================

CREATE TABLE IF NOT EXISTS card_master (
    -- Primary Key
    file_id TEXT PRIMARY KEY,
    
    -- Card Identification
    card_number TEXT NOT NULL,
    
    -- Bilingual Names
    name_jp TEXT NOT NULL,
    name_en TEXT NOT NULL,
    set_name_jp TEXT NOT NULL,
    set_name_en TEXT NOT NULL,
    
    -- Rarity (for filtering)
    rarity_jp TEXT,
    rarity_en TEXT,
    
    -- Variant info (internal)
    variant_note TEXT,
    
    -- External References
    reference_url TEXT,
    scrape_url TEXT,                    -- URL for price scraping (e.g., TCG Raftel)
    
    -- Game Type
    game_type TEXT NOT NULL DEFAULT 'one_piece',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_card_master_game_type ON card_master(game_type);
CREATE INDEX IF NOT EXISTS idx_card_master_card_number ON card_master(card_number);

-- Comment for documentation
COMMENT ON TABLE card_master IS 'Master data for all trading cards (ONE PIECE, Pokemon, etc.)';
COMMENT ON COLUMN card_master.scrape_url IS 'URL for price scraping (e.g., TCG Raftel product page)';

-- ============================================
-- Table: price_cache
-- Purpose: Cached price data from scraping
-- ============================================

CREATE TABLE IF NOT EXISTS price_cache (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to card_master
    file_id TEXT NOT NULL REFERENCES card_master(file_id) ON DELETE CASCADE,
    
    -- Price Data
    price_jp INTEGER,                   -- Japanese market price (JPY)
    price_global INTEGER,               -- Global market price (USD)
    
    -- Scraping Metadata
    source_url TEXT,                    -- URL that was scraped
    raw_price_text TEXT,                -- Raw text extracted from page
    
    -- Timestamps
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one cache entry per card
    CONSTRAINT unique_file_id UNIQUE (file_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_price_cache_file_id ON price_cache(file_id);
CREATE INDEX IF NOT EXISTS idx_price_cache_scraped_at ON price_cache(scraped_at);

-- Comment for documentation
COMMENT ON TABLE price_cache IS 'Cached price data from web scraping (updated weekly)';
COMMENT ON COLUMN price_cache.scraped_at IS 'Timestamp of last successful scrape';

-- ============================================
-- Trigger: Auto-update updated_at on card_master
-- ============================================

CREATE OR REPLACE FUNCTION update_card_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_card_master_updated_at
    BEFORE UPDATE ON card_master
    FOR EACH ROW
    EXECUTE FUNCTION update_card_master_updated_at();

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================

-- Enable RLS
ALTER TABLE card_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

-- card_master: Public read access (everyone can view cards)
CREATE POLICY "card_master_public_read" ON card_master
    FOR SELECT USING (true);

-- card_master: Only authenticated users with admin role can modify
-- (For now, we'll leave insert/update open for development)
CREATE POLICY "card_master_authenticated_insert" ON card_master
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "card_master_authenticated_update" ON card_master
    FOR UPDATE TO authenticated USING (true);

-- price_cache: Public read access
CREATE POLICY "price_cache_public_read" ON price_cache
    FOR SELECT USING (true);

-- price_cache: Service role can insert/update (for Edge Functions)
CREATE POLICY "price_cache_service_insert" ON price_cache
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "price_cache_service_update" ON price_cache
    FOR UPDATE TO service_role USING (true);
