# 🚀 BizarreBeasts Sharing Implementation Guide

> **IMPORTANT:** This document describes the sharing architecture for the BizarreBeasts app.
> Always refer to this guide when working with sharing features.

## 📍 Production URL
**Always use:** `https://bbapp.bizarrebeasts.io`
- ❌ Never use: `app.bizarrebeasts.io` or `bizarrebeastsminiapp.vercel.app`

## 🏗️ Architecture Overview

### Two Sharing Systems

1. **`ultimateShare` (Native Farcaster SDK)**
   - Location: `/lib/sdk-ultimate.ts`
   - Purpose: Native sharing within Farcaster miniapp
   - Features: Mobile detection, SDK integration
   - Used by: Direct sharing buttons, ShareButtons component (when in miniapp)

2. **`ShareButtons` Component (Multi-platform)**
   - Location: `/components/ShareButtons.tsx`
   - Purpose: Unified sharing interface for all platforms
   - Platforms: Farcaster, X/Twitter, Telegram
   - Smart behavior: Detects miniapp and uses appropriate method

## 🎯 How Sharing Works

### In Farcaster Miniapp (Mobile & Desktop)
```
User clicks share → ShareButtons detects miniapp → Uses ultimateShare → Native SDK compose
```

### In Browser
```
User clicks share → ShareButtons detects browser → Opens Warpcast/Twitter/Telegram URL
```

## 📱 Platform-Specific Behavior

### Farcaster
- **In Miniapp:** Uses `ultimateShare` for native SDK sharing
- **In Browser:** Uses `shareMemeToFarcaster` to open Warpcast compose
- **Mobile Detection:** Handled by `ultimateShare` checking `platformType`
- **Channel:** Always posts to `/bizarrebeasts`

### X/Twitter
- **Handle:** `@bizarrebeasts_` (note the underscore)
- **Token Format:** `( $BB )` with spaces
- **URL:** Always includes `https://bbapp.bizarrebeasts.io` for link preview
- **Hashtags:** #BizarreBeasts #BB

### Telegram
- **Handle:** `@bizarrebeast` (no underscore)
- **Token Format:** `($BB)` without spaces
- **URL:** Included as share parameter

## 📂 File Locations

### Core Libraries
- `/lib/sdk-ultimate.ts` - ultimateShare function, SDK initialization
- `/lib/social-sharing.ts` - Platform-specific sharing logic
- `/lib/farcaster.ts` - Farcaster-specific utilities
- `/components/ShareButtons.tsx` - Unified sharing component

### Implementation Locations
- `/app/rituals/page.tsx` - Ritual sharing (3 locations)
- `/app/empire/page.tsx` - Rank sharing (2 locations)
- `/components/canvas/MemeCanvas.tsx` - Direct meme sharing
- `/components/canvas/ExportControls.tsx` - Export sharing

## 🔧 Implementation Details

### ShareButtons Component Usage
```tsx
<ShareButtons
  customText="Optional custom text"
  shareType="default|meme|rank|ritual"
  ritualData={{ id, title, description }}  // For rituals
  rank={42}  // For rank sharing
  imageDataUrl="data:image/..."  // For memes
  buttonSize="sm|md|lg"
  showLabels={true|false}
/>
```

### Direct ultimateShare Usage
```tsx
await ultimateShare({
  text: "Share text",
  embeds: ['https://bbapp.bizarrebeasts.io'],
  channelKey: 'bizarrebeasts'
});
```

## 🐛 Common Issues & Solutions

### Issue: Mobile not detected in Farcaster
**Solution:** Ensure using `ultimateShare` or `ShareButtons` component, not direct URL opening

### Issue: Wrong URL in shares
**Solution:** Check all instances use `bbapp.bizarrebeasts.io`

### Issue: Share not working in miniapp
**Solution:** Check SDK initialization in `/lib/sdk-ultimate.ts`

## ✅ Testing Checklist

When testing sharing features:

1. **Farcaster Mobile App**
   - [ ] Opens native compose
   - [ ] Includes correct text
   - [ ] Uses correct URL

2. **Farcaster Desktop**
   - [ ] Opens compose without duplicates
   - [ ] Text formatted correctly

3. **Browser (Outside Farcaster)**
   - [ ] Opens Warpcast in new tab
   - [ ] Fallback works properly

4. **X/Twitter**
   - [ ] Correct handle (@bizarrebeasts_)
   - [ ] URL included for preview
   - [ ] Proper token spacing

5. **Telegram**
   - [ ] Correct handle (@bizarrebeast)
   - [ ] URL parameter works

## 📊 Share Locations Map

| Page | Component | Method | Platforms |
|------|-----------|---------|-----------|
| Rituals | Featured ritual | ShareButtons | All |
| Rituals | Individual rituals | ShareButtons | All |
| Rituals | Progress share | ShareButtons | All |
| Rituals | Main share | ultimateShare | Farcaster |
| Empire | Main share | ultimateShare | Farcaster |
| Empire | Search result | ShareButtons | All |
| Meme Generator | Canvas share | ultimateShare | Farcaster |
| Meme Generator | Export share | ShareButtons | All |

## 🚨 Important Notes

1. **Always use ShareButtons component** for new sharing features unless you specifically need Farcaster-only sharing
2. **Never hardcode URLs** - use the constants or environment variables
3. **Test on mobile Farcaster** before deploying sharing changes
4. **Platform detection** is handled automatically by ShareButtons

## 📝 Recent Changes (Sept 2025)

- Fixed mobile detection by using `ultimateShare` in ShareButtons
- Corrected all URLs from `app.bizarrebeasts.io` to `bbapp.bizarrebeasts.io`
- Added multi-platform support (Farcaster, X, Telegram)
- Unified sharing interface with ShareButtons component

---

**Last Updated:** September 14, 2025
**Maintained by:** BizarreBeasts Development Team