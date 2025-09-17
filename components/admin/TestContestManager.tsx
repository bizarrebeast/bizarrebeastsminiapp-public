'use client';

import { useState } from 'react';
import { X, Trash2, CheckCircle, AlertCircle, Loader2, TestTube } from 'lucide-react';
import { Contest } from '@/lib/supabase';

interface TestContestManagerProps {
  isOpen: boolean;
  onClose: () => void;
  contests: Contest[];
  onRefresh: () => void;
}

export default function TestContestManager({
  isOpen,
  onClose,
  contests,
  onRefresh
}: TestContestManagerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedContests, setSelectedContests] = useState<Set<string>>(new Set());

  // Find all contests that look like tests but aren't marked as such
  const potentialTestContests = contests.filter(c =>
    !c.is_test && (
      c.name.toLowerCase().includes('test') ||
      c.name.includes('🎮 TEST:') ||
      c.name === 'Mega Game Challenge' ||
      c.name.match(/^TEST\s+\d+$/i)
    )
  );

  // Find all marked test contests
  const markedTestContests = contests.filter(c => c.is_test);

  const toggleSelect = (contestId: string) => {
    const newSet = new Set(selectedContests);
    if (newSet.has(contestId)) {
      newSet.delete(contestId);
    } else {
      newSet.add(contestId);
    }
    setSelectedContests(newSet);
  };

  const selectAll = (contestList: Contest[]) => {
    setSelectedContests(new Set(contestList.map(c => c.id)));
  };

  const markAsTest = async () => {
    if (selectedContests.size === 0) {
      alert('Please select contests to mark as test');
      return;
    }

    setLoading(true);
    try {
      const adminWallet = localStorage.getItem('adminWallet');
      if (!adminWallet) {
        alert('Admin wallet not found. Please reconnect.');
        return;
      }

      const contestIds = Array.from(selectedContests);
      const response = await fetch('/api/admin/contests/mark-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestIds,
          adminWallet
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully marked ${contestIds.length} contest(s) as test!`);
        setSelectedContests(new Set());
        onRefresh();
      } else {
        console.error('Mark test error:', data);
        alert(`Error: ${data.error || 'Failed to mark contests as test'}`);
      }
    } catch (error) {
      console.error('Error marking as test:', error);
      alert('Failed to mark contests as test');
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedContests.size === 0) {
      alert('Please select contests to delete');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedContests.size} test contest(s)?\n\nThis cannot be undone!`
    );

    if (!confirmDelete) return;

    setLoading(true);
    try {
      const adminWallet = localStorage.getItem('adminWallet');
      if (!adminWallet) {
        alert('Admin wallet not found. Please reconnect.');
        return;
      }

      const contestIds = Array.from(selectedContests);
      const response = await fetch('/api/admin/contests/batch-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestIds,
          adminWallet
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully deleted ${data.deletedContests?.length || 0} test contest(s)!`);
        setSelectedContests(new Set());
        onRefresh();
      } else {
        alert(`Error: ${data.error}${data.details ? `\n${data.details}` : ''}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete contests');
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="w-6 h-6 text-orange-400" />
            Test Contest Manager
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Unmarked Potential Tests */}
          {potentialTestContests.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-orange-400">
                  Potential Test Contests (Not Marked)
                </h3>
                <button
                  onClick={() => selectAll(potentialTestContests)}
                  className="text-sm px-3 py-1 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 transition"
                >
                  Select All
                </button>
              </div>
              <div className="bg-dark-bg border border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Select</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {potentialTestContests.map(contest => (
                        <tr key={contest.id} className="border-t border-gray-800">
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedContests.has(contest.id)}
                              onChange={() => toggleSelect(contest.id)}
                              className="w-4 h-4 text-orange-500 bg-dark-bg border-gray-600 rounded"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm">{contest.name}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              contest.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              contest.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {contest.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-400">
                            {new Date(contest.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={markAsTest}
                  disabled={loading || selectedContests.size === 0}
                  className="px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-lg hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Selected as Test
                </button>
              </div>
            </div>
          )}

          {/* Already Marked Test Contests */}
          {markedTestContests.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-red-400">
                  Marked Test Contests ({markedTestContests.length})
                </h3>
                <button
                  onClick={() => selectAll(markedTestContests)}
                  className="text-sm px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition"
                >
                  Select All
                </button>
              </div>
              <div className="bg-dark-bg border border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Select</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Submissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markedTestContests.map(contest => (
                        <tr key={contest.id} className="border-t border-gray-800">
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedContests.has(contest.id)}
                              onChange={() => toggleSelect(contest.id)}
                              className="w-4 h-4 text-red-500 bg-dark-bg border-gray-600 rounded"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className="text-orange-300">🧪</span> {contest.name}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              contest.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              contest.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {contest.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-400">
                            -
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={deleteSelected}
                  disabled={loading || selectedContests.size === 0}
                  className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/40 rounded-lg hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected Tests
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-200">
                  <li>Select contests to mark as test or delete</li>
                  <li>Click the action button to copy SQL to clipboard</li>
                  <li>Run the SQL in your Supabase SQL editor</li>
                  <li>Refresh this page to see changes</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}