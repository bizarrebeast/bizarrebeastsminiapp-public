'use client';

import { Activity, TrendingUp, Users, MessageSquare } from 'lucide-react';

interface UserChartsProps {
  stats: {
    profile: any;
    engagement: any;
    growth: any;
    recentCasts: any[];
  };
}

export default function UserCharts({ stats }: UserChartsProps) {
  const { profile, engagement, recentCasts } = stats;

  // Calculate engagement distribution
  const engagementData = {
    likes: engagement?.totalLikes || 0,
    recasts: engagement?.totalRecasts || 0,
    replies: engagement?.totalReplies || 0,
  };

  const total = engagementData.likes + engagementData.recasts + engagementData.replies;

  const getPercentage = (value: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };

  // Calculate cast frequency (mock data for now)
  const castFrequency = [
    { day: 'Mon', casts: 5 },
    { day: 'Tue', casts: 8 },
    { day: 'Wed', casts: 3 },
    { day: 'Thu', casts: 12 },
    { day: 'Fri', casts: 7 },
    { day: 'Sat', casts: 4 },
    { day: 'Sun', casts: 6 },
  ];

  const maxCasts = Math.max(...castFrequency.map(d => d.casts));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Engagement Distribution */}
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gem-gold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Engagement Distribution
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-sm">Likes</span>
              <span className="text-gem-crystal font-semibold">
                {engagementData.likes} ({getPercentage(engagementData.likes)}%)
              </span>
            </div>
            <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(engagementData.likes)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Recasts</span>
              <span className="text-gem-crystal font-semibold">
                {engagementData.recasts} ({getPercentage(engagementData.recasts)}%)
              </span>
            </div>
            <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(engagementData.recasts)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Replies</span>
              <span className="text-gem-crystal font-semibold">
                {engagementData.replies} ({getPercentage(engagementData.replies)}%)
              </span>
            </div>
            <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(engagementData.replies)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gem-purple/20">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Engagements</span>
            <span className="text-xl font-bold text-gem-crystal">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Cast Frequency */}
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gem-gold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Weekly Cast Activity
        </h3>

        <div className="space-y-3">
          {castFrequency.map((day) => (
            <div key={day.day} className="flex items-center gap-3">
              <span className="text-gray-400 w-10 text-sm">{day.day}</span>
              <div className="flex-1 bg-dark-bg rounded-full h-8 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-gem-purple to-gem-blue rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${(day.casts / maxCasts) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">{day.casts}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gem-purple/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Average/Day</span>
              <p className="text-gem-crystal font-semibold">
                {(castFrequency.reduce((acc, d) => acc + d.casts, 0) / 7).toFixed(1)}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Peak Day</span>
              <p className="text-gem-crystal font-semibold">
                {castFrequency.find(d => d.casts === maxCasts)?.day}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Follower Growth Trend */}
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gem-gold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Growth Metrics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-bg rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Follower/Following Ratio</p>
            <p className="text-2xl font-bold text-gem-crystal">
              {profile?.followingCount > 0
                ? (profile.followerCount / profile.followingCount).toFixed(2)
                : '∞'}
            </p>
          </div>

          <div className="bg-dark-bg rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Engagement Rate</p>
            <p className="text-2xl font-bold text-gem-crystal">
              {engagement?.avgEngagementRate?.toFixed(1) || '0'}%
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Power Badge</span>
            <span className={`px-2 py-1 rounded text-xs ${
              profile?.powerBadge
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {profile?.powerBadge ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Active Status</span>
            <span className={`px-2 py-1 rounded text-xs ${
              profile?.activeStatus === 'active'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {profile?.activeStatus || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gem-gold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Community Standing
        </h3>

        <div className="space-y-4">
          <div className="bg-dark-bg rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Total Followers</span>
              <span className="text-xl font-bold text-gem-crystal">
                {profile?.followerCount?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="w-full bg-dark-card rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gem-gold to-yellow-400 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-dark-bg rounded-lg p-3">
              <p className="text-gray-400 mb-1">Following</p>
              <p className="font-semibold text-gem-crystal">
                {profile?.followingCount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <p className="text-gray-400 mb-1">Verified Addresses</p>
              <p className="font-semibold text-gem-crystal">
                {profile?.verifiedAddresses?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}