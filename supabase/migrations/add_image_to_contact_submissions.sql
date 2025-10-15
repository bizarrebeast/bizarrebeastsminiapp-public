-- Add image fields to contact_submissions table
ALTER TABLE contact_submissions
ADD COLUMN IF NOT EXISTS image_data TEXT,
ADD COLUMN IF NOT EXISTS image_mime_type TEXT;

-- Add comment for clarity
COMMENT ON COLUMN contact_submissions.image_data IS 'Base64 encoded image data (optional)';
COMMENT ON COLUMN contact_submissions.image_mime_type IS 'MIME type of the image (e.g., image/png, image/jpeg)';
