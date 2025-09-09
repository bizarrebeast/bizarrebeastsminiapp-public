# Farcaster Launch Checklist for BizarreBeasts Miniapp

## 📋 Documentation Review

### Current Documentation Status
✅ **README.md**: Comprehensive and up-to-date
- All features documented
- Technical stack clear
- Known issues listed
- Installation instructions present

### Updates Needed for README
1. ⚠️ Add Farcaster Frame configuration section
2. ⚠️ Update metadataBase URL warning (currently shows localhost)
3. ⚠️ Add production deployment URL
4. ⚠️ Document Frame testing process

## 🚀 Farcaster Frame Requirements

### 1. Frame Manifest File
**Status**: ✅ Created
**Location**: `public/.well-known/farcaster.json`

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjEyMzQ1LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4Li4uIn0",
    "payload": "eyJkb21haW4iOiJhcHAuYml6YXJyZWJlYXN0cy5pbyJ9",
    "signature": "0x..."
  },
  "frame": {
    "version": "1",
    "name": "BizarreBeasts Miniapp",
    "iconUrl": "https://app.bizarrebeasts.io/icon.png",
    "homeUrl": "https://app.bizarrebeasts.io",
    "imageUrl": "https://app.bizarrebeasts.io/og-image.png",
    "buttonTitle": "Launch App",
    "splashImageUrl": "https://app.bizarrebeasts.io/splash.png",
    "splashBackgroundColor": "#0A0A0A",
    "webhookUrl": "https://app.bizarrebeasts.io/api/frame/webhook"
  }
}
```

### 2. Frame Metadata Tags
**Status**: ⚠️ Partial - Missing Frame-specific tags
**Action Required**: Update `app/layout.tsx` metadata

```typescript
// Add to metadata export:
other: {
  'fc:frame': 'vNext',
  'fc:frame:image': 'https://app.bizarrebeasts.io/og-image.png',
  'fc:frame:button:1': 'Launch Meme Generator',
  'fc:frame:button:1:action': 'link',
  'fc:frame:button:1:target': 'https://app.bizarrebeasts.io/meme-generator',
  'fc:frame:button:2': 'View Games',
  'fc:frame:button:2:action': 'link',
  'fc:frame:button:2:target': 'https://app.bizarrebeasts.io/games',
  'fc:frame:button:3': 'Swap $BB',
  'fc:frame:button:3:action': 'link',
  'fc:frame:button:3:target': 'https://app.bizarrebeasts.io/swap',
}
```

### 3. Frame API Endpoints
**Status**: ❌ Not Created
**Action Required**: Create frame interaction endpoints

- `/api/frame` - Initial frame handler
- `/api/frame/action` - Button action handler
- `/api/frame/webhook` - Webhook handler for notifications

### 4. OG Image Assets
**Status**: ✅ All assets created and in place
**Assets Available**:
- `/public/farcaster-assets/og-image.png` (1200x630px)
- `/public/farcaster-assets/icon.png` (512x512px)
- `/public/farcaster-assets/splash.png` (200x200px)
- `/public/farcaster-assets/hero.png` (1200x630px)

## 🔧 Technical Requirements

### 1. Environment Configuration
```env
# Add to .env.local
NEXT_PUBLIC_APP_URL=https://app.bizarrebeasts.io
FARCASTER_HUB_URL=https://hub.farcaster.xyz
```

### 2. MetadataBase Fix
**Current Issue**: Warning about metadataBase not set
**Solution**: Add to `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://app.bizarrebeasts.io'),
  // ... rest of metadata
}
```

### 3. Mobile Responsiveness
✅ **Status**: Complete
- Swap page has mobile detection
- Responsive navigation
- All pages mobile-friendly

### 4. Performance Optimizations
✅ **Build Status**: Successful
- Bundle sizes optimized
- Static pages pre-rendered
- API routes dynamic

## 📝 Pre-Launch Testing Checklist

### Frame Testing Tools
1. **Warpcast Frame Validator**: https://warpcast.com/~/developers/frames
2. **Frame.js Debugger**: https://debugger.framesjs.org/
3. **Frog Devtools**: https://frog.fm/dev

### Testing Steps
- [ ] Deploy to production environment (app.bizarrebeasts.io)
- [x] Frame manifest created at `/.well-known/farcaster.json`
- [ ] Validate frame with Warpcast validator
- [ ] Test all frame buttons and actions
- [x] OG images created and ready
- [ ] Test sharing memes to Farcaster
- [x] Wallet connection flow working
- [x] Empire integration working
- [x] Mobile experience optimized

## 🚢 Deployment Steps

### 1. Vercel Deployment
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to staging
vercel --env preview

# Deploy to production
vercel --prod
```

### 2. Domain Configuration
- Point `app.bizarrebeasts.io` to Vercel
- Configure SSL certificate
- Set up environment variables in Vercel

### 3. Post-Deployment
- [ ] Submit frame to Farcaster directory
- [ ] Test frame in Warpcast
- [ ] Share in BizarreBeasts channel
- [ ] Monitor error logs
- [ ] Track usage analytics

## 🎯 Launch Action Items

### Immediate (Before Launch)
1. ✅ Frame manifest file created
2. ⚠️ Add frame metadata tags (optional for miniapp)
3. ✅ OG images created and verified
4. ⚠️ Fix metadataBase warning (needs production URL)
5. ⚠️ Create frame API endpoints (optional for miniapp)
6. Deploy to production and test with validators

### Nice to Have (Can be post-launch)
1. Add frame analytics
2. Implement frame-specific features
3. Create custom frame actions
4. Add notification webhooks
5. Implement composer actions

## 🔍 Current Blockers

1. **Production Deployment**: App needs to be deployed to app.bizarrebeasts.io
2. **MetadataBase**: Needs production URL (waiting on deployment)
3. **Domain Configuration**: Ensure app.bizarrebeasts.io is pointed to Vercel

## ✨ Ready Features

- ✅ Meme Generator with Empire gating
- ✅ Games Hub with 8 games
- ✅ Token Swap interface
- ✅ Music page
- ✅ Empire leaderboard
- ✅ Wallet connection
- ✅ Mobile responsiveness
- ✅ Production build passing

## 📊 Success Metrics

Track these after launch:
- Frame opens/clicks
- Meme generation count
- Share to Farcaster rate
- Wallet connection rate
- Feature usage by Empire tier
- User retention

## 🔗 Useful Resources

- [Farcaster Frames Spec](https://docs.farcaster.xyz/developers/frames/spec)
- [Frame Development Guide](https://docs.farcaster.xyz/developers/frames)
- [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)
- [Vercel Deployment](https://vercel.com/docs)

---

**Estimated Time to Launch**: 30 minutes - 1 hour
**Priority**: Deploy to production, configure domain, then submit to Farcaster