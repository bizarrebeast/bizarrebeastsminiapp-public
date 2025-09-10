# Lazy Loading Implementation Plan for BizarreBeasts Miniapp

## Executive Summary

This document outlines a comprehensive plan to implement lazy loading throughout the BizarreBeasts miniapp while maintaining all current functionality, especially the critical Farcaster SDK integration.

**Key Goals:**
- Reduce initial bundle size by 70% (from 661 KB to ~200 KB for meme generator)
- Maintain bulletproof Farcaster SDK functionality
- Improve Time to Interactive by 2-3 seconds
- Preserve all existing features and user experience

---

## Current State Analysis

### Bundle Size Breakdown

| Page | Current Size | Main Contributors |
|------|-------------|-------------------|
| Meme Generator | 661 KB | Fabric.js (565 KB), Canvas components |
| Swap | 555 KB | Web3 libraries (1.4 MB shared) |
| Home | 111 KB | Base components |
| Other Pages | 107-112 KB | Standard components |

### Heavy Dependencies

1. **Fabric.js**: 565 KB - Only used in meme generator
2. **Ethers/Web3**: 1.4 MB - Used for wallet features
3. **Farcaster SDK**: 45.5 KB - MUST remain eager loaded
4. **Image Assets**: 324 MB total (272 files)

---

## Implementation Strategy

### Phase 1: Quick Wins (1-2 days)
**Goal: 70% reduction in meme generator bundle**

#### 1.1 Lazy Load Fabric.js Canvas

```typescript
// app/meme-generator/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the entire canvas component
const MemeCanvas = dynamic(
  () => import('@/components/canvas/MemeCanvas'),
  {
    loading: () => <CanvasSkeleton />,
    ssr: false // Fabric.js doesn't support SSR
  }
);

// Create a skeleton loader
const CanvasSkeleton = () => (
  <div className="w-full h-[500px] bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      <p className="mt-4 text-gray-400">Loading meme canvas...</p>
    </div>
  </div>
);
```

#### 1.2 Split Canvas Sub-Components

```typescript
// components/canvas/index.ts
import dynamic from 'next/dynamic';

export const StickerGallery = dynamic(
  () => import('./StickerGallery'),
  { loading: () => <div className="h-32 bg-gray-700 animate-pulse rounded" /> }
);

export const TextControls = dynamic(
  () => import('./TextControls'),
  { loading: () => <div className="h-24 bg-gray-700 animate-pulse rounded" /> }
);

export const ExportControls = dynamic(
  () => import('./ExportControls'),
  { loading: () => <div className="h-20 bg-gray-700 animate-pulse rounded" /> }
);

export const BackgroundSelector = dynamic(
  () => import('./BackgroundSelector')
);
```

#### 1.3 Lazy Load Sticker Collections

```typescript
// hooks/useStickerCollection.ts
import { useState, useEffect } from 'react';

export const useStickerCollection = (collectionId: string) => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionId) return;

    setLoading(true);
    setError(null);

    // Dynamic import based on collection
    const loadStickers = async () => {
      try {
        // First try to load metadata
        const response = await fetch(`/assets/stickers/${collectionId}/metadata.json`);
        
        if (response.ok) {
          const metadata = await response.json();
          const loadedStickers = metadata.stickers.map((sticker: any) => ({
            id: sticker.id,
            src: `/assets/stickers/${collectionId}/${sticker.filename}`,
            thumbnail: `/assets/stickers/${collectionId}/${sticker.filename}`,
            name: sticker.name,
            tags: sticker.tags,
            category: sticker.category,
            collection: collectionId,
            tier: sticker.tier
          }));
          setStickers(loadedStickers);
        }
      } catch (err) {
        setError(err);
        console.error('Failed to load stickers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStickers();
  }, [collectionId]);

  return { stickers, loading, error };
};
```

### Phase 2: Web3 Optimization (2-3 days)
**Goal: Defer Web3 loading until needed**

