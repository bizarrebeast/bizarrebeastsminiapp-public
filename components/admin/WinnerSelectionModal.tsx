'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, Download, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ContestSubmission } from '@/lib/supabase';

interface WinnerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestId: string;
  contestName: string;
  contestType: string;
  submissions: ContestSubmission[];
  onWinnersSelected: () => void;
}

export default function WinnerSelectionModal({
  isOpen,
  onClose,
  contestId,
  contestName,
  contestType,
  submissions,
  onWinnersSelected
}: WinnerSelectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<Set<string>>(new Set());
  const [winnerCount, setWinnerCount] = useState(3);
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [exportFormat, setExportFormat] = useState<'winners' | 'all'>('winners');

  // Filter only approved submissions for winner selection
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const sortedSubmissions = [...approvedSubmissions].sort((a, b) => (b.score || 0) - (a.score || 0));

  // For onboarding/gig tasks, all approved submissions are winners
  const isPassFailContest = contestType === 'onboarding' || contestType === 'creative';

  useEffect(() => {
    if (isPassFailContest && approvedSubmissions.length > 0) {
      // For pass/fail contests, all approved are winners
      setSelectedWinners(new Set(approvedSubmissions.map(s => s.id)));
      setSelectionMode('auto');
    }
  }, [isPassFailContest, approvedSubmissions.length, contestId]);

  const handleAutoSelect = () => {
    if (isPassFailContest) {
      // All approved submissions are winners
      setSelectedWinners(new Set(approvedSubmissions.map(s => s.id)));
    } else {
      // Select top N winners based on score
      const topWinners = sortedSubmissions.slice(0, winnerCount);
      setSelectedWinners(new Set(topWinners.map(s => s.id)));
    }
  };

  const toggleWinner = (submissionId: string) => {
    const newSet = new Set(selectedWinners);
    if (newSet.has(submissionId)) {
      newSet.delete(submissionId);
    } else {
      newSet.add(submissionId);
    }
    setSelectedWinners(newSet);
  };

  const exportCSV = (includeAll: boolean = false) => {
    const dataToExport = includeAll ? approvedSubmissions :
      approvedSubmissions.filter(s => selectedWinners.has(s.id));

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    // Enhanced CSV with more fields
    const headers = [
      'Position',
      'Wallet Address',
      'Username',
      'Score',
      'Token Balance',
      'Submission Date',
      'Submission Time',
      'Status',
      'Winner',
      'Prize Amount'
    ];

    const rows = dataToExport.map((submission, index) => {
      const submissionDate = new Date(submission.submitted_at);
      const isWinner = selectedWinners.has(submission.id);
      const position = isWinner ? sortedSubmissions.findIndex(s => s.id === submission.id) + 1 : '-';

      return [
        position,
        submission.wallet_address,
        submission.username || 'Anonymous',
        submission.score || 'N/A',
        submission.token_balance || 0,
        submissionDate.toLocaleDateString(),
        submissionDate.toLocaleTimeString(),
        submission.status,
        isWinner ? 'Yes' : 'No',
        '' // Prize amount to be filled manually
      ];
    });

    // Create CSV content
    const csvContent = [
      `Contest: ${contestName}`,
      `Export Date: ${new Date().toLocaleString()}`,
      `Total Submissions: ${approvedSubmissions.length}`,
      `Winners Selected: ${selectedWinners.size}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${contestName.replace(/[^a-z0-9]/gi, '_')}_${includeAll ? 'all' : 'winners'}_${timestamp}.csv`;

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const saveWinners = async () => {
    setLoading(true);
    try {
      // Here we would call an API to save winners to the database
      // For now, just export the CSV
      exportCSV(false);
      onWinnersSelected();
      onClose();
    } catch (error) {
      console.error('Error saving winners:', error);
      alert('Failed to save winners');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-gem-crystal/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-gray-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-gem-gold" />
              Select Winners
            </h2>
            <p className="text-sm text-gray-400 mt-1">{contestName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Contest Info */}
          <div className="bg-dark-bg border border-gray-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Contest Type:</span>
                <p className="font-medium capitalize">{contestType.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-gray-500">Approved Entries:</span>
                <p className="font-medium">{approvedSubmissions.length}</p>
              </div>
              <div>
                <span className="text-gray-500">Selection Mode:</span>
                <p className="font-medium">
                  {isPassFailContest ? 'Pass/Fail (All Approved Win)' : 'Top Performers'}
                </p>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          {!isPassFailContest && (
            <div className="mb-6 space-y-4">
              <div className="flex gap-4 items-center">
                <label className="text-sm font-medium">Selection Mode:</label>
                <select
                  value={selectionMode}
                  onChange={(e) => setSelectionMode(e.target.value as 'auto' | 'manual')}
                  className="px-3 py-1 bg-dark-bg border border-gray-600 rounded-lg text-white"
                >
                  <option value="auto">Automatic (Top Scores)</option>
                  <option value="manual">Manual Selection</option>
                </select>
              </div>

              {selectionMode === 'auto' && (
                <div className="flex gap-4 items-center">
                  <label className="text-sm font-medium">Number of Winners:</label>
                  <input
                    type="number"
                    min="1"
                    max={approvedSubmissions.length}
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-1 bg-dark-bg border border-gray-600 rounded-lg text-white"
                  />
                  <button
                    onClick={handleAutoSelect}
                    className="px-4 py-1 bg-gem-crystal text-dark-bg rounded-lg hover:opacity-90"
                  >
                    Auto Select Top {winnerCount}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submissions List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              {isPassFailContest ? 'All Approved Participants (Winners)' : 'Select Winners'}
            </h3>
            <div className="bg-dark-bg border border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Select</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Rank</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Wallet</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Score</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">$BB Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubmissions.map((submission, index) => (
                      <tr
                        key={submission.id}
                        className={`border-t border-gray-800 ${
                          selectedWinners.has(submission.id) ? 'bg-gem-crystal/10' : ''
                        }`}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedWinners.has(submission.id)}
                            onChange={() => toggleWinner(submission.id)}
                            disabled={isPassFailContest}
                            className="w-4 h-4 text-gem-crystal bg-dark-bg border-gray-600 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm">#{index + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium">
                          {submission.username || 'Anonymous'}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-400">
                          {submission.wallet_address.slice(0, 6)}...{submission.wallet_address.slice(-4)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {submission.score || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {submission.token_balance || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gem-crystal/10 border border-gem-crystal/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-gem-crystal" />
              <span className="font-semibold">Winners Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Winners Selected:</span>
                <p className="text-2xl font-bold text-gem-crystal">{selectedWinners.size}</p>
              </div>
              <div>
                <span className="text-gray-400">Contest Type:</span>
                <p className="font-medium">
                  {isPassFailContest ? 'Pass/Fail - All Approved Win' : 'Competitive - Top Scores Win'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => exportCSV(true)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg hover:bg-gray-800 transition"
              >
                <Download className="w-4 h-4" />
                Export All Approved
              </button>
              <button
                onClick={() => exportCSV(false)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg hover:bg-gray-800 transition"
              >
                <Download className="w-4 h-4" />
                Export Winners Only
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-dark-bg border border-gray-600 rounded-lg hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveWinners}
                disabled={loading || selectedWinners.size === 0}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    Confirm Winners & Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}