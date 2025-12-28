-- ============================================
-- GemFolio Database Migration
-- 2024-12-28 - Consolidate user tables & Add portfolio history
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
        -- Update profiles with display_name from user_profiles
        UPDATE profiles p
        SET display_name = up.display_name
        FROM user_profiles up
        WHERE p.id = up.user_id AND up.display_name IS NOT NULL;
        
        -- Drop user_profiles table
        DROP TABLE IF EXISTS user_profiles CASCADE;
    END IF;
END $$;

-- ============================================
-- 3. Create portfolio_value_history table
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_value_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Snapshot data
    total_value DECIMAL(12, 2) NOT NULL,       -- Total market value
    total_cost DECIMAL(12, 2) NOT NULL,        -- Total investment cost
    total_items INTEGER NOT NULL DEFAULT 0,    -- Number of unique cards
    total_quantity INTEGER NOT NULL DEFAULT 0, -- Total card count
    
    -- Daily record
    recorded_date DATE NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per day
    UNIQUE(user_id, recorded_date)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_date 
    ON portfolio_value_history(user_id, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_date 
    ON portfolio_value_history(recorded_date DESC);

-- RLS Policies
ALTER TABLE portfolio_value_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio history" 
    ON portfolio_value_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio history" 
    ON portfolio_value_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. Function to record daily portfolio snapshot
-- ============================================
CREATE OR REPLACE FUNCTION record_portfolio_snapshot(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_value DECIMAL(12, 2);
    v_total_cost DECIMAL(12, 2);
    v_total_items INTEGER;
    v_total_quantity INTEGER;
BEGIN
    -- Calculate current portfolio value
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
    INTO v_total_value, v_total_cost, v_total_items, v_total_quantity
    FROM portfolios p
    LEFT JOIN cards c ON p.card_id = c.card_id
    WHERE p.user_id = p_user_id;

    -- Insert or update today's snapshot
    INSERT INTO portfolio_value_history (
        user_id, total_value, total_cost, total_items, total_quantity, recorded_date
    ) VALUES (
        p_user_id, v_total_value, v_total_cost, v_total_items, v_total_quantity, CURRENT_DATE
    )
    ON CONFLICT (user_id, recorded_date) 
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        total_cost = EXCLUDED.total_cost,
        total_items = EXCLUDED.total_items,
        total_quantity = EXCLUDED.total_quantity,
        recorded_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Function to get portfolio history for chart
-- ============================================
CREATE OR REPLACE FUNCTION get_portfolio_history(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
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
            ph.total_value,
            ph.total_cost,
            LAG(ph.total_value) OVER (ORDER BY ph.recorded_date) as prev_value
        FROM portfolio_value_history ph
        WHERE ph.user_id = p_user_id
          AND ph.recorded_date >= CURRENT_DATE - p_days
        ORDER BY ph.recorded_date
    )
    SELECT 
        h.recorded_date,
        h.total_value,
        h.total_cost,
        COALESCE(h.total_value - h.prev_value, 0) as daily_change,
        CASE 
            WHEN h.prev_value > 0 
            THEN ROUND(((h.total_value - h.prev_value) / h.prev_value * 100)::numeric, 2)
            ELSE 0
        END as daily_change_percent
    FROM history h;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
