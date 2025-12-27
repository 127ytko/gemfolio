-- Migration: Price History Table for 52-week trend charts
-- Created: 2024-12-19
-- Purpose: Store weekly price snapshots for trend visualization

-- ============================================
-- Price History Table
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT NOT NULL REFERENCES card_master(file_id) ON DELETE CASCADE,
    price_jp INTEGER NOT NULL,
    price_global INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    week_of_year INTEGER NOT NULL,  -- 1-52
    year INTEGER NOT NULL,          -- 2024, 2025, etc.
    
    -- Unique constraint: one price per card per week
    CONSTRAINT unique_card_week_year UNIQUE (file_id, year, week_of_year)
);

-- Index for fast lookups
CREATE INDEX idx_price_history_file_id ON price_history(file_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at DESC);
CREATE INDEX idx_price_history_card_time ON price_history(file_id, year DESC, week_of_year DESC);

-- RLS Policies
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Public read access (for PRO feature display)
CREATE POLICY "price_history_public_read" ON price_history
    FOR SELECT USING (true);

-- Service role write access (for scraping updates)
CREATE POLICY "price_history_service_write" ON price_history
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Cleanup Function: Remove data older than 1 year
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_price_history()
RETURNS void AS $$
BEGIN
    DELETE FROM price_history
    WHERE recorded_at < NOW() - INTERVAL '1 year';
    
    RAISE NOTICE 'Cleaned up price history older than 1 year';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- View: Latest 52 weeks for a card
-- ============================================
CREATE OR REPLACE VIEW card_price_trend AS
SELECT 
    ph.file_id,
    cm.name_jp,
    cm.name_en,
    cm.card_number,
    ph.price_jp,
    ph.recorded_at,
    ph.week_of_year,
    ph.year,
    ROW_NUMBER() OVER (PARTITION BY ph.file_id ORDER BY ph.year DESC, ph.week_of_year DESC) as weeks_ago
FROM price_history ph
JOIN card_master cm ON cm.file_id = ph.file_id
WHERE ph.recorded_at > NOW() - INTERVAL '1 year'
ORDER BY ph.file_id, ph.year DESC, ph.week_of_year DESC;

-- Grant access
GRANT SELECT ON card_price_trend TO anon, authenticated;

-- ============================================
-- Comment
-- ============================================
COMMENT ON TABLE price_history IS 'Weekly price snapshots for trend charts. Data older than 1 year is automatically cleaned up.';
COMMENT ON COLUMN price_history.week_of_year IS 'ISO week number (1-52)';
