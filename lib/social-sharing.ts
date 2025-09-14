/**
 * Multi-platform social sharing utilities
 * Supports Farcaster, X/Twitter, and Telegram
 */

export type SharePlatform = 'farcaster' | 'twitter' | 'telegram';

export interface ShareOptions {
  platform: SharePlatform;
  text?: string;
  url?: string;
  imageUrl?: string;
  hashtags?: string[];
  channelKey?: string; // For Farcaster
}

/**
 * Helper function to format text for specific platforms
 */
export function formatTextForPlatform(text: string, platform: SharePlatform): string {
  if (platform === 'twitter') {
    // For Twitter/X: Replace handle and add spaces around $BB
    return text
      .replace(/@bizarrebeasts(?!_)/g, '@bizarrebeasts_')
      .replace(/@bizarrebeast\b/g, '@bizarrebeasts_')  // Also replace @bizarrebeast mentions
      .replace(/BizarreBeasts \(\$BB\)/g, 'BizarreBeasts ( $BB )')
      .replace(/\(\$BB\)/g, '( $BB )')
      .replace(/Powered by \$GLANKER/g, 'Powered by $GLANKER @glankerempire');  // Add GLANKER handle for X
  } else if (platform === 'telegram') {
    // For Telegram: Add handle, keep $BB format as is
    return text
      .replace(/BizarreBeasts \(\$BB\)/g, '@bizarrebeast ($BB)')
      .replace(/\$GLANKER/g, '$GLANKER');  // Keep GLANKER as is
  }
  // Farcaster: keep as is (already has @bizarrebeast)
  return text;
}

/**
 * Platform-specific text templates
 * Will be fine-tuned later with correct handles
 */
export const SHARE_TEMPLATES = {
  farcaster: {
    default: `Check out BizarreBeasts ($BB) and hold 25M tokens to join /bizarrebeasts! 🚀 👹\n\nCC @bizarrebeast`,
    meme: `Just created this epic meme with BizarreBeasts! 👹\n\nJoin the bizarre movement at /bizarrebeasts\nCC @bizarrebeast`,
    rank: `I'm rank #{rank} on the BizarreBeasts Empire Leaderboard! 🏆\n\nJoin /bizarrebeasts and climb the ranks!\nCC @bizarrebeast`,
    ritual: `Daily BIZARRE Ritual #{id}: {title}\n\n{description}\n\nJoin me in completing daily $BIZARRE rituals in the BizarreBeasts ($BB) Community! 👹\n\n#BizarreBeasts #BBRituals`,
  },
  twitter: {
    default: `Check out @bizarrebeasts_ ( $BB ) - The weirdest, wildest meme generator in crypto! 👹🚀`,
    meme: `Just created this epic meme with @bizarrebeasts_! 👹\n\nJoin the bizarre movement!`,
    rank: `I'm rank #{rank} on the @bizarrebeasts_ Empire Leaderboard! 🏆\n\nGet weird, get $BB!`,
    ritual: `Daily BIZARRE Ritual #{id}: {title}\n\n{description}\n\nJoin the @bizarrebeasts_ ( $BB ) Community! 👹`,
  },
  telegram: {
    default: `Check out @bizarrebeast ($BB) - The ultimate meme generator! 👹`,
    meme: `Just created an epic @bizarrebeast meme! Check it out 👹`,
    rank: `I'm rank #{rank} on the @bizarrebeast Empire Leaderboard! 🏆`,
    ritual: `Daily BIZARRE Ritual #{id}: {title}\n\n{description}\n\nJoin the @bizarrebeast ($BB) Community! 👹`,
  }
};

/**
 * Upload image to Cloudinary for sharing
 */
export async function uploadToCloudinary(dataUrl: string): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create form data
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', 'bizarrebeasts'); // You'll need to create this preset in Cloudinary

    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/dzwacf4uz/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }

    const data = await uploadResponse.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw error;
  }
}

/**
 * Share to Farcaster/Warpcast
 */
