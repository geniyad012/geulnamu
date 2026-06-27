-- Change price column from integer to text to allow flexible pricing like "3분할", "무료", etc.
ALTER TABLE events ALTER COLUMN price TYPE text USING price::text;

-- Update existing numeric prices to include "원" for consistency (optional)
-- UPDATE events SET price = price || '원' WHERE price ~ '^\d+$';
