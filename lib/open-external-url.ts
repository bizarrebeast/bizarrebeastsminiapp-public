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
      // Standard Farcaster pattern: close current miniapp then open the external frame
      // This ensures the BB miniapp closes and the new frame/miniapp opens properly

      // First, open the URL (this triggers the navigation)
      // Using openUrl action if available, which handles frame URLs better
      if (sdk.actions?.openUrl) {
        await sdk.actions.openUrl(url);
      } else {
        // Fallback to window.open if openUrl is not available
        window.open(url, '_system');
      }

      // Then close the current miniapp
      // Small delay to ensure the URL open is initiated first
      setTimeout(async () => {
        if (sdk.actions?.close) {
          try {
            await sdk.actions.close();
          } catch (closeError) {
            console.log('Could not close miniapp:', closeError);
          }
        }
      }, 100);
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