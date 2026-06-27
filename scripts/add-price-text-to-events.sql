-- Add price_text column to events table for displaying installment information
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_text text;
