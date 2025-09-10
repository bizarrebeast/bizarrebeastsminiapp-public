/**
 * Mobile touch utilities for handling touch events safely
 */

/**
 * Detect if device supports touch
 */
export const isMobileTouch = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return ('ontouchstart' in window) || 
         (navigator.maxTouchPoints > 0) ||
         (window.matchMedia?.("(pointer: coarse)").matches) ||
         false;
};

/**
 * Detect if user agent is mobile device
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || '';
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
};

/**
 * Prevent all event defaults and propagation
 */
export const preventEventDefaults = (e: Event | React.SyntheticEvent): void => {
  if (!e) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  // For native events
  if ('stopImmediatePropagation' in e) {
    (e as Event).stopImmediatePropagation();
  }
  
  // For React synthetic events
  if ('nativeEvent' in e && e.nativeEvent) {
    const nativeEvent = e.nativeEvent as Event;
    if ('stopImmediatePropagation' in nativeEvent) {
      nativeEvent.stopImmediatePropagation();
    }
  }
};

/**
 * Debounce function to prevent rapid clicks
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit execution rate
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};