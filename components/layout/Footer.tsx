'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2025);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="mt-auto border-t border-gray-800 bg-dark-bg/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
            <Link
              href="/privacy-policy"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600 hidden md:inline">•</span>
            <Link
              href="/terms-of-service"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-gray-600 hidden md:inline">•</span>
            <Link
              href="/disclaimer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Disclaimer
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-gray-400 text-sm text-center md:text-right">
            © {currentYear} BizarreBeasts. All rights reserved.
          </div>
        </div>

        {/* Additional Info / Warning */}
        <div className="mt-4 pt-4 border-t border-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            BizarreBeasts ($BB) is a community token. Always do your own research.
            Not financial advice. Cryptocurrency investments carry risk.
          </p>
        </div>
      </div>
    </footer>
  );
}