'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Type,
  Download,
  Palette,
  Square,
  Circle,
  Sliders,
  RefreshCw,
  Copy,
  Check,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { isAdmin } from '@/lib/admin';

// Gradient presets from your website
const GRADIENT_PRESETS = [
  {
    name: 'Main Brand',
    value: 'linear-gradient(90deg, #00FFFF, #FFD700, #FF69B4)',
    colors: ['#00FFFF', '#FFD700', '#FF69B4']
  },
  {
    name: 'Crystal Gold',
    value: 'linear-gradient(90deg, #00FFFF, #FFD700)',
    colors: ['#00FFFF', '#FFD700']
  },
  {
    name: 'Gold Crystal (Reverse)',
    value: 'linear-gradient(90deg, #FFD700, #00FFFF)',
    colors: ['#FFD700', '#00FFFF']
  },
  {
    name: 'Crystal Pink',
    value: 'linear-gradient(90deg, #00FFFF, #FF69B4)',
    colors: ['#00FFFF', '#FF69B4']
  },
  {
    name: 'Gold Pink',
    value: 'linear-gradient(90deg, #FFD700, #FF69B4)',
    colors: ['#FFD700', '#FF69B4']
  },
  {
    name: 'Full Spectrum',
    value: 'linear-gradient(90deg, #00FFFF, #FFD700, #FF69B4, #9945FF)',
    colors: ['#00FFFF', '#FFD700', '#FF69B4', '#9945FF']
  },
  {
    name: 'Purple Fade',
    value: 'linear-gradient(90deg, #9945FF, #FF69B4)',
    colors: ['#9945FF', '#FF69B4']
  },
  {
    name: 'Dark Subtle',
    value: 'linear-gradient(90deg, rgba(0,255,255,0.3), rgba(255,215,0,0.3))',
    colors: ['rgba(0,255,255,0.3)', 'rgba(255,215,0,0.3)']
  }
];

