-- Add location column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comment
COMMENT ON COLUMN events.location IS '이벤트 장소';
