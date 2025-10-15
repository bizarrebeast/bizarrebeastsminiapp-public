'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Trophy, Calendar, Coins, Users, FileText, Upload, Image, ExternalLink, Link, Save, Image as ImageIcon } from 'lucide-react';
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
    track_cta_clicks: contest.track_cta_clicks ?? true,
    gallery_enabled: contest.gallery_enabled ?? false,
    display_votes: contest.display_votes ?? true,
    gallery_view_type: contest.gallery_view_type || 'grid'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get admin wallet from standardized location
      const adminWallet = localStorage.getItem('adminWallet');

      // Prepare updates, filtering out empty values
      const updates: any = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        game_name: formData.game_name || null,
        min_bb_required: Number(formData.min_bb_required) || 0,
        max_bb_required: formData.max_bb_required ? Number(formData.max_bb_required) : null,
        prize_amount: formData.prize_amount ? Number(formData.prize_amount) : null,
        prize_type: formData.prize_type,
        nft_contract_address: formData.nft_contract_address || null,
        max_entries_per_wallet: Number(formData.max_entries_per_wallet) || 1,
        rules: formData.rules || null,
        status: formData.status,
        is_recurring: formData.is_recurring,
        recurrence_interval: formData.recurrence_interval || null,
        is_test: formData.is_test,
        banner_image_url: formData.banner_image_url || null,
        voting_enabled: formData.voting_enabled,
        voting_type: formData.voting_type || 'single',
        min_votes_required: formData.min_votes_required ? Number(formData.min_votes_required) : 1,
        cta_url: formData.cta_url || null,
        cta_button_text: formData.cta_button_text || null,
        cta_type: formData.cta_type || 'internal',
        cta_new_tab: formData.cta_new_tab || false,
        track_cta_clicks: formData.track_cta_clicks ?? true,
        gallery_enabled: formData.gallery_enabled,
        display_votes: formData.display_votes,
        gallery_view_type: formData.gallery_view_type || 'grid',
        updated_at: new Date().toISOString()
      };

      // Only add date fields if they have values
      if (formData.start_date) {
        updates.start_date = formData.start_date;
      }
      if (formData.end_date) {
        updates.end_date = formData.end_date;
      }
      if (formData.voting_start_date) {
        updates.voting_start_date = formData.voting_start_date;
      }
      if (formData.voting_end_date) {
        updates.voting_end_date = formData.voting_end_date;
      }

      const response = await fetch('/api/admin/contests/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': adminWallet || '',
        },
        body: JSON.stringify({
          contestId: contest.id,
          adminWallet: adminWallet, // Also include in body as fallback
          updates: updates
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

          {/* Game Name (conditional) */}
          {formData.type === 'game_score' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game Name
              </label>
              <input
                type="text"
                value={formData.game_name}
                onChange={(e) => setFormData({ ...formData, game_name: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:border-gem-crystal
                         focus:outline-none transition"
                placeholder="e.g., Treasure Quest"
              />
            </div>
          )}

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
                style={{ colorScheme: 'dark' }}
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
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Token Requirements */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Coins className="inline w-4 h-4 mr-1" />
                Min $BB Required
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_bb_required}
                onChange={(e) => setFormData({ ...formData, min_bb_required: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition"
                placeholder="0 for free entry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Max Entries Per Wallet
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_entries_per_wallet}
                onChange={(e) => setFormData({ ...formData, max_entries_per_wallet: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition"
              />
            </div>
          </div>

          {/* Prize Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prize Type
              </label>
              <select
                value={formData.prize_type}
                onChange={(e) => setFormData({ ...formData, prize_type: e.target.value as any })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition"
              >
                <option value="tokens">Tokens</option>
                <option value="nft">NFT</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prize Amount ($BB)
              </label>
              <input
                type="number"
                min="0"
                value={formData.prize_amount}
                onChange={(e) => setFormData({ ...formData, prize_amount: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Contest Rules
            </label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 focus:border-gem-crystal
                       focus:outline-none transition resize-none"
              placeholder="Any specific rules or requirements..."
            />
          </div>

          {/* Banner Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Image className="inline w-4 h-4 mr-1" />
              Banner Image URL or Path
            </label>
            <input
              type="text"
              value={formData.banner_image_url}
              onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 focus:border-gem-crystal
                       focus:outline-none transition"
              placeholder="Full URL or path (e.g., /assets/banners/image.png)"
            />
            {formData.banner_image_url && (
              <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={formData.banner_image_url}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Voting Settings (for creative contests) */}
          {formData.type === 'creative' && (
            <div className="space-y-4 p-4 bg-dark-bg/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Voting Settings</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.voting_enabled || false}
                    onChange={(e) => setFormData({ ...formData, voting_enabled: e.target.checked })}
                    className="rounded border-gray-700 bg-dark-bg text-gem-crystal
                             focus:ring-gem-crystal focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300">Enable Voting</span>
                </label>
              </div>

              {formData.voting_enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Voting Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.voting_start_date || ''}
                        onChange={(e) => setFormData({ ...formData, voting_start_date: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                                 text-white focus:border-gem-crystal focus:outline-none transition"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Voting End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.voting_end_date || ''}
                        onChange={(e) => setFormData({ ...formData, voting_end_date: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                                 text-white focus:border-gem-crystal focus:outline-none transition"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Voting Type
                      </label>
                      <select
                        value={formData.voting_type || 'single'}
                        onChange={(e) => setFormData({ ...formData, voting_type: e.target.value as any })}
                        className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                                 text-white focus:border-gem-crystal focus:outline-none transition"
                      >
                        <option value="single">Single Vote (1 per wallet)</option>
                        <option value="multiple">Multiple Votes</option>
                        <option value="ranked">Ranked Choice</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Min Votes Required
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.min_votes_required || 1}
                        onChange={(e) => setFormData({ ...formData, min_votes_required: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                                 text-white focus:border-gem-crystal focus:outline-none transition"
                        placeholder="Minimum votes to determine winner"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Recurring Contest Settings */}
          <div className="space-y-3 p-4 bg-dark-bg/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_recurring_edit"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-4 h-4 text-gem-crystal bg-dark-bg border-gray-600 rounded
                         focus:ring-gem-crystal focus:ring-2"
              />
              <label htmlFor="is_recurring_edit" className="text-sm font-medium text-gray-300">
                Make this a recurring contest
              </label>
            </div>

            {formData.is_recurring && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recurrence Interval
                </label>
                <select
                  value={formData.recurrence_interval}
                  onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value as any })}
                  className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                           text-white focus:border-gem-crystal focus:outline-none transition"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  A new contest will be created automatically at this interval
                </p>
              </div>
            )}
          </div>

          {/* Test Contest Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_test_edit"
              checked={formData.is_test}
              onChange={(e) => setFormData({ ...formData, is_test: e.target.checked })}
              className="w-4 h-4 text-gem-crystal bg-dark-bg border-gray-600 rounded
                       focus:ring-gem-crystal focus:ring-2 mr-3"
            />
            <label htmlFor="is_test_edit" className="text-sm font-medium text-gray-300">
              🧪 Test Contest
              <span className="block text-xs text-gray-500 mt-1">
                Mark as test (can be filtered out in production)
              </span>
            </label>
          </div>

          {/* Gallery Settings - Only for creative and onboarding contests */}
          {(formData.type === 'creative' || formData.type === 'onboarding') && (
            <div className="bg-gradient-to-r from-gem-crystal/10 via-gem-gold/10 to-gem-pink/10
                          border border-gem-crystal/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gem-crystal mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Gallery Settings
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.gallery_enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      gallery_enabled: e.target.checked
                    })}
                    className="rounded border-gray-700 bg-dark-bg text-gem-crystal
                             focus:ring-gem-crystal focus:ring-offset-0"
                  />
                  <span className="text-white">Enable Meme Gallery</span>
                  <span className="text-xs text-gray-400">(Shows submissions in a visual grid)</span>
                </label>

                {formData.gallery_enabled && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.display_votes}
                        onChange={(e) => setFormData({
                          ...formData,
                          display_votes: e.target.checked
                        })}
                        className="rounded border-gray-700 bg-dark-bg text-gem-crystal
                                 focus:ring-gem-crystal focus:ring-offset-0"
                      />
                      <span className="text-white">Display vote counts publicly</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-300">View Type:</label>
                      <select
                        value={formData.gallery_view_type}
                        onChange={(e) => setFormData({
                          ...formData,
                          gallery_view_type: e.target.value as 'grid' | 'carousel'
                        })}
                        className="px-3 py-1 bg-dark-bg border border-gray-700 rounded
                                 text-white focus:border-gem-crystal focus:outline-none transition"
                      >
                        <option value="grid">Grid View</option>
                        <option value="carousel">Carousel View</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

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