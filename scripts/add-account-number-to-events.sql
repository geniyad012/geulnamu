-- Add account_number column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Add comment
COMMENT ON COLUMN events.account_number IS '이벤트 입금 계좌번호';
