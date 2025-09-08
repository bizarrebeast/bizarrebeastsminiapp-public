'use client';

import React, { useState } from 'react';
import { ExportOptions } from '@/types';
import { Download, Share2, Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface ExportControlsProps {
  onExport: (options: ExportOptions) => void;
}

export default function ExportControls({ onExport }: ExportControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1.0, // PNG doesn't use quality, always lossless
    watermark: {
      enabled: true,
      text: 'BizarreBeasts ($BB)',
      position: 'bottom-right',
      opacity: 0.5,
    },
    shareToFarcaster: false,
    downloadToDevice: true,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = () => {
    onExport(exportOptions);
  };

  const handleShareToFarcaster = () => {
    onExport({
      ...exportOptions,
      shareToFarcaster: true,
      downloadToDevice: false,
    });
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
          {/* Quick Actions */}
          <div className="space-y-2 mb-4">
        <button
          onClick={handleExport}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Meme
        </button>

        <button
          onClick={handleShareToFarcaster}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share to Farcaster
        </button>
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
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  watermark: {
                    ...exportOptions.watermark,
                    enabled: e.target.checked,
                  },
                })}
                className="rounded"
              />
              <label htmlFor="watermark" className="text-gray-400 text-sm">
                Add Watermark
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
  </div>
  );
}