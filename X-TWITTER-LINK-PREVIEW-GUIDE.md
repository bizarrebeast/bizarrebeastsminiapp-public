# X/Twitter Link Preview Guide

## Current Setup ✅
Your app already has Twitter Card meta tags configured in `/app/layout.tsx`:
- Card type: `summary_large_image`
- Image: `https://bbapp.bizarrebeasts.io/farcaster-assets/hero.png`
- Title & Description configured

## How Link Previews Work on X

### What We Have Now:
1. **URL Always Included** - The share function now always includes the app URL in tweets
2. **Meta Tags Ready** - Twitter will fetch the preview from your site's meta tags
3. **Large Image Card** - Shows as a prominent image with title/description

### When You Share:
1. User clicks X share button
2. Tweet opens with text + URL
3. X fetches meta tags from the URL
4. Preview card appears below the tweet

## Future Enhancements

### 1. Dynamic Preview Images (Best Solution)
Create dynamic OG images for different content:

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'meme', 'rank', 'ritual'
  const data = searchParams.get('data')

  // Generate custom image based on type
  return new ImageResponse(
    <div>
      {/* Custom design based on share type */}
    </div>
  )
}
```

Then share URLs like:
- Memes: `https://bbapp.bizarrebeasts.io?preview=meme&id=123`
- Rank: `https://bbapp.bizarrebeasts.io?preview=rank&rank=42`
- Rituals: `https://bbapp.bizarrebeasts.io?preview=ritual&id=1`

### 2. Cloudinary Integration (After Setup)
Once Cloudinary is configured:
1. Upload meme to Cloudinary
2. Create a share page with that image as OG image
3. Share that URL for perfect preview

### 3. Page-Specific Meta Tags
Add specific meta tags for each page:

```typescript
// app/meme-generator/page.tsx
export const metadata: Metadata = {
  twitter: {
    card: 'summary_large_image',
    images: ['https://bbapp.bizarrebeasts.io/previews/meme-generator.png'],
  },
}
```

## Testing Your Previews

### X Card Validator
Test your link previews:
1. Go to: https://cards-dev.twitter.com/validator
2. Enter: `https://bbapp.bizarrebeasts.io`
3. Check the preview

### Requirements for X Previews:
- ✅ `twitter:card` meta tag
- ✅ `twitter:image` meta tag (or `og:image` fallback)
- ✅ Image must be publicly accessible
- ✅ Image should be at least 280x150px (yours is 1200x630 - perfect!)
- ✅ URL must be in the tweet text

## Current Behavior

When users share from your app to X:
1. **Meme Generator**: Shows app preview with hero image
2. **Empire Rank**: Shows app preview with hero image
3. **Rituals**: Shows app preview with hero image

All shares will show the same preview image (hero.png) until we implement dynamic previews.

## Quick Wins

### 1. Update Hero Image
Make sure `/public/farcaster-assets/hero.png` is eye-catching and represents BizarreBeasts well.

### 2. Different Images per Page
Create page-specific preview images:
- `/public/previews/meme-generator.png`
- `/public/previews/empire.png`
- `/public/previews/rituals.png`

### 3. Add Twitter Site Handle
Add to metadata:
```typescript
twitter: {
  site: '@bizarrebeasts_',
  creator: '@bizarrebeasts_',
}
```

## Summary

✅ **Working Now**: Basic link previews with hero image
🔄 **Next Step**: Create dynamic preview images
🚀 **Future**: Cloudinary-hosted meme previews

The link preview WILL work on X as long as:
1. URL is in the tweet (✅ we ensure this)
2. Meta tags are present (✅ you have them)
3. Image is accessible (✅ hero.png exists)