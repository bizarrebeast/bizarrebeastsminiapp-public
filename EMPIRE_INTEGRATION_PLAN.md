# BizarreBeasts × Empire Builder Integration Plan

## 🎯 Executive Summary
Replace traditional token gating with Empire Builder leaderboard scores to create a more dynamic, competitive, and engaging access control system for the BizarreBeasts miniapp.

## 💡 Why Empire Score Gating is Better

### Advantages Over Token Gating:
1. **Dynamic Engagement** - Scores change based on activity and boosts
2. **Competitive Element** - Users compete for higher ranks to unlock features
3. **Multi-factor Scoring** - Combines token holding with NFTs and other activities
4. **Community Building** - Creates ongoing engagement vs one-time token purchase
5. **Flexible Tiers** - Can create multiple access levels based on rank/score
6. **Social Proof** - High rank = status in community

## 🏗️ Technical Architecture

### API Integration
```typescript
// Empire API Service
const EMPIRE_API_BASE = 'https://www.empirebuilder.world/api';
const BB_TOKEN_ADDRESS = '0x...'; // BizarreBeasts token contract

interface EmpireHolder {
  address: string;
  balance: string;
  baseBalance: string;
  appliedBoosts: Boost[];
  finalMultiplier: number;
  isLP: boolean;
  farcasterUsername?: string;
  rank: number;
}

interface EmpireLeaderboard {
  holders: EmpireHolder[];
  cached: boolean;
}
```

## 📊 Feature Access Tiers

### Tier System Based on Empire Rank
```typescript
enum AccessTier {
  ELITE = 'elite',      // Rank 1-10
  CHAMPION = 'champion', // Rank 11-50
  VETERAN = 'veteran',   // Rank 51-100
  MEMBER = 'member',     // Rank 101-500
  VISITOR = 'visitor'    // Rank 501+ or not on leaderboard
}

interface FeatureGating {
  // Meme Generator
  collections: {
    bizarrebeasts: AccessTier.VISITOR,    // Open to all
    treasureQuest: AccessTier.MEMBER,     // Top 500
    vibecards: AccessTier.VETERAN,        // Top 100
    exclusive: AccessTier.CHAMPION,       // Top 50
    legendary: AccessTier.ELITE           // Top 10
  },
  
  // Features
  features: {
    basicMemes: AccessTier.VISITOR,
    customBackgrounds: AccessTier.MEMBER,
    noWatermark: AccessTier.VETERAN,
    premiumStickers: AccessTier.CHAMPION,
    aiBackgroundRemoval: AccessTier.ELITE,
    contestEntry: AccessTier.MEMBER,
    contestVoting: AccessTier.VISITOR
  }
}
```

## 🔄 Implementation Plan

### Phase 1: Core Integration (Week 1)

#### 1.1 Create Empire Service
```typescript
// /lib/empire.ts
export class EmpireService {
  private cache: Map<string, { data: EmpireHolder, timestamp: number }>;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getLeaderboard(): Promise<EmpireLeaderboard> {
    const response = await fetch(`${EMPIRE_API_BASE}/leaderboard/${BB_TOKEN_ADDRESS}`);
    return response.json();
  }

  async getUserRank(address: string): Promise<number | null> {
    const leaderboard = await this.getLeaderboard();
    const holder = leaderboard.holders.find(h => 
      h.address.toLowerCase() === address.toLowerCase()
    );
    return holder?.rank || null;
  }

  async getUserTier(address: string): Promise<AccessTier> {
    const rank = await this.getUserRank(address);
    if (!rank) return AccessTier.VISITOR;
    if (rank <= 10) return AccessTier.ELITE;
    if (rank <= 50) return AccessTier.CHAMPION;
    if (rank <= 100) return AccessTier.VETERAN;
    if (rank <= 500) return AccessTier.MEMBER;
    return AccessTier.VISITOR;
  }
}
```

#### 1.2 Update Authentication Flow
```typescript
// Enhanced auth with Empire score
interface AuthState {
  isAuthenticated: boolean;
  fid?: number;
  username?: string;
  walletAddress?: string;
  empireRank?: number;
  empireScore?: string;
  accessTier?: AccessTier;
}
```

