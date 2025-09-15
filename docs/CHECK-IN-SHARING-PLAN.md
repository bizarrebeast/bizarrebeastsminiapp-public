# 📋 Check-In Sharing Implementation Plan

## Overview
Implement sharing functionality for the daily check-in system that follows our established sharing patterns, with proper platform-specific formatting and embeds.

---

## 🎯 Sharing Opportunities

### 1. **After Daily Check-In**
When a user successfully checks in, show share buttons with:

#### Share Templates:

**Farcaster:**
```
🔥 Day {streak} streak on BizarreBeasts!

Just checked in and earning {tierReward} $BB every 5 days!
{streakMessage}

Join /bizarrebeasts and start your daily ritual streak!
CC @bizarrebeast
```

**Twitter/X:**
```
🔥 Day {streak} streak on @bizarrebeasts_!

Just checked in and earning {tierReward} $BB every 5 days!
{streakMessage}

Start your daily ritual streak!
```

**Telegram:**
```
🔥 Day {streak} streak on @bizarrebeast!

Just checked in and earning {tierReward} ($BB) every 5 days!
{streakMessage}
```

#### Dynamic Variables:
- `{streak}`: Current streak number (e.g., "7")
- `{tierReward}`: Based on tier (e.g., "100k" for BIZARRE)
- `{streakMessage}`: Contextual messages:
  - Day 5/10/15/20/25: "💰 5-day reward earned!"
  - Day 15: "🎉 15-day bonus unlocked!"
  - Day 30: "👑 30-day cycle complete! Maximum rewards earned!"
  - Default: "Building my empire, one day at a time!"

---

### 2. **After Claiming Rewards**
When a user claims their accumulated rewards:

#### Share Templates:

**Farcaster:**
```
💰 Just claimed {amount} $BB from my BizarreBeasts check-in rewards!

{tierMessage}
Total earned: {totalEarned} $BB

Start earning daily rewards at /bizarrebeasts!
CC @bizarrebeast
```

**Twitter/X:**
```
💰 Just claimed {amount} $BB from my @bizarrebeasts_ check-in rewards!

{tierMessage}
Total earned: {totalEarned} $BB
```

**Telegram:**
```
💰 Just claimed {amount} $BB from my @bizarrebeast check-in rewards!

{tierMessage}
Total earned: {totalEarned} ($BB)
```

#### Dynamic Variables:
- `{amount}`: Amount claimed (e.g., "500,000")
- `{totalEarned}`: Running total of all claims
- `{tierMessage}`:
  - BIZARRE: "👑 BIZARRE tier = Maximum rewards!"
  - WEIRDO: "🏆 WEIRDO tier = Solid rewards!"
  - ODDBALL: "⭐ ODDBALL tier = Growing strong!"
  - MISFIT: "✨ MISFIT tier = Just getting started!"

---

### 3. **Streak Milestones**
Special shares for milestone days:

#### Share Templates:

**5-Day Milestone:**
```
🎯 5-day streak complete on BizarreBeasts!
Just earned {reward} $BB!

Join /bizarrebeasts and start earning!
CC @bizarrebeast
```

**15-Day Milestone:**
```
🏆 15-DAY STREAK on BizarreBeasts!
Bonus {bonus} $BB earned!

The grind pays off! Join /bizarrebeasts
CC @bizarrebeast
```

**30-Day Cycle Complete:**
```
👑 30-DAY PERFECT STREAK COMPLETE!

✅ 30 days checked in
💰 {totalRewards} $BB earned
🔄 Ready for next cycle!

Join the most dedicated community at /bizarrebeasts!
CC @bizarrebeast
```

---

### 4. **Streak Break Recovery**
When returning after breaking a streak:

```
🔄 Back on the grind! Starting fresh on BizarreBeasts.

Previous best: {bestStreak} days
Let's beat it this time! 💪

Join /bizarrebeasts and build your streak!
CC @bizarrebeast
```

---

## 🛠️ Technical Implementation

### 1. **Add New Share Types to ShareButtons Component**
```typescript
shareType?: 'default' | 'meme' | 'rank' | 'ritual' | 'checkin' | 'claim' | 'milestone';

checkInData?: {
  streak: number;
  tierReward: string;
  streakMessage: string;
  milestone?: '5day' | '15day' | '30day';
};

claimData?: {
  amount: string;
  totalEarned: string;
  tier: string;
};
```

### 2. **Add Templates to social-sharing.ts**
```typescript
export const SHARE_TEMPLATES = {
  farcaster: {
    // ... existing templates
    checkin: `🔥 Day {streak} streak on BizarreBeasts!...`,
    claim: `💰 Just claimed {amount} $BB...`,
    milestone5: `🎯 5-day streak complete...`,
    milestone15: `🏆 15-DAY STREAK...`,
    milestone30: `👑 30-DAY PERFECT STREAK...`,
  },
  // ... same for twitter and telegram
};
```

### 3. **Update CheckIn Component**
Add share buttons at strategic points:
- After successful check-in
- After claiming rewards
- On milestone days (special celebration UI)

### 4. **Embed URLs**
All shares should include the rituals page URL as embed:
```
https://bbapp.bizarrebeasts.io/rituals
```

For Farcaster, use the `embeds[]` parameter properly:
```typescript
await ultimateShare({
  text: shareText,
  embeds: ['https://bbapp.bizarrebeasts.io/rituals'],
  channelKey: 'bizarrebeasts'
});
```

---

## 📊 Share Analytics Events

Track these events for optimization:
1. `checkin_shared` - Platform, streak day, tier
2. `rewards_claimed_shared` - Platform, amount, tier
3. `milestone_shared` - Platform, milestone type
4. `streak_broken_shared` - Platform, previous streak

---

## 🎨 UI/UX Considerations

### Share Button Placement:
1. **Check-In Success Modal**: Show share buttons prominently
2. **Claim Success Modal**: Celebrate with confetti + share buttons
3. **Milestone Animations**: Special celebration for 5/15/30 days
4. **Persistent Share**: Small share icon in check-in box header

### Visual Feedback:
- Success toast after sharing
- Platform-specific icons
- Consistent with existing share button styling
- Mobile-optimized layouts

---

## 🚀 Launch Strategy

### Phase 1: Basic Implementation
- Check-in shares
- Claim shares
- Use existing ShareButtons component

### Phase 2: Enhanced Features
- Milestone celebrations
- Streak recovery messages
- Share streak charts/visuals

### Phase 3: Gamification
- Share badges for consistent sharers
- Bonus rewards for sharing milestones
- Community share leaderboard

---

## ✅ Success Metrics

1. **Share Rate**: % of check-ins that get shared
2. **Platform Distribution**: Which platforms are most used
3. **Viral Coefficient**: New users from shares
4. **Engagement**: Likes/replies on shared content
5. **Retention**: Do sharers have better retention?

---

## 🔗 Related Files

- `/components/ShareButtons.tsx` - Main share component
- `/lib/social-sharing.ts` - Platform templates and logic
- `/components/CheckIn.tsx` - Where to add share CTAs
- `/lib/sdk-ultimate.ts` - Farcaster SDK integration

---

## 📝 Notes

- **Platform Handles**:
  - Farcaster: @bizarrebeast
  - Twitter/X: @bizarrebeasts_
  - Telegram: @bizarrebeast

- **Hashtags**: Use sparingly, mainly #BizarreBeasts

- **Embeds**: Always include the rituals page URL

- **Beta Tag**: During beta, add "🧪 Beta Testing on Base!" to shares