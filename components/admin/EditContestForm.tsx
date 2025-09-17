'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Trophy, Calendar, Coins, Users, FileText, Upload, Image, ExternalLink, Link, Save } from 'lucide-react';
import { Contest, contestQueries } from '@/lib/supabase';

interface EditContestFormProps {
  contest: Contest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditContestForm({ contest, isOpen, onClose, onSuccess }: EditContestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: contest.name,
    type: contest.type,
    description: contest.description || '',
    game_name: contest.game_name || '',
    start_date: contest.start_date ? new Date(contest.start_date).toISOString().slice(0, 16) : '',
    end_date: contest.end_date ? new Date(contest.end_date).toISOString().slice(0, 16) : '',
    min_bb_required: contest.min_bb_required.toString(),
    max_bb_required: contest.max_bb_required?.toString() || '',
    prize_amount: contest.prize_amount?.toString() || '',
    prize_type: contest.prize_type,
    nft_contract_address: contest.nft_contract_address || '',
    max_entries_per_wallet: contest.max_entries_per_wallet.toString(),
    rules: contest.rules || '',
    status: contest.status,
    is_recurring: contest.is_recurring || false,
    recurrence_interval: contest.recurrence_interval || 'weekly',
    is_test: contest.is_test || false,
    banner_image_url: contest.banner_image_url || '',
    voting_enabled: contest.voting_enabled || false,
    voting_start_date: contest.voting_start_date ? new Date(contest.voting_start_date).toISOString().slice(0, 16) : '',
    voting_end_date: contest.voting_end_date ? new Date(contest.voting_end_date).toISOString().slice(0, 16) : '',
    voting_type: contest.voting_type || 'single',
    min_votes_required: contest.min_votes_required?.toString() || '1',
    cta_url: contest.cta_url || '',
    cta_button_text: contest.cta_button_text || '',
    cta_type: contest.cta_type || 'internal',
    cta_new_tab: contest.cta_new_tab || false,
    track_cta_clicks: contest.track_cta_clicks ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/contests/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: contest.id,
          updates: {
            ...formData,
            min_bb_required: Number(formData.min_bb_required) || 0,
            max_bb_required: formData.max_bb_required ? Number(formData.max_bb_required) : undefined,
            prize_amount: formData.prize_amount ? Number(formData.prize_amount) : undefined,
            max_entries_per_wallet: Number(formData.max_entries_per_wallet) || 1,
            min_votes_required: formData.min_votes_required ? Number(formData.min_votes_required) : 1,
            nft_contract_address: formData.nft_contract_address || undefined,
            cta_url: formData.cta_url || undefined,
            cta_button_text: formData.cta_button_text || undefined,
            updated_at: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contest');
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating contest:', err);
      setError(err instanceof Error ? err.message : 'Failed to update contest');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-gem-crystal/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-gray-800 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gem-gold" />
            Edit Contest
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contest Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contest Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 focus:border-gem-crystal
                       focus:outline-none transition"
            />
          </div>

          {/* Contest Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contest Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-white focus:border-gem-crystal focus:outline-none transition"
            >
              <option value="game_score">Game Score Contest</option>
              <option value="creative">Creative/Meme Contest</option>
              <option value="onboarding">Onboarding Tasks</option>
              <option value="tiered">Tiered Contest</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 focus:border-gem-crystal
                       focus:outline-none transition resize-none"
              placeholder="Describe the contest and how to win..."
            />
          </div>

          {/* CTA Settings */}
          <div className="space-y-4 p-4 bg-dark-bg/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white">Call-to-Action Settings</h3>

            {/* CTA URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CTA URL (Where the action button takes users)
              </label>
              <input
                type="url"
                value={formData.cta_url}
                onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:border-gem-crystal
                         focus:outline-none transition"
                placeholder="e.g., /games/treasure-quest or https://meme-creator.example.com"
              />
            </div>

            {/* CTA Button Text and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={formData.cta_button_text}
                  onChange={(e) => setFormData({ ...formData, cta_button_text: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 focus:border-gem-crystal
                           focus:outline-none transition"
                  placeholder="e.g., Play Game"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link Type
                </label>
                <select
                  value={formData.cta_type}
                  onChange={(e) => setFormData({ ...formData, cta_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                           text-white focus:border-gem-crystal focus:outline-none transition"
                >
                  <option value="internal">Internal Link</option>
                  <option value="external">External Link</option>
                  <option value="game">Game</option>
                  <option value="tool">Tool/Creator</option>
                </select>
              </div>
            </div>

            {/* CTA Options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cta_new_tab}
                  onChange={(e) => setFormData({ ...formData, cta_new_tab: e.target.checked })}
                  className="rounded border-gray-700 bg-dark-bg text-gem-crystal
                           focus:ring-gem-crystal focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Open in new tab</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.track_cta_clicks}
                  onChange={(e) => setFormData({ ...formData, track_cta_clicks: e.target.checked })}
                  className="rounded border-gray-700 bg-dark-bg text-gem-crystal
                           focus:ring-gem-crystal focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Track button clicks</span>
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contest Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-white focus:border-gem-crystal focus:outline-none transition"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-gray-300 hover:border-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                       text-dark-bg font-bold rounded-lg hover:opacity-90
                       disabled:opacity-50 disabled:cursor-not-allowed transition
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}