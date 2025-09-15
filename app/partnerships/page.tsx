'use client';

import React from 'react';
import Link from 'next/link';

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-gray-900 rounded-lg p-12 border border-gray-800">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
            Partnerships & Collabs
          </h1>

          <div className="text-3xl text-gray-400 mb-8">
            Coming Soon
          </div>

          <p className="text-gray-500 mb-8 text-lg">
            We're building something BIZARRE!
            Check back soon for exciting partnership opportunities.
          </p>

          <div className="text-6xl mb-8">👹</div>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-emerald-400 text-black font-bold rounded-lg hover:scale-105 transition-transform"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}