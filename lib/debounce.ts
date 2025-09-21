/**
 * Debounce utility function
 * Delays the execution of a function until after a specified delay has passed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Debounce with promise support
 * Returns a promise that resolves when the debounced function executes
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  } | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If there's a pending promise, reject it
      if (pendingPromise) {
        pendingPromise.reject(new Error('Debounced'));
      }

      pendingPromise = { resolve, reject };

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (pendingPromise) {
            pendingPromise.resolve(result);
          }
        } catch (error) {
          if (pendingPromise) {
            pendingPromise.reject(error);
          }
        } finally {
          timeoutId = null;
          pendingPromise = null;
        }
      }, delay);
    });
  };
}

/**
 * Throttle utility function
 * Ensures a function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}