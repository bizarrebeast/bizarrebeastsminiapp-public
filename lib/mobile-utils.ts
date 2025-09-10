/**
 * Mobile utility functions for handling downloads and shares
 */

/**
 * Download image on mobile devices
 * Handles different mobile browsers and WebView environments
 */
export async function downloadImageMobile(dataURL: string, filename: string) {
  try {
    // Convert data URL to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();
    
    // Try different download methods
    if ('share' in navigator && /mobile/i.test(navigator.userAgent)) {
      // Use Web Share API if available (works on mobile)
      try {
        const file = new File([blob], filename, { type: blob.type });
        await navigator.share({
          files: [file],
          title: 'Download Meme',
        });
        return true;
      } catch (shareError) {
        console.log('Web Share API failed, trying other methods');
      }
    }

    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);
    
    // Try creating an anchor element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Try click
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Mobile download failed:', error);
    
    // Last resort - open in new tab
    const newTab = window.open(dataURL, '_blank');
    if (newTab) {
      // Show instruction to user
      alert('Long press the image and select "Save Image" to download');
      return true;
    }
    
    return false;
  }
}

/**
 * Check if running in Farcaster app
 */
export function isInFarcasterApp(): boolean {
  // Check for Farcaster-specific user agent or window properties
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('farcaster') ||
    window.location.hostname.includes('farcaster') ||
    // Check if we're in an iframe (common for miniapps)
    window.parent !== window
  );
}

/**
 * Check if on mobile device
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  ) || window.innerWidth < 768;
}