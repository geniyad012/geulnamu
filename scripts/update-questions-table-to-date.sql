-- Update questions table to use date instead of week
ALTER TABLE questions DROP COLUMN IF EXISTS week;
ALTER TABLE questions ADD COLUMN question_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Update index
DROP INDEX IF EXISTS idx_questions_week;
CREATE INDEX IF NOT EXISTS idx_questions_date ON questions(question_date DESC);