#### 1.3 Create Empire Context
```typescript
// /contexts/EmpireContext.tsx
export const EmpireProvider = ({ children }) => {
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<AccessTier>(AccessTier.VISITOR);
  const [leaderboard, setLeaderboard] = useState<EmpireHolder[]>([]);

  useEffect(() => {
    // Fetch and update Empire data on auth
    if (user?.walletAddress) {
      updateEmpireData(user.walletAddress);
    }
  }, [user?.walletAddress]);

  return (
    <EmpireContext.Provider value={{ userRank, userTier, leaderboard }}>
      {children}
    </EmpireContext.Provider>
  );
};
```

### Phase 2: UI Updates (Week 1-2)

#### 2.1 Empire Badge Component
```typescript
// /components/ui/EmpireBadge.tsx
export function EmpireBadge({ rank, tier }: Props) {
  const tierColors = {
    elite: 'from-yellow-400 to-yellow-600',     // Gold
    champion: 'from-purple-400 to-purple-600',   // Purple
    veteran: 'from-blue-400 to-blue-600',        // Blue
    member: 'from-green-400 to-green-600',       // Green
    visitor: 'from-gray-400 to-gray-600'         // Gray
  };

  return (
    <div className={`bg-gradient-to-r ${tierColors[tier]} px-3 py-1 rounded-full`}>
      <span className="text-black font-bold">
        {tier === 'visitor' ? 'Visitor' : `Rank #${rank}`}
      </span>
    </div>
  );
}
```

#### 2.2 Gated Feature Component
```typescript
// /components/ui/GatedFeature.tsx
export function GatedFeature({ requiredTier, children }: Props) {
  const { userTier } = useEmpire();
  const hasAccess = getTierLevel(userTier) >= getTierLevel(requiredTier);

  if (!hasAccess) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center p-4">
            <Lock className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">Requires {requiredTier} Tier</p>
            <p className="text-sm">Climb the Empire leaderboard to unlock!</p>
            <Link href="/leaderboard" className="text-gem-gold underline">
              View Leaderboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
}
```

#### 2.3 Updated Meme Generator Collections
```typescript
// Show locked collections with Empire requirements
const collections = [
  {
    id: 'bizarrebeasts',
    name: 'BizarreBeasts',
    requiredTier: AccessTier.VISITOR,
    unlocked: true,
  },
  {
    id: 'treasure-quest',
    name: 'Treasure Quest',
    requiredTier: AccessTier.MEMBER,
    unlocked: userTier >= AccessTier.MEMBER,
    lockMessage: 'Top 500 Empire holders only'
  },
  {
    id: 'vibecards',
    name: 'Vibecards',
    requiredTier: AccessTier.VETERAN,
    unlocked: userTier >= AccessTier.VETERAN,
    lockMessage: 'Top 100 Empire holders only'
  }
];
```

### Phase 3: Leaderboard Page (Week 2)

#### 3.1 Empire Leaderboard Component
```typescript
// /app/empire-leaderboard/page.tsx
export default function EmpireLeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Empire Leaderboard</h1>
      
      {/* User's Position */}
      <UserRankCard />
      
      {/* Top 3 Showcase */}
      <TopThreeShowcase holders={topThree} />
      
      {/* Full Leaderboard Table */}
      <LeaderboardTable 
        holders={leaderboard}
        columns={['Rank', 'User', 'Score', 'Multiplier', 'Tier', 'Unlocked Features']}
      />
      
      {/* Tier Benefits */}
      <TierBenefitsGrid />
    </div>
  );
}
```

#### 3.2 User Rank Card
```typescript
export function UserRankCard() {
  const { userRank, userScore, userTier } = useEmpire();
  
  return (
    <div className="bg-gradient-to-r from-gem-gold to-gem-crystal p-6 rounded-lg mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Empire Position</h2>
          <p className="text-lg">Rank #{userRank || '???'}</p>
          <p className="text-sm">Score: {formatScore(userScore)}</p>
        </div>
        <EmpireBadge rank={userRank} tier={userTier} />
      </div>
      <ProgressToNextTier current={userRank} />
    </div>
  );
}
```

### Phase 4: Feature Integration (Week 2-3)

#### 4.1 Watermark Removal (Veteran+)
```typescript
// Auto-disable watermark for high-tier users
useEffect(() => {
  if (userTier >= AccessTier.VETERAN) {
    setExportOptions(prev => ({
      ...prev,
      watermark: { ...prev.watermark, enabled: false }
    }));
  }
}, [userTier]);
```

#### 4.2 Contest System
```typescript
// Empire-gated contests
interface Contest {
  id: string;
  name: string;
  requiredTier: AccessTier;
  prizes: {
    rank1: { value: '$100', extraPoints: 1000 },
    rank2: { value: '$50', extraPoints: 500 },
    rank3: { value: '$25', extraPoints: 250 }
  };
}
```

#### 4.3 Sticker Packs
```typescript
// Progressive sticker unlocking
const getUnlockedStickers = (tier: AccessTier) => {
  const allStickers = [...];
  switch(tier) {
    case AccessTier.ELITE:
      return allStickers; // All stickers
    case AccessTier.CHAMPION:
      return allStickers.filter(s => s.rarity !== 'legendary');
    case AccessTier.VETERAN:
      return allStickers.filter(s => ['common', 'rare'].includes(s.rarity));
    case AccessTier.MEMBER:
      return allStickers.filter(s => s.rarity === 'common');
    default:
      return allStickers.slice(0, 10); // Basic set only
  }
};
```

## 🎮 Gamification Elements

### Achievement System
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: {
    rank?: number;
    memeCount?: number;
    contestWins?: number;
  };
}

const achievements = [
  { id: 'first-meme', name: 'First Steps', unlockedAt: { memeCount: 1 }},
  { id: 'top-100', name: 'Centurion', unlockedAt: { rank: 100 }},
  { id: 'top-10', name: 'Elite Beast', unlockedAt: { rank: 10 }},
  { id: 'contest-winner', name: 'Champion Creator', unlockedAt: { contestWins: 1 }}
];
```

