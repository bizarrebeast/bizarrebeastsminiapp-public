import { createClient } from '@supabase/supabase-js';

// These will come from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Contest {
  id: string;
  name: string;
  description?: string;
  type: 'game_score' | 'onboarding' | 'creative' | 'tiered';
  game_name?: string;
  start_date?: string;
  end_date?: string;
  min_bb_required: number;
  max_bb_required?: number;
  prize_amount?: number;
  prize_type: 'tokens' | 'nft' | 'both';
  nft_contract_address?: string;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  rules?: string;
  max_entries_per_wallet: number;
  is_recurring?: boolean;
  recurrence_interval?: 'daily' | 'weekly' | 'monthly';
  is_test?: boolean;
  created_at: string;
  created_by?: string;
  updated_at: string;
  banner_image_url?: string;
  voting_enabled?: boolean;
  voting_start_date?: string;
  voting_end_date?: string;
  min_votes_required?: number;
  voting_type?: 'single' | 'multiple' | 'ranked';
  cta_url?: string;
  cta_button_text?: string;
  cta_type?: 'internal' | 'external' | 'game' | 'tool';
  cta_new_tab?: boolean;
  track_cta_clicks?: boolean;
  gallery_enabled?: boolean;
  display_votes?: boolean;
  gallery_view_type?: 'grid' | 'carousel';
}

export interface ContestSubmission {
  id: string;
  contest_id: string;
  wallet_address: string;
  username?: string;
  score?: number;
  screenshot_url?: string;
  metadata?: any;
  status: 'pending' | 'approved' | 'rejected';
  token_balance?: number;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  vote_count?: number;
  image_caption?: string;
}

export interface ContestVote {
  id: string;
  contest_id: string;
  submission_id: string;
  voter_address: string;
  vote_power?: number;
  created_at: string;
}

export interface ContestWinner {
  id: string;
  contest_id: string;
  submission_id: string;
  wallet_address: string;
  position: number;
  prize_amount?: number;
  prize_distributed: boolean;
  distributed_at?: string;
  transaction_hash?: string;
  created_at: string;
}

export interface OnboardingTask {
  id: string;
  submission_id: string;
  task_name: string;
  completed: boolean;
  verified_at?: string;
  verification_data?: any;
}

// Database types for active_contests_view
export interface ActiveContestView extends Contest {
  participant_count: number;
  high_score: number | null;
}

// Database types for contest_leaderboard view
export interface ContestLeaderboard {
  contest_id: string;
  wallet_address: string;
  username?: string;
  score: number;
  submitted_at: string;
  status: string;
  rank: number;
}