#### 2.1 Lazy Initialize Web3

```typescript
// hooks/useWallet.ts
import { useState, useCallback } from 'react';

export const useWallet = () => {
  const [web3Service, setWeb3Service] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeWeb3 = useCallback(async () => {
    if (web3Service || isInitializing) return web3Service;

    setIsInitializing(true);
    try {
      // Dynamic import only when needed
      const { Web3Service } = await import('@/lib/web3');
      const service = new Web3Service();
      await service.init();
      setWeb3Service(service);
      return service;
    } finally {
      setIsInitializing(false);
    }
  }, [web3Service, isInitializing]);

  const connectWallet = useCallback(async () => {
    const service = await initializeWeb3();
    return service?.connect();
  }, [initializeWeb3]);

  return {
    web3Service,
    connectWallet,
    isInitializing,
    // Other wallet methods...
  };
};
```

#### 2.2 Lazy Load Swap Components

```typescript
// app/swap/page.tsx
import dynamic from 'next/dynamic';

const SwapInterface = dynamic(
  () => import('@/components/swap/SwapInterface'),
  {
    loading: () => <SwapSkeleton />,
    ssr: false
  }
);

const SwapSkeleton = () => (
  <div className="max-w-md mx-auto">
    <div className="bg-gray-800 rounded-xl p-6 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-gray-700 rounded animate-pulse" />
      ))}
    </div>
  </div>
);
```

### Phase 3: Image Optimization (1-2 days)
**Goal: Progressive image loading**

#### 3.1 Create LazyImage Component

```typescript
// components/ui/LazyImage.tsx
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
}

export const LazyImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  placeholder,
  priority = false 
}: LazyImageProps) => {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before in view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setHasLoaded(true)}
          className={`transition-opacity duration-300 ${
            hasLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        placeholder || (
          <div 
            className="bg-gray-700 animate-pulse"
            style={{ width, height }}
          />
        )
      )}
    </div>
  );
};
```

#### 3.2 Optimize Sticker Gallery Loading

```typescript
// components/canvas/StickerGallery.tsx
import { LazyImage } from '@/components/ui/LazyImage';
import { useStickerCollection } from '@/hooks/useStickerCollection';

const StickerGallery = ({ collectionId, onSelectSticker }) => {
  const { stickers, loading } = useStickerCollection(collectionId);
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {loading ? (
        // Show skeletons while loading
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-700 animate-pulse rounded" />
        ))
      ) : (
        stickers.map(sticker => (
          <button
            key={sticker.id}
            onClick={() => onSelectSticker(sticker)}
            className="p-1 hover:bg-purple-600/40 rounded transition"
          >
            <LazyImage
              src={sticker.thumbnail}
              alt={sticker.name}
              width={64}
              height={64}
              priority={false}
            />
          </button>
        ))
      )}
    </div>
  );
};
```

### Phase 4: Route-Level Splitting (2 days)
**Goal: Split code by routes**

#### 4.1 Implement Route Wrappers

```typescript
// app/meme-generator/page.tsx
import dynamic from 'next/dynamic';

const MemeGeneratorPage = dynamic(
  () => import('./MemeGeneratorContent'),
  {
    loading: () => <PageLoader />,
  }
);

export default function Page() {
  return <MemeGeneratorPage />;
}
```

#### 4.2 Create Preload Strategies

```typescript
// hooks/usePreload.ts
export const usePreload = () => {
  const preloadMemeGenerator = useCallback(() => {
    // Preload when hovering over link
    import('@/components/canvas/MemeCanvas');
    import('fabric');
  }, []);

  const preloadSwap = useCallback(() => {
    import('@/lib/web3');
    import('@/components/swap/SwapInterface');
  }, []);

  return { preloadMemeGenerator, preloadSwap };
};

// Usage in navigation
<Link 
  href="/meme-generator"
  onMouseEnter={preloadMemeGenerator}
  onTouchStart={preloadMemeGenerator}
