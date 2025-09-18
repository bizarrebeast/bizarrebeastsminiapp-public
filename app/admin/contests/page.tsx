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
      // For admin, fetch ALL contests regardless of status
      const allContests = await contestQueries.getAllContests();
      setContests(allContests || []);
      setFilteredContests(allContests || []);

      // Auto-select first contest if available
      if (allContests && allContests.length > 0 && !selectedContest) {
        setSelectedContest(allContests[0]);
        await fetchSubmissions(allContests[0].id);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContests = (search: string, status: string, includeTest: boolean) => {
    let filtered = [...contests];

    // Filter out test contests if needed
    if (!includeTest) {
      filtered = filtered.filter(c => !c.is_test);
    }

    // Filter by search term
    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.type.toLowerCase().includes(search.toLowerCase()) ||
        (c.game_name && c.game_name.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }

    setFilteredContests(filtered);
  };

  // Update filters when search/status/test changes
  useEffect(() => {
    filterContests(searchTerm, statusFilter, showTestContests);
  }, [searchTerm, statusFilter, showTestContests, contests]);

  const fetchSubmissions = async (contestId: string) => {
    try {
      const subs = await contestQueries.getContestSubmissions(contestId);
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

            {submissions.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Wallet</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Image</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">$BB Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Submitted</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-dark-bg/50 transition">
                        <td className="px-4 py-3">
                          {submission.username ? (
                            <span className="text-white">{submission.username}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-300 font-mono text-sm">
                            {submission.wallet_address.slice(0, 6)}...{submission.wallet_address.slice(-4)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white font-mono font-bold">
                            {submission.score?.toLocaleString() || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {submission.screenshot_url ? (
                            <div className="flex items-center gap-2">
                              {/* Thumbnail preview */}
                              {submission.screenshot_url === 'pending-upload' ? (
                                <div className={`${
                                  thumbnailSize === 'small' ? 'w-12 h-12' :
                                  thumbnailSize === 'medium' ? 'w-20 h-20' :
                                  'w-32 h-32'
                                } bg-dark-bg rounded flex items-center justify-center`}>
                                  <Camera className={`${
                                    thumbnailSize === 'small' ? 'w-5 h-5' :
                                    thumbnailSize === 'medium' ? 'w-6 h-6' :
                                    'w-8 h-8'
                                  } text-gray-500`} />
                                </div>
                              ) : (
                                <div className="relative group">
                                  <img
                                    src={submission.screenshot_url}
                                    alt="Thumbnail"
                                    className={`${
                                      thumbnailSize === 'small' ? 'w-12 h-12' :
                                      thumbnailSize === 'medium' ? 'w-20 h-20' :
                                      'w-32 h-32'
                                    } object-cover rounded cursor-pointer hover:opacity-80`}
                                    onClick={() => setScreenshotModal({
                                      isOpen: true,
                                      url: submission.screenshot_url || null,
                                      wallet: submission.wallet_address,
                                      score: submission.score || undefined
                                    })}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const size = thumbnailSize === 'small' ? 'w-12 h-12' :
                                                    thumbnailSize === 'medium' ? 'w-20 h-20' : 'w-32 h-32';
                                      const iconSize = thumbnailSize === 'small' ? 'w-5 h-5' :
                                                       thumbnailSize === 'medium' ? 'w-6 h-6' : 'w-8 h-8';
                                      target.parentElement?.insertAdjacentHTML('afterbegin', `
                                        <div class="${size} bg-dark-bg rounded flex items-center justify-center">
                                          <svg class="${iconSize} text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                      `);
                                    }}
                                  />
                                </div>
                              )}
                              <button
                                onClick={() => setScreenshotModal({
                                  isOpen: true,
                                  url: submission.screenshot_url || null,
                                  wallet: submission.wallet_address,
                                  score: submission.score || undefined
                                })}
                                className="flex items-center gap-1 text-gem-crystal hover:text-gem-crystal/80 text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                Expand
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500">No image</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 text-sm">
                            {submission.token_balance
                              ? formatTokenBalance(submission.token_balance.toString())
                              : '0'} $BB
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            submission.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : submission.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {submission.status === 'pending' ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleApprove(submission.id)}
                                disabled={processingId === submission.id}
                                className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50"
                                title="Approve"
                              >
                                {processingId === submission.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(submission.id)}
                                disabled={processingId === submission.id}
                                className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              {submission.status === 'approved' ? (
                                <span className="text-green-400 text-sm">✓</span>
                              ) : (
                                <span className="text-red-400 text-sm">✗</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchContests();
          }}
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