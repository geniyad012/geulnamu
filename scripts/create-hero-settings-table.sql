-- Create hero_settings table for managing home page hero section
CREATE TABLE IF NOT EXISTS public.hero_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hero mode selection
  hero_mode TEXT NOT NULL DEFAULT 'default' CHECK (hero_mode IN ('default', 'designated_reading')),
  
  -- Default (introduction) mode fields
  default_label TEXT,
  default_title TEXT,
  default_subtitle TEXT,
  default_primary_button_text TEXT,
  default_primary_button_link TEXT,
  default_secondary_button_text TEXT,
  default_secondary_button_link TEXT,
  default_image_url TEXT,
  
  -- Designated reading mode fields
  designated_is_active BOOLEAN DEFAULT false,
  designated_title TEXT,
  designated_description TEXT,
  designated_image_url TEXT,
  designated_button_text TEXT,
  designated_button_link TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to hero_settings"
  ON public.hero_settings
  FOR SELECT
  USING (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update hero_settings"
  ON public.hero_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert hero_settings"
  ON public.hero_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Initialize with default row
INSERT INTO public.hero_settings (hero_mode, default_label, default_title, default_subtitle)
VALUES (
  'default',
  '글나무 독서모임',
  '책의 힘을 믿는 사람들',
  '매주 토요일 오전 함께 읽고, 이야기하고, 성장합니다'
)
ON CONFLICT DO NOTHING;