>
  Meme Generator
</Link>
```

---

## Critical: What MUST Stay Eager Loaded

### 1. Farcaster SDK Integration
```typescript
// app/layout.tsx - KEEP AS IS
import "@/lib/sdk-ultimate"; // MUST remain eager for miniapp detection
```

### 2. Core Providers
```typescript
// These must wrap the app immediately
<FarcasterProvider>
  <SDKProvider>
    {children}
  </SDKProvider>
</FarcasterProvider>
```

### 3. Essential Navigation
- Navbar component
- Basic routing
- Core layout styles

### 4. Critical Hooks
- `useFarcasterSDK` - Needed for SDK state
- Basic auth checks

---

## Testing Strategy

### 1. Performance Testing
```bash
# Before implementation
npm run build
# Note bundle sizes

# After each phase
npm run build
# Compare bundle sizes

# Test with Lighthouse
# Target metrics:
# - First Contentful Paint < 1.5s
# - Time to Interactive < 3.5s
# - Total Blocking Time < 200ms
```

### 2. Functionality Testing

#### Critical Path Tests
1. **Farcaster SDK**: Share must work on first click
2. **Canvas Loading**: All tools must be available after load
3. **Wallet Connection**: Must work when triggered
4. **Image Loading**: Stickers must appear when selected

#### Edge Cases
1. Slow network (throttle to 3G)
2. Component fails to load (network error)
3. User navigates quickly between pages
4. Cold start from Farcaster app

### 3. Mobile Testing
- Test on actual devices
- Verify touch events still work
- Check SDK initialization on cold start
- Confirm share functionality

---

## Rollout Plan

### Week 1: Phase 1 Implementation
- Day 1-2: Implement fabric.js lazy loading
- Day 3: Test thoroughly on staging
- Day 4: Deploy to production with monitoring

### Week 2: Phase 2 & 3
- Day 1-2: Implement Web3 lazy loading
- Day 3-4: Add image optimization
- Day 5: Comprehensive testing

### Week 3: Phase 4 & Optimization
- Day 1-2: Route-level splitting
- Day 3: Performance testing
- Day 4-5: Final optimization and deployment

---

## Expected Results

### Performance Improvements

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Initial Bundle (Meme Gen) | 661 KB | 200 KB | 70% reduction |
| First Load Time | 5-6s | 2-3s | 50% faster |
| Time to Interactive | 4-5s | 2-3s | 40% faster |
| Memory Usage | High | Medium | 30% reduction |

### User Experience Benefits
- Faster initial page load
- Smoother navigation between pages
- Better performance on slower devices
- Reduced data usage for mobile users

---

## Risk Mitigation

### Potential Issues & Solutions

1. **SDK Initialization Timing**
   - Risk: Lazy loading breaks SDK
   - Mitigation: Keep SDK eager, test thoroughly

2. **Canvas Features Not Available**
   - Risk: User clicks before load
   - Mitigation: Clear loading states, disable buttons

3. **SEO Impact**
   - Risk: Dynamic loading affects SEO
   - Mitigation: Use Next.js dynamic with SSR where possible

4. **Development Complexity**
   - Risk: Harder to maintain
   - Mitigation: Clear documentation, consistent patterns

---

## Monitoring & Metrics

### Key Metrics to Track
1. Bundle size per route
2. Load time percentiles (P50, P90, P99)
3. SDK initialization success rate
4. Component load failures
5. User engagement metrics

### Tools
- Vercel Analytics
- Lighthouse CI
- Sentry for error tracking
- Custom performance marks

---

## Conclusion

This lazy loading implementation will significantly improve the BizarreBeasts miniapp performance while maintaining all current functionality. The phased approach ensures we can validate improvements at each step without risking the stable production environment.

The key is maintaining the bulletproof Farcaster SDK initialization while optimizing everything else. With careful implementation and testing, we can achieve a 70% reduction in initial bundle size and 50% improvement in load times.