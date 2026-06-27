-- Add phone_last4 and book_genre columns to attendances table
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS phone_last4 VARCHAR(4),
ADD COLUMN IF NOT EXISTS book_genre VARCHAR(50);

-- Add comment to columns
COMMENT ON COLUMN attendances.phone_last4 IS '휴대폰 번호 뒷자리 4자리';
COMMENT ON COLUMN attendances.book_genre IS '가져온 책의 분야';
