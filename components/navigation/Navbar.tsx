'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Palette, Gamepad2, FileText, Crown, ArrowDownUp, Music, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WalletButton } from '@/components/wallet/WalletButton';
import { EmpireBadges } from '@/components/wallet/EmpireBadges';

// Navigation items in order
const navItems = [
  { href: '/meme-generator', label: 'Stickers & Meme Creator', icon: Palette },
  { href: '/games', label: 'BizarreBeasts Games', icon: Gamepad2 },
  { href: '/rituals', label: 'BIZARRE Rituals', icon: Sparkles },
  { href: '/swap', label: 'Token Swap', icon: ArrowDownUp },
  { href: '/empire', label: 'Empire Leaderboard', icon: Crown },
  { href: '/music', label: 'Music & Soundtracks', icon: Music },
  { href: '/resources', label: 'Community Resources', icon: FileText },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <nav className="bg-dark-panel border-b border-gem-crystal/20 relative" ref={menuRef}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - clickable to go home */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 group">
              <img 
                src="/assets/page-assets/logos/bizarrebeasts-miniapp-logo.svg" 
                alt="BizarreBeasts Logo" 
                className="w-10 h-10 sm:w-8 sm:h-8 object-contain rounded-lg transition-all duration-300 group-hover:scale-110"
              />
              <span className="hidden sm:inline bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-bold text-xl group-hover:from-gem-gold group-hover:via-gem-pink group-hover:to-gem-crystal transition-all duration-300">
                BizarreBeasts
              </span>
            </Link>
          </div>

          {/* Right side - Badges, Wallet and Hamburger */}
          <div className="flex items-center gap-3">
            <EmpireBadges />
            <WalletButton />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2 hover:opacity-80 focus:outline-none transition-all duration-300 rounded-lg overflow-hidden group"
              aria-label="Menu"
            >
              {/* Gradient background that shows on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink opacity-0 group-hover:opacity-10 transition-opacity" />
              
              {/* Icon with gradient color */}
              {isOpen ? (
                <X className="w-6 h-6 text-gem-pink relative z-10" />
              ) : (
                <Menu className="w-6 h-6 text-gem-pink relative z-10" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      <div
        className={cn(
          'absolute top-full right-0 bg-dark-panel border border-gem-crystal/20 rounded-b-lg shadow-xl z-50 transition-all duration-300 ease-in-out overflow-hidden',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
        style={{ width: '320px', maxWidth: '90vw' }}
      >
        <div className="px-4 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent hover:from-gem-crystal hover:via-gem-purple hover:to-gem-gold hover:bg-gem-crystal/10 block px-3 py-3 rounded-lg text-base font-medium flex items-center gap-3 transition-all duration-300"
                >
                  <Icon className="w-5 h-5 text-gem-crystal flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}