// Helper functions for common operations
export const contestQueries = {
  // Update expired contest statuses
  async updateExpiredContestStatuses() {
    const now = new Date().toISOString();

    // Find and update expired active contests
    const { data: expiredContests, error: fetchError } = await supabase
      .from('contests')
      .select('id')
      .eq('status', 'active')
      .lt('end_date', now);

    if (!fetchError && expiredContests && expiredContests.length > 0) {
      for (const contest of expiredContests) {
        await supabase
          .from('contests')
          .update({ status: 'ended' })
          .eq('id', contest.id);
      }
    }
  },

  // Get ALL contests (for admin panel - bypasses RLS)
  async getAllContests() {
    // First update any expired contests
    await this.updateExpiredContestStatuses();

    // Try to import admin client for bypassing RLS
    try {
      const { supabaseAdmin } = await import('./supabase-admin');
      const { data, error } = await supabaseAdmin
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all contests with admin client:', error);
        // Fall back to regular client
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('contests')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Error fetching contests with regular client:', fallbackError);
          return [];
        }
        console.log(`📊 getAllContests fetched ${fallbackData?.length} contests (fallback to regular client)`);
        return fallbackData as Contest[];
      }

      console.log(`📊 getAllContests fetched ${data?.length} contests from database (admin client)`);
      return data as Contest[];
    } catch (importError) {
      // If admin client not available, use regular client
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all contests:', error);
        return [];
      }

      console.log(`📊 getAllContests fetched ${data?.length} contests from database (regular client)`);
      return data as Contest[];
    }
  },

  // Get all active contests (excludes test by default)
  async getActiveContests(includeTest: boolean = false) {
    // First update any expired contests
    await this.updateExpiredContestStatuses();

    const now = new Date().toISOString();
    let query = supabase
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .or(`end_date.gte.${now},end_date.is.null`); // Active if end_date is in future or null

    // Exclude test contests for production views
    if (!includeTest) {
      query = query.eq('is_test', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as Contest[];
  },

  // Get contest by ID
  async getContest(id: string) {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Contest;
  },

  // Submit entry
  async submitEntry(submission: Partial<ContestSubmission>) {
    const { data, error } = await supabase
      .from('contest_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data as ContestSubmission;
  },

  // Get submissions for a contest
  async getContestSubmissions(contestId: string, status?: 'pending' | 'approved' | 'rejected') {
    let query = supabase
      .from('contest_submissions')
      .select('*')
      .eq('contest_id', contestId)
      .order('score', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ContestSubmission[];
  },

  // Get submissions with vote counts for gallery
  async getSubmissionsWithVotes(contestId: string) {
    // Get both pending and approved submissions (exclude rejected)
    const { data: submissions, error: subError } = await supabase
      .from('contest_submissions')
      .select('*')
      .eq('contest_id', contestId)
      .in('status', ['pending', 'approved'])
      .order('submitted_at', { ascending: false });

    if (subError) throw subError;

    // Then get vote counts for each submission
    const { data: votes, error: voteError } = await supabase
      .from('contest_votes')
      .select('submission_id')
      .eq('contest_id', contestId);

    if (voteError) throw voteError;

    // Count votes per submission
    const voteCounts: { [key: string]: number } = {};
    votes?.forEach(vote => {
      voteCounts[vote.submission_id] = (voteCounts[vote.submission_id] || 0) + 1;
    });

    // Add vote counts to submissions
    const submissionsWithVotes = submissions?.map(sub => ({
      ...sub,
      vote_count: voteCounts[sub.id] || 0
    })) || [];

    // Sort by vote count if needed
    submissionsWithVotes.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    return submissionsWithVotes;
  },

  // Get user's submission for a contest (returns first submission for backwards compatibility)
  async getUserSubmission(contestId: string, walletAddress: string) {
    const { data, error } = await supabase
      .from('contest_submissions')
      .select('*')
      .eq('contest_id', contestId)
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('submitted_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data as ContestSubmission | null;
  },

  // Get all user's submissions for a contest
  async getUserSubmissions(contestId: string, walletAddress: string) {
    const { data, error } = await supabase
      .from('contest_submissions')
      .select('*')
      .eq('contest_id', contestId)
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data as ContestSubmission[];
  },

  // Get all user's submissions across all contests (for debugging)
  async getAllUserSubmissions(walletAddress: string) {
    const { data, error } = await supabase
      .from('contest_submissions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data as ContestSubmission[];
  },

  // Get leaderboard for a contest
  async getLeaderboard(contestId: string) {
    const { data, error } = await supabase
      .from('contest_leaderboard')
      .select('*')
      .eq('contest_id', contestId)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data as ContestLeaderboard[];
  },

  // Get active contests with participant count
  async getActiveContestsWithStats() {
    const { data, error } = await supabase
      .from('active_contests_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ActiveContestView[];
  },

  // Get upcoming contests
  async getUpcomingContests() {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .gt('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data as Contest[];
  },

  // Get ended contests
  async getEndedContests(limit = 10) {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'ended')
      .order('end_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Contest[];
  },

  // Admin: Update submission status
  async updateSubmissionStatus(
    submissionId: string,
    status: 'approved' | 'rejected',
    reviewerWallet: string,
    notes?: string
  ) {
    const { data, error } = await supabase
      .from('contest_submissions')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerWallet,
        reviewer_notes: notes
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data as ContestSubmission;
  },

  // Admin: Add winner
  async addWinner(winner: Partial<ContestWinner>) {
    const { data, error } = await supabase
      .from('contest_winners')
      .insert(winner)
      .select()
      .single();

    if (error) throw error;
    return data as ContestWinner;
  },

  // Get winners for a contest
  async getContestWinners(contestId: string) {
    const { data, error } = await supabase
      .from('contest_winners')
      .select('*')
      .eq('contest_id', contestId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data as ContestWinner[];
  },

  // Admin: Create new contest
  async createContest(contest: Partial<Contest>) {
    const { data, error } = await supabase
      .from('contests')
      .insert(contest)
      .select()
      .single();

    if (error) throw error;
    return data as Contest;
  },

  // Admin: Update contest
  async updateContest(contestId: string, updates: Partial<Contest>) {
    const { data, error } = await supabase
      .from('contests')
      .update(updates)
      .eq('id', contestId)
      .select()
      .single();

    if (error) throw error;
    return data as Contest;
  },

  // Voting: Cast a vote
  async castVote(contestId: string, submissionId: string, voterAddress: string) {
    const { data, error } = await supabase
      .from('contest_votes')
      .insert({
        contest_id: contestId,
        submission_id: submissionId,
        voter_address: voterAddress.toLowerCase()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Voting: Remove vote
  async removeVote(contestId: string, voterAddress: string) {
    const { error } = await supabase
      .from('contest_votes')
      .delete()
      .eq('contest_id', contestId)
      .eq('voter_address', voterAddress.toLowerCase());

    if (error) throw error;
    return true;
  },

  // Voting: Get user's vote for a contest
  async getUserVote(contestId: string, voterAddress: string) {
    const { data, error } = await supabase
      .from('contest_votes')
      .select('*')
      .eq('contest_id', contestId)
      .eq('voter_address', voterAddress.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Voting: Get all user votes for a contest (for multiple voting)
  async getUserVotes(contestId: string, voterAddress: string) {
    const { data, error } = await supabase
      .from('contest_votes')
      .select('submission_id')
      .eq('contest_id', contestId)
      .eq('voter_address', voterAddress.toLowerCase());

    if (error) throw error;
    return data?.map(v => v.submission_id) || [];
  },

  // Voting: Get all votes for a contest
  async getContestVotes(contestId: string) {
    const { data, error } = await supabase
      .from('contest_votes')
      .select('*')
      .eq('contest_id', contestId);

    if (error) throw error;
    return data || [];
  },

  // Voting: Get submissions with vote counts
  async getVotingResults(contestId: string) {
    const { data, error } = await supabase
      .from('contest_voting_results')
      .select('*')
      .eq('contest_id', contestId)
      .order('votes', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

export default supabase;