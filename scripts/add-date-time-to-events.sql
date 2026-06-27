-- Add event date and time columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS event_time TIME;

-- Add comment for clarity
COMMENT ON COLUMN events.event_date IS 'Date when the event takes place';
COMMENT ON COLUMN events.event_time IS 'Time when the event starts';
