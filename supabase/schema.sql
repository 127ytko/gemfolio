-- ============================================
-- GemFolio Database Schema v2
-- グローバル対応（多通貨・多言語）トレカ投資管理
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Profiles（ユーザープロファイル）
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    currency_preference TEXT DEFAULT 'USD' CHECK (currency_preference IN ('USD', 'JPY', 'EUR', 'GBP')),
    language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'ja')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- Assets（ユーザー保有資産）
-- ============================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    
    -- Card/Box Information
    name TEXT NOT NULL,              -- "Charizard ex", "Pikachu VMAX"
    set_name TEXT,                   -- "Obsidian Flames", "Vivid Voltage"
    image_url TEXT,                  -- Card image URL
    
    -- Financial Data
    purchase_price DECIMAL(12, 2) NOT NULL,  -- Purchase price
    current_value DECIMAL(12, 2) NOT NULL,   -- Current market value
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY', 'EUR', 'GBP')),
    
    -- Quantity and Condition
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    condition TEXT,                  -- 'PSA 10', 'BGS 9.5', 'Raw', 'Sealed Box'
    
    -- Type
    type TEXT DEFAULT 'card' CHECK (type IN ('card', 'box', 'pack', 'accessory')),
    
    -- Timestamps
    purchase_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON assets
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for fast queries
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(user_id, type);

-- ============================================
-- Exchange Rates（為替レート）
-- ============================================
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate DECIMAL(20, 10) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(base_currency, target_currency, recorded_at)
);

CREATE INDEX idx_exchange_rates_lookup ON exchange_rates(base_currency, target_currency, recorded_at DESC);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views for Dashboard
-- ============================================

-- Portfolio Summary View
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
    a.user_id,
    COUNT(DISTINCT a.id) as total_items,
    SUM(a.quantity) as total_quantity,
    SUM(a.purchase_price * a.quantity) as total_cost,
    SUM(a.current_value * a.quantity) as total_value,
    SUM(a.current_value * a.quantity) - SUM(a.purchase_price * a.quantity) as total_profit
FROM assets a
GROUP BY a.user_id;

-- ============================================
-- Sample Exchange Rates
-- ============================================
INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES
('USD', 'JPY', 149.50),
('USD', 'EUR', 0.92),
('USD', 'GBP', 0.79),
('JPY', 'USD', 0.00669);
