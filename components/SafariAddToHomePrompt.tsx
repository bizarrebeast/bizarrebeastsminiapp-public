'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';

export default function SafariAddToHomePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's Safari on iOS and not already in standalone mode (PWA)
    const checkSafari = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(ua);
      const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      
      // Check if user has dismissed the prompt before (stored for 30 days)
      const dismissed = localStorage.getItem('safari-prompt-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const shouldShow = Date.now() - dismissedTime > thirtyDays;

      setIsIOS(isIOSDevice);
      
      // Show prompt only if:
      // 1. It's Safari on iOS
      // 2. Not already in PWA mode
      // 3. User hasn't dismissed it recently
      if (isIOSDevice && isSafari && !isStandalone && shouldShow) {
        // Show after a short delay to not be too intrusive
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    checkSafari();
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal time
    localStorage.setItem('safari-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="bg-dark-card border border-gem-gold/30 rounded-lg shadow-xl p-4 max-w-sm w-full pointer-events-auto animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="bg-gradient-to-r from-gem-gold to-gem-crystal p-2 rounded-lg flex-shrink-0">
            <Plus size={24} className="text-dark-bg" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-bold mb-2">
              Add to Home Screen for Best Experience
            </h3>
            
            <p className="text-gray-300 text-sm mb-3">
              Install BizarreBeasts as an app for smoother performance and no browser issues!
            </p>
            
            <div className="bg-dark-bg/50 rounded p-3 space-y-2">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Share size={16} className="text-gem-blue" />
                <span>Tap the Share button {isIOS ? 'below' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Plus size={16} className="text-gem-purple" />
                <span>Select "Add to Home Screen"</span>
              </div>
            </div>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-1.5 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg font-semibold rounded text-sm hover:opacity-90 transition-opacity"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}