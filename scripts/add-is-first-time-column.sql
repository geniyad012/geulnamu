-- Add is_first_time column to attendances table
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS is_first_time BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN attendances.is_first_time IS '정기모임 첫 참여 여부';
