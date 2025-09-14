# Resources Page Banner Images

## Overview
The Resources page has been prepared to display banner images from Paragraph articles above each resource card. This feature is currently **DISABLED** until images are available.

## Setup Instructions

### 1. Download Images from Paragraph
For each resource that links to a Paragraph article:
1. Visit the article URL
2. Right-click on the banner image
3. Save the image to your computer

### 2. Add Images to Project
Place all downloaded images in:
```
/public/assets/resources/
```

### 3. Naming Convention
Name each image file to match its resource ID:
- `empire-guide.jpg` - for the $BB Empire Guide
- `beginners-guide.jpg` - for the Beginner's Guide
- `bizarre-token.jpg` - for $BIZARRE Token Rewards
- Add more as needed...

### 4. Create Placeholder Image
Save a generic BizarreBeasts image as:
```
/public/assets/resources/placeholder.jpg
```
This will be used as fallback when specific images are missing.

### 5. Enable the Feature
Once images are in place, enable the banner display:

1. Open `/app/resources/page.tsx`
2. Find these two sections:
   - Line ~177: `{false && resource.bannerImage && (`
   - Line ~237: `{false && resource.bannerImage && (`
3. Change both to: `{resource.bannerImage && (`
4. Remove the TODO comments

## Image Specifications
- **Featured Resources**: Images display at 160px height
- **Regular Resources**: Images display at 128px height
- **Format**: JPG or PNG
- **Recommended dimensions**: At least 800px wide for good quality
- **File size**: Keep under 500KB for fast loading

## Features Implemented
- ✅ Banner image field added to Resource data structure
- ✅ Image display with hover effects (scales on hover)
- ✅ Gradient overlay for better text readability
- ✅ Fallback to placeholder if image fails to load
- ✅ Responsive design for all screen sizes

## Resources Already Configured
The following resources already have banner image paths configured in `/lib/resources-data.ts`:
- `empire-guide.jpg` - $BB Empire Guide
- `beginners-guide.jpg` - BizarreBeasts: Beginner's Guide

You can add more by editing the resources data and adding the `bannerImage` field to each resource.

## Example Resource with Banner
```typescript
{
  id: 'example-resource',
  title: 'Example Title',
  bannerImage: '/assets/resources/example.jpg', // Add this line
  // ... other fields
}
```

## Status
⏸️ **Currently Disabled** - Waiting for images to be added to `/public/assets/resources/`