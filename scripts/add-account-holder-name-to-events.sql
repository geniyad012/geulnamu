-- Add account_holder_name column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS account_holder_name TEXT;

COMMENT ON COLUMN events.account_holder_name IS '계좌 소유자 이름';
