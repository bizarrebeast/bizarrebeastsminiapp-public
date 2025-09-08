# BizarreBeasts Miniapp - Complete Development Gameplan

## 🎯 **Executive Summary**
A Progressive Web App (PWA) serving as both a web application and Farcaster miniapp, replacing bizarrebeasts.win with expanded features, meme generation capabilities, and community engagement tools.

## 🏗️ **Technical Architecture**

### **Core Stack**
- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS with custom BizarreBeasts theme
- **State Management:** Zustand (lightweight, performant)
- **Database:** Supabase (PostgreSQL with real-time features)
- **Authentication:** Farcaster SDK (primary) + optional wallet connection
- **Canvas:** Fabric.js for meme generator
- **Analytics:** PostHog + Vercel Analytics
- **Hosting:** Vercel (auto-scaling, edge network)
- **Domain:** app.bizarrebeasts.io

### **Architecture Overview**
```
┌─────────────────────────────────────────┐
│          Frontend (Next.js)             │
├─────────────────────────────────────────┤
│     Authentication (Farcaster SDK)      │
├─────────────────────────────────────────┤
│         Canvas Engine (Fabric.js)       │
├─────────────────────────────────────────┤
│      API Routes (Next.js Serverless)    │
├─────────────────────────────────────────┤
│     Database (Supabase PostgreSQL)      │
├─────────────────────────────────────────┤
│    CDN & Storage (Vercel Edge Network)  │
└─────────────────────────────────────────┘
```

## 📱 **Application Structure**

### **Navigation Hierarchy**
```
App Root
├── 🏠 Home/Dashboard
│   ├── Token Info Widget
│   ├── Community Stats
│   ├── Contest Banner
│   └── Quick Actions
├── 🎨 Meme Generator
│   ├── Collection Selector
│   ├── Canvas Workspace
│   ├── Sticker Gallery
│   └── Export Options
├── 🎮 Games Hub
│   ├── Treasure Quest
│   ├── Bizarre Munchies
│   └── Platform Links
├── 🏆 Leaderboard
│   ├── Search User
│   ├── Rankings Display
│   └── Stats Dashboard
├── 📝 Blog Roll
│   └── Paragraph.com Embed
├── 📚 Resources
│   ├── Token Directory
│   ├── Documentation
│   └── External Links
└── ⚙️ Settings
    ├── User Preferences
    ├── Wallet Connection
    └── Notification Settings
```

