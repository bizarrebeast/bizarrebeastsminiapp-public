# Flexible Share-Based Check-in System

## Overview
A configurable check-in system that allows dynamic adjustment of requirements without code changes. Start with 3 shares required, but easily change to 1 share or any other configuration as needed. Features multipliers, tier-based requirements, and admin controls for real-time adjustments.

## Core Design Principles

1. **Configuration-Driven**: All requirements stored in database/config, not hardcoded
2. **Multiplier System**: Quality shares count more than quantity
3. **Tier-Based Flexibility**: Different requirements for different Empire tiers
4. **Future-Proof**: Easy migration paths for requirement changes
5. **Hybrid Mode**: Support both share and ritual unlock methods

## System Architecture

### Configuration Management

#### Core Configuration Structure
```typescript
// /lib/checkin-config.ts
export interface CheckInConfig {
  unlock: {
    requiredShares: number;        // Start at 3, easily change to 1
    requiredRituals: number;       // Fallback method
    unlockMethod: 'shares' | 'rituals' | 'hybrid';
  };

  shareMultipliers: {
    verified: number;              // 1.5x for verified shares
    multiPlatform: number;         // 2.0x for cross-platform
    withImage: number;             // 1.3x for media content
    highEngagement: number;        // 1.5x for viral shares
    firstShare: number;            // 2.0x daily first share bonus
  };

  tierRequirements: {
    [tier: string]: {
      shares: number;              // Required shares per tier
      multiplier: number;          // Tier-specific multiplier
    };
  };

  rewardMultipliers: {
    baseMultiplier: number;        // 1.0x base
    perExtraShare: number;         // +10% per extra share
    maxMultiplier: number;         // 2.0x cap
    streakBonus: number;           // +5% per streak day
  };
}

// Default starting configuration
export const DEFAULT_CONFIG: CheckInConfig = {
  unlock: {
    requiredShares: 3,             // Conservative start
    requiredRituals: 3,
    unlockMethod: 'hybrid'         // User choice
  },

  shareMultipliers: {
    verified: 1.5,                 // Verified shares worth 1.5x
    multiPlatform: 2.0,            // Cross-platform worth 2x
    withImage: 1.3,                // Media content worth 1.3x
    highEngagement: 1.5,           // Viral shares worth 1.5x
    firstShare: 2.0                // First daily share worth 2x
  },

  tierRequirements: {
    BIZARRE: { shares: 1, multiplier: 3.0 },   // Elite: 1 share = 3 points
    WEIRDO: { shares: 2, multiplier: 1.5 },    // High: 2 shares = 3 points
    ODDBALL: { shares: 3, multiplier: 1.0 },   // Mid: 3 shares = 3 points
    MISFIT: { shares: 3, multiplier: 1.0 },    // Low: 3 shares = 3 points
    NORMIE: { shares: 3, multiplier: 1.0 }     // Base: 3 shares = 3 points
  },

  rewardMultipliers: {
    baseMultiplier: 1.0,
    perExtraShare: 0.1,            // +10% per extra share
    maxMultiplier: 2.0,            // Max 2x rewards
    streakBonus: 0.05              // +5% per streak day
  }
};
```

### Database Schema

#### Configuration Tables
```sql
-- Dynamic configuration storage
CREATE TABLE checkin_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name VARCHAR(100) DEFAULT 'default',
  tier VARCHAR(50),
  required_shares INTEGER DEFAULT 3,
  required_rituals INTEGER DEFAULT 3,
  unlock_method VARCHAR(20) DEFAULT 'hybrid',
  share_multipliers JSONB DEFAULT '{}',
  reward_multipliers JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  effective_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track share contributions to check-in progress
CREATE TABLE checkin_share_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES unified_users(id) NOT NULL,
  share_id UUID REFERENCES user_shares(id) NOT NULL,
  contribution_value DECIMAL(4,2) DEFAULT 1.00,  -- How much this share counts
  multipliers_applied JSONB DEFAULT '{}',        -- Which multipliers were used
  checkin_date DATE DEFAULT CURRENT_DATE,
  tier_at_time VARCHAR(50),                      -- User's tier when shared
  config_version VARCHAR(100) DEFAULT 'default',
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(share_id, checkin_date),                -- One contribution per share per day
  INDEX idx_contributions_user_date (user_id, checkin_date),
  INDEX idx_contributions_date (checkin_date DESC)
);

-- Daily check-in progress tracking
CREATE TABLE daily_checkin_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES unified_users(id) NOT NULL,
  checkin_date DATE DEFAULT CURRENT_DATE,

  -- Progress tracking
  total_share_points DECIMAL(4,2) DEFAULT 0.00,
  required_points DECIMAL(4,2) DEFAULT 3.00,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlock_method VARCHAR(20),                     -- 'shares' or 'rituals'

  -- Reward calculation
  base_reward_multiplier DECIMAL(3,2) DEFAULT 1.00,
  final_reward_multiplier DECIMAL(3,2) DEFAULT 1.00,
  extra_share_bonus DECIMAL(3,2) DEFAULT 0.00,

  -- Metadata
  tier_at_unlock VARCHAR(50),
  config_version VARCHAR(100) DEFAULT 'default',
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, checkin_date),
  INDEX idx_progress_user_date (user_id, checkin_date DESC),
  INDEX idx_progress_unlocked (is_unlocked, checkin_date)
);
```

