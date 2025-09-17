-- Add banner image field to contests table
ALTER TABLE contests
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN contests.banner_image_url IS 'URL to the contest banner image stored in Cloudflare R2';

-- Optional: Update existing contests with a default banner
-- UPDATE contests
-- SET banner_image_url = 'https://contests.bizarrebeasts.com/default-banner.jpg'
-- WHERE banner_image_url IS NULL;