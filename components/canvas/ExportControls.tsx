'use client';

import React, { useState, useEffect } from 'react';
import { ExportOptions } from '@/types';
import { Download, Share2, Settings, ChevronDown, ChevronUp, Lock, CheckCircle, Info } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { AccessTier } from '@/lib/empire';
import { canRemoveWatermark } from '@/lib/empire-gating';
import UpgradePrompt from '@/components/UpgradePrompt';

interface ExportControlsProps {
  onExport: (options: ExportOptions) => void | Promise<void>;
}

export default function ExportControls({ onExport }: ExportControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [currentImageData, setCurrentImageData] = useState<string | null>(null);
  const { empireTier } = useWallet();
  
  // Check if user can remove watermark (Elite or Champion only)
  const canToggleWatermark = canRemoveWatermark(empireTier || AccessTier.VISITOR);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1.0, // PNG doesn't use quality, always lossless
    watermark: {
      enabled: !canToggleWatermark, // Auto-disable for Elite/Champion
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
      // Force watermark on for non-Elite/Champion users
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
    
    // Export and store the image data
    const result = await onExport({
      ...exportOptions,
      downloadToDevice: true,
      shareToFarcaster: false
    });
    
    // Store image data for sharing
    if (typeof result === 'string') {
      setCurrentImageData(result);
    }
    
    // Show success message
    setHasDownloaded(true);
    setDownloadSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3000);
  };

  const handleShareToFarcaster = async () => {
    if (!hasDownloaded) {
      alert('Please download your meme first!');
      return;
    }
    
    setIsSharing(true);
    try {
      await onExport({
        ...exportOptions,
        shareToFarcaster: true,
        downloadToDevice: false, // Don't download again
      });
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
          <div className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gem-crystal mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-300">
                <p className="font-semibold text-white mb-1">Two-Step Process:</p>
                <ol className="space-y-1">
                  <li className="flex items-start gap-1">
                    <span className="text-gem-crystal">1.</span>
                    <span>Download your meme to save it</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-gem-crystal">2.</span>
                    <span>Share to Farcaster with auto-attached image</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 1: Download */}
          <div className="space-y-2 mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Step 1</div>
            <button
              onClick={handleExport}
              className="w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Meme
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
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Step 2</div>
            <button
              onClick={handleShareToFarcaster}
              disabled={isSharing || !hasDownloaded}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                hasDownloaded 
                  ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black transform hover:scale-105' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Preparing share...
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  {hasDownloaded ? 'Share to Farcaster' : 'Download First to Share'}
                </>
              )}
            </button>
            {hasDownloaded && !isSharing && (
              <p className="text-xs text-gray-400 text-center">
                Your meme will be automatically attached to the cast
              </p>
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
                    Elite/Champion only
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
    requiredTier={AccessTier.ELITE}
    featureName="Remove Watermark"
    currentTier={empireTier || AccessTier.VISITOR}
  />
  </div>
  );
}