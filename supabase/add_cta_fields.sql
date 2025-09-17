-- Add CTA (Call-to-Action) fields to contests table
-- These fields allow contests to have a primary action button that takes users to the task/game/tool

-- Add CTA URL field (where the main action button takes users)
ALTER TABLE contests ADD COLUMN IF NOT EXISTS cta_url TEXT;

-- Add custom button text for the CTA
ALTER TABLE contests ADD COLUMN IF NOT EXISTS cta_button_text TEXT DEFAULT 'Start Contest';

-- Add CTA type to distinguish internal vs external links
ALTER TABLE contests ADD COLUMN IF NOT EXISTS cta_type TEXT DEFAULT 'internal'
  CHECK (cta_type IN ('internal', 'external', 'game', 'tool'));

-- Add option to open in new tab (mainly for external links)
ALTER TABLE contests ADD COLUMN IF NOT EXISTS cta_new_tab BOOLEAN DEFAULT FALSE;

-- Add analytics tracking flag
ALTER TABLE contests ADD COLUMN IF NOT EXISTS track_cta_clicks BOOLEAN DEFAULT TRUE;

-- Update existing contests with smart defaults based on type
UPDATE contests
SET
  cta_button_text = CASE
    WHEN type = 'game_score' AND game_name IS NOT NULL THEN 'Play ' || game_name
    WHEN type = 'game_score' THEN 'Play Game'
    WHEN type = 'creative' THEN 'Create Entry'
    WHEN type = 'onboarding' THEN 'View Tasks'
    ELSE 'Start Contest'
  END,
  cta_type = CASE
    WHEN type = 'game_score' THEN 'game'
    WHEN type = 'creative' THEN 'tool'
    ELSE 'internal'
  END
WHERE cta_button_text IS NULL;

-- Create index for faster queries on CTA fields
CREATE INDEX IF NOT EXISTS idx_contests_cta_url ON contests(cta_url) WHERE cta_url IS NOT NULL;