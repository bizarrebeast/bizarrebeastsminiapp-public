# BizarreBeasts Admin Panel Specification

## Overview
The BizarreBeasts miniapp requires a comprehensive admin panel to manage the check-in system, monitor contracts, track user engagement, and handle various administrative tasks.

## Access Control
- **Authentication**: Admin wallet addresses only (using wallet connection)
- **Admin Addresses**: Configured in environment variables
- **Route Protection**: `/admin/*` routes protected by wallet authentication

## Core Admin Features

### 1. Check-In System Management

#### Dashboard Overview
- **Contract Status**
  - Current BB token balance in check-in contract
  - Total rewards distributed (all-time)
  - Pending rewards (unclaimed)
  - Contract pause status
  - Last funding date and amount

- **User Statistics**
  - Total users unlocked for check-ins
  - Active users (checked in last 7 days)
  - Average streak length
  - Distribution by Empire tier
  - Top streakers leaderboard

- **Real-time Metrics**
  - Check-ins today
  - Check-ins this week
  - Rewards distributed today
  - Current active streaks

#### Contract Management
- **Funding Interface**
  - Current BB balance display
  - Fund contract with BB tokens
  - Withdrawal interface (emergency)
  - Transaction history

- **User Management**
  - Search users by address
  - View individual user stats:
    - Current streak
    - Last check-in
    - Total check-ins
    - Pending rewards
    - Empire tier
  - Unlock check-in for specific users
  - Reset user data (testing)

- **Reward Configuration**
  - Update tier rewards (if contract allows)
  - View current reward structure
  - Projected monthly costs per tier

### 2. Ritual System Management

#### Ritual Analytics
- **Completion Tracking**
  - Total ritual completions by type
  - Most/least popular rituals
  - Average rituals per user
  - Completion trends over time

#### Ritual Configuration
- **Manage Rituals**
  - Enable/disable rituals
  - Update ritual requirements
  - Add new rituals
  - Set ritual rewards/points

### 3. Empire Integration

#### Empire Analytics
- **Tier Distribution**
  - Users per tier
  - Tier migration (upgrades/downgrades)
  - Average holdings per tier
  - Empire score trends

#### Leaderboard Management
- **Cache Management**
  - Force refresh Empire data
  - View cache status
  - Clear stale data

### 4. Content Management

#### Meme Generator
- **Template Management**
  - Upload new templates
  - Enable/disable templates
  - Set tier requirements
  - View usage statistics

#### Asset Management
- **Media Library**
  - Upload images/videos
  - Organize by category
  - Set access tiers
  - Usage tracking

### 5. Analytics & Reporting

#### User Engagement
- **Activity Metrics**
  - Daily/Weekly/Monthly active users
  - Feature usage breakdown
  - User retention rates
  - Engagement by Empire tier

#### Financial Reports
- **Token Economics**
  - BB tokens distributed
  - Distribution by tier
  - Reward efficiency
  - Projected costs

#### Export Capabilities
- Export user data (CSV)
- Export financial reports
- Export analytics data

### 6. System Administration

#### Configuration
- **Environment Settings**
  - Contract addresses
  - RPC endpoints
  - API keys management
  - Feature flags

#### Monitoring
- **System Health**
  - API response times
  - Error rates
  - Contract gas usage
  - Rate limit status

#### Maintenance
- **Bulk Operations**
  - Batch unlock users
  - Mass notifications
  - Data cleanup tools

## Technical Implementation

### Frontend Components Needed
```
/app/admin/
├── layout.tsx              # Admin layout with auth
├── page.tsx               # Dashboard overview
├── checkin/
│   ├── page.tsx          # Check-in management
│   ├── users/page.tsx    # User management
│   └── funding/page.tsx  # Contract funding
├── rituals/
│   └── page.tsx          # Ritual management
├── empire/
│   └── page.tsx          # Empire analytics
├── content/
│   ├── memes/page.tsx    # Meme templates
│   └── assets/page.tsx   # Asset management
├── analytics/
│   └── page.tsx          # Analytics dashboard
└── settings/
    └── page.tsx          # System settings
```

