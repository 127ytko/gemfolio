-- Migration: Add price analysis functions (Minimal Version)
-- Created: 2025-12-22
-- 
-- 最小限の価格分析機能
-- - latest_market_prices: 最新価格ビュー
-- - get_price_history(): カード個別の価格履歴

-- ============================================
-- 1. View: Latest Prices (最新価格を効率的に取得)
-- ============================================
-- 各カードの最新価格を取得するビュー
-- 使用例: SELECT * FROM latest_market_prices WHERE asset_id = 'OP01-001';

CREATE OR REPLACE VIEW latest_market_prices AS
SELECT DISTINCT ON (asset_id) 
    asset_id,
    price_raw,
    price_psa10,
    recorded_at
FROM market_price_history
ORDER BY asset_id, recorded_at DESC;

-- ============================================
-- 2. Function: Get Price History for Chart
-- ============================================
-- カード個別の価格履歴を取得（グラフ描画用）
-- 
-- 使用例:
--   SELECT * FROM get_price_history('OP01-001', 30);
-- 
-- パラメータ:
--   p_asset_id: カードのfile_id
--   p_days: 取得する日数（デフォルト30日）

CREATE OR REPLACE FUNCTION get_price_history(
    p_asset_id TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    price_raw BIGINT,
    price_psa10 BIGINT,
    recorded_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        mph.price_raw,
        mph.price_psa10,
        mph.recorded_at
    FROM market_price_history mph
    WHERE mph.asset_id = p_asset_id
      AND mph.recorded_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY mph.recorded_at ASC;
$$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON VIEW latest_market_prices IS '各カードの最新価格を返すビュー。検索・一覧表示の高速化に使用。';
COMMENT ON FUNCTION get_price_history IS 'カード個別の価格履歴を取得。グラフ描画用。';
