-- ============================================
-- GemFolio Schema Fix - Remove card_number unique constraint
-- 2024-12-26 - card_numberは重複を許可（同じ番号でイラスト違いあり）
-- card_idが真のユニークキー
-- ============================================

-- Remove unique constraint on card_number
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_card_number_key;

-- Ensure card_id is the primary key and unique
-- (already the case, but confirming)
-- card_numberのインデックスは検索用に残す