// Font presets
const FONT_PRESETS = [
  { name: 'System', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Bold Display', value: 'system-ui, -apple-system, sans-serif' },
  { name: 'Mono', value: 'ui-monospace, "SF Mono", Consolas, monospace' }
];

// Canvas size presets
const SIZE_PRESETS = [
  { name: 'Twitter/X', width: 1200, height: 675 },
  { name: 'Instagram Square', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'Facebook', width: 1200, height: 630 },
  { name: 'LinkedIn', width: 1200, height: 627 },
  { name: 'Discord', width: 1024, height: 576 },
  { name: 'Custom', width: 1920, height: 1080 }
];

export default function CreativeAssetsPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Text settings
  const [text, setText] = useState('BIZARRE\nBEASTS');
  const [fontSize, setFontSize] = useState(120);
  const [fontWeight, setFontWeight] = useState(800);
  const [fontFamily, setFontFamily] = useState(FONT_PRESETS[0].value);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textAlign, setTextAlign] = useState<CanvasTextAlign>('center');

  // Style settings
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [gradientAngle, setGradientAngle] = useState(90);
  const [hasBackground, setHasBackground] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#0A0B0F');

  // Canvas settings
  const [canvasSize, setCanvasSize] = useState(SIZE_PRESETS[0]);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [scale, setScale] = useState(0.5); // Display scale for preview
  const [zoom, setZoom] = useState(1); // Zoom for preview canvas

  // Check admin access
  useEffect(() => {
    if (!isConnected) return;

    if (!isAdmin(address)) {
      console.log('Not admin, redirecting...');
      router.push('/admin');
      return;
    }
  }, [address, isConnected, router]);

  // Render text on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual canvas size
    const width = canvasSize.name === 'Custom' ? customWidth : canvasSize.width;
    const height = canvasSize.name === 'Custom' ? customHeight : canvasSize.height;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background if enabled
    if (hasBackground) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Create gradient across full text width
    const textLines = text.split('\n');
    let maxTextWidth = 0;

    // Calculate max text width
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textLines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (letterSpacing > 0) {
        maxTextWidth = Math.max(maxTextWidth, metrics.width + letterSpacing * (line.length - 1));
      } else {
        maxTextWidth = Math.max(maxTextWidth, metrics.width);
      }
    });

    // Position gradient based on text alignment and width
    let gradientStartX = 0;
    if (textAlign === 'center') {
      gradientStartX = (width - maxTextWidth) / 2;
    } else if (textAlign === 'left') {
      gradientStartX = fontSize;
    } else {
      gradientStartX = width - maxTextWidth - fontSize;
    }

    // Create gradient from left to right of text
    const gradient = ctx.createLinearGradient(
      gradientStartX,
      height / 2,
      gradientStartX + maxTextWidth,
      height / 2
    );

    // Add color stops
    selectedGradient.colors.forEach((color, index) => {
      gradient.addColorStop(index / (selectedGradient.colors.length - 1), color);
    });

    // Set text properties
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    // Apply letter spacing (hack using canvas transform)
    if (letterSpacing !== 0) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }

    // Set gradient fill
    ctx.fillStyle = gradient;

    // Split text by newlines and draw each line
    const lines = text.split('\n');
    const totalHeight = lines.length * fontSize * lineHeight;
    const startY = (height - totalHeight) / 2 + fontSize / 2;

    lines.forEach((line, index) => {
      const x = textAlign === 'center' ? width / 2 :
                textAlign === 'left' ? fontSize :
                width - fontSize;
      const y = startY + (index * fontSize * lineHeight);

      if (letterSpacing === 0) {
        ctx.fillText(line, x, y);
      } else {
        // Manual letter spacing
        if (textAlign === 'center') {
          const textWidth = ctx.measureText(line).width;
          let currentX = x - (textWidth + letterSpacing * (line.length - 1)) / 2;
          for (const char of line) {
            ctx.fillText(char, currentX, y);
            currentX += ctx.measureText(char).width + letterSpacing;
          }
        } else {
          let currentX = x;
          for (const char of line) {
            ctx.fillText(char, currentX, y);
            currentX += ctx.measureText(char).width + letterSpacing;
          }
        }
      }
    });
  }, [
    text, fontSize, fontWeight, fontFamily, lineHeight, letterSpacing,
    textAlign, selectedGradient, gradientAngle, hasBackground, backgroundColor,
    canvasSize, customWidth, customHeight
  ]);

  // Export functions
  const exportAsPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizarre-beasts-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isConnected || !isAdmin(address)) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Type className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-gray-400">Please connect your admin wallet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creative Assets Generator</h1>
          <p className="text-gray-400">Create gradient text graphics with your brand styles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Text Input */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Text Content
              </h3>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text..."
                className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:border-gem-crystal
                         focus:outline-none transition resize-none text-sm"
                rows={2}
              />
            </div>

            {/* Gradient Selection */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Gradient Style
              </h3>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSelectedGradient(preset)}
                    className={`p-2 rounded border transition ${
                      selectedGradient.name === preset.name
                        ? 'border-gem-crystal bg-gem-crystal/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div
                      className="w-full h-4 rounded mb-1"
                      style={{ background: preset.value }}
                    />
                    <p className="text-[10px]">{preset.name}</p>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs">Angle:</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs w-10">{gradientAngle}°</span>
              </div>
            </div>

            {/* Typography Controls */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Typography
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Size</label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Weight</label>
                    <select
                      value={fontWeight}
                      onChange={(e) => setFontWeight(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                    >
                      <option value={300}>Light</option>
                      <option value={400}>Regular</option>
                      <option value={500}>Medium</option>
                      <option value={600}>Semi Bold</option>
                      <option value={700}>Bold</option>
                      <option value={800}>Extra Bold</option>
                      <option value={900}>Black</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1">Font</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                  >
                    {FONT_PRESETS.map(font => (
                      <option key={font.name} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Line Height</label>
                    <input
                      type="number"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      step="0.1"
                      min="0.5"
                      max="3"
                      className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Letter Spacing</label>
                    <input
                      type="number"
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Align</label>
                    <select
                      value={textAlign}
                      onChange={(e) => setTextAlign(e.target.value as CanvasTextAlign)}
                      className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Settings */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Square className="w-4 h-4" />
                Canvas Settings
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1">Size Preset</label>
                  <select
                    value={canvasSize.name}
                    onChange={(e) => {
                      const preset = SIZE_PRESETS.find(p => p.name === e.target.value);
                      if (preset) setCanvasSize(preset);
                    }}
                    className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                  >
                    {SIZE_PRESETS.map(size => (
                      <option key={size.name} value={size.name}>
                        {size.name} ({size.width}x{size.height})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={canvasSize.name === 'Custom' ? customWidth : canvasSize.width}
                      onChange={(e) => {
                        const newWidth = Number(e.target.value);
                        if (canvasSize.name === 'Custom') {
                          setCustomWidth(newWidth);
                        } else {
                          setCanvasSize({ name: 'Custom', width: newWidth, height: canvasSize.height });
                          setCustomWidth(newWidth);
                          setCustomHeight(canvasSize.height);
                        }
                      }}
                      className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={canvasSize.name === 'Custom' ? customHeight : canvasSize.height}
                      onChange={(e) => {
                        const newHeight = Number(e.target.value);
                        if (canvasSize.name === 'Custom') {
                          setCustomHeight(newHeight);
                        } else {
                          setCanvasSize({ name: 'Custom', width: canvasSize.width, height: newHeight });
                          setCustomWidth(canvasSize.width);
                          setCustomHeight(newHeight);
                        }
                      }}
                      className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs">Background</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={hasBackground}
                        onChange={(e) => setHasBackground(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs">Enable</span>
                    </label>
                    {hasBackground && (
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {/* Canvas Preview */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                    className="p-1 bg-dark-bg border border-gray-700 rounded hover:border-gem-crystal transition"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    className="p-1 bg-dark-bg border border-gray-700 rounded hover:border-gem-crystal transition"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const actualWidth = canvasSize.name === 'Custom' ? customWidth : canvasSize.width;
                      const actualHeight = canvasSize.name === 'Custom' ? customHeight : canvasSize.height;
                      const containerWidth = window.innerWidth * 0.45; // Roughly half screen
                      const containerHeight = 500;
                      const fitZoom = Math.min(containerWidth / actualWidth, containerHeight / actualHeight);
                      setZoom(Math.min(1, fitZoom));
                    }}
                    className="px-2 py-1 bg-dark-bg border border-gray-700 rounded text-xs hover:border-gem-crystal transition"
                  >
                    Fit
                  </button>
                </div>
              </div>

              <div className="relative overflow-auto max-h-[500px] bg-dark-bg rounded-lg p-4">
                <div
                  className="mx-auto"
                  style={{
                    width: `${(canvasSize.name === 'Custom' ? customWidth : canvasSize.width) * zoom}px`
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%',
                      height: 'auto',
                      background: hasBackground ? undefined :
                        'repeating-conic-gradient(#1a1a1a 0% 25%, #0d0d0d 0% 50%) 50% / 20px 20px'
                    }}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Actual size: {canvasSize.name === 'Custom' ? customWidth : canvasSize.width} × {' '}
                {canvasSize.name === 'Custom' ? customHeight : canvasSize.height}px
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Export Options</h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportAsPNG}
                  className="flex items-center justify-center gap-2 px-3 py-2
                           bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                           text-dark-bg font-semibold text-sm rounded-lg hover:opacity-90 transition"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>

                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 px-3 py-2
                           bg-dark-bg border border-gray-700 rounded-lg text-sm
                           hover:border-gem-crystal transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 p-2 bg-dark-bg rounded">
                <p className="text-[10px] text-gray-400">
                  💡 {hasBackground ? 'Background color included' : 'Transparent background'}.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setText('BIZARRE\nBEASTS');
                    setFontSize(120);
                    setFontWeight(800);
                    setSelectedGradient(GRADIENT_PRESETS[0]);
                  }}
                  className="px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-xs
                           hover:border-gem-crystal transition"
                >
                  Reset
                </button>

                <button
                  onClick={() => {
                    const randomGradient = GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)];
                    setSelectedGradient(randomGradient);
                    setGradientAngle(Math.floor(Math.random() * 360));
                  }}
                  className="px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-xs
                           hover:border-gem-crystal transition flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Random
                </button>

                <button
                  onClick={() => setText(text.toUpperCase())}
                  className="px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-xs
                           hover:border-gem-crystal transition"
                >
                  UPPERCASE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}