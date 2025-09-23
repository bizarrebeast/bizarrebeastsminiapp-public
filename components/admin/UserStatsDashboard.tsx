'use client';

import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, MessageSquare, Heart,
  Repeat, Clock, Hash, Award, Activity,
  ExternalLink, Copy, CheckCircle, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import UserStatsCards from './UserStatsCards';
import UserCharts from './UserCharts';

interface UserStatsDashboardProps {
  fid: number;
}

interface UserStats {
  profile: any;
  engagement: any;
  growth: any;
  channels: any[];
  recentCasts: any[];
  topCasts: any[];
}

export default function UserStatsDashboard({ fid }: UserStatsDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'casts' | 'engagement' | 'channels' | 'highlights'>('overview');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showAddresses, setShowAddresses] = useState(false);
  const [engagementTimeFrame, setEngagementTimeFrame] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [highlightsTimeFrame, setHighlightsTimeFrame] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [minEngagement, setMinEngagement] = useState<number>(10);

  useEffect(() => {
    fetchUserStats();
  }, [fid, engagementTimeFrame]);

  const fetchUserStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${fid}?timeFrame=${engagementTimeFrame}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gem-purple"></div>
        </div>
        <p className="text-center text-gray-400 mt-4">Loading user stats...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-dark-card border border-red-500/30 rounded-lg p-8">
        <p className="text-center text-red-400">
          {error || 'Failed to load user stats'}
        </p>
        <button
          onClick={fetchUserStats}
          className="mt-4 px-4 py-2 bg-gem-purple/20 text-gem-crystal rounded-lg hover:bg-gem-purple/30 mx-auto block"
        >
          Retry
        </button>
      </div>
    );
  }

  const { profile, engagement, growth, channels, recentCasts, topCasts } = stats;

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
        <div className="flex items-start gap-4">
          {profile.pfpUrl ? (
            <img
              src={profile.pfpUrl}
              alt={profile.username}
              className="w-16 h-16 rounded-full border-2 border-gem-purple/50"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gem-purple/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-gem-crystal" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gem-gold">
                {profile.displayName || profile.username}
              </h2>
              {profile.powerBadge && (
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                  ⚡ Power
                </span>
              )}
              {profile.activeStatus === 'active' && (
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                  🟢 Active
                </span>
              )}
            </div>

            <p className="text-gray-400 text-sm mb-2">
              @{profile.username} · FID: {profile.fid}
            </p>

            {profile.bio && (
              <p className="text-gem-crystal text-sm mb-2 max-w-2xl line-clamp-2">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Followers:</span>
                <span className="ml-2 font-semibold text-gem-crystal">
                  {profile.followerCount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Following:</span>
                <span className="ml-2 font-semibold text-gem-crystal">
                  {profile.followingCount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Ratio:</span>
                <span className="ml-2 font-semibold text-gem-crystal">
                  {profile.followingCount > 0
                    ? (profile.followerCount / profile.followingCount).toFixed(2)
                    : '∞'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={`https://warpcast.com/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gem-purple/20 text-gem-crystal rounded-lg hover:bg-gem-purple/30 transition-colors"
              title="View on Warpcast"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Verified Addresses - Collapsible */}
        {profile.verifiedAddresses && profile.verifiedAddresses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gem-purple/20">
            <button
              onClick={() => setShowAddresses(!showAddresses)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-400">
                  Verified Addresses ({profile.verifiedAddresses.length})
                </h3>
                <span className="text-xs text-gray-500">
                  {!showAddresses && profile.verifiedAddresses[0] &&
                    `${profile.verifiedAddresses[0].slice(0, 6)}...${profile.verifiedAddresses[0].slice(-4)}`
                  }
                  {!showAddresses && profile.verifiedAddresses.length > 1 &&
                    ` +${profile.verifiedAddresses.length - 1} more`
                  }
                </span>
              </div>
              <div className="text-gray-400 group-hover:text-gem-crystal transition-colors">
                {showAddresses ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showAddresses && (
              <div className="space-y-2 mt-3 animate-in slide-in-from-top-2 duration-200">
                {profile.verifiedAddresses.map((address: string) => (
                  <div
                    key={address}
                    className="flex items-center gap-2 text-sm pl-4"
                  >
                    <span className="text-gem-crystal font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="text-gray-500 hover:text-gem-crystal transition-colors"
                    >
                      {copiedAddress === address ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gem-crystal transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-1">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'casts', label: 'Casts', icon: MessageSquare },
            { id: 'engagement', label: 'Engagement', icon: TrendingUp },
            { id: 'channels', label: 'Channels', icon: Hash },
            { id: 'highlights', label: 'Highlights', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gem-purple/30 text-gem-crystal'
                  : 'text-gray-400 hover:bg-gem-purple/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <UserStatsCards stats={stats} />
          <UserCharts stats={stats} />
        </div>
      )}

      {activeTab === 'casts' && (
        <div className="space-y-4">
          {/* Recent Casts */}
          <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gem-gold mb-3">Recent Casts</h3>
            <div className="space-y-2">
              {recentCasts && recentCasts.length > 0 ? (
                recentCasts.map((cast: any) => (
                  <div
                    key={cast.hash}
                    className="border border-gem-purple/20 rounded-lg p-3 hover:bg-gem-purple/5 transition-colors"
                  >
                    <p className="text-gem-crystal text-sm mb-2 line-clamp-3">{cast.text}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {cast.reactions.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="w-4 h-4" />
                        {cast.reactions.recasts_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {cast.replies.count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(cast.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No recent casts found</p>
              )}
            </div>
          </div>

          {/* Top Performing Casts */}
          <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gem-gold mb-3">Top Performing Casts</h3>
            <div className="space-y-2">
              {topCasts && topCasts.length > 0 ? (
                topCasts.map((cast: any, index: number) => (
                  <div
                    key={cast.hash}
                    className="border border-gem-purple/20 rounded-lg p-3 hover:bg-gem-purple/5 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-gem-gold/20 text-gem-gold rounded-full text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gem-crystal text-sm mb-2 line-clamp-2">{cast.text}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {cast.reactions.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat className="w-4 h-4" />
                            {cast.reactions.recasts_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {cast.replies.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No top casts found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && engagement && (
        <div className="space-y-6">
          {/* Time Frame Selector */}
          <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gem-gold" />
                <h3 className="text-sm font-medium text-gray-400">Time Frame</h3>
              </div>
              <div className="flex gap-2">
                {[
                  { value: '7d', label: '7 Days' },
                  { value: '30d', label: '30 Days' },
                  { value: '90d', label: '90 Days' },
                  { value: 'all', label: 'All Time' },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setEngagementTimeFrame(period.value as any)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      engagementTimeFrame === period.value
                        ? 'bg-gem-purple/30 text-gem-crystal'
                        : 'bg-dark-bg text-gray-400 hover:bg-gem-purple/10'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Showing engagement metrics for: {
                engagementTimeFrame === '7d' ? 'Last 7 days' :
                engagementTimeFrame === '30d' ? 'Last 30 days' :
                engagementTimeFrame === '90d' ? 'Last 90 days' :
                'All time'
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gem-gold mb-4">
                Engagement Metrics ({engagementTimeFrame === 'all' ? 'All Time' :
                  engagementTimeFrame === '7d' ? 'Last 7 Days' :
                  engagementTimeFrame === '30d' ? 'Last 30 Days' :
                  'Last 90 Days'})
              </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Casts</span>
                <span className="text-gem-crystal font-semibold">{engagement.totalCasts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Likes Received</span>
                <span className="text-gem-crystal font-semibold">{engagement.totalLikes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Recasts</span>
                <span className="text-gem-crystal font-semibold">{engagement.totalRecasts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Replies</span>
                <span className="text-gem-crystal font-semibold">{engagement.totalReplies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Engagement Rate</span>
                <span className="text-gem-crystal font-semibold">
                  {engagement.avgEngagementRate.toFixed(2)}
                </span>
              </div>
            </div>
            </div>

            <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gem-gold mb-4">Activity Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last 7 Days</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  engagement.last7DaysActive
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {engagement.last7DaysActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last 30 Days</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  engagement.last30DaysActive
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {engagement.last30DaysActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gem-gold mb-4">Channel Activity</h3>
          {channels && channels.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {channels.map((channel: any) => (
                <div
                  key={channel.channelId}
                  className="border border-gem-purple/20 rounded-lg p-4 hover:bg-gem-purple/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gem-crystal">
                      /{channel.channelId}
                    </span>
                    {channel.role && (
                      <span className="text-xs px-2 py-1 bg-gem-purple/20 text-gem-purple rounded">
                        {channel.role}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {channel.channelName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No channel memberships found</p>
          )}
        </div>
      )}

      {activeTab === 'highlights' && (
        <div className="space-y-4">
          {/* Time Period & Filter Controls */}
          <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gem-gold" />
                <h3 className="text-base font-semibold text-gem-gold">Highlight Settings</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Min. Engagement:</span>
                  <input
                    type="number"
                    value={minEngagement}
                    onChange={(e) => setMinEngagement(parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-dark-bg border border-gem-purple/30 rounded text-sm text-gem-crystal"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 mr-2">Period:</span>
              {[
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
                { value: 'all', label: 'All Time' },
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setHighlightsTimeFrame(period.value as any)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    highlightsTimeFrame === period.value
                      ? 'bg-gem-purple/30 text-gem-crystal'
                      : 'bg-dark-bg text-gray-400 hover:bg-gem-purple/10'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Highlighted Casts */}
          <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gem-gold">
                Top Highlights - {highlightsTimeFrame === '7d' ? 'Last Week' :
                  highlightsTimeFrame === '30d' ? 'Last Month' :
                  highlightsTimeFrame === '90d' ? 'Last 3 Months' : 'All Time'}
              </h3>
              <button
                className="text-xs text-gem-purple hover:text-gem-crystal transition-colors flex items-center gap-1"
                onClick={() => {
                  const highlights = recentCasts
                    ?.map((cast: any) => ({
                      ...cast,
                      totalEngagement: (cast.reactions?.likes_count || 0) +
                                      (cast.reactions?.recasts_count || 0) +
                                      (cast.replies?.count || 0)
                    }))
                    .filter((cast: any) => cast.totalEngagement >= minEngagement)
                    .sort((a: any, b: any) => b.totalEngagement - a.totalEngagement)
                    .slice(0, 20) || [];
                  const text = highlights.map((cast: any) =>
                    `${cast.text}\n📊 ${cast.totalEngagement} engagements | 📅 ${new Date(cast.timestamp).toLocaleDateString()}\n---\n`
                  ).join('\n');
                  navigator.clipboard.writeText(text);
                }}
              >
                <Copy className="w-3 h-3" />
                Copy All
              </button>
            </div>

            <div className="space-y-3">
              {recentCasts && recentCasts.length > 0 ? (
                (() => {
                  const getHighlightedCasts = () => {
                    return recentCasts
                      .map((cast: any) => ({
                        ...cast,
                        totalEngagement: (cast.reactions?.likes_count || 0) +
                                        (cast.reactions?.recasts_count || 0) +
                                        (cast.replies?.count || 0)
                      }))
                      .filter((cast: any) => cast.totalEngagement >= minEngagement)
                      .sort((a: any, b: any) => b.totalEngagement - a.totalEngagement)
                      .slice(0, 20);
                  };

                  const highlightedCasts = getHighlightedCasts();

                  return highlightedCasts.length > 0 ? (
                    highlightedCasts.map((cast: any, index: number) => (
                      <div
                        key={cast.hash}
                        className="border border-gem-purple/20 rounded-lg p-4 hover:bg-gem-purple/5 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-400/20 text-gray-300' :
                              index === 2 ? 'bg-orange-600/20 text-orange-400' :
                              'bg-gem-purple/20 text-gem-crystal'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="text-xs text-center font-semibold text-gem-gold">
                              {cast.totalEngagement}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-gem-crystal text-sm mb-2">{cast.text}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {cast.reactions?.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Repeat className="w-3 h-3" />
                                {cast.reactions?.recasts_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {cast.replies?.count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(cast.timestamp).toLocaleDateString()}
                              </span>
                              {cast.channel && (
                                <span className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {cast.channel}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => navigator.clipboard.writeText(cast.text)}
                                className="text-xs px-2 py-1 bg-gem-purple/10 text-gem-purple rounded hover:bg-gem-purple/20 transition-colors"
                              >
                                Copy Text
                              </button>
                              <a
                                href={`https://warpcast.com/${profile.username}/${cast.hash.slice(0, 10)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-gem-purple/10 text-gem-purple rounded hover:bg-gem-purple/20 transition-colors flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Cast
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      No casts with {minEngagement}+ engagements found in this period
                    </p>
                  );
                })()
              ) : (
                <p className="text-gray-400 text-center py-8">No casts available</p>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gem-gold mb-3">Period Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gem-crystal">
                  {recentCasts?.filter((c: any) =>
                    (c.reactions?.likes_count || 0) + (c.reactions?.recasts_count || 0) + (c.replies?.count || 0) >= minEngagement
                  ).length || 0}
                </p>
                <p className="text-xs text-gray-400">Highlights</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gem-crystal">
                  {recentCasts?.reduce((sum: number, c: any) =>
                    sum + (c.reactions?.likes_count || 0), 0) || 0}
                </p>
                <p className="text-xs text-gray-400">Total Likes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gem-crystal">
                  {recentCasts?.reduce((sum: number, c: any) =>
                    sum + (c.reactions?.recasts_count || 0), 0) || 0}
                </p>
                <p className="text-xs text-gray-400">Total Recasts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gem-crystal">
                  {recentCasts?.reduce((sum: number, c: any) =>
                    sum + (c.replies?.count || 0), 0) || 0}
                </p>
                <p className="text-xs text-gray-400">Total Replies</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}