export async function shareToFarcaster(options: ShareOptions): Promise<void> {
  const baseUrl = 'https://warpcast.com/~/compose';
  const params = new URLSearchParams();

  // Use custom text or default template
  const text = options.text || SHARE_TEMPLATES.farcaster.default;
  params.append('text', text);

  // Add channel
  if (options.channelKey) {
    params.append('channelKey', options.channelKey);
  }

  // Add URL if provided
  if (options.url) {
    params.append('embeds[]', options.url);
  }

  // Add image URL if provided (after Cloudinary upload)
  if (options.imageUrl) {
    params.append('embeds[]', options.imageUrl);
  }

  const shareUrl = `${baseUrl}?${params.toString()}`;
  window.open(shareUrl, '_blank');
}

/**
 * Share to X/Twitter
 */
export async function shareToTwitter(options: ShareOptions): Promise<void> {
  const baseUrl = 'https://twitter.com/intent/tweet';
  const params = new URLSearchParams();

  // Use custom text or default template
  let text = options.text || SHARE_TEMPLATES.twitter.default;

  // IMPORTANT: Always include URL for link preview
  // Twitter will auto-generate preview card from the URL's meta tags
  const appUrl = options.url || 'https://bbapp.bizarrebeasts.io';
  text += `\n\n${appUrl}`;

  params.append('text', text);

  // Add hashtags
  if (options.hashtags && options.hashtags.length > 0) {
    params.append('hashtags', options.hashtags.join(','));
  }

  const shareUrl = `${baseUrl}?${params.toString()}`;
  window.open(shareUrl, '_blank');
}

/**
 * Share to Telegram
 */
export async function shareToTelegram(options: ShareOptions): Promise<void> {
  const baseUrl = 'https://t.me/share/url';
  const params = new URLSearchParams();

  // Telegram requires a URL
  const url = options.url || 'https://app.bizarrebeasts.io';
  params.append('url', url);

  // Use custom text or default template
  const text = options.text || SHARE_TEMPLATES.telegram.default;
  params.append('text', text);

  const shareUrl = `${baseUrl}?${params.toString()}`;
  window.open(shareUrl, '_blank');
}

/**
 * Main share function that handles all platforms
 */
export async function shareToSocial(options: ShareOptions): Promise<void> {
  switch (options.platform) {
    case 'farcaster':
      return shareToFarcaster(options);
    case 'twitter':
      return shareToTwitter(options);
    case 'telegram':
      return shareToTelegram(options);
    default:
      throw new Error(`Unsupported platform: ${options.platform}`);
  }
}

/**
 * Share meme with image upload
 */
export async function shareMemeWithImage(
  imageDataUrl: string,
  platform: SharePlatform,
  customText?: string
): Promise<void> {
  try {
    // Upload to Cloudinary first
    console.log('Uploading image to Cloudinary...');
    const imageUrl = await uploadToCloudinary(imageDataUrl);
    console.log('Image uploaded:', imageUrl);

    // Prepare share options
    const shareOptions: ShareOptions = {
      platform,
      text: customText || SHARE_TEMPLATES[platform].meme,
      url: 'https://app.bizarrebeasts.io',
      imageUrl,
      hashtags: platform === 'twitter' ? ['BizarreBeasts', 'BB', 'Memes'] : undefined,
      channelKey: platform === 'farcaster' ? 'bizarrebeasts' : undefined,
    };

    // Share to platform
    await shareToSocial(shareOptions);
  } catch (error) {
    console.error('Failed to share with image:', error);
    // Fallback to sharing without image
    await shareToSocial({
      platform,
      text: customText || SHARE_TEMPLATES[platform].meme,
      url: 'https://app.bizarrebeasts.io',
      hashtags: platform === 'twitter' ? ['BizarreBeasts', 'BB', 'Memes'] : undefined,
      channelKey: platform === 'farcaster' ? 'bizarrebeasts' : undefined,
    });
  }
}