-- Add content field to events table for event descriptions
ALTER TABLE events ADD COLUMN IF NOT EXISTS content TEXT;

-- Add comment for the column
COMMENT ON COLUMN events.content IS 'Event description content (post format)';
