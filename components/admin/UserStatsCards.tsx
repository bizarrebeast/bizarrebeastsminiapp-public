'use client';

import {
  Users, TrendingUp, MessageSquare, Heart,
  Repeat, Clock, Target, Award
} from 'lucide-react';

interface UserStatsCardsProps {
  stats: {
    profile: any;
    engagement: any;
    growth: any;
  };
}

export default function UserStatsCards({ stats }: UserStatsCardsProps) {
  const { profile, engagement, growth } = stats;

  const cards = [
    {
      title: 'Followers',
      value: profile?.followerCount?.toLocaleString() || '0',
      change: growth?.followerGrowth7d || 0,
      changeLabel: '7d',
      icon: Users,
      color: 'gem-purple',
    },
    {
      title: 'Following',
      value: profile?.followingCount?.toLocaleString() || '0',
      change: growth?.followingGrowth7d || 0,
      changeLabel: '7d',
      icon: Target,
      color: 'gem-blue',
    },
    {
      title: 'Total Casts',
      value: engagement?.totalCasts?.toLocaleString() || '0',
      change: null,
      icon: MessageSquare,
      color: 'gem-gold',
    },
    {
      title: 'Total Likes',
      value: engagement?.totalLikes?.toLocaleString() || '0',
      change: null,
      icon: Heart,
      color: 'pink',
    },
    {
      title: 'Total Recasts',
      value: engagement?.totalRecasts?.toLocaleString() || '0',
      change: null,
      icon: Repeat,
      color: 'green',
    },
    {
      title: 'Avg Engagement',
      value: engagement?.avgEngagementRate?.toFixed(1) || '0',
      change: null,
      icon: TrendingUp,
      color: 'gem-crystal',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string; border: string } } = {
      'gem-purple': {
        bg: 'bg-purple-500/20',
        text: 'text-purple-300',
        border: 'border-purple-500/30',
      },
      'gem-blue': {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
      },
      'gem-gold': {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-300',
        border: 'border-yellow-500/30',
      },
      'pink': {
        bg: 'bg-pink-500/20',
        text: 'text-pink-300',
        border: 'border-pink-500/30',
      },
      'green': {
        bg: 'bg-green-500/20',
        text: 'text-green-300',
        border: 'border-green-500/30',
      },
      'gem-crystal': {
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-300',
        border: 'border-cyan-500/30',
      },
    };
    return colorMap[color] || colorMap['gem-purple'];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const colors = getColorClasses(card.color);
        const Icon = card.icon;

        return (
          <div
            key={index}
            className={`bg-dark-card border ${colors.border} rounded-lg p-4 hover:bg-gem-purple/5 transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              {card.change !== null && (
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      card.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      card.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {card.change >= 0 ? '+' : ''}{card.change}
                  </span>
                  <span className="text-xs text-gray-500">({card.changeLabel})</span>
                </div>
              )}
            </div>

            <h3 className="text-gray-400 text-xs">{card.title}</h3>
            <p className="text-xl font-bold text-gem-crystal">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}