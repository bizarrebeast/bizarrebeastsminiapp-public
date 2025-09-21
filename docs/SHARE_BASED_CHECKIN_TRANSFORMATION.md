# Share-Based Check-in Transformation Plan

## Executive Summary
Transform the BizarreBeasts daily check-in system from requiring 3 ritual completions to requiring 1 verified social share. This change reduces user friction while increasing viral growth potential and community engagement.

## Current System Analysis

### Existing Check-in Flow
1. **Unlock Requirement**: Complete 3 daily rituals
2. **Verification**: On-chain via RitualGatekeeper contract
3. **Rewards**: Tier-based BB token rewards (100K for BIZARRE down to 0 for NORMIE)
4. **Streak System**: 20-44 hour check-in window with milestone bonuses

### Pain Points
- High friction (3 actions required)
- No social amplification
- Limited viral growth
- Purely transactional engagement

## Proposed Share-Based System

### New Check-in Flow
1. **Unlock Requirement**: Share 1 ritual completion
2. **Verification**: Off-chain share verification + on-chain record
3. **Rewards**: Same tier-based system + share quality bonuses
4. **Enhanced Streaks**: Share streaks with viral multipliers

### Key Benefits
- **Reduced Friction**: 1 action instead of 3
- **Viral Growth**: Every check-in generates social proof
- **Quality Engagement**: Rewards meaningful shares over grinding
- **Network Effects**: Each share potentially brings new users

## Implementation Architecture

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Database Extensions
```sql
-- Add to existing user_shares table
ALTER TABLE user_shares
ADD COLUMN unlocked_checkin BOOLEAN DEFAULT FALSE,
ADD COLUMN share_quality_score DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN engagement_metrics JSONB DEFAULT '{}';

-- Create share quality scoring function
CREATE OR REPLACE FUNCTION calculate_share_quality(
  p_share_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  quality_score DECIMAL(3,2);
  share_data RECORD;
BEGIN
  SELECT * INTO share_data FROM user_shares WHERE id = p_share_id;

  quality_score := 0.0;

  -- Base score for platform
  CASE share_data.share_platform
    WHEN 'farcaster' THEN quality_score := quality_score + 0.3;
    WHEN 'twitter' THEN quality_score := quality_score + 0.2;
    ELSE quality_score := quality_score + 0.1;
  END CASE;

  -- Verified bonus
  IF share_data.verified THEN
    quality_score := quality_score + 0.3;
  END IF;

  -- Content customization bonus
  IF LENGTH(share_data.share_text) > 100 THEN
    quality_score := quality_score + 0.2;
  END IF;

  -- Engagement bonus (likes, comments, reshares)
  IF share_data.engagement_metrics->>'likes' > '10' THEN
    quality_score := quality_score + 0.2;
  END IF;

  RETURN LEAST(quality_score, 1.0);
END;
$$ LANGUAGE plpgsql;
```

#### 1.2 Smart Contract Updates
```solidity
// RitualGatekeeper.sol modifications
contract RitualGatekeeper {
    mapping(address => bytes32) public shareHashes;
    mapping(address => uint256) public shareUnlockTimestamp;

    event CheckInUnlockedViaShare(
        address indexed user,
        bytes32 shareHash,
        uint256 timestamp
    );

    function unlockCheckInViaShare(
        address user,
        bytes32 shareHash
    ) external onlyAuthorized {
        require(shareHashes[user] == bytes32(0), "Already unlocked");

        shareHashes[user] = shareHash;
        shareUnlockTimestamp[user] = block.timestamp;
        userUnlockStatus[user] = true;

        emit CheckInUnlockedViaShare(user, shareHash, block.timestamp);
    }
}
```

### Phase 2: Share Verification System (Week 1-2)

