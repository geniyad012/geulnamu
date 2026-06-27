-- Add short_location column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS short_location TEXT;

-- Update existing events to copy location to short_location
UPDATE events SET short_location = location WHERE short_location IS NULL AND location IS NOT NULL;
