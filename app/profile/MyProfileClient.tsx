'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Share2, Copy, Check } from 'lucide-react';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { MemeGallery, FeaturedMeme } from '@/components/profile/MemeGallery';
import { AccessTier } from '@/lib/empire';
import { FEATURE_FLAGS } from '@/config/features';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  // User Identity
  id: string;
  farcasterUsername?: string;
  farcasterDisplayName?: string;
  farcasterPfpUrl?: string;
  farcasterFid?: number;
  walletAddress?: string;
  empireTier?: string;
  empireRank?: number;
  empireScore?: string;

  // Share Stats
  totalShares: number;
  verifiedShares: number;
  sharePoints: number;
  viralCoefficient: number;

  // Ritual Stats
  ritualsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  favoriteRitual?: string;

  // Contest Stats
  contestsEntered: number;
  contestsWon: number;
  totalPrizeWon: number;

  // Check-in Stats
  checkInStreak: number;
  totalCheckIns: number;
  lastCheckIn?: string;

  // Activity Timeline
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    points?: number;
  }>;
}

export default function ProfilePage() {
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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredMeme, setFeaturedMeme] = useState<any>(null);
  const [galleryStats, setGalleryStats] = useState({
    unlocked: false,
    slots: 0,
    used: 0
  });
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Get auth state from store - include more fields for display
  const {
    userId,
    walletAddress,
    farcasterConnected,
    walletConnected,
    farcasterUsername,
    farcasterDisplayName,
    farcasterPfpUrl,
    farcasterFid,
    empireTier,
    empireRank,
    empireScore
  } = useUnifiedAuthStore();

  // Log store data on mount and when it changes
  console.log('🔍 PROFILE PAGE - Store Data:', {
    userId,
    walletAddress,
    farcasterConnected,
    walletConnected,
    farcasterUsername,
    farcasterDisplayName,
    farcasterPfpUrl,
    farcasterFid,
    empireTier,
    empireRank,
    empireScore,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // Check auth on mount
    const checkAuth = () => {
      // Check localStorage directly for persisted auth
      const storedAuth = localStorage.getItem('unified-auth-storage');

      if (!storedAuth && !userId && !walletAddress) {
        router.push('/');
        return;
      }

      try {
        let state: any = {};
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          state = authData?.state || {};
        }

        // Debug logging
        console.log('📊 PROFILE PAGE - Auth Check Results:', {
          fromStore: {
            userId,
            farcasterUsername,
            farcasterDisplayName,
            farcasterPfpUrl,
            empireTier,
            walletAddress,
            farcasterFid
          },
          fromLocalStorage: {
            userId: state?.userId,
            farcasterUsername: state?.farcasterUsername,
            farcasterDisplayName: state?.farcasterDisplayName,
            farcasterPfpUrl: state?.farcasterPfpUrl,
            empireTier: state?.empireTier,
            walletAddress: state?.walletAddress,
            farcasterFid: state?.farcasterFid
          },
          hasLocalStorage: !!storedAuth,
          parsedSuccessfully: !!state
        });

        // Check if there's any auth data
        if (!walletAddress && !farcasterUsername && !userId && !state?.walletAddress && !state?.farcasterUsername && !state?.userId) {
          router.push('/');
          return;
        }

        // Use current store data first, then fallback to persisted data
        const profileData = {
          id: userId || state.userId || '',
          farcasterUsername: farcasterUsername || state.farcasterUsername || null,
          farcasterDisplayName: farcasterDisplayName || state.farcasterDisplayName || null,
          farcasterPfpUrl: farcasterPfpUrl || state.farcasterPfpUrl || null,
          farcasterFid: farcasterFid || state.farcasterFid || null,
          walletAddress: walletAddress || state.walletAddress || null,
          empireTier: empireTier || state.empireTier || 'NORMIE',
          empireRank: empireRank || state.empireRank || null,
          empireScore: empireScore || state.empireScore || null,
          totalShares: 0,
          verifiedShares: 0,
          sharePoints: 0,
          viralCoefficient: 0,
          ritualsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          contestsEntered: 0,
          contestsWon: 0,
          totalPrizeWon: 0,
          checkInStreak: 0,
          totalCheckIns: 0,
          recentActivity: []
        };

        console.log('✅ PROFILE PAGE - Setting Initial Profile:', profileData);
        setProfile(profileData);
        setLoading(false);

        // Fetch additional profile data if we have a user ID
        // Use current store values first
        if (userId) {
          fetchUserProfile(userId);
        } else if (state.userId) {
          fetchUserProfile(state.userId);
        } else if (walletAddress) {
          fetchUserProfileByWallet(walletAddress);
        } else if (state.walletAddress) {
          fetchUserProfileByWallet(state.walletAddress);
        }
      } catch (err) {
        console.error('Error parsing auth data:', err);
        router.push('/');
      }
    };

    checkAuth();
  }, [userId, walletAddress, farcasterUsername, farcasterDisplayName, farcasterPfpUrl, farcasterFid, empireTier]); // Re-run when store values change

  const fetchUserProfileByWallet = async (walletAddr: string) => {
    try {
      setLoading(true);

      // Fetch user by wallet address
      const { data: userData, error: userError } = await supabase
        .from('unified_users')
        .select('*')
        .eq('wallet_address', walletAddr)
        .single();

      if (userError) {
        // User might not exist in database yet, show basic info
        setProfile({
          id: '',
          walletAddress: walletAddr,
          empireTier: 'NORMIE',
          totalShares: 0,
          verifiedShares: 0,
          sharePoints: 0,
          viralCoefficient: 0,
          ritualsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          contestsEntered: 0,
          contestsWon: 0,
          totalPrizeWon: 0,
          checkInStreak: 0,
          totalCheckIns: 0,
          recentActivity: []
        });
        setLoading(false);
        return;
      }

      // Continue with full profile fetch
      await fetchUserProfile(userData.id);
    } catch (err) {
      console.error('Error fetching profile by wallet:', err);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    console.log('🔄 PROFILE PAGE - Fetching User Profile for ID:', userId);
    try {
      setLoading(true);

      // Try to fetch user base data - handle RLS errors gracefully
      let userData: any;
      const { data: dbData, error: userError } = await supabase
        .from('unified_users')
        .select('*')
        .eq('id', userId)
        .single();

      // If RLS error, use data from store instead
      if (userError) {
        console.warn('⚠️ PROFILE PAGE - Could not fetch from unified_users, using store data:', userError);
        console.log('📦 PROFILE PAGE - Store fallback data:', {
          farcasterUsername,
          farcasterDisplayName,
          farcasterPfpUrl,
          farcasterFid,
          walletAddress,
          empireTier
        });
        // Continue with store data instead of throwing
        userData = {
          id: userId,
          farcaster_username: farcasterUsername,
          farcaster_display_name: farcasterDisplayName,
          farcaster_pfp_url: farcasterPfpUrl,
          farcaster_fid: farcasterFid,
          wallet_address: walletAddress,
          empire_tier: empireTier,
          empire_rank: empireRank,
          empire_score: empireScore
        };
      } else {
        userData = dbData;
      }

      // Update gallery stats if available
      if (userData) {
        setGalleryStats({
          unlocked: userData.gallery_unlocked || false,
          slots: userData.gallery_slots || 0,
          used: 0 // Will be updated when memes load
        });

        // Fetch featured meme if gallery is unlocked
        if (userData.gallery_unlocked) {
          const { data: memeData } = await supabase
            .from('user_memes')
            .select('*')
            .eq('user_id', userId)
            .eq('is_featured', true)
            .single();

          if (memeData) {
            setFeaturedMeme(memeData);
          }
        }
      }

      // Skip complex queries if no userId in database
      if (!userData.id) {
        setProfile({
          id: '',
          farcasterUsername: userData.farcaster_username || farcasterUsername,
          walletAddress: userData.wallet_address || walletAddress,
          empireTier: userData.empire_tier || empireTier || 'NORMIE',
          empireRank: userData.empire_rank || empireRank,
          empireScore: userData.empire_score || empireScore,
          totalShares: 0,
          verifiedShares: 0,
          sharePoints: 0,
          viralCoefficient: 0,
          ritualsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          contestsEntered: 0,
          contestsWon: 0,
          totalPrizeWon: 0,
          checkInStreak: 0,
          totalCheckIns: 0,
          recentActivity: []
        });
        setLoading(false);
        return;
      }

      // Fetch share stats
      const { data: shares } = await supabase
        .from('user_shares')
        .select('*')
        .eq('user_id', userId);

      const verifiedShares = shares?.filter(s => s.verified) || [];
      const totalPoints = shares?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0;

      // Calculate viral coefficient
      const uniqueDays = new Set(shares?.map(s => s.created_at.split('T')[0])).size;
      const viralCoeff = uniqueDays > 0 ? (shares?.length || 0) / uniqueDays : 0;

      // Fetch ritual completions (using shares as proxy)
      const { data: ritualShares } = await supabase
        .from('user_shares')
        .select('*')
        .eq('user_id', userId)
        .eq('share_type', 'ritual')
        .order('created_at', { ascending: false });

      // Calculate streaks
      const ritualDates = new Set(ritualShares?.map(r => r.created_at.split('T')[0]));
      const currentStreak = calculateCurrentStreak(Array.from(ritualDates));

      // Fetch contest participation
      const { data: contestSubmissions } = await supabase
        .from('contest_submissions')
        .select('*')
        .eq('wallet_address', userData.wallet_address);

      const { data: contestWins } = await supabase
        .from('contest_winners')
        .select('*')
        .eq('wallet_address', userData.wallet_address);

      const totalPrizeWon = contestWins?.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0;

      // Calculate check-in stats (3+ rituals = check-in)
      const checkInDays = Array.from(ritualDates).filter(date => {
        const dayRituals = ritualShares?.filter(r => r.created_at.startsWith(date));
        return (dayRituals?.length || 0) >= 3;
      });

      // Build recent activity timeline
      const activities: any[] = [];

      // Add shares to timeline
      shares?.slice(0, 5).forEach(share => {
        activities.push({
          type: 'share',
          description: `Shared ${share.share_type} on ${share.share_platform}`,
          timestamp: share.created_at,
          points: share.points_awarded
        });
      });

      // Add contest entries
      contestSubmissions?.slice(0, 3).forEach(submission => {
        activities.push({
          type: 'contest',
          description: `Entered contest with score ${submission.score}`,
          timestamp: submission.submitted_at
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Find favorite ritual
      const ritualCounts = new Map<string, number>();
      ritualShares?.forEach(share => {
        const title = share.content_data?.ritualTitle || 'Unknown';
        ritualCounts.set(title, (ritualCounts.get(title) || 0) + 1);
      });
      const favoriteRitual = Array.from(ritualCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      const finalProfile = {
        id: userId,
        farcasterUsername: userData.farcaster_username || farcasterUsername,
        farcasterDisplayName: userData.farcaster_display_name || farcasterDisplayName,
        farcasterPfpUrl: userData.farcaster_pfp_url || farcasterPfpUrl,
        farcasterFid: userData.farcaster_fid || farcasterFid || null,
        walletAddress: userData.wallet_address || walletAddress,
        empireTier: userData.empire_tier || empireTier,
        empireRank: userData.empire_rank || empireRank,
        empireScore: userData.empire_score || empireScore,
        totalShares: shares?.length || 0,
        verifiedShares: verifiedShares.length,
        sharePoints: totalPoints,
        viralCoefficient: viralCoeff,
        ritualsCompleted: ritualShares?.length || 0,
        currentStreak: currentStreak,
        longestStreak: currentStreak, // Would need historical data for accurate longest
        favoriteRitual,
        contestsEntered: contestSubmissions?.length || 0,
        contestsWon: contestWins?.length || 0,
        totalPrizeWon,
        checkInStreak: calculateCurrentStreak(checkInDays),
        totalCheckIns: checkInDays.length,
        lastCheckIn: checkInDays[0],
        recentActivity: activities.slice(0, 10)
      };

      console.log('🎯 PROFILE PAGE - Final Profile Data:', finalProfile);
      setProfile(finalProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
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
    const profileUrl = `${window.location.origin}/profile/${farcasterUsername || 'me'}`;
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${farcasterUsername || 'me'}`;
    const shareText = `Check out my BizarreBeasts profile!`;

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

  // Log render state
  console.log('🖼️ PROFILE PAGE - Render State:', {
    loading,
    hasProfile: !!profile,
    hasError: !!error,
    profileUsername: profile?.farcasterUsername,
    profileDisplayName: profile?.farcasterDisplayName,
    profilePfpUrl: profile?.farcasterPfpUrl,
    profileFid: profile?.farcasterFid,
    profileTier: profile?.empireTier
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gem-gold text-2xl animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    console.error('❌ PROFILE PAGE - Error or No Profile:', { error, profile });
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-red-500">{error || 'Profile not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button and Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gem-gold hover:text-gem-crystal transition-colors">
            <span className="text-xl">←</span>
            <span>Back to Home</span>
          </Link>

          {/* Action Buttons - Styled like home page */}
          <div className="flex gap-3">
            <button
              onClick={shareProfile}
              className="px-6 py-2 bg-dark-card border border-gem-purple/50 hover:border-gem-purple rounded-lg flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gem-purple/20 text-white"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Profile</span>
            </button>
            <button
              onClick={copyProfileLink}
              className="px-6 py-2 bg-dark-card border border-gem-gold/50 hover:border-gem-gold rounded-lg flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gem-gold/20 text-white"
            >
              {copied ? <Check className="w-4 h-4 text-gem-crystal" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>


        {/* Header Section with Profile and Featured Meme */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Main Profile Card (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            <div className="p-[2px] rounded-xl bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink h-full">
              <div className="bg-dark-card rounded-xl p-4 sm:p-6 h-full">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  {/* Profile Picture with Gradient Ring */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink p-[3px]">
                      <div className="w-full h-full rounded-full bg-dark-card"></div>
                    </div>
                    {profile.farcasterPfpUrl ? (
                      <img
                        src={profile.farcasterPfpUrl}
                        alt={profile.farcasterDisplayName || profile.farcasterUsername || 'Profile'}
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gem-gold to-gem-purple flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                        {profile.farcasterUsername?.[0]?.toUpperCase() || profile.walletAddress?.[2]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                        {profile.farcasterDisplayName || profile.farcasterUsername || 'Anonymous'}
                      </h1>
                      {profile.farcasterUsername && (
                        <p className="text-gray-400 text-lg sm:text-xl">@{profile.farcasterUsername}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      {profile.farcasterFid && (
                        <span className="flex items-center gap-1">
                          <span className="text-gem-crystal">FID:</span> {profile.farcasterFid}
                        </span>
                      )}
                      {profile.walletAddress && (
                        <span className="flex items-center gap-1">
                          <span className="text-gem-gold">⟠</span>
                          <span className="hidden sm:inline">{profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}</span>
                          <span className="sm:hidden">{profile.walletAddress.slice(0, 4)}...{profile.walletAddress.slice(-3)}</span>
                        </span>
                      )}
                      {profile.empireRank && (
                        <span className="flex items-center gap-1">
                          <span className="text-gem-pink">Rank:</span> #{profile.empireRank}
                        </span>
                      )}
                      {profile.empireScore && (
                        <span className="flex items-center gap-1">
                          <span className="text-gem-purple">Score:</span> {parseInt(profile.empireScore).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Meme Card (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            <FeaturedMeme
              meme={featuredMeme}
              isOwner={true}
              galleryUnlocked={galleryStats.unlocked}
              onView={(meme) => {
                console.log('View featured meme:', meme);
              }}
            />
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Total Shares"
            value={profile.totalShares}
            subtitle={`${profile.verifiedShares} verified`}
            icon="🔄"
          />
          <StatCard
            title="Share Points"
            value={profile.sharePoints.toLocaleString()}
            subtitle={`${profile.viralCoefficient.toFixed(1)}x viral`}
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

      {/* Detailed Stats - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Check-in Stats */}
          <div className="bg-dark-card rounded-xl p-4 sm:p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Check-in Progress</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Streak</span>
                <span className="text-white font-bold">{profile.checkInStreak} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Check-ins</span>
                <span className="text-white font-bold">{profile.totalCheckIns}</span>
              </div>
              {profile.lastCheckIn && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Check-in</span>
                  <span className="text-white">{new Date(profile.lastCheckIn).toLocaleDateString()}</span>
                </div>
              )}
              {profile.favoriteRitual && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Favorite Ritual</span>
                  <span className="text-gem-gold">{profile.favoriteRitual}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contest Stats */}
          <div className="bg-dark-card rounded-xl p-4 sm:p-6 border border-gem-purple/30">
            <h2 className="text-xl font-bold text-gem-crystal mb-4">Contest Performance</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Contests Entered</span>
                <span className="text-white font-bold">{profile.contestsEntered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Contests Won</span>
                <span className="text-white font-bold">{profile.contestsWon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Win Rate</span>
                <span className="text-white font-bold">
                  {profile.contestsEntered > 0
                    ? `${((profile.contestsWon / profile.contestsEntered) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Prizes</span>
                <span className="text-gem-gold font-bold">{profile.totalPrizeWon.toLocaleString()} BB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Responsive */}
        <div className="bg-dark-card rounded-xl p-4 sm:p-6 border border-gem-purple/30 mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-gem-crystal mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {profile.recentActivity.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No recent activity</p>
            ) : (
              profile.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {activity.type === 'share' ? '🔄' :
                       activity.type === 'contest' ? '🏆' :
                       activity.type === 'ritual' ? '🎯' : '✨'}
                    </span>
                    <div>
                      <p className="text-white">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {activity.points && (
                    <span className="text-gem-gold font-bold">+{activity.points} pts</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Meme Gallery */}
        {galleryStats.unlocked && (
          <div className="mb-8">
            <MemeGallery
              userId={profile.id}
              isOwnProfile={true}
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

function StatCard({ title, value, subtitle, icon }: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
}) {
  return (
    <div className="bg-dark-card rounded-xl p-3 sm:p-4 lg:p-6 border border-gem-purple/30">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <h3 className="text-gray-400 text-xs sm:text-sm">{title}</h3>
        <span className="text-lg sm:text-xl lg:text-2xl">{icon}</span>
      </div>
      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">{value}</div>
      {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}