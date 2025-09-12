'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Copy, CheckCircle } from 'lucide-react';
import { web3Service } from '@/lib/web3';

interface MobileWalletHelperProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileWalletHelper({ isOpen, onClose }: MobileWalletHelperProps) {
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Try to get WalletConnect URI
      getConnectionURI();
    }
  }, [isOpen]);

  const getConnectionURI = async () => {
    setLoading(true);
    try {
      // First open the modal to generate URI
      await web3Service.connect();
      
      // Small delay to ensure URI is generated
      setTimeout(async () => {
        const uri = await web3Service.getWalletConnectURI();
        if (uri) {
          setWcUri(uri);
        }
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to get WalletConnect URI:', error);
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (wcUri) {
      try {
        await navigator.clipboard.writeText(wcUri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const openInWallet = (walletScheme: string) => {
    if (wcUri) {
      const encodedUri = encodeURIComponent(wcUri);
      const deepLink = `${walletScheme}wc?uri=${encodedUri}`;
      window.location.href = deepLink;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-4">Connect Mobile Wallet</h2>
        
        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-dark-bg/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-300 mb-2">
              Having trouble connecting? Try these options:
            </p>
            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open your wallet app directly</li>
              <li>Tap the wallet icon below to open your wallet</li>
              <li>Or copy the connection link and paste in your wallet</li>
            </ol>
          </div>

          {/* Direct wallet links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openInWallet('rainbow://')}
              className="flex flex-col items-center gap-2 p-3 bg-dark-bg/50 border border-gray-700 rounded-lg hover:border-gem-crystal/50 transition"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
              <span className="text-xs text-gray-300">Rainbow</span>
            </button>

            <button
              onClick={() => openInWallet('metamask://')}
              className="flex flex-col items-center gap-2 p-3 bg-dark-bg/50 border border-gray-700 rounded-lg hover:border-gem-crystal/50 transition"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-lg" />
              <span className="text-xs text-gray-300">MetaMask</span>
            </button>

            <button
              onClick={() => openInWallet('trust://')}
              className="flex flex-col items-center gap-2 p-3 bg-dark-bg/50 border border-gray-700 rounded-lg hover:border-gem-crystal/50 transition"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg" />
              <span className="text-xs text-gray-300">Trust Wallet</span>
            </button>

            <button
              onClick={() => window.location.href = 'https://link.coinbase.com/dapp'}
              className="flex flex-col items-center gap-2 p-3 bg-dark-bg/50 border border-gray-700 rounded-lg hover:border-gem-crystal/50 transition"
            >
              <div className="w-10 h-10 bg-blue-700 rounded-lg" />
              <span className="text-xs text-gray-300">Coinbase</span>
            </button>
          </div>

          {/* Copy WalletConnect URI */}
          {wcUri && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Or copy connection link:</p>
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-bg/50 border border-gray-700 rounded-lg hover:border-gem-crystal/50 transition"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Copy Link</span>
                  </>
                )}
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gem-crystal"></div>
              <p className="text-xs text-gray-400 mt-2">Generating connection...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}