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
    ritual: `Daily BIZARRE Ritual #{id}: {title}\n\n{description}\n\nJoin me in completing daily $BIZARRE rituals in the BizarreBeasts ($BB) Community! 👹\n\n@bizarrebeast \n\n#BizarreBeasts #BBRituals {ritualHashtag}`,
    checkin: `🔥 Day {streak} streak on BizarreBeasts!\n\nJust checked in and earning $BB every week for being active in the community!\n\nJoin /bizarrebeasts and start your daily ritual streak!\n\nCC @bizarrebeast\n\n#bbrituals #BBCheckin`,
    claim: `💰 Just claimed {amount} $BB from my BizarreBeasts check-in rewards!\n\n{tierMessage}\nTotal earned: {totalEarned} $BB\n\nStart earning daily rewards at /bizarrebeasts!\nCC @bizarrebeast`,
    milestone5: `🎯 5-day streak complete on BizarreBeasts!\nJust earned {reward} $BB!\n\nJoin /bizarrebeasts and start earning!\nCC @bizarrebeast`,
    milestone15: `🏆 15-DAY STREAK on BizarreBeasts!\nBonus {bonus} $BB earned!\n\nThe grind pays off! Join /bizarrebeasts\nCC @bizarrebeast`,
    milestone30: `👑 30-DAY PERFECT STREAK COMPLETE!\n\n✅ 30 days checked in\n💰 {totalRewards} $BB earned\n🔄 Ready for next cycle!\n\nJoin the most dedicated community at /bizarrebeasts!\nCC @bizarrebeast`,
    streakbreak: `🔄 Back on the grind! Starting fresh on BizarreBeasts.\n\nPrevious best: {bestStreak} days\nLet's beat it this time! 💪\n\nJoin /bizarrebeasts and build your streak!\nCC @bizarrebeast`,
    contest: `🏆 {name}\n\n⏰ {timeLeft}\n💰 Prize: {prize}\n\nEnter now at /bizarrebeasts!\nCC @bizarrebeast`,
    contestEntry: `📸 Just entered: {name}\n\nCheck out my BIZARRE creation and vote for me!\n\n💰 Prize pool: {prize}\n⏰ {timeLeft}\n\nJoin the competition at /bizarrebeasts!\nCC @bizarrebeast`,
    contestPosition: `🏆 {playerText} ranked #{rank} in {name}!\n\n💪 Score: {score}\n\nJoin and compete at /bizarrebeasts!\nCC @bizarrebeast`,
    contestWinner: `🎉 I WON {name}!\n\n🥇 Final position: #{position}\n💰 Prize won: {prize}\n🔥 Score: {score}\n\nJoin the next contest at /bizarrebeasts!\nCC @bizarrebeast`,
    swap: `🔄 Just bought $BB in the BizarreBeasts miniapp!\n\nGO BIZARRE. GET BANK. 💰👹\n\n/bizarrebeasts\nCC @bizarrebeast`,
    tip: `💸 Just tipped {amount} $BB to @{recipient} using the BizarreBeasts Miniapp!\n\nGO BIZARRE. GET BANK. 💰👹\n\n/bizarrebeasts\nCC @bizarrebeast`,
    flip: `🪙 BizBe's Daily Coin Flip = BIZARRE Prizes\n\n✅ 50/50 odds to win 5,000 $BB (test tokens in Beta)\n🎟️ PLUS enter monthly prize drawing\n🔥 Empire leaders get up to 5 flips/day\n💰 Just flip. That's it.\n\n/bizarrebeasts\nCC @bizarrebeast`,
    flipWin: `🎉 I just WON 5,000 $BB on BizBe's Daily Flip!\n\n💰 50/50 odds, instant win (test tokens in Beta)\n🎟️ {totalEntries} entries into monthly drawing\n🔥 Flip daily at /bizarrebeasts\n\nCC @bizarrebeast`,
    flipPrize: `🎁 THIS MONTH: {prizeDisplay}\n\n🪙 Flip BizBe's coin daily to enter!\n✨ Winners drawn {drawingDate}\n🎟️ {totalEntries} entries so far\n\n💰 Win 5,000 $BB per flip (test tokens in Beta)\n\n/bizarrebeasts\nCC @bizarrebeast`,
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
    contest: `🏆 {name}\n\n⏰ {timeLeft}\n💰 Prize: {prize}\n\n@bizarrebeasts_`,
    contestEntry: `📸 Just entered: {name}\n\nCheck out my BIZARRE creation and vote for me!\n\n💰 Prize pool: {prize}\n⏰ {timeLeft}\n\nJoin the competition!\nCC @bizarrebeasts_`,
    contestPosition: `🏆 {playerText} ranked #{rank} in {name}!\n\n💪 Score: {score}\n\n@bizarrebeasts_`,
    contestWinner: `🎉 I WON {name}!\n\n🥇 Final position: #{position}\n💰 Prize won: {prize}\n\n@bizarrebeasts_`,
    swap: `🔄 Just bought ( $BB ) in the BizarreBeasts miniapp!\n\nGO BIZARRE. GET BANK. 💰👹\n\n@bizarrebeasts_`,
    tip: `💸 Just tipped {amount} ( $BB ) to @{recipient} using the BizarreBeasts Miniapp!\n\nGO BIZARRE. GET BANK. 💰👹\n\n@bizarrebeasts_`,
    flip: `🪙 BizBe's Daily Coin Flip = BIZARRE Prizes\n\n✅ 50/50 odds to win 5,000 ( $BB ) (test tokens in Beta)\n🎟️ PLUS enter monthly prize drawing\n🔥 Empire leaders get up to 5 flips/day\n💰 Just flip. That's it.\n\n@bizarrebeasts_`,
    flipWin: `🎉 I just WON 5,000 ( $BB ) on BizBe's Daily Flip!\n\n💰 50/50 odds, instant win (test tokens in Beta)\n🎟️ {totalEntries} entries into monthly drawing\n🔥 Flip daily!\n\n@bizarrebeasts_`,
    flipPrize: `🎁 THIS MONTH: {prizeDisplay}\n\n🪙 Flip BizBe's coin daily to enter!\n✨ Drawing: {drawingDate}\n🎟️ {totalEntries} entries\n\n💰 Win 5K ( $BB ) per flip (test tokens in Beta)\n\n@bizarrebeasts_`,
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
    contest: `🏆 {name}\n\n⏰ {timeLeft}\n💰 Prize: {prize}\n\n@bizarrebeast`,
    contestEntry: `📸 Just entered: {name}\n\nCheck out my BIZARRE creation and vote for me!\n\n💰 Prize pool: {prize}\n⏰ {timeLeft}\n\n@bizarrebeast`,
    contestPosition: `🏆 {playerText} ranked #{rank} in {name}!\n\n💪 Score: {score}\n\n@bizarrebeast`,
    contestWinner: `🎉 I WON {name}!\n\n🥇 Final position: #{position}\n💰 Prize won: {prize}\n\n@bizarrebeast ($BB)`,
    swap: `🔄 Just bought ($BB) in the BizarreBeasts miniapp!\n\nGO BIZARRE. GET BANK. 💰👹\n\n@bizarrebeast`,
    tip: `💸 Just tipped {amount} ($BB) to {recipient} using the BizarreBeasts Miniapp!\n\nGO BIZARRE. GET BANK. 💰👹\n\n@bizarrebeast`,
    flip: `🪙 BizBe's Daily Coin Flip = BIZARRE Prizes\n\n✅ 50/50 odds to win 5,000 ($BB) (test tokens in Beta)\n🎟️ PLUS enter monthly prize drawing\n🔥 Empire leaders get up to 5 flips/day\n💰 Just flip. That's it.\n\n@bizarrebeast`,
    flipWin: `🎉 I just WON 5,000 ($BB) on BizBe's Daily Flip!\n\n💰 50/50 odds, instant win (test tokens in Beta)\n🎟️ {totalEntries} entries into monthly drawing\n🔥 Flip daily!\n\n@bizarrebeast`,
    flipPrize: `🎁 THIS MONTH: {prizeDisplay}\n\n🪙 Flip BizBe's coin daily to enter!\n✨ Drawing: {drawingDate}\n🎟️ {totalEntries} entries\n\n💰 Win 5K ($BB) per flip (test tokens in Beta)\n\n@bizarrebeast`,
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

  // Use custom text or default template
  const text = options.text || SHARE_TEMPLATES.farcaster.default;

  // Build URL with proper encoding for line breaks
  const params: string[] = [];
  params.push(`text=${encodeURIComponent(text)}`);

  // Add channel
  if (options.channelKey) {
    params.push(`channelKey=${encodeURIComponent(options.channelKey)}`);
  }

  // Add URL if provided
  if (options.url) {
    params.push(`embeds[]=${encodeURIComponent(options.url)}`);
  }

  // Add image URL if provided (after Cloudinary upload)
  if (options.imageUrl) {
    params.push(`embeds[]=${encodeURIComponent(options.imageUrl)}`);
  }

  const shareUrl = `${baseUrl}?${params.join('&')}`;
  window.open(shareUrl, '_blank');
}

