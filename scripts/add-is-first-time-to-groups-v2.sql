-- Add is_first_time column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_first_time BOOLEAN DEFAULT false;

-- Update existing groups with is_first_time data from attendances table
UPDATE groups g
SET is_first_time = COALESCE(
  (SELECT a.is_first_time 
   FROM attendances a 
   WHERE a.name = g.member_name 
   AND a.event_id = g.event_id
   AND DATE(a.created_at) = CURRENT_DATE
   LIMIT 1),
  false
);