### Daily Challenges
```typescript
// Empire rank affects reward multipliers
interface DailyChallenge {
  task: string;
  baseReward: number;
  getTierMultiplier: (tier: AccessTier) => number;
}
```

## 📈 Analytics Integration

Track Empire-related metrics:
```typescript
enum EmpireAnalytics {
  TIER_UNLOCK = 'empire_tier_unlock',
  RANK_CHANGE = 'empire_rank_change',
  FEATURE_GATED = 'empire_feature_gated',
  LEADERBOARD_VIEW = 'empire_leaderboard_view'
}
```

## 🚀 Migration Strategy

### Week 1: Foundation
- [ ] Implement Empire API service
- [ ] Create Empire context and hooks
- [ ] Add Empire badge components
- [ ] Update auth flow to fetch Empire data

### Week 2: Feature Gating
- [ ] Replace token gating with Empire tiers
- [ ] Update meme generator collections
- [ ] Add gated feature UI components
- [ ] Create Empire leaderboard page

### Week 3: Enhancements
- [ ] Add achievement system
- [ ] Implement tier-based rewards
- [ ] Create progression indicators
- [ ] Add social sharing for ranks

## 🎯 Success Metrics

### KPIs to Track:
1. **User Engagement**
   - Daily active users increase
   - Average session duration
   - Feature usage by tier

2. **Competition Metrics**
   - Leaderboard page views
   - Rank improvement rate
   - User retention by tier

3. **Feature Adoption**
   - Unlock rate per tier
   - Premium feature usage
   - Contest participation

## 🔗 API Endpoints Needed

```typescript
// Required Empire Builder endpoints
GET /api/leaderboard/{TOKEN_ADDRESS} - Full leaderboard
GET /api/holder/{WALLET_ADDRESS} - Individual holder data (if available)

// Our backend endpoints
GET /api/empire/user-tier - Get current user's tier
GET /api/empire/features - Get unlocked features
POST /api/empire/refresh - Force refresh user's Empire data
```

## 💡 Future Enhancements

1. **Empire Score Predictions**
   - Show what user needs to reach next tier
   - Boost calculator

2. **Social Features**
   - Challenge other users at similar ranks
   - Team competitions

3. **Dynamic Rewards**
   - NFT airdrops for tier achievements
   - Exclusive content for top rankers

4. **Cross-game Integration**
   - Use Empire rank in Treasure Quest game
   - Unlock characters based on tier

## 🏁 Conclusion

Empire score gating creates a more engaging, competitive ecosystem than simple token gating. It rewards active participation, creates ongoing engagement, and builds a stronger community around BizarreBeasts.

The integration is straightforward, using a simple API call to determine access levels, while providing rich opportunities for gamification and social features.

**Estimated Timeline:** 2-3 weeks for full implementation
**Priority:** HIGH - This fundamentally improves user engagement
**Risk:** LOW - Simple API integration with fallback to visitor tier