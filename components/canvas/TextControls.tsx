'use client';

import React, { useState, useEffect } from 'react';
import { TextOptions } from '@/types';
import { Type, ChevronDown, ChevronUp } from 'lucide-react';

interface TextControlsProps {
  onAddText: (text: string, options: TextOptions) => void;
  onUpdateText?: (updates: Partial<TextOptions>) => void;
  selectedTextOptions?: TextOptions | null;
}

export default function TextControls({ onAddText, onUpdateText, selectedTextOptions }: TextControlsProps) {
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

  // Sync text options when a text object is selected on canvas
  useEffect(() => {
    if (selectedTextOptions) {
      console.log('📝 TEXT CONTROLS: Syncing with selected text:', selectedTextOptions);
      console.log('📝 TEXT CONTROLS: Current state before sync:', textOptions);
      setTextOptions(selectedTextOptions);
      console.log('📝 TEXT CONTROLS: State after sync (will update on next render)');
    } else {
      console.log('📝 TEXT CONTROLS: Selection cleared, keeping current options');
    }
  }, [selectedTextOptions]);

  const fonts = ['Impact', 'Arial', 'Comic Sans'];

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
              className="px-3 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black rounded font-semibold hover:scale-105 transition-all text-sm"
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
              className="px-3 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black rounded font-semibold hover:scale-105 transition-all text-sm"
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
              className="px-3 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black rounded font-semibold hover:scale-105 transition-all text-sm"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Text Options */}
      <div className="space-y-3 pt-3 border-t border-gray-700">
        <div className="text-gray-400 text-xs mb-2">
          <p className="font-semibold">Style Options:</p>
          <p>Select text on canvas to update its style, or set style before adding new text</p>
        </div>
        {/* Font Selection */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Font</label>
          <select
            value={textOptions.font}
            onChange={(e) => {
              const newFont = e.target.value as any;
              setTextOptions({ ...textOptions, font: newFont });
              if (onUpdateText) onUpdateText({ font: newFont });
            }}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {fonts.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Text Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={textOptions.color}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setTextOptions({ ...textOptions, color: newColor });
                  if (onUpdateText) onUpdateText({ color: newColor });
                }}
                className="w-16 h-10 rounded cursor-pointer border border-gray-600"
              />
              <input
                type="text"
                value={textOptions.color}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setTextOptions({ ...textOptions, color: newColor });
                  if (onUpdateText) onUpdateText({ color: newColor });
                }}
                className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">Outline</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={textOptions.stroke}
                onChange={(e) => {
                  const newStroke = e.target.value;
                  setTextOptions({ ...textOptions, stroke: newStroke });
                  if (onUpdateText) onUpdateText({ stroke: newStroke });
                }}
                className="w-16 h-10 rounded cursor-pointer border border-gray-600"
              />
              <input
                type="number"
                min="0"
                max="10"
                value={textOptions.strokeWidth}
                onChange={(e) => {
                  const newWidth = Number(e.target.value);
                  setTextOptions({ ...textOptions, strokeWidth: newWidth });
                  if (onUpdateText) onUpdateText({ strokeWidth: newWidth });
                }}
                className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm"
                placeholder="Outline Width"
              />
            </div>
          </div>
        </div>

        </div>
      </>
    )}
  </div>
  );
}