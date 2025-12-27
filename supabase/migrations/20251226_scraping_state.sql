-- Scraping state table for batch processing
CREATE TABLE IF NOT EXISTS scraping_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    current_offset INTEGER DEFAULT 0,
    is_running BOOLEAN DEFAULT FALSE,
    last_run_at TIMESTAMPTZ,
    last_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial state
INSERT INTO scraping_state (id, current_offset, is_running)
VALUES ('current', 0, FALSE)
ON CONFLICT (id) DO NOTHING;
