-- Complete Contest System Migration
-- Run this file in your Supabase SQL editor

-- ================================================
-- 1. ADD CTA FIELDS TO CONTESTS TABLE
-- ================================================

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

-- ================================================
-- 2. CREATE VOTING SYSTEM TABLES
-- ================================================

-- Create contest_votes table for tracking votes
CREATE TABLE IF NOT EXISTS contest_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES contest_submissions(id) ON DELETE CASCADE,
    voter_address TEXT NOT NULL,
    vote_power INTEGER DEFAULT 1, -- For potential weighted voting based on token holdings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one vote per wallet per contest
    UNIQUE(contest_id, voter_address)
);

-- Add voting-related fields to contests table
ALTER TABLE contests ADD COLUMN IF NOT EXISTS voting_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS voting_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS voting_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS min_votes_required INTEGER DEFAULT 1;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS voting_type TEXT DEFAULT 'single' CHECK (voting_type IN ('single', 'multiple', 'ranked'));

-- Add vote count to submissions for performance
ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contest_votes_contest_id ON contest_votes(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_votes_submission_id ON contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_contest_votes_voter_address ON contest_votes(voter_address);
CREATE INDEX IF NOT EXISTS idx_contest_votes_contest_voter ON contest_votes(contest_id, voter_address);

-- ================================================
-- 3. CREATE VIEWS FOR BETTER DATA ACCESS
-- ================================================

-- Create a view for voting results
CREATE OR REPLACE VIEW contest_voting_results AS
SELECT
    cs.id as submission_id,
    cs.contest_id,
    cs.wallet_address,
    cs.username,
    cs.score,
    cs.screenshot_url,
    cs.metadata,
    cs.status,
    cs.submitted_at,
    COALESCE(cv.vote_count, 0) as votes,
    cs.vote_count as cached_votes
FROM contest_submissions cs
LEFT JOIN (
    SELECT submission_id, COUNT(*) as vote_count
    FROM contest_votes
    GROUP BY submission_id
) cv ON cs.id = cv.submission_id
WHERE cs.status = 'approved';

-- ================================================
-- 4. CREATE FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to update cached vote count
CREATE OR REPLACE FUNCTION update_submission_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contest_submissions
        SET vote_count = vote_count + 1
        WHERE id = NEW.submission_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contest_submissions
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE id = OLD.submission_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update vote counts
DROP TRIGGER IF EXISTS update_vote_count_trigger ON contest_votes;
CREATE TRIGGER update_vote_count_trigger
AFTER INSERT OR DELETE ON contest_votes
FOR EACH ROW
EXECUTE FUNCTION update_submission_vote_count();

-- ================================================
-- 5. CREATE CTA CLICK TRACKING TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS contest_cta_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    wallet_address TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    -- Index for analytics queries
    INDEX idx_cta_clicks_contest_id (contest_id),
    INDEX idx_cta_clicks_clicked_at (clicked_at)
);

-- ================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_cta_clicks ENABLE ROW LEVEL SECURITY;

-- Votes are viewable by everyone
CREATE POLICY "Votes are viewable by everyone" ON contest_votes
    FOR SELECT USING (true);

-- Users can only insert their own votes
CREATE POLICY "Users can vote" ON contest_votes
    FOR INSERT WITH CHECK (
        -- Check if voting is enabled and within voting period
        EXISTS (
            SELECT 1 FROM contests c
            WHERE c.id = contest_id
            AND c.voting_enabled = true
            AND c.voting_start_date <= NOW()
            AND (c.voting_end_date IS NULL OR c.voting_end_date > NOW())
            AND c.status = 'active'
        )
    );

-- Users can delete their own votes (change vote)
CREATE POLICY "Users can change their vote" ON contest_votes
    FOR DELETE USING (voter_address = current_setting('app.current_user_address', true));

-- CTA clicks are viewable by everyone
CREATE POLICY "CTA clicks are viewable by everyone" ON contest_cta_clicks
    FOR SELECT USING (true);

-- Anyone can insert CTA clicks
CREATE POLICY "Anyone can track CTA clicks" ON contest_cta_clicks
    FOR INSERT WITH CHECK (true);

-- ================================================
-- 7. SAMPLE DATA FOR TESTING (OPTIONAL)
-- ================================================

-- Uncomment below to create a test contest with CTA
/*
INSERT INTO contests (
    name,
    description,
    type,
    status,
    min_bb_required,
    prize_amount,
    prize_type,
    max_entries_per_wallet,
    start_date,
    end_date,
    cta_url,
    cta_button_text,
    cta_type,
    cta_new_tab,
    track_cta_clicks,
    voting_enabled,
    voting_start_date,
    voting_end_date,
    is_test
) VALUES (
    'Meme Creation Contest',
    'Create the funniest Bizarre Beast meme to win prizes!',
    'creative',
    'active',
    0,
    1000,
    'tokens',
    1,
    NOW(),
    NOW() + INTERVAL '7 days',
    '/meme-generator',
    'Create Meme',
    'tool',
    false,
    true,
    true,
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '7 days',
    true
);
*/

-- ================================================
-- 8. GRANT PERMISSIONS (if needed)
-- ================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON contests TO authenticated;
GRANT SELECT, INSERT ON contest_submissions TO authenticated;
GRANT SELECT, INSERT, DELETE ON contest_votes TO authenticated;
GRANT SELECT, INSERT ON contest_cta_clicks TO authenticated;
GRANT SELECT ON contest_voting_results TO authenticated;

-- ================================================
-- Migration Complete!
-- ================================================