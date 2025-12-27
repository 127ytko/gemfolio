-- Migration: Create market_price_history table for price tracking
-- Created: 2025-12-21

-- ============================================
-- 0. Ensure assets table has price columns
-- ============================================
ALTER TABLE assets ADD COLUMN IF NOT EXISTS price_raw BIGINT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS price_psa10 BIGINT;

-- ============================================
-- 0.1 Assets Table RLS (Critical for Search)
-- ============================================
-- Enable RLS just in case it's not
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Allow public read access ONLY to master data (where user_id is NULL)
-- This prevents users from seeing each other's portfolio items
CREATE POLICY "Public read master assets"
ON assets FOR SELECT
TO anon, authenticated
USING (user_id IS NULL);

-- Ensure users can still see their own items (idempotent-ish check not possible easily in SQL, 
-- but this policy is standard. If it exists, this might fail, so usually we check existence or catch error,
-- but for plain SQL migration file, we just add it. If it fails due to duplicate, clean up manually.)
-- Assuming "User can see own assets" might already exist, we'll use a unique name just in case
CREATE POLICY "User read own assets policy_v2"
ON assets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 1. Create Table
-- ============================================
CREATE TABLE IF NOT EXISTS market_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id TEXT NOT NULL, -- Logical link to assets table (file_id)
    price_raw BIGINT,       -- Raw card price
    price_psa10 BIGINT,     -- PSA10 card price
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create Indexes for Performance
-- ============================================
CREATE INDEX idx_market_price_history_asset_id ON market_price_history(asset_id);
CREATE INDEX idx_market_price_history_recorded ON market_price_history(recorded_at DESC);

-- ============================================
-- 3. Enable RLS (Row Level Security)
-- ============================================
ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Set Policies
-- ============================================

-- Policy: Authenticated users can read price history
CREATE POLICY "Allow public read access" ON market_price_history
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only service_role can insert/update (for security)
CREATE POLICY "Allow service_role write access" ON market_price_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 5. Comment
-- ============================================
COMMENT ON TABLE market_price_history IS 'Stores historical price data for assets to build trend charts.';
