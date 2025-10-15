'use client';

import { useState } from 'react';
import { X, ExternalLink, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// All 97 illustrations with SEO-friendly filenames
const illustrations = [
  'dylan-yarter-ink-illustration-all-seeing-siamese.jpg',
  'dylan-yarter-ink-illustration-at-long-lash.jpg',
  'dylan-yarter-ink-illustration-butterflies.jpg',
  'dylan-yarter-ink-illustration-donnie-donkey.jpg',
  'dylan-yarter-ink-illustration-ellis.jpg',
  'dylan-yarter-ink-illustration-magic-man.jpg',
  'dylan-yarter-ink-illustration-mushroom-01.jpg',
  'dylan-yarter-ink-illustration-mushroom-02.jpg',
  'dylan-yarter-ink-illustration-mushroom-03.jpg',
  'dylan-yarter-ink-illustration-mushroom-04.jpg',
  'dylan-yarter-ink-illustration-mushroom-05.jpg',
  'dylan-yarter-ink-illustration-mushroom-06.jpg',
  'dylan-yarter-ink-illustration-mushroom-07.jpg',
  'dylan-yarter-ink-illustration-palm-reader.jpg',
  'dylan-yarter-ink-illustration-third-eye-kitty.jpg',
  'dylan-yarter-ink-illustration-wake-up.jpg',
  'dylan-yarter-paper-illustration-001.jpg',
  'dylan-yarter-paper-illustration-002.jpg',
  'dylan-yarter-paper-illustration-003.jpg',
  'dylan-yarter-paper-illustration-004.jpg',
  'dylan-yarter-paper-illustration-005.jpg',
  'dylan-yarter-paper-illustration-006.jpg',
  'dylan-yarter-paper-illustration-007.jpg',
  'dylan-yarter-paper-illustration-008.jpg',
  'dylan-yarter-paper-illustration-009.jpg',
  'dylan-yarter-paper-illustration-010.jpg',
  'dylan-yarter-paper-illustration-011.jpg',
  'dylan-yarter-paper-illustration-012.jpg',
  'dylan-yarter-paper-illustration-013.jpg',
  'dylan-yarter-paper-illustration-014.jpg',
  'dylan-yarter-paper-illustration-015.jpg',
  'dylan-yarter-paper-illustration-016.jpg',
  'dylan-yarter-paper-illustration-017.jpg',
  'dylan-yarter-paper-illustration-018.jpg',
  'dylan-yarter-paper-illustration-019.jpg',
  'dylan-yarter-paper-illustration-020.jpg',
  'dylan-yarter-paper-illustration-021.jpg',
  'dylan-yarter-paper-illustration-022.jpg',
  'dylan-yarter-paper-illustration-023.jpg',
  'dylan-yarter-paper-illustration-024.jpg',
  'dylan-yarter-paper-illustration-025.jpg',
  'dylan-yarter-paper-illustration-026.jpg',
  'dylan-yarter-paper-illustration-027.jpg',
  'dylan-yarter-paper-illustration-028.jpg',
  'dylan-yarter-paper-illustration-029.jpg',
  'dylan-yarter-paper-illustration-030.jpg',
  'dylan-yarter-paper-illustration-031.jpg',
  'dylan-yarter-paper-illustration-032.jpg',
  'dylan-yarter-paper-illustration-033.jpg',
  'dylan-yarter-paper-illustration-034.jpg',
  'dylan-yarter-paper-illustration-035.jpg',
  'dylan-yarter-paper-illustration-036.jpg',
  'dylan-yarter-paper-illustration-037.jpg',
  'dylan-yarter-paper-illustration-038.jpg',
  'dylan-yarter-paper-illustration-039.jpg',
  'dylan-yarter-paper-illustration-040.jpg',
  'dylan-yarter-paper-illustration-041.jpg',
  'dylan-yarter-paper-illustration-042.jpg',
  'dylan-yarter-paper-illustration-043.jpg',
  'dylan-yarter-paper-illustration-044.jpg',
  'dylan-yarter-paper-illustration-045.jpg',
  'dylan-yarter-paper-illustration-046.jpg',
  'dylan-yarter-paper-illustration-047.jpg',
  'dylan-yarter-paper-illustration-048.jpg',
  'dylan-yarter-paper-illustration-049.jpg',
  'dylan-yarter-paper-illustration-050.jpg',
  'dylan-yarter-paper-illustration-051.jpg',
  'dylan-yarter-paper-illustration-052.jpg',
  'dylan-yarter-paper-illustration-053.jpg',
  'dylan-yarter-paper-illustration-054.jpg',
  'dylan-yarter-paper-illustration-055.jpg',
  'dylan-yarter-paper-illustration-056.jpg',
  'dylan-yarter-paper-illustration-057.jpg',
  'dylan-yarter-paper-illustration-058.jpg',
  'dylan-yarter-paper-illustration-059.jpg',
  'dylan-yarter-paper-illustration-060.jpg',
  'dylan-yarter-paper-illustration-061.jpg',
  'dylan-yarter-paper-illustration-062.jpg',
  'dylan-yarter-paper-illustration-063.jpg',
  'dylan-yarter-paper-illustration-064.jpg',
  'dylan-yarter-paper-illustration-065.jpg',
  'dylan-yarter-paper-illustration-066.jpg',
  'dylan-yarter-paper-illustration-067.jpg',
  'dylan-yarter-paper-illustration-068.jpg',
  'dylan-yarter-paper-illustration-069.jpg',
  'dylan-yarter-paper-illustration-070.jpg',
  'dylan-yarter-paper-illustration-071.jpg',
  'dylan-yarter-paper-illustration-072.jpg',
  'dylan-yarter-paper-illustration-073.jpg',
  'dylan-yarter-paper-illustration-074.jpg',
  'dylan-yarter-paper-illustration-075.jpg',
  'dylan-yarter-paper-illustration-076.jpg',
  'dylan-yarter-paper-illustration-077.jpg',
  'dylan-yarter-paper-illustration-078.jpg',
  'dylan-yarter-paper-illustration-079.jpg',
  'dylan-yarter-paper-illustration-080.jpg',
  'dylan-yarter-paper-illustration-081.png',
];

const IMAGES_PER_PAGE = 20;

export default function IllustrationsClient() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(IMAGES_PER_PAGE);

  const openLightbox = (filename: string, index: number) => {
    setSelectedImage(filename);
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setSelectedIndex(null);
    document.body.style.overflow = 'auto';
  };

  const nextImage = () => {
    if (selectedIndex !== null) {
      const nextIndex = (selectedIndex + 1) % illustrations.length;
      setSelectedIndex(nextIndex);
      setSelectedImage(illustrations[nextIndex]);
    }
  };

  const previousImage = () => {
    if (selectedIndex !== null) {
      const prevIndex = (selectedIndex - 1 + illustrations.length) % illustrations.length;
      setSelectedIndex(prevIndex);
      setSelectedImage(illustrations[prevIndex]);
    }
  };

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + IMAGES_PER_PAGE, illustrations.length));
  };

  const displayedIllustrations = illustrations.slice(0, displayCount);
  const hasMore = displayCount < illustrations.length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg overflow-x-hidden max-w-full">
      {/* Header */}
      <section className="px-4 pt-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <Link href="/about" className="inline-block mb-6 text-gem-crystal hover:text-gem-gold transition-colors text-sm">
            ← Back to About
          </Link>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
              Paper Illustrations Gallery
            </h1>
            <p className="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
              Original black and white ink illustrations on paper by Dylan. Featuring surreal characters, mushrooms, still life, portraiture, abstract, and BizarreBeasts.
            </p>
            <Link
              href="https://www.thebazaarstudio.com/the-bazaar-studio-shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Shop Original Illustrations
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayedIllustrations.map((filename, displayIndex) => {
              const actualIndex = illustrations.indexOf(filename);
              return (
              <div
                key={filename}
                onClick={() => openLightbox(filename, actualIndex)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gem-crystal/10 hover:border-gem-gold/50 transition-all duration-300 cursor-pointer bg-dark-card"
              >
                <Image
                  src={`/assets/illustrations/${filename}`}
                  alt={`Illustration ${filename.replace('.jpg', '')}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover transition-all duration-300 group-hover:brightness-110"
                  loading={displayIndex < IMAGES_PER_PAGE ? "eager" : "lazy"}
                  priority={displayIndex < 8}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4 px-2">
                  <span className="text-gem-crystal text-xs">View Full Size</span>
                </div>
              </div>
            );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                className="px-8 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg rounded-lg font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                Load More ({illustrations.length - displayCount} remaining)
              </button>
            </div>
          )}

          {/* Count Display */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            Showing {displayCount} of {illustrations.length} illustrations
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 bg-dark-card/80 hover:bg-dark-card rounded-full border border-gem-crystal/20 hover:border-gem-gold transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              previousImage();
            }}
            className="absolute left-4 z-10 p-3 bg-dark-card/80 hover:bg-dark-card rounded-full border border-gem-crystal/20 hover:border-gem-gold transition-all"
          >
            <span className="text-white text-2xl">‹</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 z-10 p-3 bg-dark-card/80 hover:bg-dark-card rounded-full border border-gem-crystal/20 hover:border-gem-gold transition-all"
          >
            <span className="text-white text-2xl">›</span>
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-dark-card/80 px-4 py-2 rounded-full border border-gem-crystal/20">
            <span className="text-white text-sm font-semibold">
              {selectedIndex !== null ? selectedIndex + 1 : 0} / {illustrations.length}
            </span>
          </div>

          {/* Shop CTA - Top */}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href="https://www.thebazaarstudio.com/the-bazaar-studio-shop"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg rounded-full font-semibold hover:opacity-90 transition-all text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Shop Original Art
            </Link>
          </div>

          {/* Image with Title */}
          <div className="flex flex-col items-center max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative max-w-[90vw] max-h-[80vh]">
              <Image
                src={`/assets/illustrations/${selectedImage}`}
                alt={`Illustration ${selectedImage.replace('.jpg', '')}`}
                width={1200}
                height={1200}
                className="max-w-full max-h-[80vh] object-contain"
                quality={90}
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
