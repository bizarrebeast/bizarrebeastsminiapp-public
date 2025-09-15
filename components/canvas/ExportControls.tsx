'use client';

import React, { useState, useEffect } from 'react';
import { ExportOptions } from '@/types';
import { Download, Share2, Settings, ChevronDown, ChevronUp, Lock, CheckCircle, Info } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { AccessTier } from '@/lib/empire';
import { canRemoveWatermark } from '@/lib/empire-gating';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useFarcasterSDK } from '@/contexts/SDKContext';
import ShareButtons from '@/components/ShareButtons';

interface ExportControlsProps {
  onExport: (options: ExportOptions) => Promise<string | void> | string | void;
}

export default function ExportControls({ onExport }: ExportControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [savedImageDataUrl, setSavedImageDataUrl] = useState<string | null>(null);
  const [isMobileFarcaster, setIsMobileFarcaster] = useState(false);
  const { empireTier } = useWallet();
  const { isSDKReady } = useFarcasterSDK();
  
  // Check if we're in mobile Farcaster
  useEffect(() => {
    const checkPlatform = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const isInMiniApp = await sdk.isInMiniApp();
        if (isInMiniApp) {
          const context = await sdk.context;
          setIsMobileFarcaster(context?.client?.platformType === 'mobile');
        }
      } catch (error) {
        // Not in miniapp
      }
    };
    checkPlatform();
  }, []);
  
  // Check if user can remove watermark (BIZARRE or Weirdo only)
  const canToggleWatermark = canRemoveWatermark(empireTier || AccessTier.NORMIE);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1.0, // PNG doesn't use quality, always lossless
    watermark: {
      enabled: !canToggleWatermark, // Auto-disable for BIZARRE/Weirdo
      text: 'BizarreBeasts ($BB)',
      position: 'bottom-right',
      opacity: 0.5,
    },
    shareToFarcaster: false,
    downloadToDevice: true,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Update watermark when tier changes
  useEffect(() => {
    if (!canToggleWatermark) {
      // Force watermark on for non-BIZARRE/Weirdo users
      setExportOptions(prev => ({
        ...prev,
        watermark: {
          ...prev.watermark,
          enabled: true
        }
      }));
    }
  }, [canToggleWatermark]);

  const handleExport = async () => {
    console.log('Download button clicked, exportOptions:', exportOptions);
    setDownloadSuccess(false);
    
    try {
      // Export and get the uploaded URL back
      const result = await onExport({
        ...exportOptions,
        downloadToDevice: true,
        shareToFarcaster: false
      });
      
      // Store the data URL for Step 2 sharing
      console.log('Export result:', result, 'Type:', typeof result);
      if (result && typeof result === 'string') {
        setSavedImageDataUrl(result);
        console.log('Stored image data for sharing');
      }
      
      // Always show success message (even for Farcaster desktop)
      setHasDownloaded(true);
      setDownloadSuccess(true);
      
      // Hide success message after 4 seconds
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download meme. Please try again.');
    }
  };

  const handleShareToFarcaster = async () => {
    if (!hasDownloaded) {
      alert('Please download your meme first (Step 1) before sharing!');
      return;
    }
    
    setIsSharing(true);
    try {
      // Simple share - just open Farcaster with pre-filled text
      // User will manually attach their downloaded image
      await onExport({
        ...exportOptions,
        shareToFarcaster: true,
        downloadToDevice: false,
      });
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to open Farcaster. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between text-white font-semibold mb-4 w-full text-left hover:text-gray-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export & Share
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {/* Two-Step Instructions */}
          <div className="relative rounded-lg p-4 mb-4 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gem-crystal/20 via-gem-gold/10 to-gem-pink/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-lg" style={{
              background: 'linear-gradient(90deg, #44D0A7, #F9AA00, #F967C6, #44D0A7)',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 3s ease infinite',
              padding: '1px',
            }}>
              <div className="absolute inset-[1px] bg-black/90 rounded-lg" />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-gem-crystal to-gem-gold rounded-lg">
                  <Info className="w-4 h-4 text-black" />
                </div>
                <h3 className="font-bold text-white text-sm tracking-wide">EXPORT YOUR MEME</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gem-crystal to-gem-crystal/50 rounded-full flex items-center justify-center font-bold text-black">
                    1
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Download First</p>
                    <p className="text-gray-400 text-xs">
                      {isMobileFarcaster 
                        ? "Opens image - long-press to save" 
                        : "Save your meme to your device"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gem-pink to-gem-pink/50 rounded-full flex items-center justify-center font-bold text-black">
                    2
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Share to Farcaster</p>
                    <p className="text-gray-400 text-xs">Opens cast composer - attach your meme manually</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SDK Loading Notice */}
          {!isSDKReady && isMobileFarcaster && (
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400" />
              <span className="text-sm text-yellow-300">Loading Farcaster features...</span>
            </div>
          )}

          {/* Step 1: Download */}
          <div className="space-y-2 mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Step 1</div>
            <button
              onClick={handleExport}
              disabled={isMobileFarcaster && !isSDKReady}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                isMobileFarcaster && !isSDKReady
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black transform hover:scale-105'
              }`}
              title={isMobileFarcaster && !isSDKReady ? 'Please wait for app to fully load' : ''}
            >
              <Download className="w-5 h-5" />
              {isMobileFarcaster && !isSDKReady ? 'Loading...' : 'Download Meme'}
            </button>
            
            {/* Success Message */}
            {downloadSuccess && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-2 flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">Meme saved to your device!</span>
              </div>
            )}
          </div>

          {/* Step 2: Share */}
          <div className="space-y-2 mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Step 2: Share</div>

            {hasDownloaded ? (
              <>
                {/* Multi-platform share buttons */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-3 text-center">
                    Choose platform to share your meme:
                  </p>
                  <ShareButtons
                    imageDataUrl={savedImageDataUrl || undefined}
                    shareType="meme"
                    buttonSize="md"
                    className="justify-center"
                    contextUrl="https://bbapp.bizarrebeasts.io/meme-generator"
                  />
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Attach your downloaded meme manually
                  </p>
                </div>

                {/* Alternative: Original Farcaster button (hidden for now but available) */}
                {false && (
                  <button
                    onClick={handleShareToFarcaster}
                    disabled={isSharing}
                    className="w-full py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    {isSharing ? 'Opening Farcaster...' : 'Share to Farcaster (Original)'}
                  </button>
                )}
              </>
            ) : (
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">
                  Download your meme first (Step 1) to enable sharing
                </p>
              </div>
            )}
          </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-gray-400 text-sm py-2 hover:text-white transition flex items-center justify-center gap-2"
      >
        <Settings className="w-4 h-4" />
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-4 space-y-3 pt-3 border-t border-gray-700">
          {/* Format Info */}
          <div className="text-gray-400 text-sm">
            <span className="font-semibold">Format:</span> PNG (Lossless quality, supports transparency)
          </div>

          {/* Watermark Settings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="watermark"
                checked={exportOptions.watermark.enabled}
                onChange={(e) => {
                  if (canToggleWatermark) {
                    setExportOptions({
                      ...exportOptions,
                      watermark: {
                        ...exportOptions.watermark,
                        enabled: e.target.checked,
                      },
                    });
                  } else if (!e.target.checked) {
                    // User trying to disable watermark without permission
                    setShowUpgradePrompt(true);
                  }
                }}
                disabled={!canToggleWatermark}
                className={`rounded ${!canToggleWatermark ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <label 
                htmlFor="watermark" 
                className="text-gray-400 text-sm flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  if (!canToggleWatermark && exportOptions.watermark.enabled) {
                    setShowUpgradePrompt(true);
                  }
                }}
              >
                Add Watermark
                {!canToggleWatermark && (
                  <button
                    className="inline-flex items-center gap-1 text-xs text-gem-crystal hover:text-gem-gold transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUpgradePrompt(true);
                    }}
                  >
                    <Lock className="w-3 h-3" />
                    BIZARRE/Weirdo only
                  </button>
                )}
              </label>
            </div>

            {exportOptions.watermark.enabled && (
              <>
                <input
                  type="text"
                  value={exportOptions.watermark.text}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    watermark: {
                      ...exportOptions.watermark,
                      text: e.target.value,
                    },
                  })}
                  placeholder="Watermark text..."
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                />

                <select
                  value={exportOptions.watermark.position}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    watermark: {
                      ...exportOptions.watermark,
                      position: e.target.value as any,
                    },
                  })}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>

                <div>
                  <label className="text-gray-400 text-sm block mb-1">
                    Opacity: {Math.round(exportOptions.watermark.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={exportOptions.watermark.opacity * 100}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      watermark: {
                        ...exportOptions.watermark,
                        opacity: Number(e.target.value) / 100,
                      },
                    })}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Export Info */}
      <div className="mt-4 p-3 bg-gray-700 rounded text-gray-300 text-xs">
        <p>• Export size: 800 × 800px</p>
        <p>• Perfect for social media</p>
        <p>• Farcaster frames compatible</p>
      </div>
    </>
  )}

  {/* Upgrade Prompt Modal */}
  <UpgradePrompt
    isOpen={showUpgradePrompt}
    onClose={() => setShowUpgradePrompt(false)}
    requiredTier={AccessTier.BIZARRE}
    featureName="Remove Watermark"
    currentTier={empireTier || AccessTier.NORMIE}
  />
  </div>
  );
}