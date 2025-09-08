/**
 * Asset Manager for efficient loading and caching of stickers and backgrounds
 * Inspired by Treasure Quest's performance optimizations
 */

export interface AssetConfig {
  id: string;
  src: string;
  type: 'sticker' | 'background';
  priority?: 'high' | 'medium' | 'low';
  fallback?: string;
}

export class AssetManager {
  private static instance: AssetManager;
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Map<string, Promise<HTMLImageElement>>();
  private readonly MAX_CACHE_SIZE = 30;
  private readonly BATCH_SIZE = 5;
  private loadQueue: AssetConfig[] = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Load image with caching and retry logic
   */
  async loadImage(src: string, retries = 3): Promise<HTMLImageElement> {
    // Check cache first
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Check if already loading
    if (this.loading.has(src)) {
      return this.loading.get(src)!;
    }

    // Start loading
    const loadPromise = this.loadWithRetry(src, retries);
    this.loading.set(src, loadPromise);

    try {
      const img = await loadPromise;
      this.addToCache(src, img);
      return img;
    } finally {
      this.loading.delete(src);
    }
  }

  private async loadWithRetry(src: string, retries: number): Promise<HTMLImageElement> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.loadSingleImage(src);
      } catch (error) {
        if (attempt === retries) {
          console.error(`Failed to load image after ${retries} attempts:`, src);
          // Return fallback image
          return this.loadFallbackImage();
        }
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 500)
        );
      }
    }
    throw new Error('Failed to load image');
  }

  private loadSingleImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private addToCache(key: string, img: HTMLImageElement) {
    // Implement LRU cache
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, img);
  }

  /**
   * Batch load assets with priority
   */
  async batchLoad(assets: AssetConfig[]): Promise<void> {
    // Sort by priority
    const sorted = assets.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']);
    });

    // Load in batches
    for (let i = 0; i < sorted.length; i += this.BATCH_SIZE) {
      const batch = sorted.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(asset => this.loadImage(asset.src)));
      
      // Small delay between batches to prevent blocking
      if (i + this.BATCH_SIZE < sorted.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Preload popular assets in background
   */
  preloadPopularAssets(urls: string[]) {
    // Load in background without blocking
    setTimeout(() => {
      urls.forEach((url, index) => {
        setTimeout(() => {
          this.loadImage(url).catch(() => {
            // Silently fail for preloads
          });
        }, index * 100); // Stagger loading
      });
    }, 1000);
  }

  /**
   * Clear cache for memory management
   */
  clearCache(keepKeys?: string[]) {
    if (keepKeys) {
      const keep = new Set(keepKeys);
      Array.from(this.cache.keys()).forEach(key => {
        if (!keep.has(key)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      loading: this.loading.size,
      keys: Array.from(this.cache.keys())
    };
  }

  private loadFallbackImage(): HTMLImageElement {
    const img = new Image();
    // Create a simple colored rectangle as fallback
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#44D0A7';
    ctx.fillRect(0, 0, 100, 100);
    img.src = canvas.toDataURL();
    return img;
  }
}

/**
 * Object Pool for Fabric.js objects
 */
export class FabricObjectPool {
  private pools = new Map<string, any[]>();
  private readonly MAX_POOL_SIZE = 20;

  get<T>(type: string, createFn: () => T): T {
    const pool = this.pools.get(type) || [];
    
    if (pool.length > 0) {
      return pool.pop();
    }
    
    return createFn();
  }

  release(type: string, obj: any) {
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }
    
    const pool = this.pools.get(type)!;
    if (pool.length < this.MAX_POOL_SIZE) {
      // Reset object state
      if (obj.set) {
        obj.set({
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
          angle: 0
        });
      }
      pool.push(obj);
    }
  }

  clear() {
    this.pools.clear();
  }
}

// Export singleton instance
export const assetManager = AssetManager.getInstance();
export const fabricObjectPool = new FabricObjectPool();