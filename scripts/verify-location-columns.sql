-- Check if location and short_location columns exist in events table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('location', 'short_location');

-- If columns don't exist, add them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'location') THEN
        ALTER TABLE events ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'short_location') THEN
        ALTER TABLE events ADD COLUMN short_location TEXT;
    END IF;
END $$;
