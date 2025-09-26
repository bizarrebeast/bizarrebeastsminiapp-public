'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  X, Heart, Share2, Download, MessageCircle,
  Flame, Laugh, Brain, MoreVertical, ExternalLink,
  Copy, Trash2, Edit
} from 'lucide-react';
import { Meme, MemeComment } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MemeViewerProps {
  meme: Meme;
  onClose: () => void;
  onReaction: (memeId: string, reactionType: string) => void;
  isOwner: boolean;
}

export default function MemeViewer({ meme, onClose, onReaction, isOwner }: MemeViewerProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<MemeComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const reactions = [
    { type: 'like', icon: Heart, color: 'text-red-500' },
    { type: 'fire', icon: Flame, color: 'text-orange-500' },
    { type: 'laugh', icon: Laugh, color: 'text-yellow-500' },
    { type: 'mind_blown', icon: Brain, color: 'text-purple-500' }
  ];

  const handleShare = async (platform: string) => {
    const shareUrl = `${window.location.origin}/meme/${meme.id}`;
    const shareText = `Check out this meme: ${meme.title}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'farcaster':
        window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        break;
    }

    // Track share
    await supabase
      .from('user_memes')
      .update({ share_count: meme.share_count + 1 })
      .eq('id', meme.id);

    setShowShareMenu(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = meme.image_url;
    link.download = `${meme.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('meme_comments')
        .select(`
          *,
          user:unified_users(
            farcaster_username,
            farcaster_pfp_url
          )
        `)
        .eq('meme_id', meme.id)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('meme_comments')
        .insert({
          meme_id: meme.id,
          user_id: meme.user_id, // Should be current user
          content: newComment
        })
        .select()
        .single();

      if (error) throw error;

      setComments([data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  React.useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[50vh] md:min-h-full">
          <img
            src={meme.image_url}
            alt={meme.title}
            className="w-full h-full object-contain"
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* NFT Badge */}
          {meme.is_nft && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-gem-gold text-dark-bg font-bold rounded-lg">
              NFT
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-96 p-6 flex flex-col">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">{meme.title}</h2>
            {meme.description && (
              <p className="text-gray-400 text-sm">{meme.description}</p>
            )}

            {/* Tags */}
            {meme.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {meme.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gem-purple/20 text-gem-purple rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold">{meme.like_count}</div>
              <div className="text-xs text-gray-400">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{meme.share_count}</div>
              <div className="text-xs text-gray-400">Shares</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{meme.view_count}</div>
              <div className="text-xs text-gray-400">Views</div>
            </div>
          </div>

          {/* Reactions */}
          <div className="flex gap-2 mb-4">
            {reactions.map(({ type, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => onReaction(meme.id, type)}
                className={`flex-1 py-2 rounded-lg bg-dark-bg hover:bg-gray-700 transition ${color}`}
              >
                <Icon className="w-5 h-5 mx-auto" />
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex-1 py-2 px-3 bg-dark-bg rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Comments</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="py-2 px-3 bg-dark-bg rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>

              {showShareMenu && (
                <div className="absolute top-full mt-2 right-0 bg-dark-card border border-gray-700 rounded-lg shadow-lg p-2 z-10">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full px-3 py-2 text-left hover:bg-gray-700 rounded transition text-sm"
                  >
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => handleShare('farcaster')}
                    className="w-full px-3 py-2 text-left hover:bg-gray-700 rounded transition text-sm"
                  >
                    Share on Farcaster
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full px-3 py-2 text-left hover:bg-gray-700 rounded transition text-sm"
                  >
                    <Copy className="w-4 h-4 inline mr-2" />
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="py-2 px-3 bg-dark-bg rounded-lg hover:bg-gray-700 transition"
            >
              <Download className="w-4 h-4" />
            </button>

            {isOwner && (
              <button className="py-2 px-3 bg-dark-bg rounded-lg hover:bg-gray-700 transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="flex-1 flex flex-col border-t border-gray-700 pt-4">
              {/* Add Comment */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg focus:outline-none focus:border-gem-purple"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-gem-purple rounded-lg hover:opacity-90 transition"
                >
                  Post
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {loadingComments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-gem-purple border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gem-purple to-gem-crystal flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {comment.user?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* NFT Actions */}
          {meme.is_nft && (
            <div className="mt-auto pt-4 border-t border-gray-700">
              <button className="w-full py-2 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg font-bold rounded-lg hover:opacity-90 transition">
                <ExternalLink className="w-4 h-4 inline mr-2" />
                View on OpenSea
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}