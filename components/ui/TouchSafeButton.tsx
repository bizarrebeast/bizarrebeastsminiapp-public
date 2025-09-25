'use client';

import React, { useCallback, useRef } from 'react';
import { preventEventDefaults } from '@/utils/mobile';

interface TouchSafeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  preventDoubleTap?: boolean;
}

/**
 * Touch-safe button component that prevents event propagation
 * and handles both touch and click events properly
 */
export const TouchSafeButton: React.FC<TouchSafeButtonProps> = ({
  onClick,
  children,
  preventDoubleTap = true,
  style,
  ...props
}) => {
  const lastTapTime = useRef<number>(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isScrolling = useRef<boolean>(false);

  const handleInteraction = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // For touchend events, check if user was scrolling
    if (e.type === 'touchend' && isScrolling.current) {
      // User was scrolling, don't trigger action
      touchStartPos.current = null;
      isScrolling.current = false;
      return;
    }

    // Always prevent defaults and propagation
    preventEventDefaults(e);

    if (preventDoubleTap) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      // Ignore if tapped within 300ms (prevent double tap)
      if (timeSinceLastTap < 300) {
        console.log('Ignoring rapid tap');
        return;
      }

      lastTapTime.current = now;
    }

    // Clear any pending timeout
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
    }

    // Only fire onClick for actual clicks or touchend (when not scrolling)
    if (e.type === 'click' || (e.type === 'touchend' && !isScrolling.current)) {
      // Small delay to ensure touch events are processed
      tapTimeout.current = setTimeout(() => {
        onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      }, 10);
    }

    // Reset touch tracking
    touchStartPos.current = null;
    isScrolling.current = false;
  }, [onClick, preventDoubleTap]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    // Record touch start position
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isScrolling.current = false;

    // Just prevent defaults, don't trigger action
    preventEventDefaults(e);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    // Check if user is scrolling
    if (touchStartPos.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

      // If finger moved more than 10 pixels, consider it scrolling
      if (deltaX > 10 || deltaY > 10) {
        isScrolling.current = true;
        // Cancel any pending action
        if (tapTimeout.current) {
          clearTimeout(tapTimeout.current);
          tapTimeout.current = null;
        }
      }
    }

    // Don't prevent default to allow scrolling
    // preventEventDefaults(e);
  }, []);

  return (
    <button
      {...props}
      onClick={handleInteraction}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleInteraction}
      style={{ 
        touchAction: 'manipulation', // Disable double-tap zoom
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight
        WebkitTouchCallout: 'none', // Disable callout menu
        WebkitUserSelect: 'none', // Disable text selection
        userSelect: 'none',
        cursor: 'pointer',
        ...style 
      }}
    >
      {children}
    </button>
  );
};