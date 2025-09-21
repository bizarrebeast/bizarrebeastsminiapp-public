'use client';

import { useState, useMemo } from 'react';
import {
  Eye,
  Camera,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Calendar,
  Hash,
  User,
  Wallet,
  Image as ImageIcon
} from 'lucide-react';
import { ContestSubmission } from '@/lib/supabase';
import { formatTokenBalance } from '@/lib/tokenBalance';

interface EnhancedSubmissionsTableProps {
  submissions: ContestSubmission[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  processingId: string | null;
  onViewScreenshot: (submission: ContestSubmission) => void;
  thumbnailSize: 'small' | 'medium' | 'large';
}

type SortField = 'username' | 'wallet' | 'score' | 'balance' | 'status' | 'date' | 'suspicious';
type SortOrder = 'asc' | 'desc';

export default function EnhancedSubmissionsTable({
  submissions,
  onApprove,
  onReject,
  processingId,
  onViewScreenshot,
  thumbnailSize
}: EnhancedSubmissionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState({
    status: 'all',
    hasScreenshot: 'all',
    suspicious: false,
    searchText: '',
    minScore: '',
    maxScore: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Calculate suspicious submissions
  const submissionsWithSuspicion = useMemo(() => {
    const walletSubmissions = new Map<string, ContestSubmission[]>();

    submissions.forEach(sub => {
      const wallet = sub.wallet_address.toLowerCase();
      if (!walletSubmissions.has(wallet)) {
        walletSubmissions.set(wallet, []);
      }
      walletSubmissions.get(wallet)!.push(sub);
    });

    return submissions.map(sub => {
      const wallet = sub.wallet_address.toLowerCase();
      const walletSubs = walletSubmissions.get(wallet) || [];

      // Check for suspicious patterns
      const suspiciousReasons = [];

      // Check image metadata fraud detection first
      const imageMetadata = (sub.metadata as any)?.image_metadata;
      const imageFraudDetection = imageMetadata?.fraud_detection;

      if (imageFraudDetection?.is_suspicious) {
        suspiciousReasons.push(...imageFraudDetection.suspicious_reasons);
      }

      // NOTE: Multiple submissions are allowed - not flagging this
      // Only flag rapid-fire submissions that might be bot activity

      // Submissions within very short time frame (< 30 seconds) - likely bot
      const subTime = new Date(sub.submitted_at).getTime();
      const rapidFireSubs = walletSubs.filter(s => {
        const otherTime = new Date(s.submitted_at).getTime();
        const diff = Math.abs(subTime - otherTime);
        return diff > 0 && diff < 30 * 1000; // 30 seconds
      });

      if (rapidFireSubs.length > 0) {
        suspiciousReasons.push('Rapid-fire submissions (< 30 seconds apart)');
      }

      // Unusually high score
      const avgScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length;
      if (sub.score && sub.score > avgScore * 2) {
        suspiciousReasons.push('Unusually high score');
      }

      // Missing screenshot for high score
      if (sub.score && sub.score > avgScore && !sub.screenshot_url) {
        suspiciousReasons.push('High score without screenshot');
      }

      return {
        ...sub,
        isSuspicious: suspiciousReasons.length > 0 || imageFraudDetection?.is_suspicious,
        suspiciousReasons,
        imageRiskScore: imageFraudDetection?.risk_score || 0,
        imageFraudSummary: imageFraudDetection?.summary
      };
    });
  }, [submissions]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissionsWithSuspicion.filter(sub => {
      // Status filter
      if (filters.status !== 'all' && sub.status !== filters.status) return false;

      // Screenshot filter
      if (filters.hasScreenshot === 'yes' && !sub.screenshot_url) return false;
      if (filters.hasScreenshot === 'no' && sub.screenshot_url) return false;

      // Suspicious filter
      if (filters.suspicious && !sub.isSuspicious) return false;

      // Search text (username or wallet)
      if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        const matchesUsername = sub.username?.toLowerCase().includes(search);
        const matchesWallet = sub.wallet_address.toLowerCase().includes(search);
        if (!matchesUsername && !matchesWallet) return false;
      }

      // Score range
      if (filters.minScore && sub.score && sub.score < parseInt(filters.minScore)) return false;
      if (filters.maxScore && sub.score && sub.score > parseInt(filters.maxScore)) return false;

      // Date range
      if (filters.dateFrom) {
        const subDate = new Date(sub.submitted_at);
        const fromDate = new Date(filters.dateFrom);
        if (subDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const subDate = new Date(sub.submitted_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (subDate > toDate) return false;
      }

      return true;
    });
  }, [submissionsWithSuspicion, filters]);

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    const sorted = [...filteredSubmissions].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'username':
          aVal = a.username || '';
          bVal = b.username || '';
          break;
        case 'wallet':
          aVal = a.wallet_address;
          bVal = b.wallet_address;
          break;
        case 'score':
          aVal = a.score || 0;
          bVal = b.score || 0;
          break;
        case 'balance':
          aVal = parseInt(String(a.token_balance || '0'));
          bVal = parseInt(String(b.token_balance || '0'));
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'date':
          aVal = new Date(a.submitted_at).getTime();
          bVal = new Date(b.submitted_at).getTime();
          break;
        case 'suspicious':
          aVal = a.isSuspicious ? 1 : 0;
          bVal = b.isSuspicious ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return sorted;
  }, [filteredSubmissions, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      hasScreenshot: 'all',
      suspicious: false,
      searchText: '',
      minScore: '',
      maxScore: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3" />
      : <ArrowDown className="w-3 h-3" />;
  };

  const thumbnailClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg border border-gray-600 rounded-lg hover:bg-gray-800 transition"
            >
              <Filter className="w-4 h-4" />
              Filters
              {Object.values(filters).some(v => {
                if (typeof v === 'boolean') return v === true;
                return v && v !== 'all' && v !== '';
              }) && (
                <span className="px-1.5 py-0.5 bg-gem-crystal text-dark-bg text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
            <input
              type="text"
              placeholder="Search username or wallet..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="px-3 py-1.5 bg-dark-bg border border-gray-600 rounded-lg text-sm
                       placeholder-gray-500 focus:border-gem-crystal focus:outline-none"
            />
            {filters.suspicious && (
              <span className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg">
                <AlertTriangle className="w-3 h-3" />
                Suspicious Only
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {sortedSubmissions.length} of {submissions.length} submissions
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-700">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2 py-1 bg-dark-bg border border-gray-600 rounded text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Screenshot</label>
              <select
                value={filters.hasScreenshot}
                onChange={(e) => setFilters({ ...filters, hasScreenshot: e.target.value })}
                className="w-full px-2 py-1 bg-dark-bg border border-gray-600 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="yes">With Screenshot</option>
                <option value="no">No Screenshot</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Min Score</label>
              <input
                type="number"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-1 bg-dark-bg border border-gray-600 rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Max Score</label>
              <input
                type="number"
                value={filters.maxScore}
                onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                placeholder="999999"
                className="w-full px-2 py-1 bg-dark-bg border border-gray-600 rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-2 py-1 bg-dark-bg border border-gray-600 rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-2 py-1 bg-dark-bg border border-gray-600 rounded text-sm"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setFilters({ ...filters, suspicious: !filters.suspicious })}
                className={`flex-1 px-2 py-1 border rounded text-sm transition ${
                  filters.suspicious
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    : 'bg-dark-bg border-gray-600 text-gray-400'
                }`}
              >
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Suspicious
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex-1 px-2 py-1 bg-dark-bg border border-gray-600 rounded text-sm
                         hover:bg-gray-800 transition text-gray-400"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-card border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-bg">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('suspicious')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-white"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Risk
                    <SortIcon field="suspicious" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('username')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-white"
                  >
                    <User className="w-3 h-3" />
                    Username
                    <SortIcon field="username" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('wallet')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-white"
                  >
                    <Wallet className="w-3 h-3" />
                    Wallet
                    <SortIcon field="wallet" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('score')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-white"
                  >
                    <Hash className="w-3 h-3" />
                    Score
                    <SortIcon field="score" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase">
                    <ImageIcon className="w-3 h-3" />
                    Image
                  </span>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('balance')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-white"
                  >
                    $BB
                    <SortIcon field="balance" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-white"
                  >
                    Status
                    <SortIcon field="status" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase hover:text-white"
                  >
                    <Calendar className="w-3 h-3" />
                    Date
                    <SortIcon field="date" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedSubmissions.map((submission) => (
                <tr
                  key={submission.id}
                  className={`hover:bg-dark-bg/50 transition ${
                    submission.isSuspicious ? 'bg-orange-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {submission.isSuspicious && (
                      <div className="relative group">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <div className="absolute z-10 invisible group-hover:visible bg-dark-bg border border-orange-500/40
                                      rounded-lg p-3 mt-1 w-64 text-xs text-orange-300">
                          {submission.imageRiskScore > 0 && (
                            <div className="mb-2 pb-2 border-b border-orange-500/20">
                              <div className="font-semibold">Image Analysis:</div>
                              <div>Risk Score: {submission.imageRiskScore}/100</div>
                              {submission.imageFraudSummary && (
                                <div className="mt-1 text-gray-400">{submission.imageFraudSummary}</div>
                              )}
                            </div>
                          )}
                          <div className="font-semibold mb-1">Suspicious Activity:</div>
                          {submission.suspiciousReasons.map((reason, i) => (
                            <div key={i}>• {reason}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {submission.username ? (
                      <div className="flex items-center gap-2">
                        {/* Platform icon */}
                        {(() => {
                          const platform = (submission.metadata as any)?.username_platform;
                          if (platform === 'farcaster') {
                            return <span className="text-sm" title="Farcaster">🟣</span>;
                          } else if (platform === 'x') {
                            return <span className="text-sm" title="X (Twitter)">𝕏</span>;
                          }
                          return null;
                        })()}
                        <span className="text-white">{submission.username}</span>
                      </div>
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
                        {submission.screenshot_url === 'pending-upload' ? (
                          <div className={`${thumbnailClasses[thumbnailSize]} bg-dark-bg rounded flex items-center justify-center`}>
                            <Camera className="w-5 h-5 text-gray-500" />
                          </div>
                        ) : (
                          <img
                            src={submission.screenshot_url}
                            alt="Thumbnail"
                            className={`${thumbnailClasses[thumbnailSize]} object-cover rounded cursor-pointer hover:opacity-80`}
                            onClick={() => onViewScreenshot(submission)}
                          />
                        )}
                        <button
                          onClick={() => onViewScreenshot(submission)}
                          className="flex items-center gap-1 text-gem-crystal hover:text-gem-crystal/80 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
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
                        : '0'}
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
                    <div>{new Date(submission.submitted_at).toLocaleDateString()}</div>
                    <div className="text-xs opacity-75">
                      {new Date(submission.submitted_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {submission.status === 'pending' ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onApprove(submission.id)}
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
                          onClick={() => {
                            if (submission.isSuspicious) {
                              const reason = prompt('Rejection reason:', submission.suspiciousReasons[0]);
                              if (reason) onReject(submission.id, reason);
                            } else {
                              onReject(submission.id);
                            }
                          }}
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
      </div>
    </div>
  );
}