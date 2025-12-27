-- ============================================
-- GemFolio Database Migration v3
-- 2024-12-25 - Full Schema Update
-- Raw/PSA10対応、お気に入り、サブスクリプション追加
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CARDS TABLE (カードマスター)
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
    card_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_number TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    
    -- Names (Bilingual)
    name_ja TEXT,
    name_en TEXT,
    
    -- Set Info (Bilingual)
    set_name_ja TEXT,
    set_name_en TEXT,
    
    -- Rarity (Bilingual)
    rarity_ja TEXT,
    rarity_en TEXT,
    
    -- Image
    image_url TEXT,
    
    -- Scraping Sources
    scrape_url_raw TEXT,
    scrape_url_psa10 TEXT,
    
    -- Raw Prices (USD)
    price_raw_avg DECIMAL(12, 2),
    price_raw_low DECIMAL(12, 2),
    price_raw_high DECIMAL(12, 2),
    
    -- PSA10 Prices (USD)
    price_psa10_avg DECIMAL(12, 2),
    price_psa10_low DECIMAL(12, 2),
    price_psa10_high DECIMAL(12, 2),
    
    -- Price Changes (Weekly %)
    price_raw_change_weekly DECIMAL(8, 2),
    price_psa10_change_weekly DECIMAL(8, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cards
CREATE INDEX IF NOT EXISTS idx_cards_slug ON cards(slug);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON cards(card_number);
CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_name_en);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity_en);

-- ============================================
-- 2. MARKET PRICES - RAW (Raw価格履歴)
-- ============================================
CREATE TABLE IF NOT EXISTS market_prices_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    price_avg DECIMAL(12, 2) NOT NULL,
    price_low DECIMAL(12, 2),
    price_high DECIMAL(12, 2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for market_prices_raw
CREATE INDEX IF NOT EXISTS idx_market_prices_raw_card ON market_prices_raw(card_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_raw_date ON market_prices_raw(card_id, recorded_at DESC);

-- ============================================
-- 3. MARKET PRICES - PSA10 (PSA10価格履歴)
-- ============================================
CREATE TABLE IF NOT EXISTS market_prices_psa10 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    price_avg DECIMAL(12, 2) NOT NULL,
    price_low DECIMAL(12, 2),
    price_high DECIMAL(12, 2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for market_prices_psa10
CREATE INDEX IF NOT EXISTS idx_market_prices_psa10_card ON market_prices_psa10(card_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_psa10_date ON market_prices_psa10(card_id, recorded_at DESC);

-- ============================================
-- 4. PROFILES TABLE (ユーザープロフィール)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    currency_preference TEXT DEFAULT 'USD' CHECK (currency_preference IN ('USD', 'JPY', 'EUR', 'GBP')),
    language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'ja')),
    email_notifications BOOLEAN DEFAULT true,
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
-- 5. PORTFOLIOS TABLE (ユーザーポートフォリオ)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    condition TEXT NOT NULL CHECK (condition IN ('RAW', 'PSA10', 'PSA9', 'PSA8', 'BGS10', 'BGS9.5', 'CGC10', 'OTHER')),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    purchase_price DECIMAL(12, 2) NOT NULL,
    purchase_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for portfolios
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_card ON portfolios(card_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_card ON portfolios(user_id, card_id);

-- RLS Policies for portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. FAVORITES TABLE (お気に入り)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_card ON favorites(card_id);

-- RLS Policies for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. SUBSCRIPTIONS TABLE (サブスクリプション)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE UNIQUE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'pro')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- RLS Policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 8. EXCHANGE RATES TABLE (為替レート)
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate DECIMAL(20, 10) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(base_currency, target_currency, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON exchange_rates(base_currency, target_currency, recorded_at DESC);

-- ============================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. VIEWS
-- ============================================

-- Portfolio Summary View
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

-- Top Performers View (Top 10 by weekly change)
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

-- ============================================
-- 11. SAMPLE EXCHANGE RATES
-- ============================================
INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES
('USD', 'JPY', 157.00),
('USD', 'EUR', 0.96),
('USD', 'GBP', 0.79),
('JPY', 'USD', 0.00637)
ON CONFLICT (base_currency, target_currency, recorded_at) DO NOTHING;

-- ============================================
-- 12. CREATE DEFAULT SUBSCRIPTION FOR NEW USERS
-- ============================================
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON profiles;
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();
