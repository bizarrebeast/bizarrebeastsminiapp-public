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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contest_votes_contest_id ON contest_votes(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_votes_submission_id ON contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_contest_votes_voter_address ON contest_votes(voter_address);
-- Composite index for unique constraint optimization
CREATE INDEX IF NOT EXISTS idx_contest_votes_contest_voter ON contest_votes(contest_id, voter_address);

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

-- RLS policies for voting
ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes
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