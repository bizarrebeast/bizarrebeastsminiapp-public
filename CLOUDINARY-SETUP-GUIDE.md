# Cloudinary Setup Guide for BizarreBeasts

## Your Cloudinary Cloud Name
`dzwacf4uz`

## Setup Steps

### 1. Create Upload Preset
You need to create an unsigned upload preset in your Cloudinary dashboard:

1. **Log into Cloudinary Dashboard**
   - Go to https://cloudinary.com/console
   - Sign in with your account

2. **Navigate to Settings**
   - Click on the gear icon (⚙️) or "Settings" in the sidebar
   - Go to "Upload" tab

3. **Create Upload Preset**
   - Scroll to "Upload presets" section
   - Click "Add upload preset"
   - Configure as follows:
     - **Preset name**: `bizarrebeasts` (IMPORTANT: Must match exactly)
     - **Signing Mode**: `Unsigned` (REQUIRED for client-side uploads)
     - **Folder**: `bizarrebeasts-memes` (optional, for organization)

4. **Configure Preset Settings**
   - **Allowed formats**: `png, jpg, jpeg, webp`
   - **Max file size**: `10MB`
   - **Eager transformations** (optional, for optimization):
     - Quality: `auto:good`
     - Format: `auto`
     - Width: `1200` (max width)
     - Height: `1200` (max height)
     - Crop: `limit`

5. **Save the Preset**
   - Click "Save" at the top of the page
   - Note down the preset name: `bizarrebeasts`

### 2. Update CORS Settings (if needed)
If you encounter CORS errors:

1. Go to Settings → Security
2. Add your domains to allowed origins:
   - `https://app.bizarrebeasts.io`
   - `http://localhost:3000` (for development)

### 3. Test the Integration

The integration is already set up in the code with:
- Cloud name: `dzwacf4uz`
- Upload preset: `bizarrebeasts` (you need to create this)
- Upload endpoint: `https://api.cloudinary.com/v1_1/dzwacf4uz/image/upload`

### 4. Usage Limits (Free Tier)
- **Bandwidth**: 25GB/month
- **Storage**: 25GB total
- **Transformations**: 25,000/month
- **API calls**: Unlimited

## How It Works

1. User clicks share button (Farcaster, X, or Telegram)
2. Meme image is uploaded to Cloudinary
3. Cloudinary returns a public URL
4. URL is included in the share message
5. Social platforms auto-unfurl the image

## Troubleshooting

### Error: "Upload preset not found"
- Make sure preset name is exactly `bizarrebeasts`
- Ensure it's set to "Unsigned"

### Error: "CORS policy"
- Add your domain to Cloudinary's allowed origins
- Check that you're using HTTPS in production

### Images not showing on social media
- Ensure images are public (not requiring authentication)
- Check that URLs are using HTTPS
- Verify image format is supported (PNG, JPG)

## Optional Enhancements

### 1. Add Watermark via Transformation
In your upload preset, add an overlay transformation:
- Overlay: `text:Arial_40:BizarreBeasts`
- Gravity: `south_east`
- Opacity: `50`
- Color: `white`

### 2. Auto-optimize for Social Media
Add eager transformations for each platform:
- Twitter: 1200x675 (16:9)
- Farcaster: 1200x1200 (1:1)
- Telegram: 1280x720 (16:9)

### 3. Set Up Webhook for Analytics
Track shares by setting up a notification URL that logs each upload.

## Environment Variables (Optional)
If you want to keep the cloud name secure, add to `.env.local`:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dzwacf4uz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=bizarrebeasts
```

## Next Steps

1. **Create the upload preset** in Cloudinary dashboard
2. **Test sharing** with a meme
3. **Monitor usage** in Cloudinary dashboard
4. **Upgrade plan** if you exceed free tier limits

## Support
- Cloudinary Docs: https://cloudinary.com/documentation
- Upload Presets: https://cloudinary.com/documentation/upload_presets
- CORS: https://cloudinary.com/documentation/upload_images#cors