'use client';

import { useRef, useEffect } from 'react';

export default function TestGradientPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawGradient();
  }, []);

  const drawGradient = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient (crystal -> gold -> pink)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#44D0A7');    // gem-crystal
    gradient.addColorStop(0.5, '#FFD700');  // gem-gold
    gradient.addColorStop(1, '#FF69B4');    // gem-pink

    // Fill canvas with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadGradient = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Download
    const link = document.createElement('a');
    link.download = 'bizarrebeasts-gradient-1500x500.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
          BizarreBeasts Gradient Generator
        </h1>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Preview (1500x500px)</h2>
          <div className="border-4 border-gray-700 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1500}
              height={500}
              className="w-full h-auto"
              style={{ background: 'linear-gradient(to right, #44D0A7, #FFD700, #FF69B4)' }}
            />
          </div>
        </div>

        <button
          onClick={downloadGradient}
          className="px-8 py-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg hover:brightness-110 transition-all text-lg"
        >
          Download 1500x500 Gradient Image
        </button>

        <div className="mt-8 p-6 bg-dark-card border border-gray-700 rounded-lg">
          <h3 className="font-bold mb-2">Gradient Colors:</h3>
          <ul className="space-y-2 text-sm">
            <li><span className="text-gem-crystal">●</span> gem-crystal: #44D0A7 (start)</li>
            <li><span className="text-gem-gold">●</span> gem-gold: #FFD700 (middle)</li>
            <li><span className="text-gem-pink">●</span> gem-pink: #FF69B4 (end)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
