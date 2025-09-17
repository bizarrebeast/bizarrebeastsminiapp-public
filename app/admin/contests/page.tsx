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
  Camera
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { isAdmin } from '@/lib/admin';
import { contestQueries, Contest, ContestSubmission } from '@/lib/supabase';
import { formatTokenBalance } from '@/lib/tokenBalance';
import ScreenshotModal from '@/components/admin/ScreenshotModal';

export default function AdminContestsPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
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

  // Check admin access
  useEffect(() => {
    if (!isConnected) return;

    if (!isAdmin(address)) {
      console.log('Not admin, redirecting...');
      router.push('/contests');
      return;
    }

    fetchContests();
  }, [address, isConnected]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const allContests = await contestQueries.getActiveContestsWithStats();
      setContests(allContests || []);

      // Auto-select first contest if available
      if (allContests && allContests.length > 0) {
        setSelectedContest(allContests[0]);
        await fetchSubmissions(allContests[0].id);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const exportToCSV = () => {
    if (!submissions || submissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Create CSV content
    const headers = ['Rank', 'Wallet', 'Username', 'Score', 'Status', 'Submitted At'];
    const rows = submissions
      .filter(s => s.status === 'approved')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((sub, index) => [
        index + 1,
        sub.wallet_address,
        sub.username || 'Anonymous',
        sub.score || 0,
        sub.status,
        new Date(sub.submitted_at).toLocaleDateString()
      ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contest-${selectedContest?.id}-submissions.csv`;
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
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-gem-crystal" />
            <h1 className="text-3xl font-bold">Contest Admin Panel</h1>
          </div>
          <button
            onClick={fetchContests}
            className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-gray-700 rounded-lg hover:bg-dark-bg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
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

        {/* Contest Selector */}
        <div className="bg-dark-card border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start mb-2">
            <label className="block text-sm font-medium">Select Contest</label>
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
              {contests.map(contest => (
                <option key={contest.id} value={contest.id}>
                  {contest.name}
                </option>
              ))}
            </select>
            {selectedContest && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gem-crystal text-dark-bg rounded-lg hover:bg-gem-crystal/80 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        {selectedContest && (
          <div className="bg-dark-card border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">Submissions for {selectedContest.name}</h2>
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
                                      url: submission.screenshot_url,
                                      wallet: submission.wallet_address,
                                      score: submission.score || undefined
                                    })}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const size = '${thumbnailSize}' === 'small' ? 'w-12 h-12' :
                                                    '${thumbnailSize}' === 'medium' ? 'w-20 h-20' : 'w-32 h-32';
                                      const iconSize = '${thumbnailSize}' === 'small' ? 'w-5 h-5' :
                                                       '${thumbnailSize}' === 'medium' ? 'w-6 h-6' : 'w-8 h-8';
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
                                  url: submission.screenshot_url,
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
      </div>
    </div>
  );
}