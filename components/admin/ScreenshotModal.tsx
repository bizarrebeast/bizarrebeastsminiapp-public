'use client';

import { X, Download, ExternalLink } from 'lucide-react';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotUrl: string | null;
  walletAddress: string;
  score?: number;
}

export default function ScreenshotModal({
  isOpen,
  onClose,
  screenshotUrl,
  walletAddress,
  score
}: ScreenshotModalProps) {
  if (!isOpen) return null;

  // For now, since we don't have R2 setup, we'll show a placeholder
  const isPlaceholder = screenshotUrl === 'pending-upload';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-card border border-gem-crystal/20 rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Screenshot Proof</h2>
            <p className="text-sm text-gray-400 mt-1">
              Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              {score !== undefined && (
                <span className="ml-2">| Score: {score.toLocaleString()}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-bg rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Container */}
        <div className="bg-dark-bg rounded-lg p-4 min-h-[400px] flex items-center justify-center">
          {isPlaceholder ? (
            <div className="text-center">
              <ExternalLink className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Screenshot pending upload to storage</p>
              <p className="text-gray-500 text-sm">
                R2 storage integration needed for actual screenshots
              </p>
            </div>
          ) : screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt="Contest submission screenshot"
              className="max-w-full max-h-[600px] rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.insertAdjacentHTML('beforeend', `
                  <div class="text-center">
                    <p class="text-red-400">Failed to load screenshot</p>
                    <p class="text-gray-500 text-sm mt-2">${screenshotUrl}</p>
                  </div>
                `);
              }}
            />
          ) : (
            <div className="text-center">
              <X className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No screenshot provided</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {screenshotUrl && !isPlaceholder && (
          <div className="flex justify-end gap-2 mt-4">
            <a
              href={screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 rounded-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open Original
            </a>
            <a
              href={screenshotUrl}
              download
              className="flex items-center gap-2 px-4 py-2 bg-gem-crystal text-dark-bg hover:bg-gem-crystal/80 rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}