# BizarreBeasts Contest System - Complete Feature Documentation
**Last Updated**: January 17, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Features](#user-features)
3. [Admin Features](#admin-features)
4. [Technical Architecture](#technical-architecture)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Usage Guide](#usage-guide)

## 🎯 System Overview

The BizarreBeasts Contest System is a comprehensive Web3-native contest management platform that supports multiple contest types, token-gated entry, and automated winner selection.

### Contest Types Supported
- **Game Score Contests**: Competitive high-score challenges
- **Creative/Meme Contests**: Pass/fail creative submissions
- **Onboarding Tasks**: Complete tasks to win (all approved win)
- **Tiered Contests**: Different prize tiers based on $BB holdings

### Key Features
- 🔐 Token-gated entry using $BB balance
- 🏆 Automated and manual winner selection
- 📊 Advanced CSV export for prize distribution
- 🔄 Recurring contest support
- 🖼️ Image/screenshot submission via R2 storage
- 📱 Mobile-responsive design

## 👤 User Features

### Contest Listing Page (`/contests`)
- View active, upcoming, and ended contests
- See requirements ($BB tokens needed)
- Check participant counts
- Time remaining countdown
- Contest type indicators

### Contest Details Page (`/contests/[id]`)
- Full contest information
- Live leaderboard (approved entries only)
- Entry submission form
- Token balance verification
- Share functionality
- Winner announcements

### Submission Features
- Score input for game contests
- Image/screenshot upload (5MB max)
- Automatic token balance check
- Duplicate submission prevention
- Success confirmation for sharing

## 👨‍💼 Admin Features

### Admin Panel (`/admin/contests`)

#### Contest Management
- **Create Contests**: Full UI form with all options
- **Search & Filter**: Find contests by name, type, or status
- **Status Tracking**: 🟢 Active, 🔵 Upcoming, 🟡 Draft, 🔴 Ended
- **Recurring Contests**: Set daily/weekly/monthly recurrence
- **View All Contests**: Not limited to active ones

#### Submission Review
- View all submissions with thumbnails
- Approve/reject with notes
- Adjustable thumbnail sizes (small/medium/large)
- Full-screen image viewer
- Token balance display

#### Winner Selection System
- **Automatic Selection**:
  - Top N by score (competitive contests)
  - All approved (pass/fail contests)
- **Manual Override**: Toggle individual winners
- **Contest Type Aware**: Different logic for different types
- **Live Preview**: See selections before confirming

#### Data Export
- **Export Formats**:
  - All Submissions
  - Approved Only
  - Winners Only
- **CSV Fields**:
  - Rank/Position
  - Wallet Address
  - Username
  - Score
  - Token Balance
  - Submission Date/Time
  - Review Status
  - Reviewer Info
  - Notes
- **Smart Filenames**: `contestname_type_date.csv`

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.2, React 18, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Blockchain**: Base network for $BB token
- **Deployment**: Vercel
- **Styling**: TailwindCSS

### Key Libraries
```json
{
  "@supabase/supabase-js": "^2.39.1",
  "@aws-sdk/client-s3": "^3.511.0",
  "viem": "^2.21.58",
  "wagmi": "^2.13.10"
}
```

### Security Features
- Row-level security (RLS) on all tables
- Admin wallet authentication
- Rate limiting (5 submissions/min, 30 admin actions/min)
- Input validation and sanitization
- Secure file upload with type checking

## 📡 API Documentation

### Public Endpoints

#### Submit Contest Entry
```
POST /api/contests/submit
Content-Type: multipart/form-data

Fields:
- contestId: string
- walletAddress: string
- username?: string
- score?: number
- screenshot?: File
- metadata?: JSON
```

### Admin Endpoints (Requires Admin Wallet)

#### Create Contest
```
POST /api/admin/contests/create
Content-Type: application/json

Body:
{
  name: string
  type: 'game_score' | 'creative' | 'onboarding' | 'tiered'
  description?: string
  game_name?: string
  start_date: string
  end_date: string
  min_bb_required: number
  max_bb_required?: number
  prize_amount?: number
  prize_type: 'tokens' | 'nft' | 'both'
  status: 'draft' | 'active'
  rules?: string
  max_entries_per_wallet: number
  is_recurring?: boolean
  recurrence_interval?: 'daily' | 'weekly' | 'monthly'
}
```

#### Review Submission
```
POST /api/admin/submissions/review
Content-Type: application/json

Body:
{
  submissionId: string
  status: 'approved' | 'rejected'
  reviewerWallet: string
  notes?: string
}
```

## 💾 Database Schema

### Main Tables

#### contests
```sql
CREATE TABLE contests (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  game_name TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  min_bb_required NUMERIC DEFAULT 0,
  max_bb_required NUMERIC,
  prize_amount NUMERIC,
  prize_type TEXT DEFAULT 'tokens',
  nft_contract_address TEXT,
  status TEXT DEFAULT 'draft',
  rules TEXT,
  max_entries_per_wallet INTEGER DEFAULT 1,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT,
  created_by TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### contest_submissions
```sql
CREATE TABLE contest_submissions (
  id UUID PRIMARY KEY,
  contest_id UUID REFERENCES contests(id),
  wallet_address TEXT NOT NULL,
  username TEXT,
  score NUMERIC,
  screenshot_url TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'pending',
  token_balance NUMERIC,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by TEXT,
  reviewer_notes TEXT
);
```

#### contest_winners
```sql
CREATE TABLE contest_winners (
  id UUID PRIMARY KEY,
  contest_id UUID REFERENCES contests(id),
  submission_id UUID REFERENCES contest_submissions(id),
  wallet_address TEXT NOT NULL,
  position INTEGER,
  prize_amount NUMERIC,
  prize_distributed BOOLEAN DEFAULT false,
  distributed_at TIMESTAMP,
  transaction_hash TEXT,
  created_at TIMESTAMP
);
```

### Views

#### active_contests_view
Shows active contests with participant counts

#### contest_leaderboard
Live rankings of approved submissions

## 📖 Usage Guide

### For Contest Creators (Admin)

#### Creating a New Contest
1. Navigate to `/admin/contests`
2. Click "Create Contest" button
3. Fill in contest details:
   - Name and description
   - Contest type (game_score, creative, etc.)
   - Start and end dates
   - Token requirements
   - Prize information
   - Entry limits
4. Choose status (Active or Draft)
5. Enable recurring if needed
6. Submit form

#### Reviewing Submissions
1. Select contest from dropdown
2. View submissions in table
3. Click thumbnail for full image
4. Click Approve ✅ or Reject ❌
5. Add notes if rejecting

#### Selecting Winners
1. Click "Select Winners" button
2. Choose selection mode:
   - Auto: Top N by score
   - Manual: Pick individually
3. Review selections
4. Export winners to CSV
5. Distribute prizes offline

### For Participants

#### Entering a Contest
1. Go to `/contests`
2. Click on contest card
3. Check requirements
4. Fill submission form
5. Upload screenshot if required
6. Submit entry
7. Share on social media

#### Checking Results
1. Visit contest page
2. View leaderboard
3. Check winner announcements
4. Track your submissions

## 🚀 Deployment Guide

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=bizarrebeasts-contests
NEXT_PUBLIC_R2_PUBLIC_URL=your-public-url

# Contest Settings
NEXT_PUBLIC_CONTEST_FEATURE_ENABLED=true
NEXT_PUBLIC_CONTEST_ADMIN_WALLET=0x...

# Blockchain
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
```

### Deployment Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations in Supabase
5. Configure R2 bucket with CORS
6. Deploy to Vercel
7. Test all features

## 🔧 Maintenance

### Regular Tasks
- Monitor submission volume
- Review rejected submissions
- Export winner data
- Clear old contest data
- Monitor R2 storage usage

### Troubleshooting

#### Common Issues
1. **"Admin wallet not connected"**
   - Ensure wallet is connected
   - Check NEXT_PUBLIC_CONTEST_ADMIN_WALLET env var

2. **"Failed to upload image"**
   - Check R2 credentials
   - Verify CORS settings
   - Check file size (5MB limit)

3. **"Contest not showing in dropdown"**
   - Refresh page
   - Check contest status in database
   - Verify dates are correct

## 📈 Future Enhancements

### Planned Features
1. **Contest Templates**: Save and reuse contest configurations
2. **Automated Prize Distribution**: On-chain prize sending
3. **Analytics Dashboard**: Contest performance metrics
4. **Social Integration**: Farcaster frames, Twitter cards
5. **Notification System**: Email/wallet notifications
6. **Multi-chain Support**: Expand beyond Base network

### API Improvements
1. GraphQL endpoint for complex queries
2. Webhook support for integrations
3. Batch operations for efficiency
4. Real-time updates via WebSockets

## 📞 Support

For issues or questions:
- GitHub Issues: [Report bugs](https://github.com/bizarrebeasts/miniapp/issues)
- Admin Contact: Check with project maintainer
- Documentation: This file and CONTEST_PROGRESS_REPORT.md

---

**Built with 💎 by BizarreBeasts Team**
*Contest System v1.0.0 - Production Ready*