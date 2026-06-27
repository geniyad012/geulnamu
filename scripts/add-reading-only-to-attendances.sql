-- Add reading_only column to attendances table
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS reading_only BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN attendances.reading_only IS '독서만 하는 사람 표시 (조편성에서 제외됨)';
