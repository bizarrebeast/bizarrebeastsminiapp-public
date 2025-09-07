'use client';

import React, { useState } from 'react';
import { TextOptions } from '@/types';
import { Type, AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronUp } from 'lucide-react';

interface TextControlsProps {
  onAddText: (text: string, options: TextOptions) => void;
}

export default function TextControls({ onAddText }: TextControlsProps) {
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [customText, setCustomText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [textOptions, setTextOptions] = useState<TextOptions>({
    font: 'Impact',
    size: 48,
    color: '#FFFFFF',
    stroke: '#000000',
    strokeWidth: 2,
    position: 'top',
    align: 'center',
  });

  const fonts = ['Impact', 'Arial', 'Comic Sans'];
  const sizes = [24, 32, 48, 64, 72, 96];

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between text-white font-semibold mb-4 w-full text-left hover:text-gray-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Type className="w-4 h-4" />
          Text Controls
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {/* Quick Text Inputs */}
          <div className="space-y-3 mb-4">
        <div>
          <label className="text-gray-400 text-sm block mb-1">Top Text</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Enter top text..."
              className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => {
                if (topText) {
                  onAddText(topText, { ...textOptions, position: 'top' });
                  setTopText('');
                }
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Bottom Text</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Enter bottom text..."
              className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => {
                if (bottomText) {
                  onAddText(bottomText, { ...textOptions, position: 'bottom' });
                  setBottomText('');
                }
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Custom Text</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter custom text..."
              className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => {
                if (customText) {
                  onAddText(customText, { ...textOptions, position: 'custom' });
                  setCustomText('');
                }
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Text Options */}
      <div className="space-y-3 pt-3 border-t border-gray-700">
        {/* Font Selection */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Font</label>
          <select
            value={textOptions.font}
            onChange={(e) => setTextOptions({ ...textOptions, font: e.target.value as any })}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {fonts.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Size Selection */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Size</label>
          <select
            value={textOptions.size}
            onChange={(e) => setTextOptions({ ...textOptions, size: Number(e.target.value) })}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {sizes.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={textOptions.color}
                onChange={(e) => setTextOptions({ ...textOptions, color: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={textOptions.color}
                onChange={(e) => setTextOptions({ ...textOptions, color: e.target.value })}
                className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">Outline</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={textOptions.stroke}
                onChange={(e) => setTextOptions({ ...textOptions, stroke: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="10"
                value={textOptions.strokeWidth}
                onChange={(e) => setTextOptions({ ...textOptions, strokeWidth: Number(e.target.value) })}
                className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm"
                placeholder="Width"
              />
            </div>
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Alignment</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTextOptions({ ...textOptions, align: 'left' })}
              className={`flex-1 p-2 rounded ${
                textOptions.align === 'left' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <AlignLeft className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setTextOptions({ ...textOptions, align: 'center' })}
              className={`flex-1 p-2 rounded ${
                textOptions.align === 'center' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <AlignCenter className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setTextOptions({ ...textOptions, align: 'right' })}
              className={`flex-1 p-2 rounded ${
                textOptions.align === 'right' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <AlignRight className="w-4 h-4 mx-auto" />
            </button>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
  );
}