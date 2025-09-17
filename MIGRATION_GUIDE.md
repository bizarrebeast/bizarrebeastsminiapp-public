# Contest System Migration Guide

## 🚀 Quick Setup

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/complete_migration.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration

This will:
- ✅ Add CTA fields to contests table
- ✅ Create voting system tables
- ✅ Set up click tracking
- ✅ Create necessary indexes and views
- ✅ Configure Row Level Security policies

### Step 2: Test the System

#### Create a Test Contest with CTA:

1. Go to `/admin/contests` in your app
2. Click "Create Contest"
3. Fill in the basic details
4. In **CTA Settings**:
   - **CTA URL**: `/meme-generator` (or any game/tool URL)
   - **Button Text**: `Create Meme` (or custom text)
   - **Link Type**: Choose appropriate type
   - **Track Clicks**: Enable to track analytics

#### Verify Dual Buttons:

1. Visit the contest detail page
2. You should see two buttons:
   - **CTA Button** (e.g., "Create Meme") - Takes users to the tool/game
   - **Submit Entry** - Opens submission form

### Step 3: Monitor CTA Clicks

To view CTA click analytics, run this query in Supabase:

```sql
SELECT
    c.name as contest_name,
    COUNT(cc.id) as total_clicks,
    COUNT(DISTINCT cc.wallet_address) as unique_users,
    MAX(cc.clicked_at) as last_click
FROM contest_cta_clicks cc
JOIN contests c ON c.id = cc.contest_id
WHERE c.track_cta_clicks = true
GROUP BY c.id, c.name
ORDER BY total_clicks DESC;
```

## 📊 Features Implemented

### 1. **Dual Button System**
- CTA button for primary action (game/tool/external link)
- Submit Entry button for contest submissions
- Smart icons based on contest type

### 2. **CTA Configuration**
- Customizable button text
- Internal/external link support
- New tab option for external links
- Click tracking analytics

### 3. **Voting System**
- Enable/disable voting per contest
- Set voting period (start/end dates)
- Single vote per wallet
- Real-time vote counting

### 4. **Admin Features**
- Create contests with CTA configuration
- Edit existing contests
- View analytics dashboard
- Manage submissions and winners

## 🎯 Contest Types & Default CTAs

| Contest Type | Default Button Text | CTA Type |
|-------------|-------------------|----------|
| game_score | Play Game | game |
| creative | Create Entry | tool |
| onboarding | View Tasks | internal |
| tiered | Start Contest | internal |

## 🔧 API Endpoints

### Track CTA Clicks
```javascript
POST /api/contests/track-cta
{
  "contestId": "uuid",
  "walletAddress": "0x..." // optional
}
```

### Update Contest
```javascript
PUT /api/admin/contests/update
{
  "contestId": "uuid",
  "updates": {
    "cta_url": "/new-game",
    "cta_button_text": "Play Now"
  }
}
```

### Cast Vote
```javascript
POST /api/contests/vote
{
  "contestId": "uuid",
  "submissionId": "uuid",
  "walletAddress": "0x..."
}
```

## 🎨 Component Usage

### ContestActionButtons

```jsx
import ContestActionButtons from '@/components/contests/ContestActionButtons';

<ContestActionButtons
  contest={contest}
  contestId={contestId}
  variant="default" // or "compact" | "stacked"
  showIcons={true}
  onCtaClick={() => console.log('CTA clicked')}
/>
```

### Variants:
- **default**: Side-by-side buttons
- **compact**: Smaller buttons for cards
- **stacked**: Vertical layout for mobile

## 📈 Analytics Queries

### Top Performing CTAs
```sql
SELECT
    c.name,
    c.cta_button_text,
    COUNT(cc.id) as clicks,
    COUNT(DISTINCT cc.wallet_address) as unique_clickers
FROM contests c
LEFT JOIN contest_cta_clicks cc ON c.id = cc.contest_id
WHERE c.track_cta_clicks = true
GROUP BY c.id
ORDER BY clicks DESC
LIMIT 10;
```

### Conversion Rate
```sql
SELECT
    c.name,
    COUNT(DISTINCT cc.wallet_address) as cta_clicks,
    COUNT(DISTINCT cs.wallet_address) as submissions,
    ROUND(
        COUNT(DISTINCT cs.wallet_address)::numeric /
        NULLIF(COUNT(DISTINCT cc.wallet_address), 0) * 100,
        2
    ) as conversion_rate
FROM contests c
LEFT JOIN contest_cta_clicks cc ON c.id = cc.contest_id
LEFT JOIN contest_submissions cs ON c.id = cs.contest_id
GROUP BY c.id
ORDER BY conversion_rate DESC;
```

## 🚨 Troubleshooting

### Issue: Buttons not appearing
- Check that contest has `cta_url` set
- Verify contest status is "active"
- Check console for errors

### Issue: Clicks not tracking
- Ensure `track_cta_clicks` is enabled for the contest
- Check network tab for `/api/contests/track-cta` requests
- Verify `contest_cta_clicks` table exists in database

### Issue: Voting not working
- Check `voting_enabled` is true for the contest
- Verify current date is within voting period
- Ensure user hasn't already voted (one vote per wallet)

## 🎉 Next Steps

1. **Create Contest Templates** - Pre-configured contests for common use cases
2. **Email Notifications** - Notify participants of contest updates
3. **Advanced Analytics** - Detailed conversion funnels and user journeys
4. **Automated Winners** - Auto-select winners based on voting results
5. **Recurring Contests** - Automatically create new rounds of contests

## 📝 Notes

- Always test in development before production deployment
- Keep `is_test: true` for test contests to filter them out
- Monitor error logs in Supabase for any issues
- Regular backups recommended before major updates

---

For questions or issues, check the codebase or create an issue in the repository.