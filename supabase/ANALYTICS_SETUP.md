# Complete Analytics Setup Guide

## Overview
This guide sets up the complete analytics system for:
1. **Ritual Tracking** - Tracks clicks, completions, and shares for rituals 1-9
2. **Attestation Tracking** - Already set up for Ritual 10
3. **Admin Analytics** - View all metrics in the admin panel

## Prerequisites
- Supabase project with environment variables configured
- Admin access to Supabase SQL Editor

## Setup Steps

### Step 1: Run Ritual Tracking Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/002_ritual_tracking.sql`
5. Paste and click **Run**

This creates:
- `ritual_completions` - Tracks when users complete rituals
- `ritual_shares` - Tracks when users share rituals
- `ritual_clicks` - Tracks CTA clicks and interactions
- `ritual_stats` - Aggregated statistics
- `user_ritual_stats` - Per-user statistics
- Automatic triggers to update stats

### Step 2: Verify Tables Created

In Supabase Table Editor, you should see these new tables:
- `ritual_completions`
- `ritual_shares`
- `ritual_clicks`
- `ritual_stats`
- `user_ritual_stats`
- `ritual_leaderboard` (view)
- `ritual_performance` (view)

### Step 3: Test the Tracking

The tracking system needs to be activated in the frontend. Currently:

**What's NOT working (needs fixing):**
- RitualsClient doesn't call tracking APIs
- Clicks aren't being tracked
- Shares aren't being tracked
- Completions aren't being tracked

**What IS working:**
- Ritual 10 (attestations) tracking works perfectly
- Database structure is ready
- Admin pages are ready to display data

### Step 4: Access Admin Analytics

Once tracking is enabled, you can view analytics at:

1. **Rituals Analytics**: `/admin/analytics/rituals`
   - Overall ritual performance
   - Hourly distribution
   - Top performers
   - Individual ritual stats

2. **Attestations Analytics**: `/admin/attestations`
   - Ritual 10 specific metrics
   - Onchain attestation tracking
   - Wallet leaderboard
   - Streak analysis

3. **Share Analytics**: `/admin/share-analytics`
   - Share conversion rates
   - Platform breakdown
   - Viral coefficient

## What Needs to Be Fixed

### RitualsClient.tsx needs to:

1. **Track clicks** when user clicks a ritual CTA:
```javascript
// When user clicks ritual CTA
await fetch('/api/rituals/track', {
  method: 'POST',
  body: JSON.stringify({
    userId: wallet.address,
    ritualId: ritual.id,
    action: 'click_cta',
    ritualTitle: ritual.title
  })
});
```

2. **Track completions** when ritual completes:
```javascript
// When ritual is marked complete
await fetch('/api/rituals/complete', {
  method: 'POST',
  body: JSON.stringify({
    userId: wallet.address,
    ritualId: ritual.id,
    ritualTitle: ritual.title,
    completed: true,
    timeToComplete: timeSpent
  })
});
```

3. **Track shares** when user shares:
```javascript
// When user shares ritual
await fetch('/api/rituals/share', {
  method: 'POST',
  body: JSON.stringify({
    userId: wallet.address,
    ritualId: ritual.id,
    platform: 'farcaster', // or twitter, etc
    shareUrl: shareUrl
  })
});
```

## Database Schema Summary

### For Rituals 1-9:
- `ritual_completions` - Individual completion records
- `ritual_shares` - Share tracking with platform
- `ritual_clicks` - Interaction tracking
- `ritual_stats` - Aggregated metrics per ritual
- `user_ritual_stats` - User-specific stats and streaks

### For Ritual 10 (Attestations):
- `bizarre_attestations` - Onchain attestation records
- `bizarre_attestation_stats` - User stats and streaks
- `bizarre_attestation_leaderboard` - Ranked leaderboard view

## Monitoring

Once live, monitor at:
- `/admin` - Overview dashboard
- `/admin/analytics/rituals` - Rituals 1-9 performance
- `/admin/attestations` - Ritual 10 attestations
- `/admin/leaderboards` - Cross-ritual rankings

## Troubleshooting

If analytics show zeros:
1. Check that tracking APIs are being called in browser console
2. Verify Supabase tables have data
3. Check browser Network tab for API errors
4. Ensure RLS policies allow inserts

## Next Steps

1. **Enable Tracking**: Update RitualsClient.tsx to call tracking APIs
2. **Test Tracking**: Complete a ritual and verify data appears
3. **Deploy**: Push changes to production
4. **Monitor**: Watch analytics populate in admin panel