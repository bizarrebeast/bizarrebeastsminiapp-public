# Farcaster Assets Guide

Place your Farcaster miniapp images in this folder. Required images:

## Required Images

### 1. `icon.png` - App Icon (REQUIRED)
- **Size**: 1024x1024px exactly
- **Format**: PNG, no alpha/transparency
- **Purpose**: App icon shown in Farcaster app directory and miniapp launcher
- **Description**: Your main logo/icon
- **Suggested**: Use the BizarreBeasts logo on solid background
- **Max file size**: Keep under 1MB

### 2. `splash.png` - Loading/Splash Screen (Optional)
- **Size**: 200x200px exactly
- **Format**: PNG
- **Purpose**: Shown while the miniapp is loading
- **Description**: Simple, clean loading state icon
- **Suggested**: BizarreBeasts logo or $BB symbol

## Additional Images for Marketing

### 3. `hero.png` - Hero/Cover Image (Recommended)
- **Size**: 1200x630px (1.91:1 aspect ratio)
- **Format**: PNG
- **Purpose**: Main preview image for social sharing
- **Description**: Should showcase the app's main features or branding
- **Suggested**: Include $BB logo, meme creator preview, and "BizarreBeasts Miniapp" text

### 4. `og-image.png` - Open Graph Image (Recommended)
- **Size**: 1200x630px (1.91:1 aspect ratio)
- **Format**: PNG
- **Purpose**: Social media preview when sharing links
- **Description**: Can be same as hero.png or different
- **Suggested**: Feature key app capabilities with clear text

### 5. `preview-1.png`, `preview-2.png`, `preview-3.png` - App Screenshots (Optional)
- **Size**: 1080x1920px (9:16 mobile) or 1920x1080px (16:9 desktop)
- **Format**: PNG
- **Purpose**: Showcase app features in the directory
- **Description**: Screenshots of key features
- **Suggested**: 
  - preview-1: Meme generator in action
  - preview-2: Games hub or Treasure Quest
  - preview-3: Token swap interface or Empire leaderboard

## Image Optimization Tips

1. **Compress images** using tools like TinyPNG or ImageOptim
2. **Use vibrant colors** that stand out in feeds
3. **Include clear text** that's readable at small sizes
4. **Show actual app UI** not just marketing graphics
5. **Keep file sizes under 1MB** each for faster loading

## Color Palette for Consistency

- **Background**: #0A0A0A (dark-bg)
- **Primary**: #60E3FF (gem-crystal)
- **Secondary**: #FFD700 (gem-gold)
- **Accent**: #FF69B4 (gem-pink)
- **Card**: #1F2937 (dark-card)

## Text Overlay Suggestions

For hero.png and og-image.png, consider adding:
- "BizarreBeasts Miniapp"
- "Create memes, play games, swap $BB"
- "Join 4400+ holders going BIZARRE"
- "$BB on Base"

## File Naming

Place files directly in this folder:
```
/public/farcaster-assets/
  ├── hero.png (REQUIRED)
  ├── icon.png (REQUIRED)
  ├── og-image.png (REQUIRED)
  ├── splash.png (optional)
  ├── preview-1.png (optional)
  ├── preview-2.png (optional)
  └── preview-3.png (optional)
```

## Quick Links for Reference

After placing images here, update these references:
- `app/layout.tsx` - Update OpenGraph images
- `public/.well-known/farcaster.json` - Update image URLs
- Frame metadata tags in layout.tsx

## Testing

Use these tools to test your images:
- [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)
- [OpenGraph Preview](https://www.opengraph.xyz/)
- [Frame.js Debugger](https://debugger.framesjs.org/)