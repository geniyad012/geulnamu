-- Add password column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS password TEXT;

-- Update RLS policies to allow authenticated users to update and delete their own questions
-- (password verification will be done in the API layer)