/**
 * Share to X/Twitter
 */
export async function shareToTwitter(options: ShareOptions): Promise<void> {
  const baseUrl = 'https://twitter.com/intent/tweet';

  // Use custom text or default template
  let text = options.text || SHARE_TEMPLATES.twitter.default;

  // IMPORTANT: Always include URL for link preview
  // Twitter will auto-generate preview card from the URL's meta tags
  const appUrl = options.url || 'https://bbapp.bizarrebeasts.io';
  text += `\n\n${appUrl}`;

  // Use encodeURIComponent which properly encodes \n as %0A
  // Twitter DOES support line breaks when properly encoded
  const encodedText = encodeURIComponent(text);

  // Build URL manually
  let shareUrl = `${baseUrl}?text=${encodedText}`;

  // Add hashtags if provided
  if (options.hashtags && options.hashtags.length > 0) {
    shareUrl += `&hashtags=${encodeURIComponent(options.hashtags.join(','))}`;
  }

  window.open(shareUrl, '_blank');
}

/**
 * Share to Telegram
 */
export async function shareToTelegram(options: ShareOptions): Promise<void> {
  const baseUrl = 'https://t.me/share/url';

  // Telegram requires a URL
  const url = options.url || 'https://bbapp.bizarrebeasts.io';

  // Use custom text or default template
  const text = options.text || SHARE_TEMPLATES.telegram.default;

  // Build URL with proper encoding for line breaks
  const params: string[] = [];
  params.push(`url=${encodeURIComponent(url)}`);
  params.push(`text=${encodeURIComponent(text)}`);

  const shareUrl = `${baseUrl}?${params.join('&')}`;
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