#### 2.1 Enhanced Verification Logic
```typescript
// /app/api/shares/verify-checkin/route.ts
interface CheckInShareVerification {
  shareId: string;
  platform: string;
  userId: string;
  ritualId?: string;
}

export async function verifyCheckInShare({
  shareId,
  platform,
  userId,
  ritualId
}: CheckInShareVerification) {
  // Platform-specific verification
  let verificationResult = await verifyPlatformShare(shareId, platform);

  // Calculate share quality
  const qualityScore = await calculateShareQuality({
    hasImage: verificationResult.hasMedia,
    textLength: verificationResult.textLength,
    mentions: verificationResult.mentions,
    hashtags: verificationResult.hashtags,
    customized: verificationResult.isCustomized
  });

  // Determine unlock eligibility
  const unlockThreshold = getUnlockThreshold(userId);
  const canUnlock = qualityScore >= unlockThreshold;

  if (canUnlock) {
    // Unlock check-in on-chain
    await unlockCheckInOnChain(userId, shareId);

    // Track in database
    await trackCheckInUnlock(userId, shareId, qualityScore);
  }

  return {
    verified: verificationResult.verified,
    qualityScore,
    canUnlock,
    bonusMultiplier: calculateBonusMultiplier(qualityScore)
  };
}
```

#### 2.2 Platform-Specific Verification
```typescript
// Farcaster Verification (Enhanced)
async function verifyFarcasterShare(shareId: string) {
  const share = await getShareById(shareId);

  // Check for ritual-specific content
  const castData = await neynarClient.lookupCast(share.content_data.castHash);

  const verification = {
    hasRitualMention: castData.text.includes('#BBRitual'),
    hasBBMention: castData.text.includes('$BB'),
    hasImage: castData.embeds?.some(e => e.type === 'image'),
    engagement: {
      likes: castData.reactions?.likes?.length || 0,
      recasts: castData.reactions?.recasts?.length || 0
    },
    timeValid: Date.now() - castData.timestamp < 10 * 60 * 1000 // 10 min
  };

  return {
    verified: verification.hasRitualMention && verification.timeValid,
    quality: calculateFarcasterQuality(verification),
    engagement: verification.engagement
  };
}
```

### Phase 3: User Interface Updates (Week 2)

#### 3.1 CheckIn Component Modifications
```typescript
// components/CheckIn.tsx updates
const CheckInUnlockFlow = () => {
  const [unlockMethod, setUnlockMethod] = useState<'share' | 'rituals'>('share');
  const [shareStatus, setShareStatus] = useState<ShareStatus>('pending');

  const unlockViaShare = async (ritual: Ritual) => {
    // Show share modal
    const shareResult = await showShareModal({
      type: 'ritual',
      content: ritual,
      platforms: ['farcaster', 'twitter', 'telegram'],
      customizable: true
    });

    if (shareResult.shared) {
      // Track share
      const shareId = await trackShare(shareResult);

      // Show verification progress
      setShareStatus('verifying');

      // Verify share
      const verification = await verifyShare(shareId);

      if (verification.canUnlock) {
        setShareStatus('unlocked');
        // Refresh check-in eligibility
        await refreshCheckInStatus();
      } else {
        setShareStatus('insufficient');
        // Show quality feedback
        showQualityFeedback(verification.qualityScore);
      }
    }
  };

  return (
    <div className="unlock-methods">
      <button
        onClick={() => setUnlockMethod('share')}
        className="share-unlock-btn"
      >
        🚀 Quick Unlock: Share 1 Ritual
      </button>

      <button
        onClick={() => setUnlockMethod('rituals')}
        className="ritual-unlock-btn"
      >
        🎮 Classic: Complete 3 Rituals
      </button>

      {unlockMethod === 'share' && (
        <ShareUnlockFlow onUnlock={unlockViaShare} />
      )}
    </div>
  );
};
```

#### 3.2 Share Quality Indicators
```typescript
const ShareQualityIndicator = ({ score }: { score: number }) => {
  const getQualityLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Excellent', color: 'gem-gold' };
    if (score >= 0.6) return { label: 'Good', color: 'gem-crystal' };
    if (score >= 0.4) return { label: 'Basic', color: 'gem-pink' };
    return { label: 'Needs Work', color: 'gray-400' };
  };

  const quality = getQualityLevel(score);

  return (
    <div className="share-quality">
      <div className="quality-bar">
        <div
          className={`quality-fill bg-${quality.color}`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <p className={`text-${quality.color}`}>{quality.label} Share</p>
      {score < 0.4 && (
        <p className="text-xs text-gray-400">
          Tips: Add image, customize message, mention @bizarrebeast
        </p>
      )}
    </div>
  );
};
```

