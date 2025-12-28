-- ============================================
-- GemFolio Database Migration
-- 2024-12-28 - Consolidate user tables & Add portfolio history (Multi-currency support)
-- ============================================

-- ============================================
-- 1. Add display_name to profiles table
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================
-- 2. Migrate data from user_profiles to profiles (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        UPDATE profiles p
        SET display_name = up.display_name
        FROM user_profiles up
        WHERE p.id = up.user_id AND up.display_name IS NOT NULL;
        
        DROP TABLE IF EXISTS user_profiles CASCADE;
    END IF;
END $$;

-- ============================================
-- 3. Create portfolio_value_history table
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_value_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- JPY Values
    total_value_jpy DECIMAL(12, 0) NOT NULL,   -- JPY is usually Integer
    total_cost_jpy DECIMAL(12, 0) NOT NULL,
    
    -- USD Values
    total_value_usd DECIMAL(12, 2) NOT NULL,
    total_cost_usd DECIMAL(12, 2) NOT NULL,
    
    -- Meta data
    total_items INTEGER NOT NULL DEFAULT 0,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    exchange_rate DECIMAL(10, 2) NOT NULL,     -- Rate used for conversion (USD to JPY)
    
    -- Timestamp
    recorded_date DATE NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, recorded_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_date 
    ON portfolio_value_history(user_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_date 
    ON portfolio_value_history(recorded_date DESC);

-- RLS
ALTER TABLE portfolio_value_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio history" 
    ON portfolio_value_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio history" 
    ON portfolio_value_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. Function to record daily portfolio snapshot
-- Triggered by cron job or user action
-- ============================================
CREATE OR REPLACE FUNCTION record_portfolio_snapshot(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_value_usd DECIMAL(12, 2);
    v_total_cost_jpy DECIMAL(12, 0);
    v_total_items INTEGER;
    v_total_quantity INTEGER;
    v_rate DECIMAL(10, 2);
BEGIN
    -- 1. Get current exchange rate (USD to JPY)
    -- Default to 157.00 if not found (Should assume updated by cron)
    SELECT rate INTO v_rate 
    FROM exchange_rates 
    WHERE base_currency = 'USD' AND target_currency = 'JPY'
    ORDER BY recorded_at DESC LIMIT 1;
    
    IF v_rate IS NULL THEN
        v_rate := 157.00;
    END IF;

    -- 2. Calculate Portfolio Sums
    -- Cards prices are in USD (price_raw_avg)
    -- Purchase prices are in JPY (purchase_price)
    SELECT
        COALESCE(SUM(
            CASE 
                WHEN p.condition = 'RAW' THEN COALESCE(c.price_raw_avg, 0)
                WHEN p.condition = 'PSA10' THEN COALESCE(c.price_psa10_avg, 0)
                ELSE COALESCE(c.price_raw_avg, 0)
            END * p.quantity
        ), 0),
        COALESCE(SUM(p.purchase_price * p.quantity), 0),
        COUNT(DISTINCT p.id),
        COALESCE(SUM(p.quantity), 0)
    INTO v_total_value_usd, v_total_cost_jpy, v_total_items, v_total_quantity
    FROM portfolios p
    LEFT JOIN cards c ON p.card_id = c.card_id
    WHERE p.user_id = p_user_id;

    -- 3. Insert Snapshot (Convert currencies)
    INSERT INTO portfolio_value_history (
        user_id,
        total_value_jpy,
        total_cost_jpy,
        total_value_usd,
        total_cost_usd,
        total_items,
        total_quantity,
        exchange_rate,
        recorded_date
    ) VALUES (
        p_user_id,
        v_total_value_usd * v_rate,  -- Value USD -> JPY
        v_total_cost_jpy,            -- Cost JPY
        v_total_value_usd,           -- Value USD
        v_total_cost_jpy / v_rate,   -- Cost JPY -> USD
        v_total_items,
        v_total_quantity,
        v_rate,
        CURRENT_DATE
    )
    ON CONFLICT (user_id, recorded_date) 
    DO UPDATE SET
        total_value_jpy = EXCLUDED.total_value_jpy,
        total_cost_jpy = EXCLUDED.total_cost_jpy,
        total_value_usd = EXCLUDED.total_value_usd,
        total_cost_usd = EXCLUDED.total_cost_usd,
        total_items = EXCLUDED.total_items,
        total_quantity = EXCLUDED.total_quantity,
        exchange_rate = EXCLUDED.exchange_rate,
        recorded_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Function to get portfolio history for chart
-- ============================================
CREATE OR REPLACE FUNCTION get_portfolio_history(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30,
    p_currency TEXT DEFAULT 'USD'  -- 'USD' or 'JPY'
)
RETURNS TABLE (
    recorded_date DATE,
    total_value DECIMAL(12, 2),
    total_cost DECIMAL(12, 2),
    daily_change DECIMAL(12, 2),
    daily_change_percent DECIMAL(8, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH history AS (
        SELECT 
            ph.recorded_date,
            CASE WHEN p_currency = 'JPY' THEN ph.total_value_jpy ELSE ph.total_value_usd END as val,
            CASE WHEN p_currency = 'JPY' THEN ph.total_cost_jpy ELSE ph.total_cost_usd END as cost
        FROM portfolio_value_history ph
        WHERE ph.user_id = p_user_id
          AND ph.recorded_date >= CURRENT_DATE - p_days
        ORDER BY ph.recorded_date
    ),
    history_with_lag AS (
        SELECT 
            h.recorded_date,
            h.val,
            h.cost,
            LAG(h.val) OVER (ORDER BY h.recorded_date) as prev_val
        FROM history h
    )
    SELECT 
        hwl.recorded_date,
        hwl.val as total_value,
        hwl.cost as total_cost,
        COALESCE(hwl.val - hwl.prev_val, 0) as daily_change,
        CASE 
            WHEN hwl.prev_val > 0 
            THEN ROUND(((hwl.val - hwl.prev_val) / hwl.prev_val * 100)::numeric, 2)
            ELSE 0
        END as daily_change_percent
    FROM history_with_lag hwl;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
