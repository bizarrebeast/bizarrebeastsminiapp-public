'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Palette, Gamepad2, Trophy, BookOpen, FileText, Crown, ArrowDownUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WalletButton } from '@/components/wallet/WalletButton';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/meme-generator', label: 'Meme Generator', icon: Palette },
  { href: '/swap', label: 'Swap', icon: ArrowDownUp },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/empire', label: 'Empire', icon: Crown },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/resources', label: 'Resources', icon: FileText },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-dark-panel border-b border-gem-crystal/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-gem-gold to-gem-crystal rounded-lg transition-all duration-300" />
              <span className="text-gem-gold font-bold text-xl group-hover:text-gem-crystal transition-colors duration-300">BizarreBeasts</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-400 hover:bg-gem-crystal/10 hover:text-gem-crystal px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <WalletButton />
          </div>

          {/* Mobile menu button and wallet */}
          <div className="md:hidden flex items-center gap-2">
            <WalletButton />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gem-crystal focus:outline-none focus:text-gem-crystal transition-colors duration-300"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-dark-card border-t border-gem-crystal/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:bg-gem-crystal/10 hover:text-gem-crystal block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 transition-all duration-300"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}