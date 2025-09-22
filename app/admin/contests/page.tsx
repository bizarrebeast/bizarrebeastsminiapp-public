'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Trophy,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  AlertCircle,
  Loader2,
  RefreshCw,
  Camera,
  Plus,
  Trash2,
  BarChart3
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { isAdmin } from '@/lib/admin';
import { contestQueries, Contest, ContestSubmission } from '@/lib/supabase';
import { formatTokenBalance } from '@/lib/tokenBalance';
import ScreenshotModal from '@/components/admin/ScreenshotModal';
import CreateContestForm from '@/components/admin/CreateContestForm';
import EditContestForm from '@/components/admin/EditContestForm';
import WinnerSelectionModal from '@/components/admin/WinnerSelectionModal';
import TestContestManager from '@/components/admin/TestContestManager';
import EnhancedSubmissionsTable from '@/components/admin/EnhancedSubmissionsTable';

export default function AdminContestsPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'ended'>('all');
  const [showTestContests, setShowTestContests] = useState(true);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [screenshotModal, setScreenshotModal] = useState<{
    isOpen: boolean;
    url: string | null;
    wallet: string;
    score?: number;
  }>({
    isOpen: false,
    url: null,
    wallet: '',
    score: undefined
  });

  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [duplicatingContest, setDuplicatingContest] = useState<Contest | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showTestManager, setShowTestManager] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isConnected) return;

    if (!isAdmin(address)) {
      console.log('Not admin, redirecting...');
      router.push('/contests');
      return;
    }

    // Store admin wallet in localStorage for API calls
    if (address) {
      localStorage.setItem('adminWallet', address);
    }

    fetchContests();
  }, [address, isConnected]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching all contests from database...');
      // For admin, fetch ALL contests regardless of status
      const allContests = await contestQueries.getAllContests();
      console.log(`✅ Admin page received ${allContests?.length || 0} contests from getAllContests()`);
      setContests(allContests || []);
      setFilteredContests(allContests || []);

      // Auto-select first contest if available
      if (allContests && allContests.length > 0 && !selectedContest) {
        setSelectedContest(allContests[0]);
        await fetchSubmissions(allContests[0].id);
      }
    } catch (error) {
      console.error('❌ Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContests = (search: string, status: string, includeTest: boolean) => {
    let filtered = [...contests];
    console.log(`🔍 Filtering contests: Total=${contests.length}, Status=${status}, IncludeTest=${includeTest}`);

    // Filter out test contests if needed
    if (!includeTest) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(c => !c.is_test);
      console.log(`   Test filter: ${beforeFilter} → ${filtered.length} contests`);
    }

    // Filter by search term
    if (search) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.type.toLowerCase().includes(search.toLowerCase()) ||
        (c.game_name && c.game_name.toLowerCase().includes(search.toLowerCase()))
      );
      console.log(`   Search filter "${search}": ${beforeFilter} → ${filtered.length} contests`);
    }

    // Filter by status
    if (status !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(c => c.status === status);
      console.log(`   Status filter "${status}": ${beforeFilter} → ${filtered.length} contests`);
    }

    console.log(`✅ Final filtered: ${filtered.length} contests`);
    setFilteredContests(filtered);
  };

  // Update filters when search/status/test changes
  useEffect(() => {
    filterContests(searchTerm, statusFilter, showTestContests);
  }, [searchTerm, statusFilter, showTestContests, contests]);

  const fetchSubmissions = async (contestId: string) => {
    try {
      // Use getSubmissionsWithVotes for gallery contests to include vote counts
      const contest = contests.find(c => c.id === contestId);
      console.log(`🔍 Admin fetchSubmissions - Contest:`, contest?.name);
      console.log(`🔍 Admin fetchSubmissions - Gallery enabled:`, contest?.gallery_enabled);

      const subs = contest?.gallery_enabled
        ? await contestQueries.getSubmissionsWithVotes(contestId)
        : await contestQueries.getContestSubmissions(contestId);

      console.log(`🔍 Admin fetchSubmissions - Fetched submissions:`, subs?.length);
      if (subs && subs.length > 0) {
        console.log(`🔍 Admin fetchSubmissions - First submission vote_count:`, subs[0].vote_count);
      }

      setSubmissions(subs || []);

      // Calculate stats
      const pending = subs?.filter(s => s.status === 'pending').length || 0;
      const approved = subs?.filter(s => s.status === 'approved').length || 0;
      const rejected = subs?.filter(s => s.status === 'rejected').length || 0;

      setStats({
        totalSubmissions: subs?.length || 0,
        pendingCount: pending,
        approvedCount: approved,
        rejectedCount: rejected
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleApprove = async (submissionId: string) => {
    if (!address) return;

    setProcessingId(submissionId);
    try {
      const response = await fetch('/api/admin/submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          status: 'approved',
          reviewerWallet: address
        })
      });

      if (!response.ok) throw new Error('Failed to approve submission');

      // Refresh submissions
      if (selectedContest) {
        await fetchSubmissions(selectedContest.id);
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Failed to approve submission');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submissionId: string, reason?: string) => {
    if (!address) return;

    setProcessingId(submissionId);
    try {
      const response = await fetch('/api/admin/submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          status: 'rejected',
          reviewerWallet: address,
          notes: reason || 'Does not meet contest requirements'
        })
      });

      if (!response.ok) throw new Error('Failed to reject submission');

      // Refresh submissions
      if (selectedContest) {
        await fetchSubmissions(selectedContest.id);
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Failed to reject submission');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteContest = async (contestId: string, contestName: string) => {
    if (!address) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${contestName}"?\n\nThis will also delete all submissions and cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/admin/contests/delete?id=${contestId}&wallet=${address}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete contest');
      }

      // Success - refresh contests
      alert(`Contest "${contestName}" deleted successfully`);

      // Clear selected contest if it was deleted
      if (selectedContest?.id === contestId) {
        setSelectedContest(null);
        setSubmissions([]);
      }

      // Refresh contest list
      await fetchContests();
    } catch (error) {
      console.error('Error deleting contest:', error);
      alert(`Failed to delete contest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const exportToCSV = (onlyApproved: boolean = false) => {
    const dataToExport = onlyApproved
      ? submissions.filter(s => s.status === 'approved')
      : submissions;

    if (!dataToExport || dataToExport.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Enhanced CSV content with more fields
    const headers = [
      'Rank',
      'Wallet Address',
      'Username',
      'Score',
      'Token Balance',
      'Status',
      'Submitted Date',
      'Submitted Time',
      'Reviewed By',
      'Notes'
    ];

    const sortedData = [...dataToExport].sort((a, b) => (b.score || 0) - (a.score || 0));
    const rows = sortedData.map((sub, index) => {
      const submissionDate = new Date(sub.submitted_at);
      return [
        index + 1,
        sub.wallet_address,
        sub.username || 'Anonymous',
        sub.score || 'N/A',
        sub.token_balance || 0,
        sub.status,
        submissionDate.toLocaleDateString(),
        submissionDate.toLocaleTimeString(),
        sub.reviewed_by || '-',
        sub.reviewer_notes || '-'
      ];
    });

    const csvContent = [
      `Contest: ${selectedContest?.name || 'Unknown'}`,
      `Export Date: ${new Date().toLocaleString()}`,
      `Total Entries: ${dataToExport.length}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV with better filename
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    const type = onlyApproved ? 'approved' : 'all';
    const contestName = selectedContest?.name.replace(/[^a-z0-9]/gi, '_') || 'contest';
    a.download = `${contestName}_${type}_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-gray-400">Please connect your admin wallet</p>
        </div>
      </div>
    );
  }

  if (!isAdmin(address)) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have admin privileges</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gem-crystal" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contest Management</h1>
            <p className="text-gray-400 mt-1">Create, manage, and review contest submissions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Create Contest
            </button>
            <button
              onClick={() => setShowTestManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-lg hover:bg-orange-500/30 transition"
            >
              <Trash2 className="w-4 h-4" />
              Test Manager
            </button>
            <button
              onClick={fetchContests}
              className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-gray-700 rounded-lg hover:bg-dark-bg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-gem-gold" />
              <span className="text-gray-400 text-sm">Total Submissions</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
          </div>
          <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">Pending Review</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pendingCount}</p>
          </div>
          <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Approved</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.approvedCount}</p>
          </div>
          <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-gray-400 text-sm">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.rejectedCount}</p>
          </div>
        </div>

        {/* Contest Selector with Filters */}
        <div className="bg-dark-card border border-gray-700 rounded-lg p-4 mb-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search contests by name, type, or game..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:border-gem-crystal
                         focus:outline-none transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-white focus:border-gem-crystal focus:outline-none transition"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="ended">Ended</option>
            </select>

            {/* Test Toggle */}
            <button
              onClick={() => setShowTestContests(!showTestContests)}
              className={`px-4 py-2 border rounded-lg transition flex items-center gap-2 ${
                showTestContests
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                  : 'bg-dark-bg border-gray-700 text-gray-400'
              }`}
            >
              🧪
              {showTestContests ? 'Tests Shown' : 'Tests Hidden'}
            </button>
          </div>

          <div className="flex justify-between items-start mb-2">
            <label className="block text-sm font-medium">
              Select Contest
              <span className="text-gray-500 ml-2">
                ({filteredContests.length} of {contests.length} contests)
              </span>
            </label>
            {/* Thumbnail Size Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Thumbnail Size:</span>
              <button
                onClick={() => setThumbnailSize('small')}
                className={`px-2 py-1 text-xs rounded ${
                  thumbnailSize === 'small'
                    ? 'bg-gem-crystal text-dark-bg'
                    : 'bg-dark-bg border border-gray-600 text-gray-400'
                }`}
              >
                Small
              </button>
              <button
                onClick={() => setThumbnailSize('medium')}
                className={`px-2 py-1 text-xs rounded ${
                  thumbnailSize === 'medium'
                    ? 'bg-gem-crystal text-dark-bg'
                    : 'bg-dark-bg border border-gray-600 text-gray-400'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setThumbnailSize('large')}
                className={`px-2 py-1 text-xs rounded ${
                  thumbnailSize === 'large'
                    ? 'bg-gem-crystal text-dark-bg'
                    : 'bg-dark-bg border border-gray-600 text-gray-400'
                }`}
              >
                Large
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedContest?.id || ''}
              onChange={async (e) => {
                const contest = contests.find(c => c.id === e.target.value);
                setSelectedContest(contest || null);
                if (contest) await fetchSubmissions(contest.id);
              }}
              className="flex-1 px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white"
            >
              <option value="">Choose a contest...</option>
              {filteredContests.map(contest => {
                const now = new Date();
                const startDate = contest.start_date ? new Date(contest.start_date) : new Date();
                const endDate = contest.end_date ? new Date(contest.end_date) : new Date();
                const isActive = contest.status === 'active' && now >= startDate && now <= endDate;
                const isUpcoming = contest.status === 'active' && now < startDate;
                const isEnded = contest.status === 'ended' || (contest.status === 'active' && now > endDate);
                const isDraft = contest.status === 'draft';

                return (
                  <option key={contest.id} value={contest.id}>
                    {contest.is_test && '🧪 [TEST] '}
                    {contest.name}
                    {' • '}
                    {isDraft && '🟡 Draft'}
                    {isActive && '🟢 Active'}
                    {isUpcoming && '🔵 Upcoming'}
                    {isEnded && '🔴 Ended'}
                    {' • '}
                    {contest.type}
                    {contest.is_recurring && ' • 🔄 Recurring'}
                  </option>
                );
              })}
            </select>
            {selectedContest && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingContest(selectedContest);
                    setShowEditForm(true);
                  }}
                  className="px-3 py-1 bg-gem-crystal text-dark-bg rounded-lg hover:bg-gem-crystal/80 transition flex items-center gap-1 text-sm font-semibold"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    setDuplicatingContest(selectedContest);
                    setShowCreateForm(true);
                  }}
                  className="px-3 py-1 bg-gem-purple text-white rounded-lg hover:bg-gem-purple/80 transition flex items-center gap-1 text-sm font-semibold"
                >
                  📋 Duplicate
                </button>
                <button
                  onClick={() => exportToCSV(false)}
                  className="px-3 py-1 bg-dark-bg border border-gray-600 rounded-lg hover:bg-gray-800 transition flex items-center gap-1 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
                <button
                  onClick={() => exportToCSV(true)}
                  className="px-3 py-1 bg-gem-crystal/20 border border-gem-crystal/40 rounded-lg hover:bg-gem-crystal/30 transition flex items-center gap-1 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Approved
                </button>
              </div>
            )}
          </div>

          {/* Contest Info Display */}
          {selectedContest && (
            <div className="mt-3 space-y-2">
              {/* Contest Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-dark-bg px-3 py-2 rounded-lg">
                  <span className="text-xs text-gray-500">Type</span>
                  <p className="text-sm font-medium capitalize">{selectedContest.type.replace('_', ' ')}</p>
                </div>
                <div className="bg-dark-bg px-3 py-2 rounded-lg">
                  <span className="text-xs text-gray-500">Status</span>
                  <p className="text-sm font-medium">
                    {selectedContest.status === 'active' && '🟢 Active'}
                    {selectedContest.status === 'draft' && '🟡 Draft'}
                    {selectedContest.status === 'ended' && '🔴 Ended'}
                  </p>
                </div>
                <div className="bg-dark-bg px-3 py-2 rounded-lg">
                  <span className="text-xs text-gray-500">Starts</span>
                  <p className="text-sm font-medium">
                    {selectedContest.start_date
                      ? new Date(selectedContest.start_date).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div className="bg-dark-bg px-3 py-2 rounded-lg">
                  <span className="text-xs text-gray-500">Ends</span>
                  <p className="text-sm font-medium">
                    {selectedContest.end_date
                      ? new Date(selectedContest.end_date).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
              </div>

              {/* Additional Info Row */}
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedContest.is_test && (
                  <>
                    <span className="bg-orange-500/10 text-orange-300 px-2 py-1 rounded font-bold">
                      🧪 TEST CONTEST
                    </span>
                    <button
                      onClick={() => deleteContest(selectedContest.id, selectedContest.name)}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Test
                    </button>
                  </>
                )}
                {selectedContest.status === 'draft' && !selectedContest.is_test && (
                  <button
                    onClick={() => deleteContest(selectedContest.id, selectedContest.name)}
                    className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 px-2 py-1 rounded flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Draft
                  </button>
                )}
                {selectedContest.min_bb_required > 0 && (
                  <span className="bg-gem-crystal/10 text-gem-crystal px-2 py-1 rounded">
                    💎 {selectedContest.min_bb_required} $BB Required
                  </span>
                )}
                {selectedContest.prize_amount && (
                  <span className="bg-gem-gold/10 text-gem-gold px-2 py-1 rounded">
                    🏆 {selectedContest.prize_amount} $BB Prize
                  </span>
                )}
                {selectedContest.is_recurring && (
                  <span className="bg-gem-pink/10 text-gem-pink px-2 py-1 rounded">
                    🔄 {selectedContest.recurrence_interval} Recurring
                  </span>
                )}
                <span className="bg-gray-700 px-2 py-1 rounded">
                  📝 Max {selectedContest.max_entries_per_wallet || 1} Entry/Wallet
                </span>
                <span className="bg-gray-700 px-2 py-1 rounded">
                  👥 {stats.totalSubmissions} Total Submissions
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submissions Table */}
        {selectedContest && (
          <div className="space-y-4">
            <div className="bg-dark-card border border-gray-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold">Submissions for {selectedContest.name}</h2>
                <button
                  onClick={() => setShowWinnerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg font-bold rounded-lg hover:opacity-90 transition"
                >
                  <Trophy className="w-4 h-4" />
                  Select Winners
                </button>
              </div>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-dark-card border border-gray-700 rounded-lg p-12 text-center">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No submissions yet</p>
              </div>
            ) : (
              <EnhancedSubmissionsTable
                submissions={submissions}
                contest={selectedContest}
                onApprove={handleApprove}
                onReject={handleReject}
                processingId={processingId}
                onViewScreenshot={(submission) => setScreenshotModal({
                  isOpen: true,
                  url: submission.screenshot_url || null,
                  wallet: submission.wallet_address,
                  score: submission.score || undefined
                })}
                thumbnailSize={thumbnailSize}
              />
            )}
          </div>
        )}

        {/* Screenshot Modal */}
        <ScreenshotModal
          isOpen={screenshotModal.isOpen}
          onClose={() => setScreenshotModal({
            isOpen: false,
            url: null,
            wallet: '',
            score: undefined
          })}
          screenshotUrl={screenshotModal.url}
          walletAddress={screenshotModal.wallet}
          score={screenshotModal.score}
        />

        {/* Create Contest Form Modal */}
        <CreateContestForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setDuplicatingContest(null);
          }}
          onSuccess={() => {
            setShowCreateForm(false);
            setDuplicatingContest(null);
            fetchContests();
          }}
          duplicateFrom={duplicatingContest}
        />

        {/* Edit Contest Form Modal */}
        {editingContest && (
          <EditContestForm
            isOpen={showEditForm}
            onClose={() => {
              setShowEditForm(false);
              setEditingContest(null);
            }}
            onSuccess={() => {
              setShowEditForm(false);
              setEditingContest(null);
              fetchContests();
            }}
            contest={editingContest}
          />
        )}

        {/* Winner Selection Modal */}
        {selectedContest && (
          <WinnerSelectionModal
            isOpen={showWinnerModal}
            onClose={() => setShowWinnerModal(false)}
            contestId={selectedContest.id}
            contestName={selectedContest.name}
            contestType={selectedContest.type}
            submissions={submissions}
            onWinnersSelected={() => {
              // Refresh submissions after winners are selected
              if (selectedContest) {
                fetchSubmissions(selectedContest.id);
              }
            }}
          />
        )}

        {/* Test Contest Manager Modal */}
        <TestContestManager
          isOpen={showTestManager}
          onClose={() => setShowTestManager(false)}
          contests={contests}
          onRefresh={fetchContests}
        />
      </div>
    </div>
  );
}