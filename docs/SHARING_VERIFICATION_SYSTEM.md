# Sharing Verification System

## Overview
Building on our unified authentication system, this document outlines the enhanced sharing verification and tracking system for BizarreBeasts. This system will track, verify, and reward user sharing activities across multiple platforms.

## Current State

### What We Have
1. **Unified User Identity** - Single user ID linking wallet and Farcaster identities
2. **Share Verification API** - `/api/neynar/verify-share` for Farcaster share verification
3. **ShareButtons Component** - Supports multiple share types with platform tracking
4. **Basic Ritual Verification** - Can verify if users actually shared rituals on Farcaster

### Current Limitations
- No persistent storage of share history
- Limited to Farcaster verification only
- No reward system for verified shares
- No analytics or insights on sharing patterns

## Enhanced System Architecture

### 1. Database Schema

#### user_shares Table
```sql
CREATE TABLE user_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES unified_users(id) NOT NULL,
  share_type VARCHAR(50) NOT NULL, -- ritual, contest, rank, checkin, etc.
  share_platform VARCHAR(50) NOT NULL, -- farcaster, twitter, telegram
  content_id VARCHAR(255), -- ritual_id, contest_id, etc.
  content_data JSONB, -- Store content-specific data
  share_url TEXT,
  share_text TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verification_data JSONB, -- Store platform-specific verification response
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_user_shares_user_id (user_id),
  INDEX idx_user_shares_type (share_type),
  INDEX idx_user_shares_verified (verified),
  INDEX idx_user_shares_created (created_at DESC)
);
```

#### share_rewards Table
```sql
CREATE TABLE share_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES unified_users(id) NOT NULL,
  share_id UUID REFERENCES user_shares(id),
  reward_type VARCHAR(50), -- points, tokens, nft, feature_unlock
  reward_amount INTEGER,
  reward_data JSONB, -- Additional reward details
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Endpoints

#### POST /api/shares/track
Track a new share action
```typescript
interface TrackShareRequest {
  shareType: string;
  sharePlatform: string;
  contentId?: string;
  contentData?: any;
  shareUrl?: string;
  shareText?: string;
}
```

#### POST /api/shares/verify
Verify a tracked share
```typescript
interface VerifyShareRequest {
  shareId: string;
  platform: 'farcaster' | 'twitter' | 'telegram';
  verificationData?: any;
}
```

#### GET /api/shares/user/:userId
Get user's share history
```typescript
interface UserSharesResponse {
  shares: Share[];
  stats: {
    totalShares: number;
    verifiedShares: number;
    pointsEarned: number;
    sharesByType: Record<string, number>;
  };
}
```

#### GET /api/shares/leaderboard
Get top sharers
```typescript
interface ShareLeaderboardResponse {
  leaderboard: {
    userId: string;
    username: string;
    totalShares: number;
    verifiedShares: number;
    points: number;
    rank: number;
  }[];
}
```

### 3. Implementation Plan

#### Phase 1: Database & Core Tracking
1. Create database tables with RLS policies
2. Implement track share API endpoint
3. Update ShareButtons component to call tracking API
4. Add share history to user profile

#### Phase 2: Verification System
1. Enhance Farcaster verification with rewards
2. Add Twitter/X verification via API
3. Implement Telegram miniapp share tracking
4. Create verification queue system

#### Phase 3: Rewards & Gamification
1. Define point values for different share types
2. Implement reward distribution system
3. Create share streak tracking
4. Add achievement badges for sharing milestones

#### Phase 4: Analytics & Insights
1. Build analytics dashboard
2. Track share-to-conversion metrics
3. Identify top performing content
4. Generate shareholder reports

## Share Types & Rewards

### Share Type Matrix
| Type | Base Points | Verified Bonus | Cooldown |
|------|------------|----------------|----------|
| Ritual | 10 | +20 | 1 hour |
| Contest Entry | 15 | +30 | Per entry |
| Rank/Empire | 5 | +10 | 24 hours |
| Check-in | 5 | +15 | Daily |
| Milestone | 20 | +40 | One-time |
| Contest Win | 50 | +100 | Per win |

### Verification Requirements
- **Farcaster**: Must contain specific hashtags/mentions
- **Twitter/X**: Must be public tweet with app link
- **Telegram**: Must be sent to group/channel

## Security Considerations

1. **Rate Limiting**: Max 10 shares per hour per user
2. **Duplicate Prevention**: Same content can't be shared to same platform within cooldown
3. **Verification Window**: Shares must be verified within 24 hours
4. **Anti-Gaming**: Pattern detection for suspicious sharing behavior

## Success Metrics

- Daily Active Sharers (DAS)
- Share Verification Rate
- Share-to-New-User Conversion
- Average Shares per User
- Viral Coefficient (K-factor)

## Next Steps

1. Create database migration script
2. Implement core tracking API
3. Update ShareButtons component
4. Add verification queue worker
5. Design rewards distribution system
6. Build analytics dashboard

## Technical Dependencies

- Supabase (Database & RLS)
- Neynar API (Farcaster verification)
- Twitter API v2 (Twitter verification)
- Telegram Bot API (Telegram tracking)
- Background job queue (verification processing)