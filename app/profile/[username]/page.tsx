'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Share2, Copy, Check } from 'lucide-react';
import { MemeGallery, FeaturedMeme } from '@/components/profile/MemeGallery';
import { AccessTier } from '@/lib/empire';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { FEATURE_FLAGS } from '@/config/features';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PublicProfile {
  id: string;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  fid?: number;
  walletAddress?: string;
  empireTier?: string;
  empireRank?: number;
  totalShares: number;
  verifiedShares: number;
  sharePoints: number;
  ritualsCompleted: number;
  currentStreak: number;
  contestsEntered: number;
  contestsWon: number;
  checkInStreak: number;
  totalCheckIns: number;
  isOwner?: boolean;
}

export default function PublicProfilePage() {
  // Check feature flag
  if (!FEATURE_FLAGS.ENABLE_PUBLIC_PROFILES) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gem-gold mb-4">Profile Feature Coming Soon</h1>
          <p className="text-gray-400 mb-6">We're working on making profiles even better!</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-2 bg-gem-purple/20 border border-gem-purple/50 hover:border-gem-purple rounded-lg transition-all hover:shadow-lg hover:shadow-gem-purple/20 text-white">
            <span>← Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [featuredMeme, setFeaturedMeme] = useState<any>(null);
  const [galleryStats, setGalleryStats] = useState({
    unlocked: false,
    slots: 0,
    used: 0
  });

  // Get current user to check if viewing own profile
  const { farcasterUsername } = useUnifiedAuthStore();
  const isOwner = farcasterUsername === username;

  useEffect(() => {
    fetchPublicProfile();
  }, [username]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);

      // Fetch user by username
      const { data: userData, error: userError } = await supabase
        .from('unified_users')
        .select('*')
        .eq('farcaster_username', username)
        .single();

      if (userError || !userData) {
        notFound();
        return;
      }

      // Update gallery stats
      setGalleryStats({
        unlocked: userData.gallery_unlocked || false,
        slots: userData.gallery_slots || 0,
        used: 0
      });

      // Fetch featured meme if gallery is unlocked
      if (userData.gallery_unlocked) {
        const { data: memeData } = await supabase
          .from('user_memes')
          .select('*')
          .eq('user_id', userData.id)
          .eq('is_featured', true)
          .single();

        if (memeData) {
          setFeaturedMeme(memeData);
        }
      }

      // Fetch share stats
      const { data: shares } = await supabase
        .from('user_shares')
        .select('*')
        .eq('user_id', userData.id);

      const verifiedShares = shares?.filter(s => s.verified) || [];
      const totalPoints = shares?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0;

      // Fetch ritual completions
      const { data: ritualShares } = await supabase
        .from('user_shares')
        .select('*')
        .eq('user_id', userData.id)
        .eq('share_type', 'ritual');

      // Calculate streaks
      const ritualDates = new Set(ritualShares?.map(r => r.created_at.split('T')[0]));
      const currentStreak = calculateCurrentStreak(Array.from(ritualDates));

      // Fetch contest stats
      const { data: contestSubmissions } = await supabase
        .from('contest_submissions')
        .select('*')
        .eq('wallet_address', userData.wallet_address);

      const { data: contestWins } = await supabase
        .from('contest_winners')
        .select('*')
        .eq('wallet_address', userData.wallet_address);

      // Calculate check-in stats
      const checkInDays = Array.from(ritualDates).filter(date => {
        const dayRituals = ritualShares?.filter(r => r.created_at.startsWith(date));
        return (dayRituals?.length || 0) >= 3;
      });

      setProfile({
        id: userData.id,
        username: userData.farcaster_username,
        displayName: userData.farcaster_display_name,
        pfpUrl: userData.farcaster_pfp_url,
        fid: userData.farcaster_fid,
        walletAddress: userData.wallet_address,
        empireTier: userData.empire_tier,
        empireRank: userData.empire_rank,
        totalShares: shares?.length || 0,
        verifiedShares: verifiedShares.length,
        sharePoints: totalPoints,
        ritualsCompleted: ritualShares?.length || 0,
        currentStreak: currentStreak,
        contestsEntered: contestSubmissions?.length || 0,
        contestsWon: contestWins?.length || 0,
        checkInStreak: calculateCurrentStreak(checkInDays),
        totalCheckIns: checkInDays.length,
        isOwner
      });
    } catch (err) {
      console.error('Error fetching public profile:', err);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    const sortedDates = dates.sort((a, b) => b.localeCompare(a));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const dayDiff = (prevDate.getTime() - currDate.getTime()) / 86400000;
      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const copyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    const shareText = `Check out ${profile?.displayName || username}'s BizarreBeasts profile!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BizarreBeasts Profile',
          text: shareText,
          url: profileUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      copyProfileLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gem-gold text-2xl animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  if (!profile) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <div className="p-[2px] rounded-xl bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink h-full">
              <div className="bg-dark-card rounded-xl p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/" className="text-gem-gold hover:text-gem-crystal transition-colors">
                    ← Home
                  </Link>

                  {/* Share Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={shareProfile}
                      className="px-3 py-1 bg-gem-purple/20 hover:bg-gem-purple/30 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      onClick={copyProfileLink}
                      className="px-3 py-1 bg-gem-gold/20 hover:bg-gem-gold/30 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* Empire Tier Badge */}
                {profile.empireTier && (
                  <div className="flex justify-center mb-4">
                    <div className={`px-4 py-2 rounded-full text-lg font-bold flex items-center gap-2 ${
                      profile.empireTier === 'BIZARRE' ? 'bg-gradient-to-r from-gem-gold to-gem-purple text-white' :
                      profile.empireTier === 'WEIRDO' ? 'bg-gem-purple text-white' :
                      profile.empireTier === 'ODDBALL' ? 'bg-gem-pink text-white' :
                      profile.empireTier === 'MISFIT' ? 'bg-gem-crystal text-black' :
                      'bg-gray-600 text-white'
                    }`}>
                      <span className="text-xl">
                        {profile.empireTier === 'BIZARRE' ? '👑' :
                         profile.empireTier === 'WEIRDO' ? '🔮' :
                         profile.empireTier === 'ODDBALL' ? '💎' :
                         profile.empireTier === 'MISFIT' ? '🎯' :
                         '🌟'}
                      </span>
                      {profile.empireTier}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  {/* Profile Picture */}
                  {profile.pfpUrl ? (
                    <img
                      src={profile.pfpUrl}
                      alt={profile.displayName || profile.username || 'Profile'}
                      className="w-24 h-24 rounded-full border-4 border-gem-gold/50 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gem-gold to-gem-purple flex items-center justify-center text-3xl font-bold text-white border-4 border-gem-gold/50 shadow-lg">
                      {profile.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                        {profile.displayName || profile.username || 'Anonymous'}
                      </h1>
                      {profile.username && (
                        <span className="text-gray-400 text-xl">@{profile.username}</span>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm text-gray-400">
                      {profile.fid && (
                        <span className="flex items-center gap-1">
                          <span className="text-gem-crystal">FID:</span> {profile.fid}
                        </span>
                      )}
                      {profile.empireRank && (
                        <span className="flex items-center gap-1">
                          <span className="text-gem-pink">Rank:</span> #{profile.empireRank}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Meme Card */}
          <div className="lg:col-span-1">
            <FeaturedMeme
              meme={featuredMeme}
              isOwner={isOwner}
              galleryUnlocked={galleryStats.unlocked}
              onView={(meme) => {
                console.log('View featured meme:', meme);
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Shares"
            value={profile.totalShares}
            subtitle={`${profile.verifiedShares} verified`}
            icon="🔄"
          />
          <StatCard
            title="Share Points"
            value={profile.sharePoints.toLocaleString()}
            subtitle={`Earned from shares`}
            icon="⭐"
          />
          <StatCard
            title="Rituals"
            value={profile.ritualsCompleted}
            subtitle={`${profile.currentStreak} day streak`}
            icon="🎯"
          />
          <StatCard
            title="Contests"
            value={profile.contestsEntered}
            subtitle={`${profile.contestsWon} won`}
            icon="🏆"
          />
        </div>

        {/* Meme Gallery */}
        {galleryStats.unlocked && (
          <div className="mb-8">
            <MemeGallery
              userId={profile.id}
              isOwnProfile={isOwner}
              userTier={(profile.empireTier as AccessTier) || AccessTier.NORMIE}
              galleryUnlocked={galleryStats.unlocked}
              gallerySlots={galleryStats.slots}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: any) {
  return (
    <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gem-gold">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}