'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Allow full width for meme generator and admin pages, constrain others to 800px
  const isFullWidth = pathname === '/meme-generator' || pathname.startsWith('/admin');

  return (
    <div className={isFullWidth ? '' : 'max-w-[800px] mx-auto'}>
      {children}
    </div>
  );
}