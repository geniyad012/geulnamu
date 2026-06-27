-- Create featured_book table for storing featured book information
CREATE TABLE IF NOT EXISTS featured_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE featured_book ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read
CREATE POLICY "Allow public read" ON featured_book
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON featured_book
  FOR UPDATE USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON featured_book
  FOR INSERT WITH CHECK (true);