#### Configuration Functions
```sql
-- Function to calculate share contribution value
CREATE OR REPLACE FUNCTION calculate_share_contribution(
  p_share_id UUID,
  p_user_tier VARCHAR(50) DEFAULT 'NORMIE'
) RETURNS DECIMAL AS $$
DECLARE
  share_data RECORD;
  config_data RECORD;
  base_value DECIMAL(4,2) := 1.00;
  final_value DECIMAL(4,2);
BEGIN
  -- Get share details
  SELECT * INTO share_data FROM user_shares WHERE id = p_share_id;

  -- Get current configuration for user's tier
  SELECT * INTO config_data
  FROM checkin_requirements
  WHERE tier = p_user_tier
    AND active = true
  ORDER BY effective_date DESC
  LIMIT 1;

  -- Start with base value
  final_value := base_value;

  -- Apply verification multiplier
  IF share_data.verified THEN
    final_value := final_value * COALESCE(
      (config_data.share_multipliers->>'verified')::DECIMAL, 1.5
    );
  END IF;

  -- Apply media multiplier
  IF share_data.content_data->>'hasImage' = 'true' THEN
    final_value := final_value * COALESCE(
      (config_data.share_multipliers->>'withImage')::DECIMAL, 1.3
    );
  END IF;

  -- Apply multi-platform multiplier
  IF (share_data.content_data->>'platformCount')::INTEGER > 1 THEN
    final_value := final_value * COALESCE(
      (config_data.share_multipliers->>'multiPlatform')::DECIMAL, 2.0
    );
  END IF;

  -- Apply tier multiplier
  final_value := final_value * COALESCE(
    (config_data.share_multipliers->>'tierMultiplier')::DECIMAL, 1.0
  );

  RETURN LEAST(final_value, 5.0); -- Cap at 5x
END;
$$ LANGUAGE plpgsql;

-- Function to update daily progress
CREATE OR REPLACE FUNCTION update_checkin_progress(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
  user_tier VARCHAR(50);
  config_data RECORD;
  total_points DECIMAL(4,2) := 0.00;
  required_points DECIMAL(4,2);
  is_unlocked BOOLEAN := FALSE;
  reward_multiplier DECIMAL(3,2) := 1.00;
  result JSONB;
BEGIN
  -- Get user's current tier
  SELECT empire_tier INTO user_tier
  FROM unified_users
  WHERE id = p_user_id;

  -- Get configuration for user's tier
  SELECT * INTO config_data
  FROM checkin_requirements
  WHERE tier = COALESCE(user_tier, 'NORMIE')
    AND active = true
  ORDER BY effective_date DESC
  LIMIT 1;

  required_points := COALESCE(config_data.required_shares, 3);

  -- Calculate total share points for the day
  SELECT COALESCE(SUM(contribution_value), 0) INTO total_points
  FROM checkin_share_contributions
  WHERE user_id = p_user_id
    AND checkin_date = p_date;

  -- Check if unlocked
  is_unlocked := total_points >= required_points;

  -- Calculate reward multiplier for extra shares
  IF total_points > required_points THEN
    reward_multiplier := 1.0 + (
      (total_points - required_points) *
      COALESCE((config_data.reward_multipliers->>'perExtraShare')::DECIMAL, 0.1)
    );
    reward_multiplier := LEAST(
      reward_multiplier,
      COALESCE((config_data.reward_multipliers->>'maxMultiplier')::DECIMAL, 2.0)
    );
  END IF;

  -- Upsert progress record
  INSERT INTO daily_checkin_progress (
    user_id, checkin_date, total_share_points, required_points,
    is_unlocked, base_reward_multiplier, final_reward_multiplier,
    tier_at_unlock, config_version
  ) VALUES (
    p_user_id, p_date, total_points, required_points,
    is_unlocked, 1.00, reward_multiplier,
    user_tier, COALESCE(config_data.config_name, 'default')
  )
  ON CONFLICT (user_id, checkin_date)
  DO UPDATE SET
    total_share_points = EXCLUDED.total_share_points,
    is_unlocked = EXCLUDED.is_unlocked,
    final_reward_multiplier = EXCLUDED.final_reward_multiplier,
    updated_at = NOW();

  -- Return progress summary
  result := jsonb_build_object(
    'totalPoints', total_points,
    'requiredPoints', required_points,
    'isUnlocked', is_unlocked,
    'rewardMultiplier', reward_multiplier,
    'progress', (total_points / required_points * 100)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### API Implementation

#### Progress Calculation API
```typescript
// /app/api/checkin/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Update and get progress
    const { data: progress, error } = await supabase
      .rpc('update_checkin_progress', {
        p_user_id: userId,
        p_date: date
      });

    if (error) {
      console.error('Progress calculation error:', error);
      return NextResponse.json(
        { error: 'Failed to calculate progress', details: error },
        { status: 500 }
      );
    }

    // Get share contributions for detailed view
    const { data: contributions } = await supabase
      .from('checkin_share_contributions')
      .select(`
        *,
        share:user_shares(*)
      `)
      .eq('user_id', userId)
      .eq('checkin_date', date)
      .order('created_at', { ascending: false });

    // Get current configuration
    const { data: userProfile } = await supabase
      .from('unified_users')
      .select('empire_tier')
      .eq('id', userId)
      .single();

    const { data: config } = await supabase
      .from('checkin_requirements')
      .select('*')
      .eq('tier', userProfile?.empire_tier || 'NORMIE')
      .eq('active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      progress,
      contributions: contributions || [],
      config: {
        method: config?.unlock_method || 'hybrid',
        requiredShares: config?.required_shares || 3,
        requiredRituals: config?.required_rituals || 3,
        multipliers: config?.share_multipliers || {},
        tier: userProfile?.empire_tier || 'NORMIE'
      }
    });

  } catch (error) {
    console.error('Check-in progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

// POST to track a new share contribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, shareId, date } = body;

    if (!userId || !shareId) {
      return NextResponse.json(
        { error: 'userId and shareId required' },
        { status: 400 }
      );
    }

    // Get user's tier
    const { data: userProfile } = await supabase
      .from('unified_users')
      .select('empire_tier')
      .eq('id', userId)
      .single();

    // Calculate contribution value
    const { data: contributionValue, error: calcError } = await supabase
      .rpc('calculate_share_contribution', {
        p_share_id: shareId,
        p_user_tier: userProfile?.empire_tier || 'NORMIE'
      });

    if (calcError) {
      console.error('Contribution calculation error:', calcError);
      return NextResponse.json(
        { error: 'Failed to calculate contribution' },
        { status: 500 }
      );
    }

    // Record the contribution
    const { data: contribution, error: insertError } = await supabase
      .from('checkin_share_contributions')
      .insert([{
        user_id: userId,
        share_id: shareId,
        contribution_value: contributionValue,
        checkin_date: date || new Date().toISOString().split('T')[0],
        tier_at_time: userProfile?.empire_tier || 'NORMIE'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Contribution insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to record contribution' },
        { status: 500 }
      );
    }

    // Update progress
    const { data: updatedProgress } = await supabase
      .rpc('update_checkin_progress', {
        p_user_id: userId,
        p_date: date || new Date().toISOString().split('T')[0]
      });

    return NextResponse.json({
      success: true,
      contribution,
      progress: updatedProgress,
      contributionValue
    });

  } catch (error) {
    console.error('Track contribution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
```

#### Configuration Management API
```typescript
// /app/api/admin/checkin-config/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') || 'default';

    const { data: config, error } = await supabase
      .from('checkin_requirements')
      .select('*')
      .eq('tier', tier)
      .eq('active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Config fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      config: config || DEFAULT_CONFIG
    });

  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier = 'default', config, effectiveDate } = body;

    // Validate configuration
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Valid configuration object required' },
        { status: 400 }
      );
    }

    // Deactivate current configuration
    await supabase
      .from('checkin_requirements')
      .update({ active: false })
      .eq('tier', tier)
      .eq('active', true);

    // Insert new configuration
    const { data: newConfig, error } = await supabase
      .from('checkin_requirements')
      .insert([{
        tier,
        required_shares: config.unlock?.requiredShares || 3,
        required_rituals: config.unlock?.requiredRituals || 3,
        unlock_method: config.unlock?.unlockMethod || 'hybrid',
        share_multipliers: config.shareMultipliers || {},
        reward_multipliers: config.rewardMultipliers || {},
        effective_date: effectiveDate || new Date().toISOString(),
        active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Config update error:', error);
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: newConfig
    });

  } catch (error) {
    console.error('Update config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Frontend Implementation

#### Progress Display Component
```typescript
// components/CheckInProgress.tsx
import React from 'react';
import { useCheckInProgress } from '@/hooks/useCheckInProgress';
import { Crown, Share2, Trophy, Star } from 'lucide-react';

interface CheckInProgressProps {
  userId: string;
  className?: string;
}

export const CheckInProgress: React.FC<CheckInProgressProps> = ({
  userId,
  className = ''
}) => {
  const { progress, contributions, config, isLoading } = useCheckInProgress(userId);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-dark-card rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-8 bg-gray-700 rounded"></div>
      </div>
    );
  }

  const progressPercentage = Math.min(
    (progress.totalPoints / progress.requiredPoints) * 100,
    100
  );

  const isUnlocked = progress.totalPoints >= progress.requiredPoints;
  const extraShares = Math.max(0, progress.totalPoints - progress.requiredPoints);

  return (
    <div className={`bg-dark-card border border-gem-crystal/20 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {config.method === 'shares' && <Share2 className="w-5 h-5 text-gem-crystal" />}
          {config.method === 'hybrid' && <Crown className="w-5 h-5 text-gem-gold" />}
          Daily Check-in Progress
        </h3>

        {isUnlocked && (
          <div className="flex items-center gap-2 text-gem-gold">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-semibold">Unlocked!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">
            {config.method === 'shares' ? 'Share Progress' : 'Unlock Progress'}
          </span>
          <span className="text-white font-medium">
            {progress.totalPoints.toFixed(1)} / {progress.requiredPoints}
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isUnlocked
                ? 'bg-gradient-to-r from-gem-gold to-gem-crystal'
                : 'bg-gradient-to-r from-gem-crystal to-gem-pink'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="text-xs text-gray-400 mt-1">
          {progressPercentage.toFixed(0)}% complete
        </div>
      </div>

      {/* Requirements Display */}
      <div className="mb-4">
        {config.method === 'shares' && (
          <div className="text-sm text-gray-300">
            <p>
              <strong>Required:</strong> {config.requiredShares} quality shares
            </p>
            {config.tier !== 'NORMIE' && (
              <p className="text-gem-crystal">
                <Crown className="w-3 h-3 inline mr-1" />
                {config.tier} tier bonus active
              </p>
            )}
          </div>
        )}

        {config.method === 'hybrid' && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-gem-crystal/10 rounded border border-gem-crystal/20">
              <Share2 className="w-6 h-6 text-gem-crystal mx-auto mb-1" />
              <p className="font-semibold">Share Path</p>
              <p className="text-xs text-gray-400">
                {config.requiredShares} quality shares
              </p>
              <div className="text-gem-crystal font-bold">
                {progress.totalPoints.toFixed(1)}/{config.requiredShares}
              </div>
            </div>

            <div className="text-center p-3 bg-gem-gold/10 rounded border border-gem-gold/20">
              <Crown className="w-6 h-6 text-gem-gold mx-auto mb-1" />
              <p className="font-semibold">Ritual Path</p>
              <p className="text-xs text-gray-400">
                {config.requiredRituals} completed rituals
              </p>
              <div className="text-gem-gold font-bold">
                Classic Mode
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Contributions */}
      {contributions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            Today's Contributions
          </h4>
          <div className="space-y-2">
            {contributions.map((contrib, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded p-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gem-crystal"></div>
                  <span className="text-xs text-gray-300">
                    {contrib.share?.share_platform} share
                    {contrib.share?.verified && (
                      <span className="text-gem-crystal ml-1">✓</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-gem-gold" />
                  <span className="text-xs font-semibold text-gem-gold">
                    +{contrib.contribution_value.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus Rewards Display */}
      {extraShares > 0 && (
        <div className="bg-gem-gold/10 border border-gem-gold/20 rounded p-3">
          <div className="flex items-center gap-2 text-gem-gold mb-1">
            <Trophy className="w-4 h-4" />
            <span className="font-semibold">Bonus Rewards Active!</span>
          </div>
          <p className="text-xs text-gray-300">
            Extra {extraShares.toFixed(1)} shares = {progress.rewardMultiplier?.toFixed(1)}x rewards
          </p>
        </div>
      )}

      {/* Configuration Display (Admin/Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs">
          <summary className="text-gray-400 cursor-pointer">Debug Info</summary>
          <pre className="text-gray-500 mt-2 whitespace-pre-wrap">
            {JSON.stringify({ progress, config }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
```

#### Admin Configuration Panel
```typescript
// /app/admin/checkin-config/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { CheckInConfig, DEFAULT_CONFIG } from '@/lib/checkin-config';

export default function CheckInConfigPanel() {
  const [configs, setConfigs] = useState<Record<string, CheckInConfig>>({});
  const [selectedTier, setSelectedTier] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tiers = ['default', 'BIZARRE', 'WEIRDO', 'ODDBALL', 'MISFIT', 'NORMIE'];

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const configPromises = tiers.map(async (tier) => {
        const response = await fetch(`/api/admin/checkin-config?tier=${tier}`);
        const data = await response.json();
        return [tier, data.config || DEFAULT_CONFIG];
      });

      const configEntries = await Promise.all(configPromises);
      setConfigs(Object.fromEntries(configEntries));
    } catch (error) {
      console.error('Failed to load configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (tier: string, config: CheckInConfig) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/checkin-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          config,
          effectiveDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Reload configs to reflect changes
        await loadConfigs();
        alert('Configuration saved successfully!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (tier: string, path: string, value: any) => {
    setConfigs(prev => {
      const newConfigs = { ...prev };
      const config = { ...newConfigs[tier] };

      // Deep update using path
      const pathParts = path.split('.');
      let current = config;

      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }

      current[pathParts[pathParts.length - 1]] = value;
      newConfigs[tier] = config;

      return newConfigs;
    });
  };

  const currentConfig = configs[selectedTier] || DEFAULT_CONFIG;

  if (isLoading) {
    return <div className="p-8">Loading configurations...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-white">Check-in Configuration</h1>

      {/* Tier Selector */}
      <div className="flex gap-2 flex-wrap">
        {tiers.map(tier => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`px-4 py-2 rounded font-medium transition ${
              selectedTier === tier
                ? 'bg-gem-crystal text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tier === 'default' ? 'Global Default' : tier}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Settings */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Basic Requirements</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Required Shares
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentConfig.unlock.requiredShares}
                onChange={(e) => updateConfig(selectedTier, 'unlock.requiredShares', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Number of shares needed to unlock check-in
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unlock Method
              </label>
              <select
                value={currentConfig.unlock.unlockMethod}
                onChange={(e) => updateConfig(selectedTier, 'unlock.unlockMethod', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="shares">Shares Only</option>
                <option value="rituals">Rituals Only</option>
                <option value="hybrid">Both Options</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Required Rituals (Fallback)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentConfig.unlock.requiredRituals}
                onChange={(e) => updateConfig(selectedTier, 'unlock.requiredRituals', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </div>

        {/* Share Multipliers */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Share Multipliers</h2>

          <div className="space-y-4">
            {Object.entries(currentConfig.shareMultipliers).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={value}
                  onChange={(e) => updateConfig(selectedTier, `shareMultipliers.${key}`, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reward Multipliers */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Reward Multipliers</h2>

          <div className="space-y-4">
            {Object.entries(currentConfig.rewardMultipliers).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="3.0"
                  value={value}
                  onChange={(e) => updateConfig(selectedTier, `rewardMultipliers.${key}`, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Configuration Preview</h2>

          <div className="bg-gray-800 rounded p-4 text-sm">
            <pre className="text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(currentConfig, null, 2)}
            </pre>
          </div>

          <div className="mt-4 p-4 bg-gem-crystal/10 rounded border border-gem-crystal/20">
            <h3 className="font-semibold text-gem-crystal mb-2">Example Scenarios:</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 1 verified share = {(1 * currentConfig.shareMultipliers.verified).toFixed(1)} points</li>
              <li>• 1 multi-platform share = {(1 * currentConfig.shareMultipliers.multiPlatform).toFixed(1)} points</li>
              <li>• 1 verified + image share = {(1 * currentConfig.shareMultipliers.verified * currentConfig.shareMultipliers.withImage).toFixed(1)} points</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => saveConfig(selectedTier, currentConfig)}
          disabled={isSaving}
          className="px-6 py-3 bg-gem-crystal text-black font-semibold rounded hover:bg-gem-crystal/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Quick Presets */}
      <div className="bg-dark-card border border-gem-pink/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Presets</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => updateConfig(selectedTier, 'unlock.requiredShares', 1)}
            className="p-4 bg-gem-crystal/10 border border-gem-crystal/20 rounded hover:bg-gem-crystal/20 transition"
          >
            <h3 className="font-semibold text-gem-crystal">Viral Mode</h3>
            <p className="text-xs text-gray-400">1 quality share required</p>
          </button>

          <button
            onClick={() => updateConfig(selectedTier, 'unlock.requiredShares', 3)}
            className="p-4 bg-gem-gold/10 border border-gem-gold/20 rounded hover:bg-gem-gold/20 transition"
          >
            <h3 className="font-semibold text-gem-gold">Balanced Mode</h3>
            <p className="text-xs text-gray-400">3 shares required (current)</p>
          </button>

          <button
            onClick={() => updateConfig(selectedTier, 'unlock.requiredShares', 5)}
            className="p-4 bg-gem-pink/10 border border-gem-pink/20 rounded hover:bg-gem-pink/20 transition"
          >
            <h3 className="font-semibold text-gem-pink">Grind Mode</h3>
            <p className="text-xs text-gray-400">5 shares for max rewards</p>
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Migration & Evolution Strategy

### Phase 1: Foundation (Week 1)
1. **Database Setup**: Create all tables and functions
2. **Basic API**: Implement progress tracking and configuration
3. **Simple UI**: Show current progress with share counting

### Phase 2: Full Implementation (Week 2)
1. **Complete UI**: Full progress display with multipliers
2. **Admin Panel**: Configuration management interface
3. **Integration**: Connect with existing ShareButtons

### Phase 3: Advanced Features (Week 3)
1. **A/B Testing**: Different configs for different user segments
2. **Analytics**: Track effectiveness of different requirements
3. **Optimization**: Performance improvements and caching

### Phase 4: Ongoing Evolution
1. **Data-Driven Adjustments**: Use analytics to optimize requirements
2. **Seasonal Events**: Special configurations for events
3. **Advanced Multipliers**: Engagement-based bonuses

## Configuration Examples

### Conservative Start (Current Plan)
```typescript
{
  unlock: { requiredShares: 3, unlockMethod: 'hybrid' },
  shareMultipliers: { verified: 1.5, multiPlatform: 2.0 },
  // Result: 2 verified shares or 1 multi-platform share unlocks
}
```

### Future Viral Mode
```typescript
{
  unlock: { requiredShares: 1, unlockMethod: 'shares' },
  shareMultipliers: { verified: 3.0, withImage: 2.0 },
  // Result: Must be high-quality share to unlock
}
```

### Event Mode
```typescript
{
  unlock: { requiredShares: 5, unlockMethod: 'shares' },
  rewardMultipliers: { perExtraShare: 0.2, maxMultiplier: 5.0 },
  // Result: High engagement period with big rewards
}
```

## Benefits of This System

1. **No Code Deployment** - Change requirements instantly via admin panel
2. **Data-Driven** - A/B test different requirements easily
3. **Tier-Optimized** - Different rules for different user segments
4. **Future-Proof** - Easy evolution as platform grows
5. **Quality Focused** - Rewards meaningful engagement over quantity
6. **Revenue Protection** - Maintain reward economics while improving UX

This flexible system gives you complete control to optimize user engagement without technical constraints, starting conservative and evolving based on real user behavior data.