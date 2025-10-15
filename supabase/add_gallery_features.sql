-- Add gallery features to contests table
ALTER TABLE contests
ADD COLUMN IF NOT EXISTS gallery_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS display_votes BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS gallery_view_type VARCHAR(20) DEFAULT 'grid';

-- Add caption and vote count to submissions
ALTER TABLE contest_submissions
ADD COLUMN IF NOT EXISTS image_caption TEXT,
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;

-- Create index for performance on vote queries
CREATE INDEX IF NOT EXISTS idx_submissions_votes
ON contest_submissions(contest_id, vote_count DESC);

-- Add comments for documentation
COMMENT ON COLUMN contests.gallery_enabled IS 'Whether to show a meme gallery for this contest';
COMMENT ON COLUMN contests.display_votes IS 'Whether to publicly display vote counts';
COMMENT ON COLUMN contests.gallery_view_type IS 'Display type: grid or carousel';
COMMENT ON COLUMN contest_submissions.image_caption IS 'Optional caption for meme submissions';
COMMENT ON COLUMN contest_submissions.vote_count IS 'Cached vote count for performance';

-- Update the contest_leaderboard view to include vote counts for creative contests
DROP VIEW IF EXISTS contest_leaderboard;

CREATE OR REPLACE VIEW contest_leaderboard AS
SELECT
  s.contest_id,
  s.wallet_address,
  s.username,
  s.score,
  s.submitted_at,
  s.status,
  s.screenshot_url,
  s.metadata,
  s.image_caption,
  COALESCE(v.vote_count, 0) as vote_count,
  RANK() OVER (
    PARTITION BY s.contest_id
    ORDER BY
      CASE
        WHEN c.type IN ('creative', 'onboarding') THEN COALESCE(v.vote_count, 0)
        ELSE s.score
      END DESC,
      s.submitted_at ASC
  ) as rank
FROM contest_submissions s
JOIN contests c ON c.id = s.contest_id
LEFT JOIN (
  SELECT submission_id, COUNT(*) as vote_count
  FROM contest_votes
  GROUP BY submission_id
) v ON v.submission_id = s.id
WHERE s.status = 'approved';

-- Grant permissions
GRANT SELECT ON contest_leaderboard TO authenticated;
GRANT SELECT ON contest_leaderboard TO anon;