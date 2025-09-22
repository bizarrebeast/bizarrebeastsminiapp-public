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
    checkin: `🔥 Day {streak} streak on BizarreBeasts!\n\nJust checked in and earning $BB every week for being active in the community!\n\nJoin /bizarrebeasts and start your daily ritual streak!\n\nCC @bizarrebeast\n\n#bbrituals #BBCheckin`,
    claim: `💰 Just claimed {amount} $BB from my BizarreBeasts check-in rewards!\n\n{tierMessage}\nTotal earned: {totalEarned} $BB\n\nStart earning daily rewards at /bizarrebeasts!\nCC @bizarrebeast`,
    milestone5: `🎯 5-day streak complete on BizarreBeasts!\nJust earned {reward} $BB!\n\nJoin /bizarrebeasts and start earning!\nCC @bizarrebeast`,
    milestone15: `🏆 15-DAY STREAK on BizarreBeasts!\nBonus {bonus} $BB earned!\n\nThe grind pays off! Join /bizarrebeasts\nCC @bizarrebeast`,
    milestone30: `👑 30-DAY PERFECT STREAK COMPLETE!\n\n✅ 30 days checked in\n💰 {totalRewards} $BB earned\n🔄 Ready for next cycle!\n\nJoin the most dedicated community at /bizarrebeasts!\nCC @bizarrebeast`,
    streakbreak: `🔄 Back on the grind! Starting fresh on BizarreBeasts.\n\nPrevious best: {bestStreak} days\nLet's beat it this time! 💪\n\nJoin /bizarrebeasts and build your streak!\nCC @bizarrebeast`,
    contest: `🏆 Check out the {name} contest on BizarreBeasts!\n\n{description}\n\n⏰ {timeLeft}\n💰 Prize: {prize}\n\nEnter now at /bizarrebeasts!\nCC @bizarrebeast`,
    contestEntry: `📸 Just entered the {name} to join the BizarreBeasts and gain access to a /bizarrebeasts community access pass!\n\nCheck out my BIZARRE creation and vote for me!\n\n💰 Prize pool: {prize}\n⏰ {timeLeft}\n\nJoin the competition at /bizarrebeasts!\nCC @bizarrebeast`,
    contestPosition: `🏆 {playerText} ranked #{rank} in the {name} contest on BizarreBeasts!\n\n💪 Score: {score}\n\nJoin and compete at /bizarrebeasts!\nCC @bizarrebeast`,
    contestWinner: `🎉 I WON the {name} contest on BizarreBeasts!\n\n🥇 Final position: #{position}\n💰 Prize won: {prize}\n🔥 Score: {score}\n\nJoin the next contest at /bizarrebeasts!\nCC @bizarrebeast`,
  },
  twitter: {
    default: `Check out @bizarrebeasts_ ( $BB ) - The weirdest, wildest meme generator in crypto! 👹🚀`,
    meme: `Just created this epic meme with @bizarrebeasts_! 👹\n\nJoin the bizarre movement!`,
    rank: `I'm rank #{rank} on the @bizarrebeasts_ Empire Leaderboard! 🏆\n\nGet weird, get $BB!`,
    ritual: `Daily BIZARRE Ritual #{id}: {title}\n\n{description}\n\nJoin the @bizarrebeasts_ ( $BB ) Community! 👹`,
    checkin: `🔥 Day {streak} streak on @bizarrebeasts_!\n\nJust checked in and earning $BB every week for being active in the community!\n\nJoin the community and start your daily ritual streak!\n\nCC @bizarrebeasts_`,
    claim: `💰 Just claimed {amount} $BB from my @bizarrebeasts_ check-in rewards!\n\n{tierMessage}\nTotal earned: {totalEarned} $BB`,
    milestone5: `🎯 5-day streak complete on @bizarrebeasts_!\nJust earned {reward} $BB!`,
    milestone15: `🏆 15-DAY STREAK on @bizarrebeasts_!\nBonus {bonus} $BB earned!\n\nThe grind pays off!`,
    milestone30: `👑 30-DAY PERFECT STREAK COMPLETE on @bizarrebeasts_!\n\n✅ 30 days checked in\n💰 {totalRewards} $BB earned\n🔄 Ready for next cycle!`,
    streakbreak: `🔄 Back on the grind! Starting fresh on @bizarrebeasts_.\n\nPrevious best: {bestStreak} days\nLet's beat it this time! 💪`,
    contest: `🏆 Check out the {name} contest on @bizarrebeasts_!\n\n{description}\n\n⏰ {timeLeft}\n💰 Prize: {prize}`,
    contestEntry: `📸 Just entered the {name} to join the @bizarrebeasts_ and gain access to a community access pass!\n\nCheck out my BIZARRE creation and vote for me!\n\n💰 Prize pool: {prize}\n⏰ {timeLeft}\n\nJoin the competition!\nCC @bizarrebeasts_`,
    contestPosition: `🏆 {playerText} ranked #{rank} in the {name} contest on @bizarrebeasts_!\n\n💪 Score: {score}`,
    contestWinner: `🎉 I WON the {name} contest on @bizarrebeasts_!\n\n🥇 Final position: #{position}\n💰 Prize won: {prize}`,
  },
  telegram: {
    default: `Check out @bizarrebeast ($BB) - The ultimate meme generator! 👹`,
    meme: `Just created an epic @bizarrebeast meme! Check it out 👹`,
    rank: `I'm rank #{rank} on the @bizarrebeast Empire Leaderboard! 🏆`,
    ritual: `Daily BIZARRE Ritual #{id}: {title}\n\n{description}\n\nJoin the @bizarrebeast ($BB) Community! 👹`,
    checkin: `🔥 Day {streak} streak on @bizarrebeast!\n\nJust checked in and earning ($BB) every week for being active in the community!\n\nJoin the community and start your daily ritual streak!\n\nCC @bizarrebeast`,
    claim: `💰 Just claimed {amount} ($BB) from my @bizarrebeast check-in rewards!\n\n{tierMessage}\nTotal earned: {totalEarned} ($BB)`,
    milestone5: `🎯 5-day streak complete on @bizarrebeast!\nJust earned {reward} ($BB)!`,
    milestone15: `🏆 15-DAY STREAK on @bizarrebeast!\nBonus {bonus} ($BB) earned!`,
    milestone30: `👑 30-DAY PERFECT STREAK COMPLETE!\n\n✅ 30 days checked in\n💰 {totalRewards} ($BB) earned\n🔄 Ready for next cycle!`,
    streakbreak: `🔄 Back on the grind! Starting fresh on @bizarrebeast.\n\nPrevious best: {bestStreak} days`,
    contest: `🏆 Check out the {name} contest on @bizarrebeast!\n\n{description}\n\n⏰ {timeLeft}\n💰 Prize: {prize}`,
    contestEntry: `📸 Just entered the {name} to join the @bizarrebeast and gain access to a community access pass!\n\nCheck out my BIZARRE creation and vote for me!\n\n💰 Prize pool: {prize}\n⏰ {timeLeft}`,
    contestPosition: `🏆 {playerText} ranked #{rank} in the {name} contest on @bizarrebeast!\n\n💪 Score: {score}`,
    contestWinner: `🎉 I WON the {name} contest on @bizarrebeast ($BB)!\n\n🥇 Final position: #{position}\n💰 Prize won: {prize}`,
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

  // Use encodeURIComponent for better compatibility with line breaks
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
  const url = options.url || 'https://bbapp.bizarrebeasts.io';
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
      url: 'https://bbapp.bizarrebeasts.io',
      imageUrl,
      hashtags: undefined, // Removed hashtags for X/Twitter per 2025 best practices
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
      url: 'https://bbapp.bizarrebeasts.io',
      hashtags: undefined, // Removed hashtags for X/Twitter per 2025 best practices
      channelKey: platform === 'farcaster' ? 'bizarrebeasts' : undefined,
    });
  }
}