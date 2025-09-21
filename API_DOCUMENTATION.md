# 🔗 BizarreBeasts Miniapp API Documentation

**Last Updated**: December 2024
**API Version**: 1.0

This document covers all API endpoints in the BizarreBeasts Miniapp, including the unified authentication system, contest management, and admin operations.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Unified Auth Endpoints](#unified-auth-endpoints)
3. [Contest System Endpoints](#contest-system-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Empire Integration](#empire-integration)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

## 🔐 Authentication

The API uses a hybrid authentication system combining:
- **Wallet Signatures**: For wallet-based operations
- **Farcaster Auth**: For social features
- **Session Tokens**: For persistent authentication
- **Service Role**: For admin operations bypassing RLS

### Authentication Headers

```typescript
// For authenticated requests
headers: {
  'Authorization': 'Bearer <session_token>',
  'Content-Type': 'application/json'
}

// For admin operations (server-side only)
headers: {
  'Authorization': 'Bearer <service_role_key>',
  'Content-Type': 'application/json'
}
```

## 🔐 Unified Auth Endpoints

### Link Identities

**POST** `/api/auth/link`

Links wallet and Farcaster identities for a user.

#### Request Body
```typescript
{
  walletAddress?: string;      // Ethereum wallet address
  farcasterData?: {
    fid: number;              // Farcaster ID
    username: string;         // Farcaster username
    displayName: string;      // Display name
    pfpUrl?: string;          // Profile picture URL
    bio?: string;             // User bio
    verifiedAddresses: string[]; // Verified wallet addresses
  };
  signature?: string;         // Wallet signature for verification
  message?: string;           // Signed message
}
```

#### Response
```typescript
{
  success: boolean;
  user: {
    id: string;
    walletAddress?: string;
    farcasterFid?: number;
    farcasterUsername?: string;
    identitiesLinked: boolean;
    primaryIdentity: 'wallet' | 'farcaster' | null;
    createdAt: string;
    updatedAt: string;
  };
  session?: {
    token: string;
    expiresAt: string;
  };
}
```

#### Examples

```typescript
// Link wallet only
const response = await fetch('/api/auth/link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9B',
    signature: '0x...',
    message: 'Sign in to BizarreBeasts Miniapp'
  })
});

// Link Farcaster only
const response = await fetch('/api/auth/link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    farcasterData: {
      fid: 12345,
      username: 'bizarrebeast',
      displayName: 'Bizarre Beast',
      verifiedAddresses: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9B']
    }
  })
});
```

### Get Link Status

**GET** `/api/auth/link?walletAddress=<address>&fid=<fid>`

Checks if identities can be linked or are already linked.

#### Query Parameters
- `walletAddress` (optional): Wallet address to check
- `fid` (optional): Farcaster ID to check

#### Response
```typescript
{
  canLink: boolean;
  reason?: string;
  existingUser?: {
    id: string;
    identitiesLinked: boolean;
    walletAddress?: string;
    farcasterFid?: number;
  };
}
```

### Get User Profile

**GET** `/api/auth/profile`

Retrieves the unified user profile for the authenticated user.

#### Headers
```typescript
{
  'Authorization': 'Bearer <session_token>'
}
```

#### Response
```typescript
{
  user: {
    id: string;
    walletAddress?: string;
    walletEns?: string;
    farcasterFid?: number;
    farcasterUsername?: string;
    farcasterDisplayName?: string;
    farcasterPfpUrl?: string;
    farcasterBio?: string;
    verifiedAddresses: string[];
    identitiesLinked: boolean;
    primaryIdentity: 'wallet' | 'farcaster' | null;

    // Empire protocol data (cached)
    empireTier?: string;
    empireRank?: number;
    empireScore?: string;
    empireDataUpdatedAt?: string;

    // Metadata
    preferences: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
  };
}
```

### Update Profile

**PATCH** `/api/auth/profile`

Updates user preferences and metadata.

#### Request Body
```typescript
{
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
  primaryIdentity?: 'wallet' | 'farcaster';
}
```

#### Response
```typescript
{
  success: boolean;
  user: UpdatedUserProfile;
}
```

### Delete Profile

**DELETE** `/api/auth/profile`

Unlinks identities and optionally deletes user data.

#### Request Body
```typescript
{
  unlinkOnly?: boolean;    // If true, unlink but don't delete data
  deleteData?: boolean;    // If true, permanently delete all user data
}
```

#### Response
```typescript
{
  success: boolean;
  message: string;
}
```

## 🏆 Contest System Endpoints

### Get Contests

**GET** `/api/contests?status=<status>&type=<type>&page=<page>&limit=<limit>`

Retrieves list of contests with optional filtering.

#### Query Parameters
- `status` (optional): `active`, `upcoming`, `ended`, `draft`
- `type` (optional): `game_score`, `creative`, `onboarding`, `tiered`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### Response
```typescript
{
  contests: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    ctaUrl?: string;
    ctaButtonText?: string;
    trackCtaClicks: boolean;
    votingEnabled: boolean;
    votingStartDate?: string;
    votingEndDate?: string;
    bannerImage?: string;
    prizeDescription?: string;
    rules: string;
    submissionCount: number;
    clickCount: number;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Get Contest Details

**GET** `/api/contests/[id]`

Retrieves detailed information about a specific contest.

#### Response
```typescript
{
  contest: {
    // Full contest details
    id: string;
    name: string;
    description: string;
    type: string;
    status: string;
    // ... all contest fields

    submissions?: Array<{
      id: string;
      userId: string;
      userWallet?: string;
      userFarcasterUsername?: string;
      content: string;
      imageUrl?: string;
      submittedAt: string;
      voteCount?: number;
      hasUserVoted?: boolean;
    }>;

    userSubmission?: {
      id: string;
      content: string;
      imageUrl?: string;
      submittedAt: string;
    };

    analytics?: {
      totalClicks: number;
      uniqueClickers: number;
      conversionRate: number;
    };
  };
}
```

### Submit Contest Entry

**POST** `/api/contests/[id]/submit`

Submits an entry to a contest.

#### Request Body
```typescript
{
  content: string;           // Entry content/description
  imageUrl?: string;         // Optional image URL
  walletAddress: string;     // User's wallet address
  farcasterUsername?: string; // User's Farcaster username
  farcasterFid?: number;     // User's Farcaster FID
}
```

#### Response
```typescript
{
  success: boolean;
  submission: {
    id: string;
    contestId: string;
    userId: string;
    content: string;
    imageUrl?: string;
    submittedAt: string;
  };
}
```

### Track CTA Click

**POST** `/api/contests/track-cta`

Tracks clicks on contest CTA buttons for analytics.

#### Request Body
```typescript
{
  contestId: string;
  walletAddress?: string;    // Optional for anonymous tracking
}
```

#### Response
```typescript
{
  success: boolean;
  clickId: string;
}
```

### Vote on Submission

**POST** `/api/contests/vote`

Casts a vote for a contest submission.

#### Request Body
```typescript
{
  contestId: string;
  submissionId: string;
  walletAddress: string;     // Voter's wallet address
}
```

#### Response
```typescript
{
  success: boolean;
  vote: {
    id: string;
    submissionId: string;
    voterWallet: string;
    votedAt: string;
  };
  newVoteCount: number;
}
```

## 👨‍💼 Admin Endpoints

All admin endpoints require authentication with admin wallet or service role.

### Create Contest

**POST** `/api/admin/contests/create`

Creates a new contest.

#### Headers
```typescript
{
  'Authorization': 'Bearer <service_role_key>',
  'x-admin-wallet': '<admin_wallet_address>'
}
```

#### Request Body
```typescript
{
  name: string;
  description: string;
  type: 'game_score' | 'creative' | 'onboarding' | 'tiered';
  status: 'draft' | 'active' | 'upcoming' | 'ended';
  startDate: string;         // ISO date string
  endDate: string;           // ISO date string
  ctaUrl?: string;
  ctaButtonText?: string;
  ctaLinkType?: 'internal' | 'external' | 'game' | 'tool';
  ctaOpenInNewTab?: boolean;
  trackCtaClicks?: boolean;
  votingEnabled?: boolean;
  votingStartDate?: string;
  votingEndDate?: string;
  bannerImage?: string;
  prizeDescription?: string;
  rules: string;
  maxSubmissions?: number;
  requiresApproval?: boolean;
  isRecurring?: boolean;
  recurringInterval?: string;
  isTest?: boolean;
}
```

#### Response
```typescript
{
  success: boolean;
  contest: CreatedContest;
}
```

### Update Contest

**PUT** `/api/admin/contests/update`

Updates an existing contest.

#### Request Body
```typescript
{
  contestId: string;
  updates: Partial<ContestData>;
}
```

### Delete Contest

**DELETE** `/api/admin/contests/[id]`

Deletes a contest and all associated data.

#### Response
```typescript
{
  success: boolean;
  message: string;
}
```

### Get Contest Analytics

**GET** `/api/admin/contests/[id]/analytics`

Retrieves detailed analytics for a contest.

#### Response
```typescript
{
  analytics: {
    overview: {
      totalClicks: number;
      uniqueClickers: number;
      totalSubmissions: number;
      totalVotes: number;
      conversionRate: number;
    };
    clicksOverTime: Array<{
      date: string;
      clicks: number;
      uniqueUsers: number;
    }>;
    submissionsOverTime: Array<{
      date: string;
      submissions: number;
    }>;
    topPerformingCTAs: Array<{
      buttonText: string;
      clicks: number;
      conversionRate: number;
    }>;
  };
}
```

## 🏰 Empire Integration

### Get Empire Data

**GET** `/api/empire/user?address=<wallet_address>`

Retrieves Empire protocol data for a user.

#### Query Parameters
- `address`: Wallet address to lookup

#### Response
```typescript
{
  user: {
    address: string;
    tier: string;
    rank: number;
    score: string;
    multipliers: Array<{
      type: string;
      value: number;
      description: string;
    }>;
    lastUpdated: string;
  };
}
```

## ⚠️ Error Handling

All endpoints follow consistent error response format:

```typescript
{
  error: {
    code: string;              // Error code (e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR')
    message: string;           // Human-readable error message
    details?: any;             // Additional error details
    timestamp: string;         // ISO timestamp
  };
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `DATABASE_ERROR` (500): Database operation failed
- `EXTERNAL_API_ERROR` (502): External service error

## 🚦 Rate Limiting

API endpoints are rate limited to prevent abuse:

### Limits by Endpoint Type

- **Authentication**: 10 requests/minute per IP
- **Contest Viewing**: 100 requests/minute per IP
- **Contest Submission**: 5 requests/minute per wallet
- **Voting**: 10 requests/minute per wallet
- **Admin Operations**: 50 requests/minute per admin wallet

### Rate Limit Headers

```typescript
{
  'X-RateLimit-Limit': '100',      // Request limit
  'X-RateLimit-Remaining': '87',   // Remaining requests
  'X-RateLimit-Reset': '1640995200' // Reset timestamp
}
```

### Rate Limit Response

When rate limited:
```typescript
{
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Try again later.',
    retryAfter: 60  // Seconds until reset
  }
}
```

## 📝 SDK/Client Libraries

### TypeScript Client

```typescript
import { BizarreBeastsAPI } from '@/lib/api-client';

const api = new BizarreBeastsAPI({
  baseUrl: 'https://bbapp.bizarrebeasts.io',
  sessionToken: 'your-session-token'
});

// Link identities
const user = await api.auth.link({
  walletAddress: '0x...',
  farcasterData: { ... }
});

// Get contests
const contests = await api.contests.list({
  status: 'active',
  type: 'creative'
});

// Submit entry
const submission = await api.contests.submit('contest-id', {
  content: 'My amazing entry',
  imageUrl: 'https://...'
});
```

## 🔍 Testing

### Example Test Requests

```bash
# Test authentication
curl -X POST https://bbapp.bizarrebeasts.io/api/auth/link \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9B"}'

# Test contest listing
curl -X GET https://bbapp.bizarrebeasts.io/api/contests?status=active

# Test admin endpoint (requires auth)
curl -X GET https://bbapp.bizarrebeasts.io/api/admin/contests \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-admin-wallet: YOUR_ADMIN_WALLET"
```

---

## 📞 Support

For API questions:
1. Check this documentation first
2. Review error messages and codes
3. Test in development environment
4. Create GitHub issue with API call details

**Remember**: Always use HTTPS in production, validate input data, handle errors gracefully, and respect rate limits.

---

*This API documentation covers all endpoints in the BizarreBeasts Miniapp with comprehensive examples and error handling guidelines.*