# 🚀 Featured Ritual Quick Reference Card

## Update in 10 Seconds
```
1. Open: config/featured-ritual-config.ts
2. Edit: ACTIVE_CAMPAIGN object
3. Save & Deploy
```

## Essential Fields Only
```typescript
export const ACTIVE_CAMPAIGN = {
  title: "Your Campaign Title",
  description: "Your campaign description",
  actionText: "Button Text",
  actionUrl: "https://your-url.com",
  image: "/assets/page-assets/banners/rituals-boxes/your-image.png"
};
```

## Hide Featured Box
```typescript
export const ACTIVE_CAMPAIGN = null;
```

## With Learn More Button
```typescript
export const ACTIVE_CAMPAIGN = {
  // ... basic fields ...
  learnMoreUrl: "https://docs-url.com",
  learnMoreText: "Learn More"
};
```

## With Expiration
```typescript
export const ACTIVE_CAMPAIGN = {
  // ... basic fields ...
  expiresAt: "2025-01-31",  // YYYY-MM-DD
  urgencyText: "3 days left!"
};
```

## Sponsored Content
```typescript
export const ACTIVE_CAMPAIGN = {
  // ... basic fields ...
  sponsorType: "sponsored",  // or "collab" or "partner"
  sponsorName: "Partner Name",
  sponsorLogo: "/assets/logo.png",
  sponsorTagline: "Powered by Partner"
};
```

## Custom Sharing
```typescript
export const ACTIVE_CAMPAIGN = {
  // ... basic fields ...
  shareTitle: "Share this!",
  shareText: "Check out this campaign by @bizarrebeasts!",
  shareEmbed: "https://campaign-url.com"
};
```

---
**File Location**: `config/featured-ritual-config.ts`
**Full Guide**: `docs/FEATURED-RITUAL-UPDATE-GUIDE.md`