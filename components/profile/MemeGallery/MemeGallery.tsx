'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { AccessTier } from '@/lib/empire';
import {
  Upload, Image, Lock, Crown, Plus, Grid, List,
  Heart, Share2, Eye, Flame, Laugh, Brain,
  MessageCircle, MoreVertical, X, ShoppingBag, Star
} from 'lucide-react';
import { Meme, MemeCollection, TIER_ACCESS_CONFIG } from './types';
import MemeUploader from './MemeUploader';
import MemeViewer from './MemeViewer';
import PaymentModal from './PaymentModal';
import FeaturedMeme from './FeaturedMeme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MemeGalleryProps {
  userId: string;
  isOwnProfile: boolean;
  userTier: AccessTier;
  galleryUnlocked?: boolean;
  gallerySlots?: number;
}

export default function MemeGallery({ userId, isOwnProfile, userTier, galleryUnlocked = false, gallerySlots = 0 }: MemeGalleryProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [collections, setCollections] = useState<MemeCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'collections'>('all');
  const [featuredMeme, setFeaturedMeme] = useState<Meme | null>(null);
  const [currentSlots, setCurrentSlots] = useState(gallerySlots);
  const [isUnlocked, setIsUnlocked] = useState(galleryUnlocked);
  const [stats, setStats] = useState({
    total: 0,
    likes: 0,
    shares: 0,
    views: 0
  });

  const access = TIER_ACCESS_CONFIG[userTier];
  const { walletAddress } = useUnifiedAuthStore();

  useEffect(() => {
    if (isUnlocked) {
      fetchMemes();
      fetchStats();
      if (access.canCreateCollections) {
        fetchCollections();
      }
    }
  }, [userId, isUnlocked]);

  const fetchMemes = async () => {
    try {
      const query = supabase
        .from('user_memes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Only show public memes if not own profile
      if (!isOwnProfile) {
        query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMemes(data || []);

      // Find the featured meme (starred)
      const featured = data?.find(m => m.is_featured || m.is_starred);
      if (featured) {
        setFeaturedMeme(featured);
      }
    } catch (error) {
      console.error('Error fetching memes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const query = supabase
        .from('meme_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isOwnProfile) {
        query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_meme_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setStats({
          total: data.total_memes || 0,
          likes: data.total_likes || 0,
          shares: data.total_shares || 0,
          views: data.total_views || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMemeClick = async (meme: Meme) => {
    setSelectedMeme(meme);
    // Increment view count
    await supabase.rpc('increment_meme_view', { meme_id_param: meme.id });
  };

  const handleReaction = async (memeId: string, reactionType: string) => {
    if (!walletAddress) {
      alert('Please connect your wallet to react to memes');
      return;
    }

    try {
      const { error } = await supabase
        .from('meme_reactions')
        .upsert({
          meme_id: memeId,
          user_id: userId,
          reaction_type: reactionType
        });

      if (error) throw error;

      // Update local state
      setMemes(prev => prev.map(m =>
        m.id === memeId
          ? { ...m, like_count: m.like_count + 1 }
          : m
      ));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const getTierBadge = () => {
    const badges = {
      [AccessTier.NORMIE]: { icon: Lock, color: 'text-gray-400', bg: 'bg-gray-600' },
      [AccessTier.MISFIT]: { icon: Image, color: 'text-green-400', bg: 'bg-green-600' },
      [AccessTier.ODDBALL]: { icon: Image, color: 'text-blue-400', bg: 'bg-blue-600' },
      [AccessTier.WEIRDO]: { icon: Crown, color: 'text-purple-400', bg: 'bg-purple-600' },
      [AccessTier.BIZARRE]: { icon: Crown, color: 'text-gem-gold', bg: 'bg-gradient-to-r from-gem-gold to-gem-crystal' }
    };

    const badge = badges[userTier];
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {userTier}
      </div>
    );
  };

  const handleStarMeme = async (memeId: string) => {
    try {
      // Unstar all other memes first
      await supabase
        .from('user_memes')
        .update({ is_featured: false })
        .eq('user_id', userId);

      // Star the selected meme
      const { error } = await supabase
        .from('user_memes')
        .update({ is_featured: true })
        .eq('id', memeId);

      if (error) throw error;

      // Update local state
      const starred = memes.find(m => m.id === memeId);
      if (starred) {
        setFeaturedMeme(starred);
        setMemes(prev => prev.map(m => ({ ...m, is_featured: m.id === memeId })));
      }
    } catch (error) {
      console.error('Error starring meme:', error);
    }
  };

  const handlePaymentSuccess = (newSlots: number) => {
    setCurrentSlots(newSlots);
    setIsUnlocked(true);
    setShowPaymentModal(false);
    fetchMemes(); // Load memes after unlock
  };

  const renderEmptyState = () => {
    if (!isUnlocked) {
      return (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-bold mb-2">Unlock Your Meme Gallery</h3>
          <p className="text-gray-400 mb-4">
            Create and showcase your best memes to the world
          </p>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-gem-purple to-gem-crystal text-white rounded-lg hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Unlock Gallery ($2)
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <Image className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <h3 className="text-xl font-bold mb-2">No Memes Yet</h3>
        {isOwnProfile ? (
          <>
            <p className="text-gray-400 mb-4">
              Start your meme collection today!
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="px-4 py-2 bg-gem-purple text-white rounded-lg hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Upload Your First Meme
            </button>
          </>
        ) : (
          <p className="text-gray-400">
            This user hasn't uploaded any memes yet
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-dark-card rounded-xl p-6 border border-gem-purple/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Meme Gallery</h2>
          {getTierBadge()}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-dark-bg rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gem-purple' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gem-purple' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Button */}
          {isOwnProfile && access.canUpload && (
            <button
              onClick={() => setShowUploader(true)}
              disabled={memes.length >= access.uploadLimit}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                memes.length >= access.uploadLimit
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gem-purple to-gem-crystal text-white hover:opacity-90'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload ({memes.length}/{access.uploadLimit})
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-bg rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gem-gold">{stats.total}</div>
          <div className="text-xs text-gray-400">Memes</div>
        </div>
        <div className="bg-dark-bg rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-pink-400">{stats.likes}</div>
          <div className="text-xs text-gray-400">Likes</div>
        </div>
        <div className="bg-dark-bg rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.shares}</div>
          <div className="text-xs text-gray-400">Shares</div>
        </div>
        <div className="bg-dark-bg rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.views}</div>
          <div className="text-xs text-gray-400">Views</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'all'
              ? 'border-gem-purple text-gem-purple'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          All Memes
        </button>
        <button
          onClick={() => setActiveTab('featured')}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'featured'
              ? 'border-gem-purple text-gem-purple'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Featured
        </button>
        {access.canCreateCollections && (
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-2 px-1 border-b-2 transition ${
              activeTab === 'collections'
                ? 'border-gem-purple text-gem-purple'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Collections ({collections.length})
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gem-purple border-t-transparent rounded-full" />
        </div>
      ) : memes.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
          {memes
            .filter(m => activeTab === 'featured' ? m.is_featured : true)
            .map(meme => (
              <div
                key={meme.id}
                onClick={() => handleMemeClick(meme)}
                className="group relative bg-dark-bg rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-gem-purple transition"
              >
                {/* Meme Image */}
                <div className="aspect-square relative">
                  <img
                    src={meme.thumbnail_url || meme.image_url}
                    alt={meme.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-white font-semibold text-sm truncate">{meme.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {meme.like_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" /> {meme.share_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {meme.view_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* NFT Badge */}
                  {meme.is_nft && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gem-gold text-dark-bg text-xs font-bold rounded">
                      NFT
                    </div>
                  )}

                  {/* Featured Badge */}
                  {meme.is_featured && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-gem-purple text-white text-xs font-bold rounded">
                      Featured
                    </div>
                  )}
                </div>

                {/* List View Details */}
                {viewMode === 'list' && (
                  <div className="p-3">
                    <h4 className="font-semibold truncate">{meme.title}</h4>
                    {meme.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{meme.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{new Date(meme.created_at).toLocaleDateString()}</span>
                      {meme.tags.length > 0 && (
                        <span>#{meme.tags.join(' #')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
        }
        </div>
      )}

      {/* Modals */}
      {showUploader && (
        <MemeUploader
          userId={userId}
          userTier={userTier}
          currentCount={memes.length}
          onClose={() => setShowUploader(false)}
          onSuccess={() => {
            fetchMemes();
            fetchStats();
            setShowUploader(false);
          }}
        />
      )}

      {selectedMeme && (
        <MemeViewer
          meme={selectedMeme}
          onClose={() => setSelectedMeme(null)}
          onReaction={handleReaction}
          isOwner={isOwnProfile}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          userId={userId}
          walletAddress={walletAddress || undefined}
          currentSlots={currentSlots}
          isFirstPurchase={currentSlots === 0}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}