### **File Structure**
```
/bizarrebeastsminiapp
├── /public
│   ├── /stickers
│   │   ├── /bizarrebeasts      # Main collection
│   │   ├── /treasure-quest     # Game sprites
│   │   └── /vibecards          # Character collection
│   ├── /backgrounds
│   ├── /fonts
│   └── farcaster.json
├── /src
│   ├── /app                    # Next.js app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── /meme-generator
│   │   ├── /games
│   │   ├── /leaderboard
│   │   └── /api
│   ├── /components
│   │   ├── /canvas
│   │   ├── /navigation
│   │   ├── /shared
│   │   └── /ui
│   ├── /hooks
│   ├── /lib
│   ├── /store
│   ├── /types
│   └── /utils
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 🚀 **Phase 1: MVP Features** (Weeks 1-4)

### **1.1 Foundation Setup**
```typescript
// Core dependencies
{
  "dependencies": {
    "next": "^14.0.0",
    "@farcaster/auth-kit": "latest",
    "fabric": "^5.3.0",
    "zustand": "^4.4.0",
    "@supabase/supabase-js": "^2.0.0",
    "posthog-js": "^1.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### **1.2 Database Schema**
```sql
-- Users table (minimal data)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farcaster_fid INTEGER UNIQUE NOT NULL,
  wallet_address VARCHAR(42),
  username VARCHAR(255),
  preferred_collection VARCHAR(50),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Contest system
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rules JSONB,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  prizes JSONB,
  active BOOLEAN DEFAULT false,
  featured_collection VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_fid INTEGER,
  properties JSONB,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_fid ON users(farcaster_fid);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

### **1.3 Authentication Flow**
```typescript
interface AuthState {
  isAuthenticated: boolean;
  fid?: number;
  username?: string;
  walletAddress?: string;
  profileImage?: string;
}

// Farcaster authentication handler
const authenticateUser = async () => {
  const authResult = await farcasterAuth.authenticate();
  if (authResult.fid) {
    // Store in Zustand
    useAuthStore.setState({
      isAuthenticated: true,
      fid: authResult.fid,
      username: authResult.username
    });
    // Sync with Supabase
    await syncUserToDatabase(authResult);
  }
};
```

### **1.4 Meme Generator Core**
```typescript
interface MemeCanvas {
  width: 1200;
  height: 1200;
  exportSize: 800;
  maxStickers: 20;
  maxFileSize: 2097152; // 2MB
}

interface CanvasElement {
  id: string;
  type: 'sticker' | 'text' | 'background';
  src?: string;
  text?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  locked: boolean;
}

interface TextOptions {
  font: 'Impact' | 'Arial' | 'Comic Sans';
  size: number;
  color: string;
  stroke: string;
  strokeWidth: number;
  position: 'top' | 'bottom' | 'custom';
}
```

## 🎨 **Phase 1: Core Features Detail**

### **Meme Generator Specifications**

#### **Canvas Features**
- **Base Resolution:** 1200x1200px (high quality editing)
- **Export Resolution:** 800x800px (optimized for social)
- **Background Options:**
  - Solid colors (color picker)
  - Uploaded images (max 2MB)
  - Transparent
  - Collection-specific backgrounds

#### **Sticker System**
```typescript
interface StickerCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  stickers: Sticker[];
  isTokenGated: boolean;
  requiredTokenAmount?: number;
  sortOrder: number;
  tags: string[];
}

interface Sticker {
  id: string;
  src: string;
  thumbnail: string;
  name: string;
  tags: string[];
  category: string;
  collection: string;
}
```

#### **Text Overlay**
- Top/bottom positioning (meme style)
- Custom positioning with drag
- Font options: Impact (default), Arial, Comic Sans
- Outline/stroke for visibility
- Size adjustment (24px - 200px)
- Color picker with presets

#### **Export & Sharing**
```typescript
interface ExportOptions {
  format: 'png' | 'jpg';
  quality: 0.92;
  watermark: {
    enabled: true;
    text: 'BizarreBeasts.io';
    position: 'bottom-right';
    opacity: 0.7;
  };
  shareToFarcaster: boolean;
  downloadToDevice: boolean;
}

// Farcaster sharing
const shareToFarcaster = async (imageBlob: Blob) => {
  const cast = {
    text: "Check out my new meme! Created with @bizarrebeasts",
    embeds: [await uploadToIPFS(imageBlob)]
  };
  await farcasterClient.publishCast(cast);
};
```

### **Contest System**
```typescript
interface Contest {
  id: string;
  name: string;
  description: string;
  rules: string[];
  startDate: Date;
  endDate: Date;
  prizes: {
    place: number;
    reward: string;
    description: string;
  }[];
  submissionCount: number;
  featured: boolean;
  votingEnabled: boolean;
}

// Contest participation tracking
interface ContestEntry {
  contestId: string;
  userId: string;
  memeData: string; // Base64 or IPFS hash
  votes: number;
  submittedAt: Date;
}
```

## 📊 **Analytics & Monitoring**

### **Event Tracking**
```typescript
// Core events to track
enum AnalyticsEvent {
  // User journey
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  WALLET_CONNECTED = 'wallet_connected',
  
  // Meme generator
  MEME_STARTED = 'meme_started',
  STICKER_ADDED = 'sticker_added',
  TEXT_ADDED = 'text_added',
  MEME_EXPORTED = 'meme_exported',
  MEME_SHARED = 'meme_shared',
  
  // Engagement
  COLLECTION_SELECTED = 'collection_selected',
  CONTEST_ENTERED = 'contest_entered',
  GAME_CLICKED = 'game_clicked',
  
  // Performance
  PAGE_LOAD = 'page_load',
  ERROR_OCCURRED = 'error_occurred'
}

// Track with metadata
const trackEvent = (event: AnalyticsEvent, properties?: any) => {
  posthog.capture(event, {
    ...properties,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    userFid: getUserFid()
  });
};
```

### **Performance Monitoring**
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const vitalsHandler = (metric: any) => {
  trackEvent(AnalyticsEvent.PAGE_LOAD, {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating
  });
};

getCLS(vitalsHandler);
getFID(vitalsHandler);
getFCP(vitalsHandler);
getLCP(vitalsHandler);
getTTFB(vitalsHandler);
```

## 🔒 **Security & Performance**

### **Security Headers**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' *.supabase.co *.posthog.com;
    `.replace(/\n/g, '')
  }
];
```

### **Rate Limiting**
```typescript
// Using upstash redis for rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

// API route protection
export async function middleware(request: Request) {
  const ip = request.headers.get("x-forwarded-for");
  const { success } = await ratelimit.limit(ip ?? "anonymous");
  
  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }
}
```

### **Image Optimization**
```typescript
// Automatic optimization with Next.js
import Image from 'next/image';

// Sticker component with lazy loading
const StickerImage = ({ src, alt }: Props) => (
  <Image
    src={src}
    alt={alt}
    width={200}
    height={200}
    loading="lazy"
    placeholder="blur"
    blurDataURL={generateBlurPlaceholder(src)}
  />
);
```

## 🚢 **Deployment Strategy**

### **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
FARCASTER_APP_FID=your_app_fid
FARCASTER_APP_KEY=your_app_key
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 **Success Metrics & KPIs**

### **Launch Week Goals**
- ✅ 100+ unique users
- ✅ 50+ memes created
- ✅ 5 minute average session time
- ✅ 0 critical bugs
- ✅ < 3 second page load time

### **Month 1 Targets**
- 🎯 1,000 unique users
- 🎯 500 memes created
- 🎯 20% return user rate
- 🎯 30% meme share rate
- 🎯 First contest with 50+ entries

### **Growth Metrics**
```typescript
interface GrowthMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  memeCreationRate: number; // memes per user
  shareRate: number; // shared/created ratio
  contestParticipation: number;
  avgSessionDuration: number; // minutes
  bounceRate: number; // percentage
  retentionRate: {
    day1: number;
    day7: number;
    day30: number;
  };
}
```

## 🗓️ **Development Timeline**

### **Week 1-2: Foundation** ✅ COMPLETED
- [x] Project setup with Next.js 14
- [x] Basic navigation and layout
- [x] Mobile responsive design
- [x] Tailwind CSS with custom gem color theme
- [x] Homepage with CTA buttons
- [x] Games and Leaderboard pages
- [ ] Farcaster authentication integration
- [ ] Supabase database setup

### **Week 3-4: Meme Generator** 🚧 IN PROGRESS
- [x] Canvas implementation with Fabric.js v6
- [x] Responsive canvas sizing
- [x] Sticker gallery with collections
- [x] Collection-specific background types
- [x] Text overlay system with controls
- [x] Export controls UI
- [x] Collapsible UI sections
- [ ] Actual sticker assets integration
- [ ] Background image uploads
- [ ] Export functionality implementation
- [ ] Farcaster sharing

### **Week 5: Integration & Polish**
- [ ] Contest system framework
- [ ] Analytics integration
- [ ] Performance optimization
- [ ] Error boundaries and recovery
- [ ] Beta testing with small group

### **Week 6: Launch Preparation**
- [ ] Final bug fixes
- [ ] Load testing
- [ ] Documentation
- [ ] Marketing materials
- [ ] Miniapp submission to Farcaster

## 💰 **Budget & Resources**

### **Monthly Costs**
| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month |
| PostHog | Free | $0 (up to 1M events) |
| Upstash | Pay-as-you-go | ~$5/month |
| Domain | Annual | $10/year |
| **Total** | | **~$50/month** |

### **Team Resources**
- Frontend Developer (primary)
- UI/UX Designer (as needed)
- Community Manager (contests)
- QA Tester (beta phase)

## 🚀 **Launch Strategy**

### **Soft Launch (Day 1-7)**
- Deploy to production
- Invite 20 beta testers
- Monitor analytics closely
- Fix critical issues
- Gather user feedback

### **Beta Launch (Week 2)**
- Open to 100 users
- Run first mini contest
- Social media announcement
- Collect feature requests
- Performance optimization

### **Public Launch (Week 3)**
- Full Farcaster announcement
- Submit as official miniapp
- Launch first major contest
- Influencer partnerships
- Press release

## 📋 **Phase 2: Future Enhancements**

### **Advanced Features**
- [ ] Token-gated premium collections
- [ ] User-generated sticker submissions
- [ ] Animation support (GIF stickers)
- [ ] Collaborative meme creation
- [ ] NFT minting for winning memes
- [ ] Advanced text effects
- [ ] AI-powered background removal
- [ ] Multi-language support

### **Platform Expansion**
- [ ] Native mobile apps (iOS/Android)
- [ ] Browser extension
- [ ] Discord bot integration
- [ ] Twitter/X integration
- [ ] Telegram miniapp

### **Monetization**
- [ ] Premium subscriptions ($BB holders discount)
- [ ] Sponsored sticker packs
- [ ] Contest entry fees
- [ ] Custom watermark removal
- [ ] API access for developers

## 🛡️ **Risk Mitigation**

### **Technical Risks**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Canvas performance issues | High | Implement virtual scrolling, image compression |
| API rate limits | Medium | Redis caching, request batching |
| Database overload | Medium | Connection pooling, query optimization |
| CDN costs | Low | Image optimization, lazy loading |

### **Business Risks**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low user adoption | High | Strong marketing, influencer partnerships |
| Content moderation | Medium | Community guidelines, reporting system |
| Competition | Medium | Unique features, fast iteration |
| Technical debt | Low | Regular refactoring, code reviews |

## 📝 **Legal & Compliance**

### **Terms of Service**
- User age requirement (13+)
- Content ownership and licensing
- Prohibited content guidelines
- Contest rules and eligibility
- Liability limitations

### **Privacy Policy**
- Data collection disclosure
- Third-party services (PostHog, Supabase)
- User rights (GDPR, CCPA)
- Cookie usage
- Data retention policies

### **Content Guidelines**
- No copyrighted material without permission
- No hate speech or harassment
- No explicit content
- Respect community standards
- Original content encouraged

## ✅ **Launch Checklist**

### **Technical**
- [ ] All core features working
- [ ] Mobile responsive design verified
- [ ] Load testing completed (100+ concurrent users)
- [ ] Security audit passed
- [ ] Analytics tracking verified
- [ ] Error monitoring active
- [ ] Backup systems in place

### **Content**
- [ ] 3+ sticker collections ready
- [ ] 20+ backgrounds available
- [ ] Tutorial/onboarding created
- [ ] Documentation complete
- [ ] Marketing materials prepared

### **Legal**
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Content guidelines defined
- [ ] Age verification implemented
- [ ] Copyright compliance verified

### **Marketing**
- [ ] Social media accounts ready
- [ ] Launch announcement drafted
- [ ] Influencer partnerships secured
- [ ] Contest prizes arranged
- [ ] Press kit prepared

## 🎯 **Success Definition**

### **Short Term (3 months)**
- 5,000+ registered users
- 2,000+ memes created
- 3 successful contests
- 4.5+ app store rating
- 25% monthly active users

### **Long Term (1 year)**
- 50,000+ registered users
- 20,000+ memes created
- Monthly contests with 500+ entries
- Revenue positive
- Expansion to other platforms

---

**Document Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Ready for Development  
**Repository:** github.com/bizarrebeast/bizarrebeastsminiapp

This gameplan provides a complete roadmap for building the BizarreBeasts Miniapp from conception to launch and beyond. The focus is on launching fast with core features while maintaining the ability to scale and add advanced functionality over time.