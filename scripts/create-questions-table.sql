-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week TEXT NOT NULL,
  group_number INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  phone_last4 VARCHAR(4) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON questions
  FOR SELECT
  USING (true);

-- Allow authenticated insert
CREATE POLICY "Allow authenticated insert" ON questions
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_week ON questions(week);
CREATE INDEX IF NOT EXISTS idx_questions_group ON questions(group_number);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
