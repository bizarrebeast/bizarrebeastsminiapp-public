/**
 * Farcaster sharing utilities
 */

// Removed shareToWarpcast function - functionality merged into shareMemeToFarcaster

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
  channelKey?: string,
  existingWindow?: Window | null
): Promise<string> {
  try {
    // For development, we'll open Warpcast directly with the text
    // In production with proper image hosting, uncomment the upload step
    
    // Uncomment when you have proper image hosting configured:
    // const imageUrl = await uploadImageForSharing(imageDataUrl);
    
    const baseUrl = 'https://warpcast.com/~/compose';

    // Add cast text with proper line break encoding
    const defaultText = `(your text here)\n\nCheck out BizarreBeasts ($BB) and hold 25M tokens to join /bizarrebeasts! 🚀 👹\n\nCC @bizarrebeast\nhttps://bbapp.bizarrebeasts.io`;
    const text = customText || defaultText;
    const channel = channelKey || 'bizarrebeasts';

    // Build URL with proper encoding for line breaks
    const shareUrl = `${baseUrl}?text=${encodeURIComponent(text)}&channelKey=${encodeURIComponent(channel)}`;
    
    // Use existing window or open new one
    if (existingWindow) {
      existingWindow.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank');
    }
    
    // Show a helpful message
    console.log('Opening Warpcast... You can attach your downloaded meme to the cast.');
    
    return shareUrl;
  } catch (error) {
    console.error('Failed to share to Farcaster:', error);
    // Simple fallback - just open Warpcast
    const fallbackUrl = 'https://warpcast.com';
    if (existingWindow) {
      existingWindow.location.href = fallbackUrl;
    } else {
      window.open(fallbackUrl, '_blank');
    }
    return fallbackUrl;
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
    'fc:frame:button:1:target': `https://bbapp.bizarrebeasts.io/meme-generator`,
    'fc:frame:button:2': 'View Gallery',
    'fc:frame:button:2:action': 'link',
    'fc:frame:button:2:target': `https://bbapp.bizarrebeasts.io/gallery/${memeId}`,
    'og:image': imageUrl,
    'og:title': 'BizarreBeasts Meme',
    'og:description': 'Check out this epic meme created with BizarreBeasts Meme Generator!',
  };
}