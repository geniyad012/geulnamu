-- Create featured_book table if it doesn't exist
CREATE TABLE IF NOT EXISTS featured_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE featured_book ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON featured_book
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update" ON featured_book
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert" ON featured_book
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS featured_book_updated_at_idx ON featured_book(updated_at DESC);
