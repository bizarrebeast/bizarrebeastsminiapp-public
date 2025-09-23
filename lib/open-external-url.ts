import { sdk } from './sdk-init';

/**
 * Opens an external URL properly, handling both Farcaster miniapp and regular browser contexts.
 * In Farcaster miniapp, this ensures the URL opens in a new frame/tab outside the miniapp.
 * In regular browser, it opens in a new tab.
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    // Check if we're in the Farcaster miniapp
    const isInMiniApp = await sdk.isInMiniApp();

    if (isInMiniApp) {
      // In Farcaster miniapp, we need to use the proper method to open external URLs
      // This will open the URL in the user's default browser or a new Warpcast frame
      // Using window.open with specific parameters to ensure it opens outside the miniapp
      window.open(url, '_system');

      // Alternative: If the above doesn't work, we can try composing a cast with the link
      // This would create a cast with the URL that users can click
      // await sdk.actions.composeCast({
      //   text: `Check out: ${url}`,
      //   embeds: [url]
      // });
    } else {
      // Regular browser context - open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Failed to open external URL:', error);
    // Fallback to regular window.open
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}