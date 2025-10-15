'use client';

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Paintings with titles
const paintings = [
  { src: '/assets/paintings/1 EYED GUY.jpg', title: '1 Eyed Guy' },
  { src: '/assets/paintings/A GUY AND HIS CAT.jpg', title: 'A Guy and His Cat' },
  { src: '/assets/paintings/ABORIGINE.jpg', title: 'Aborigine' },
  { src: '/assets/paintings/BEAST BIDET copy.jpg', title: 'Beast Bidet' },
  { src: '/assets/paintings/BIZARRE BAZAAR.jpg', title: 'Bizarre Bazaar' },
  { src: '/assets/paintings/BOUNCER.jpg', title: 'Bouncer' },
  { src: '/assets/paintings/BRAIN PAIN.jpg', title: 'Brain Pain' },
  { src: '/assets/paintings/BULL, FIGHTER copy.jpg', title: 'Bull, Fighter' },
  { src: '/assets/paintings/CAMPFIRE STORIES.jpg', title: 'Campfire Stories' },
  { src: '/assets/paintings/CELLULAR.jpg', title: 'Cellular' },
  { src: '/assets/paintings/CONFUCIUS.jpg', title: 'Confucius' },
  { src: '/assets/paintings/DESERT TOTEMS.jpg', title: 'Desert Totems' },
  { src: '/assets/paintings/ENOUGH BULLSHIT.jpg', title: 'Enough Bullshit' },
  { src: '/assets/paintings/ESCALATOR.jpg', title: 'Escalator' },
  { src: '/assets/paintings/EYES OKAY.jpg', title: 'Eyes Okay' },
  { src: '/assets/paintings/FACE PLANT.jpg', title: 'Face Plant' },
  { src: '/assets/paintings/GRILLIN.jpg', title: 'Grillin' },
  { src: '/assets/paintings/MUNCHIES.jpg', title: 'Munchies' },
  { src: '/assets/paintings/MUSHROOMS- C_455_DJY copy.jpg', title: 'Mushrooms' },
  { src: '/assets/paintings/OFFICE BREAKROOM.jpg', title: 'Office Breakroom' },
  { src: '/assets/paintings/PLANTSTAN.jpg', title: 'Plantstan' },
  { src: '/assets/paintings/PORTRAIT OF A PAINTER copy.jpg', title: 'Portrait of a Painter' },
  { src: '/assets/paintings/PUT ON YOUR FACE.jpg', title: 'Put On Your Face' },
  { src: '/assets/paintings/RATTLESNAKE copy.png', title: 'Rattlesnake' },
  { src: '/assets/paintings/RED EYE.jpg', title: 'Red Eye' },
  { src: '/assets/paintings/SERAPE.jpg', title: 'Serape' },
  { src: '/assets/paintings/SOME GUY.jpg', title: 'Some Guy' },
  { src: '/assets/paintings/THAT DARN CAT.jpg', title: 'That Darn Cat' },
  { src: '/assets/paintings/THE AUDIENCE.jpg', title: 'The Audience' },
  { src: '/assets/paintings/THE CAVE.jpg', title: 'The Cave' },
  { src: '/assets/paintings/THE CONVERSATION.jpg', title: 'The Conversation' },
  { src: '/assets/paintings/THE FLORIST etsy.jpg', title: 'The Florist' },
  { src: '/assets/paintings/THE GURU.jpg', title: 'The Guru' },
  { src: '/assets/paintings/THE JOURNEY.jpg', title: 'The Journey' },
  { src: '/assets/paintings/THE SNAKE CHARMER copy SMALLER.jpg', title: 'The Snake Charmer' },
  { src: '/assets/paintings/THE STRANGLER.jpg', title: 'The Strangler' },
  { src: '/assets/paintings/THE THREE etsy.jpg', title: 'The Three' },
  { src: '/assets/paintings/UNCHILL PILL.jpg', title: 'Unchill Pill' },
];

const IMAGES_PER_PAGE = 12;

export default function GalleryClient() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(IMAGES_PER_PAGE);

  const openLightbox = (painting: { src: string; title: string }, index: number) => {
    setSelectedImage(painting);
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
      const nextIndex = (selectedIndex + 1) % paintings.length;
      setSelectedIndex(nextIndex);
      setSelectedImage(paintings[nextIndex]);
    }
  };

  const previousImage = () => {
    if (selectedIndex !== null) {
      const prevIndex = (selectedIndex - 1 + paintings.length) % paintings.length;
      setSelectedIndex(prevIndex);
      setSelectedImage(paintings[prevIndex]);
    }
  };

  const getPaintingTitle = (title: string) => {
    // Clean up the title for display
    return title;
  };

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + IMAGES_PER_PAGE, paintings.length));
  };

  const displayedPaintings = paintings.slice(0, displayCount);
  const hasMore = displayCount < paintings.length;

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
              Canvas Paintings Gallery
            </h1>
            <p className="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
              Original acrylic and mixed media paintings by Dylan available for purchase. More works are listed in the TheBazaarStudio.com Gallery.
            </p>
            <Link
              href="https://www.thebazaarstudio.com/dylan-yarter-portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <ExternalLink className="w-5 h-5" />
              Visit TheBazaarStudio.com Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedPaintings.map((painting, displayIndex) => {
              const actualIndex = paintings.indexOf(painting);
              return (
              <div
                key={actualIndex}
                onClick={() => openLightbox(painting, actualIndex)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gem-crystal/10 hover:border-gem-gold/50 transition-all duration-300 cursor-pointer bg-dark-card"
              >
                <Image
                  src={painting.src}
                  alt={painting.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-all duration-300 group-hover:brightness-110"
                  loading={displayIndex < IMAGES_PER_PAGE ? "eager" : "lazy"}
                  priority={displayIndex < 8}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4 px-2">
                  <span className="text-white font-bold text-sm text-center mb-1">{painting.title}</span>
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
                Load More ({paintings.length - displayCount} remaining)
              </button>
            </div>
          )}

          {/* Count Display */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            Showing {displayCount} of {paintings.length} paintings
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
              {selectedIndex !== null ? selectedIndex + 1 : 0} / {paintings.length}
            </span>
          </div>

          {/* Image with Title */}
          <div className="flex flex-col items-center max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative max-w-[90vw] max-h-[85vh] mb-4">
              <Image
                src={selectedImage.src}
                alt={selectedImage.title}
                width={1200}
                height={1200}
                className="max-w-full max-h-[85vh] object-contain"
                quality={90}
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-white bg-dark-card/80 px-6 py-3 rounded-full border border-gem-gold/30">
              {selectedImage.title}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}
