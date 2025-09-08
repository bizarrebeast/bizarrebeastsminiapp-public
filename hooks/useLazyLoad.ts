/**
 * Lazy loading hook for efficient asset loading
 * Based on Treasure Quest's progressive loading strategy
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useLazyLoad<T extends HTMLElement>(
  options: LazyLoadOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if already loaded and triggerOnce is true
    if (hasLoaded && triggerOnce) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (triggerOnce) {
              setHasLoaded(true);
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasLoaded]);

  return { ref, isInView, hasLoaded };
}

/**
 * Hook for batch loading assets
 */
export function useBatchLoader<T>(
  items: T[],
  batchSize: number = 5,
  delay: number = 100
) {
  const [loadedItems, setLoadedItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;

    setIsLoading(true);
    const loadBatch = async () => {
      const start = currentBatch * batchSize;
      const end = Math.min(start + batchSize, items.length);
      const batch = items.slice(start, end);

      setLoadedItems(prev => [...prev, ...batch]);

      if (end < items.length) {
        setTimeout(() => {
          setCurrentBatch(prev => prev + 1);
        }, delay);
      } else {
        setIsLoading(false);
      }
    };

    loadBatch();
  }, [currentBatch, items, batchSize, delay]);

  return { loadedItems, isLoading, progress: loadedItems.length / items.length };
}

/**
 * Hook for progressive image loading with skeleton
 */
export function useProgressiveImage(src: string, placeholder?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { src: currentSrc, isLoading, error };
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex
  };
}