### API Routes Needed
```
/api/admin/
├── auth/route.ts          # Admin authentication
├── stats/route.ts         # Dashboard statistics
├── checkin/
│   ├── fund/route.ts     # Fund contract
│   ├── users/route.ts    # User management
│   └── unlock/route.ts   # Unlock users
├── rituals/
│   └── manage/route.ts   # Ritual CRUD
├── analytics/
│   └── export/route.ts   # Data export
└── config/route.ts        # System config
```

### Smart Contract Functions Needed
- `getContractBalance()` - Check BB balance
- `getTotalDistributed()` - Total rewards paid
- `getUserCount()` - Total users
- `getActiveUsers(days)` - Active user count
- `emergencyWithdraw()` - Emergency withdrawal
- `pause()/unpause()` - Contract pause
- `updateRewards()` - Update tier rewards
- `batchUnlock()` - Unlock multiple users

### Database/Storage Requirements
- **Admin Activity Logs**
  - Action performed
  - Admin address
  - Timestamp
  - Details

- **Analytics Data**
  - Time-series metrics
  - Aggregated statistics
  - Historical snapshots

- **Configuration Store**
  - Feature flags
  - System settings
  - Cached data

## Security Considerations

### Access Control
- Wallet-based authentication only
- Admin addresses whitelist
- Session management
- Activity logging

### Contract Security
- Multi-sig for critical operations
- Rate limiting on admin functions
- Emergency pause capability
- Audit trail for all transactions

### Data Protection
- Sensitive data encryption
- API rate limiting
- CORS configuration
- Input validation

## UI/UX Guidelines

### Design Principles
- Dark theme consistent with main app
- Gem color scheme (gold, pink, blue, crystal)
- Clear data visualization
- Mobile-responsive design

### Key Components
- **Stat Cards**: Real-time metrics display
- **Charts**: Line, bar, pie charts for analytics
- **Tables**: Sortable, filterable data tables
- **Action Buttons**: Clear CTAs for admin actions
- **Status Indicators**: Health/status badges

## Implementation Priority

### Phase 1 (Critical)
1. Admin authentication
2. Check-in dashboard
3. Contract funding interface
4. User search and stats

### Phase 2 (Important)
1. Analytics dashboard
2. Ritual management
3. Bulk operations
4. Export capabilities

### Phase 3 (Nice to Have)
1. Advanced analytics
2. Automated reports
3. Notification system
4. A/B testing tools

## Monitoring & Alerts

### Key Metrics to Monitor
- Contract BB balance < threshold
- Unusual check-in patterns
- High pending rewards
- Error rates spike
- Gas price alerts

### Alert Channels
- Email notifications
- Discord webhooks
- Dashboard warnings
- Transaction logs

## Maintenance Tasks

### Daily
- Review check-in activity
- Monitor contract balance
- Check error logs

### Weekly
- Review user engagement metrics
- Analyze reward distribution
- Check system health

### Monthly
- Export analytics reports
- Review tier distribution
- Plan contract funding
- Audit admin actions

## Success Metrics

### System Health
- 99.9% uptime
- < 500ms response time
- Zero critical errors
- Sufficient contract funding

### User Engagement
- 50%+ daily active users
- 70%+ streak retention
- Even tier distribution
- High ritual completion

### Financial Efficiency
- Predictable reward costs
- Optimal BB distribution
- Low gas costs
- Minimal unclaimed rewards

## Future Enhancements

### Automation
- Auto-funding when low balance
- Scheduled reports
- Automated user notifications
- Smart reward adjustments

### Advanced Features
- Predictive analytics
- User segmentation
- Cohort analysis
- Revenue projections

### Integrations
- Farcaster notifications
- Discord bot commands
- Treasury management
- DAO governance tools