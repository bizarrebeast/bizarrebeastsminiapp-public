import { sdk } from './sdk-init';

/**
 * CRITICAL: Farcaster Frame Navigation Guidelines
 * ================================================
 *
 * ALWAYS use this utility for ALL external links in the app.
 *
 * This utility handles three scenarios:
 * 1. Farcaster frame URLs → Opens with openMiniApp() to keep in Farcaster
 * 2. External websites → Opens with openUrl() to open in browser
 * 3. Regular browser → Opens with window.open() in new tab
 *
 * Platform-specific behavior:
 * - Mobile (platformType = 'mobile'): Opens frame/URL then closes BB miniapp
 * - Desktop (platformType = 'web'): Opens frame/URL, lets Farcaster handle transition
 *
 * Usage:
 * ```typescript
 * import { openExternalUrl } from '@/lib/open-external-url';
 *
 * // ✅ CORRECT
 * <button onClick={async () => await openExternalUrl(url)}>
 *
 * // ❌ WRONG - Don't use these:
 * <button onClick={() => window.open(url, '_blank')}>
 * <a href={url} target="_blank">
 * ```
 *
 * Why this matters:
 * - Keeps frame navigation within Farcaster (expected UX)
 * - Handles mobile vs desktop differences correctly
 * - Prevents navigation interruption on desktop
 * - Maintains consistent behavior across all external links
 *
 * To add new frame domains, update the framePatterns array below.
 */

/**
 * Checks if a URL is a Farcaster frame/miniapp based on known patterns
 */
function isFarcasterFrame(url: string): boolean {
  const framePatterns = [
    'warpcast.com',
    'farverse.games',
    'frame.weponder.io',
    'polls.metadater.com',
    'nounspace.com',
    'zora.co',
    'paragraph.xyz',
    'degen.tips',
    'mint.fun',
    'ponder.sh',
    'events.xyz',
    'farcaster.vote',
    'launchcaster.xyz',
    'perl.xyz'
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if the URL matches any known frame patterns
    return framePatterns.some(pattern =>
      hostname.includes(pattern) || hostname.endsWith(pattern)
    );
  } catch {
    // If URL parsing fails, assume it's not a frame
    return false;
  }
}

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
      // Determine if this is a Farcaster frame URL
      const isFrame = isFarcasterFrame(url);

      // Check if we're on mobile (native app) vs desktop (web)
      const context = await sdk.context;
      const isMobileApp = context?.client?.platformType === 'mobile';

      console.log('Platform:', context?.client?.platformType, 'isMobile:', isMobileApp);

      if (isFrame && sdk.actions?.openMiniApp) {
        // For Farcaster frames, use openMiniApp to open within Farcaster
        console.log('Opening as Farcaster miniapp:', url);
        try {
          await sdk.actions.openMiniApp({ url });
        } catch (miniAppError) {
          console.error('Failed to open miniapp, falling back:', miniAppError);
          // Fallback to openUrl if miniapp opening fails
          if (sdk.actions?.openUrl) {
            await sdk.actions.openUrl(url);
          }
        }
      } else if (sdk.actions?.openUrl) {
        // For regular URLs, use openUrl (opens in browser)
        console.log('Opening as external URL:', url);
        await sdk.actions.openUrl(url);
      } else {
        // Final fallback
        window.open(url, '_system');
      }

      // Only close on mobile apps where it works correctly
      // On desktop, let Farcaster handle the transition naturally
      if (isMobileApp) {
        // Close the current miniapp after a small delay on mobile
        setTimeout(async () => {
          if (sdk.actions?.close) {
            try {
              console.log('Closing miniapp on mobile');
              await sdk.actions.close();
            } catch (closeError) {
              console.log('Could not close miniapp:', closeError);
            }
          }
        }, 100);
      } else {
        // On desktop, don't close - let the navigation happen naturally
        console.log('Desktop detected - not closing miniapp to allow navigation');
      }
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