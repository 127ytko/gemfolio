-- Migration: Add previous price tracking for week-over-week comparison
-- Created: 2024-12-19

-- Add previous_price column to price_cache
ALTER TABLE price_cache 
ADD COLUMN IF NOT EXISTS previous_price_jp INTEGER,
ADD COLUMN IF NOT EXISTS previous_scraped_at TIMESTAMPTZ;

-- Comment
COMMENT ON COLUMN price_cache.previous_price_jp IS 'Previous weeks price for WoW comparison';
COMMENT ON COLUMN price_cache.previous_scraped_at IS 'Timestamp of the previous price scrape';

-- Create a view for trending cards (top price gainers)
CREATE OR REPLACE VIEW trending_cards AS
SELECT 
    cm.file_id,
    cm.card_number,
    cm.name_jp,
    cm.name_en,
    cm.set_name_jp,
    cm.set_name_en,
    cm.rarity_jp,
    cm.rarity_en,
    cm.game_type,
    pc.price_jp AS current_price,
    pc.previous_price_jp AS previous_price,
    pc.scraped_at,
    CASE 
        WHEN pc.previous_price_jp > 0 THEN 
            ROUND(((pc.price_jp - pc.previous_price_jp)::NUMERIC / pc.previous_price_jp) * 100, 1)
        ELSE 0
    END AS price_change_percent,
    (pc.price_jp - COALESCE(pc.previous_price_jp, pc.price_jp)) AS price_change_amount
FROM card_master cm
JOIN price_cache pc ON cm.file_id = pc.file_id
WHERE pc.price_jp > 0
  AND pc.previous_price_jp > 0
ORDER BY price_change_percent DESC
LIMIT 10;

-- Grant access to the view
GRANT SELECT ON trending_cards TO anon, authenticated;