### Phase 4: Analytics & Optimization (Week 3)

#### 4.1 Share Analytics Dashboard
```typescript
// /app/admin/share-analytics/page.tsx
const ShareAnalytics = () => {
  const metrics = useShareMetrics();

  return (
    <Dashboard>
      <MetricCard
        title="Share to Check-in Rate"
        value={`${metrics.shareToCheckinRate}%`}
        trend={metrics.shareToCheckinTrend}
      />

      <MetricCard
        title="Avg Share Quality"
        value={metrics.avgQualityScore}
        benchmark={0.6}
      />

      <MetricCard
        title="Viral Coefficient"
        value={metrics.viralCoefficient}
        target={1.1}
      />

      <ShareQualityDistribution data={metrics.qualityDistribution} />
      <PlatformPerformance data={metrics.platformStats} />
      <TopSharers data={metrics.topSharers} />
    </Dashboard>
  );
};
```

#### 4.2 A/B Testing Framework
```typescript
const shareUnlockExperiments = {
  'single_share': {
    requirement: 1,
    qualityThreshold: 0.4
  },
  'quality_focused': {
    requirement: 1,
    qualityThreshold: 0.6
  },
  'multi_platform': {
    requirement: 2,
    qualityThreshold: 0.3,
    requireDifferentPlatforms: true
  }
};

const getExperimentVariant = (userId: string) => {
  // Consistent hashing for user bucketing
  const variant = hashUserId(userId) % 3;
  return Object.keys(shareUnlockExperiments)[variant];
};
```

## Success Metrics

### Primary KPIs
1. **Share-to-Check-in Conversion**: Target 80%+
2. **Viral Coefficient (K-factor)**: Target 1.2+
3. **Daily Active Sharers**: Target 40% of DAU
4. **Share Quality Score**: Target avg 0.6+

### Secondary Metrics
- Time to unlock (target < 2 minutes)
- Platform distribution (balanced across 3+)
- Share engagement rate (likes/comments)
- New user acquisition via shares

## Risk Mitigation

### Anti-Gaming Measures
1. **Share Uniqueness Check**: Prevent duplicate content
2. **Account Age Requirements**: Min 7 days for auto-verify
3. **Rate Limiting**: Max 5 shares/hour per user
4. **Quality Thresholds**: Higher requirements for suspicious accounts

### Fallback Options
1. **Hybrid Mode**: Allow both share and ritual unlock
2. **Progressive Requirements**: Start with low threshold, increase over time
3. **Manual Review Queue**: For edge cases and disputes

## Timeline

### Week 1
- [ ] Database schema updates
- [ ] API endpoint creation
- [ ] Basic verification logic

### Week 2
- [ ] UI component updates
- [ ] Share quality scoring
- [ ] Platform integrations

### Week 3
- [ ] Analytics dashboard
- [ ] A/B testing setup
- [ ] Performance optimization

### Week 4
- [ ] Beta testing with select users
- [ ] Refinement based on feedback
- [ ] Full rollout preparation

## Technical Dependencies

- Unified Auth System ✅
- Share Tracking Infrastructure ✅
- Neynar API for Farcaster ✅
- Smart Contract Updates (RitualGatekeeper)
- Analytics Pipeline

## Budget Considerations

### Development (3 developers × 3 weeks)
- Smart Contract Updates: $5K
- Backend Development: $10K
- Frontend Development: $10K
- Testing & QA: $5K

### Infrastructure
- Enhanced Neynar API tier: $500/month
- Additional database capacity: $200/month
- Analytics tools: $300/month

### Total Initial Investment: ~$30K + $1K/month operational

## Conclusion

The share-based check-in transformation will:
1. **Reduce friction** from 3 actions to 1
2. **Increase visibility** through mandatory sharing
3. **Drive growth** via network effects
4. **Improve quality** by rewarding meaningful engagement
5. **Build community** through social proof

This system leverages our existing unified auth and share tracking infrastructure to create a more viral, engaging, and sustainable growth mechanism for BizarreBeasts.