/**
 * Farcaster sharing utilities
 */

interface FarcasterShareOptions {
  text?: string;
  embeds?: string[];
  channelKey?: string;
}

/**
 * Share to Farcaster using Warpcast composer
 * This opens Warpcast with a pre-filled cast
 */
export function shareToWarpcast(options: FarcasterShareOptions) {
  const baseUrl = 'https://warpcast.com/~/compose';
  const params = new URLSearchParams();
  
  // Add cast text
  const defaultText = 'Check out my BizarreBeasts meme! 🦾\n\nMade with BizarreBeasts Meme Generator';
  params.append('text', options.text || defaultText);
  
  // Add embeds (image URLs)
  if (options.embeds && options.embeds.length > 0) {
    options.embeds.forEach(embed => {
      params.append('embeds[]', embed);
    });
  }
  
  // Add channel if specified (e.g., 'bizarrebeasts')
  if (options.channelKey) {
    params.append('channelKey', options.channelKey);
  }
  
  const shareUrl = `${baseUrl}?${params.toString()}`;
  window.open(shareUrl, '_blank');
}

/**
 * Upload image to temporary storage for sharing
 * Using a free image hosting service or our own API
 */
export async function uploadImageForSharing(dataUrl: string): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('image', blob, 'meme.png');
    
    // Upload to our API endpoint
    const uploadResponse = await fetch('/api/upload-meme', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }
    
    const { url } = await uploadResponse.json();
    return url;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
}

/**
 * Share meme to Farcaster
 * Handles the full flow: upload image, then share
 */
export async function shareMemeToFarcaster(
  imageDataUrl: string,
  customText?: string,
  channelKey?: string
): Promise<void> {
  try {
    // For development, we'll open Warpcast directly with the text
    // In production with proper image hosting, uncomment the upload step
    
    // Uncomment when you have proper image hosting configured:
    // const imageUrl = await uploadImageForSharing(imageDataUrl);
    
    // For now, just share the text without the image embed
    // Users can still manually attach the downloaded image in Warpcast
    shareToWarpcast({
      text: customText || `Just created an epic meme with @bizarrebeasts! 🦾\n\nJoin the Empire and make your own: https://app.bizarrebeasts.io`,
      embeds: [], // Will be [imageUrl] when hosting is configured
      channelKey: channelKey || 'bizarrebeasts', // Default to bizarrebeasts channel
    });
    
    // Show a helpful message
    console.log('Opening Warpcast... You can attach your downloaded meme to the cast.');
  } catch (error) {
    console.error('Failed to share to Farcaster:', error);
    // Simple fallback - just open Warpcast
    window.open('https://warpcast.com', '_blank');
  }
}

/**
 * Alternative: Create a Farcaster frame for the meme
 * This generates frame metadata that can be embedded
 */
export function generateFrameMetadata(imageUrl: string, memeId: string) {
  return {
    'fc:frame': 'vNext',
    'fc:frame:image': imageUrl,
    'fc:frame:image:aspect_ratio': '1:1',
    'fc:frame:button:1': 'Create Your Own',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': `https://app.bizarrebeasts.io/meme-generator`,
    'fc:frame:button:2': 'View Gallery',
    'fc:frame:button:2:action': 'link',
    'fc:frame:button:2:target': `https://app.bizarrebeasts.io/gallery/${memeId}`,
    'og:image': imageUrl,
    'og:title': 'BizarreBeasts Meme',
    'og:description': 'Check out this epic meme created with BizarreBeasts Meme Generator!',
  };
}