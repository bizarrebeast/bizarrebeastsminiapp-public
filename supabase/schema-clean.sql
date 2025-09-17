-- BizarreBeasts Contest System - Clean Install
-- This version checks if objects exist before creating them

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types if they exist (in reverse order of dependencies)
DROP VIEW IF EXISTS contest_leaderboard CASCADE;
DROP VIEW IF EXISTS active_contests_view CASCADE;
DROP TABLE IF EXISTS onboarding_tasks CASCADE;
DROP TABLE IF EXISTS contest_winners CASCADE;
DROP TABLE IF EXISTS contest_submissions CASCADE;
DROP TABLE IF EXISTS contests CASCADE;
DROP TYPE IF EXISTS submission_status CASCADE;
DROP TYPE IF EXISTS contest_status CASCADE;
DROP TYPE IF EXISTS prize_type CASCADE;
DROP TYPE IF EXISTS contest_type CASCADE;

-- Create enum types for better data integrity
CREATE TYPE contest_type AS ENUM ('game_score', 'onboarding', 'creative', 'tiered');
CREATE TYPE prize_type AS ENUM ('tokens', 'nft', 'both');
CREATE TYPE contest_status AS ENUM ('draft', 'active', 'ended', 'cancelled');
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');

-- Main contests table
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type contest_type NOT NULL,
  game_name VARCHAR(100), -- For game contests
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  min_bb_required DECIMAL(20, 0) DEFAULT 0, -- Token gate amount
  max_bb_required DECIMAL(20, 0), -- For tiered brackets
  prize_amount DECIMAL(20, 0),
  prize_type prize_type DEFAULT 'tokens',
  nft_contract_address VARCHAR(42), -- If NFT reward
  status contest_status DEFAULT 'draft',
  rules TEXT,
  max_entries_per_wallet INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(42), -- Admin wallet
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Contest submissions
CREATE TABLE contest_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42) NOT NULL,
  username VARCHAR(255), -- Farcaster/ENS name
  score INTEGER, -- For game contests
  screenshot_url TEXT, -- Cloudflare R2 URL
  metadata JSONB DEFAULT '{}', -- Additional data (game settings, etc.)
  status submission_status DEFAULT 'pending',
  token_balance DECIMAL(20, 0), -- User's $BB balance at submission time
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(42),
  reviewer_notes TEXT,
  UNIQUE(contest_id, wallet_address) -- One entry per wallet per contest
);

-- Winners table
CREATE TABLE contest_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES contest_submissions(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42) NOT NULL,
  position INTEGER NOT NULL,
  prize_amount DECIMAL(20, 0),
  prize_distributed BOOLEAN DEFAULT FALSE,
  distributed_at TIMESTAMPTZ,
  transaction_hash VARCHAR(66),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding tasks tracking
CREATE TABLE onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES contest_submissions(id) ON DELETE CASCADE,
  task_name VARCHAR(100),
  completed BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_data JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX idx_submissions_contest ON contest_submissions(contest_id);
CREATE INDEX idx_submissions_wallet ON contest_submissions(wallet_address);
CREATE INDEX idx_submissions_status ON contest_submissions(status);
CREATE INDEX idx_winners_contest ON contest_winners(contest_id);
CREATE INDEX idx_winners_wallet ON contest_winners(wallet_address);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to contests table
CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Public can read active contests
CREATE POLICY "Public can view active contests" ON contests
  FOR SELECT USING (status = 'active' OR status = 'ended');

-- Public can read their own submissions
CREATE POLICY "Users can view own submissions" ON contest_submissions
  FOR SELECT USING (true); -- We'll filter by wallet in the app

-- Public can insert submissions (with app validation)
CREATE POLICY "Users can submit entries" ON contest_submissions
  FOR INSERT WITH CHECK (true); -- App will validate token requirements

-- Public can view winners
CREATE POLICY "Public can view winners" ON contest_winners
  FOR SELECT USING (true);

-- Public can view onboarding tasks
CREATE POLICY "Public can view onboarding tasks" ON onboarding_tasks
  FOR SELECT USING (true);

-- Create view for active contests with submission counts
CREATE VIEW active_contests_view AS
SELECT
  c.*,
  COUNT(DISTINCT s.wallet_address) as participant_count,
  MAX(s.score) as high_score
FROM contests c
LEFT JOIN contest_submissions s ON c.id = s.contest_id AND s.status = 'approved'
WHERE c.status = 'active'
  AND c.start_date <= CURRENT_TIMESTAMP
  AND c.end_date >= CURRENT_TIMESTAMP
GROUP BY c.id;

-- Create view for leaderboard
CREATE VIEW contest_leaderboard AS
SELECT
  s.contest_id,
  s.wallet_address,
  s.username,
  s.score,
  s.submitted_at,
  s.status,
  RANK() OVER (PARTITION BY s.contest_id ORDER BY s.score DESC, s.submitted_at ASC) as rank
FROM contest_submissions s
WHERE s.status = 'approved';

-- Grant necessary permissions to authenticated users
GRANT SELECT ON contests TO authenticated;
GRANT SELECT, INSERT ON contest_submissions TO authenticated;
GRANT SELECT ON contest_winners TO authenticated;
GRANT SELECT ON onboarding_tasks TO authenticated;
GRANT SELECT ON active_contests_view TO authenticated;
GRANT SELECT ON contest_leaderboard TO authenticated;

-- Grant permissions to anon users (for public viewing)
GRANT SELECT ON contests TO anon;
GRANT SELECT ON contest_winners TO anon;
GRANT SELECT ON contest_leaderboard TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Contest system tables created successfully!';
END $$;