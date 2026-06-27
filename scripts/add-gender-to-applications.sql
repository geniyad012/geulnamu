-- Add gender column to event_applications table
ALTER TABLE event_applications
ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Add comment
COMMENT ON COLUMN event_applications.gender IS 'Gender of the applicant (male/female)';
