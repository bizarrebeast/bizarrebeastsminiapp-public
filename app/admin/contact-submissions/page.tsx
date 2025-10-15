'use client';

import { useEffect, useState } from 'react';
import { Mail, User, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { isAdmin } from '@/lib/admin';

interface ContactSubmission {
  id: string;
  name: string;
  contact_method: 'email' | 'farcaster' | 'x';
  email?: string;
  farcaster_handle?: string;
  x_handle?: string;
  category: string;
  subject: string;
  message: string;
  email_sent: boolean;
  email_error?: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
  image_data?: string;
  image_mime_type?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  partnership: 'Collabs & Partnerships',
  general: 'General Inquiry',
  feedback: 'Beta Feedback',
  commission: 'Art Commission',
  other: 'Other',
};

export default function ContactSubmissionsPage() {
  const { address } = useWallet();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  // Check if user is admin
  const userIsAdmin = address && isAdmin(address);

  useEffect(() => {
    if (userIsAdmin && address) {
      fetchSubmissions();
    }
  }, [userIsAdmin, address]);

  const fetchSubmissions = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/admin/contact-submissions?wallet=${address}`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!address) return;
    try {
      await fetch('/api/admin/contact-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'read', wallet: address })
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  if (!userIsAdmin) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent mb-2">
            Contact Submissions
          </h1>
          <p className="text-gray-400">View and manage contact form messages</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                : 'bg-dark-card text-gray-400 hover:text-white'
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                : 'bg-dark-card text-gray-400 hover:text-white'
            }`}
          >
            Unread ({submissions.filter(s => s.status === 'unread').length})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'read'
                ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                : 'bg-dark-card text-gray-400 hover:text-white'
            }`}
          >
            Read ({submissions.filter(s => s.status === 'read').length})
          </button>
        </div>

        {/* Submissions Grid */}
        <div className="grid lg:grid-cols-2 gap-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className={`bg-dark-card border rounded-xl p-6 cursor-pointer transition-all hover:border-gem-crystal/50 ${
                submission.status === 'unread' ? 'border-gem-gold/40' : 'border-gem-crystal/20'
              }`}
              onClick={() => {
                setSelectedSubmission(submission);
                if (submission.status === 'unread') {
                  markAsRead(submission.id);
                }
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gem-crystal" />
                    <h3 className="font-bold text-white">{submission.name}</h3>
                    {submission.status === 'unread' && (
                      <span className="px-2 py-0.5 bg-gem-gold/20 text-gem-gold text-xs rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-3 h-3" />
                    {submission.contact_method === 'email' && submission.email}
                    {submission.contact_method === 'farcaster' && `@${submission.farcaster_handle}`}
                    {submission.contact_method === 'x' && `@${submission.x_handle}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {submission.email_sent ? (
                    <div title="Email sent">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ) : submission.email_error ? (
                    <div title={submission.email_error}>
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                  ) : (
                    <div title="Email pending">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Subject */}
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-gem-crystal/10 text-gem-crystal text-xs rounded-full mb-2">
                  {CATEGORY_LABELS[submission.category] || submission.category}
                </span>
                <p className="font-semibold text-white line-clamp-1">{submission.subject}</p>
              </div>

              {/* Message Preview */}
              <p className="text-gray-400 text-sm line-clamp-2 mb-3">{submission.message}</p>

              {/* Footer */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(submission.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No submissions found</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              className="bg-dark-card border border-gem-crystal/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedSubmission.subject}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedSubmission.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedSubmission.contact_method === 'email' && selectedSubmission.email}
                      {selectedSubmission.contact_method === 'farcaster' && `@${selectedSubmission.farcaster_handle}`}
                      {selectedSubmission.contact_method === 'x' && `@${selectedSubmission.x_handle}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gem-crystal/10 text-gem-crystal text-sm rounded-full">
                  {CATEGORY_LABELS[selectedSubmission.category] || selectedSubmission.category}
                </span>
              </div>

              <div className="bg-dark-bg rounded-lg p-4 mb-4">
                <p className="text-white whitespace-pre-wrap">{selectedSubmission.message}</p>
              </div>

              {/* Display attached image if present */}
              {selectedSubmission.image_data && selectedSubmission.image_mime_type && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gem-crystal mb-2">Attached Image:</h3>
                  <div className="bg-dark-bg rounded-lg p-4">
                    <img
                      src={`data:${selectedSubmission.image_mime_type};base64,${selectedSubmission.image_data}`}
                      alt="Submitted attachment"
                      className="w-full h-auto max-h-96 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedSubmission.created_at).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  {selectedSubmission.email_sent && (
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Email Sent
                    </span>
                  )}
                  {selectedSubmission.email_error && (
                    <span className="text-red-500 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Email Failed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
