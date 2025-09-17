'use client';

import { useState } from 'react';
import { X, Loader2, Trophy, Calendar, Coins, Users, FileText, Upload, Image } from 'lucide-react';

interface CreateContestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateContestForm({ isOpen, onClose, onSuccess }: CreateContestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'game_score' as 'game_score' | 'creative' | 'onboarding' | 'tiered',
    description: '',
    game_name: '',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    min_bb_required: '',
    max_bb_required: '',
    prize_amount: '',
    prize_type: 'tokens' as 'tokens' | 'nft' | 'both',
    nft_contract_address: '',
    max_entries_per_wallet: '1',
    rules: '',
    status: 'active' as 'draft' | 'active' | 'ended' | 'cancelled',
    is_recurring: false,
    recurrence_interval: 'weekly' as 'daily' | 'weekly' | 'monthly',
    is_test: false,
    banner_image_url: ''
  });

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }

      setBannerFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBanner = async (): Promise<string | undefined> => {
    if (!bannerFile) return undefined;

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', bannerFile);

      const response = await fetch('/api/admin/contests/upload-banner', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload banner');
      }

      return data.url;
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw error;
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload banner image if selected
      let bannerUrl: string | undefined;
      if (bannerFile) {
        try {
          bannerUrl = await uploadBanner();
        } catch (uploadError) {
          setError('Failed to upload banner image. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Get admin wallet - try multiple sources
      let adminWallet = localStorage.getItem('walletAddress');

      // If not in localStorage, try to get from window.ethereum
      if (!adminWallet && typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        adminWallet = accounts[0];
      }

      // Use environment variable as fallback for admin
      if (!adminWallet) {
        adminWallet = process.env.NEXT_PUBLIC_CONTEST_ADMIN_WALLET || null;
      }

      if (!adminWallet) {
        throw new Error('Please connect your admin wallet first');
      }

      const response = await fetch('/api/admin/contests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          banner_image_url: bannerUrl || formData.banner_image_url || undefined,
          created_by: adminWallet.toLowerCase(),
          min_bb_required: formData.min_bb_required ? Number(formData.min_bb_required) : 0,
          max_bb_required: formData.max_bb_required ? Number(formData.max_bb_required) : undefined,
          prize_amount: formData.prize_amount ? Number(formData.prize_amount) : undefined,
          max_entries_per_wallet: formData.max_entries_per_wallet ? Number(formData.max_entries_per_wallet) : 1,
          nft_contract_address: formData.nft_contract_address || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contest');
      }

      // Success!
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        type: 'game_score',
        description: '',
        game_name: '',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        min_bb_required: '',
        max_bb_required: '',
        prize_amount: '',
        prize_type: 'tokens',
        nft_contract_address: '',
        max_entries_per_wallet: '1',
        rules: '',
        status: 'active',
        is_recurring: false,
        recurrence_interval: 'weekly',
        is_test: false,
        banner_image_url: ''
      });
      setBannerFile(null);
      setBannerPreview(null);
    } catch (err) {
      console.error('Error creating contest:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contest');
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
            Create New Contest
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
              placeholder="e.g., Treasure Quest High Score Challenge"
            />
          </div>

          {/* Contest Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contest Type *
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

          {/* Banner Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Image className="inline w-4 h-4 mr-1" />
              Contest Banner Image
            </label>
            <div className="space-y-3">
              {/* Preview */}
              {bannerPreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-700">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg
                             text-white hover:bg-black/70 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              {!bannerPreview && (
                <label className="flex flex-col items-center justify-center w-full h-32
                                 border-2 border-dashed border-gray-700 rounded-lg
                                 cursor-pointer hover:border-gem-crystal/50 transition
                                 bg-dark-bg/50">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Click to upload banner</span>
                  <span className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP or GIF (Max 5MB)</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleBannerSelect}
                  />
                </label>
              )}

              {/* URL Input (Optional) */}
              <div>
                <input
                  type="url"
                  value={formData.banner_image_url}
                  onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 focus:border-gem-crystal
                           focus:outline-none transition text-sm"
                  placeholder="Or paste banner image URL (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a file or provide a URL for the contest banner
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition
                         cursor-pointer hover:border-gem-crystal/50"
                style={{ colorScheme: 'dark' }}
              />
              <p className="text-xs text-gray-500 mt-1">Click to select date and time</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition
                         cursor-pointer hover:border-gem-crystal/50"
                style={{ colorScheme: 'dark' }}
              />
              <p className="text-xs text-gray-500 mt-1">Contest will end at this time</p>
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

          {/* Contest Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white focus:border-gem-crystal focus:outline-none transition"
              >
                <option value="active">Active (Live Immediately)</option>
                <option value="draft">Draft (Not Visible Yet)</option>
              </select>
            </div>

            {/* Test Contest Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_test"
                checked={formData.is_test}
                onChange={(e) => setFormData({ ...formData, is_test: e.target.checked })}
                className="w-4 h-4 text-gem-crystal bg-dark-bg border-gray-600 rounded
                         focus:ring-gem-crystal focus:ring-2 mr-3"
              />
              <label htmlFor="is_test" className="text-sm font-medium text-gray-300">
                🧪 Test Contest
                <span className="block text-xs text-gray-500 mt-1">
                  Mark as test (can be filtered out in production)
                </span>
              </label>
            </div>
          </div>

          {/* Recurring Contest */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-4 h-4 text-gem-crystal bg-dark-bg border-gray-600 rounded
                         focus:ring-gem-crystal focus:ring-2"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-gray-300">
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
                  {uploadingBanner ? 'Uploading Banner...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  Create Contest
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}