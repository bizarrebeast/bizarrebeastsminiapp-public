'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, FabricText } from 'fabric';
import { Sticker, TextOptions, ExportOptions, StickerCollection, BackgroundImage } from '@/types';
import { shareMemeToFarcaster } from '@/lib/farcaster';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface MemeCanvasProps {
  onCanvasReady: (canvasApi: any) => void;
  selectedCollection?: StickerCollection;
}

export default function MemeCanvas({ onCanvasReady, selectedCollection }: MemeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [showInstructions, setShowInstructions] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const canvasApiRef = useRef<any>(null);

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 32; // Account for padding
      const maxHeight = window.innerHeight - 300; // Leave room for controls
      
      // Keep square aspect ratio
      const size = Math.min(maxWidth, maxHeight, 800);
      setCanvasSize({ width: size, height: size });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Initialize canvas only when size changes
  useEffect(() => {
    if (!canvasRef.current || !canvasSize.width) return;

    // Initialize Fabric.js canvas with responsive size
    const canvas = new Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: 'transparent',
      snapAngle: 15, // Snap rotation to 15-degree increments
      snapThreshold: 5, // Snap when within 5 degrees
      uniformScaling: false, // Allow proportional scaling with shift key
      centeredRotation: true,
      centeredScaling: true,
    });

    fabricCanvasRef.current = canvas;
    
    // Save initial state
    historyRef.current = [JSON.stringify(canvas.toJSON())];
    historyIndexRef.current = 0;
    
    // Track changes for undo/redo
    canvas.on('object:added', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());
    canvas.on('object:modified', () => saveHistory());
    
    const saveHistory = () => {
      // Don't save during undo/redo operations
      if ((canvas as any)._isUndoRedo) return;
      
      const state = JSON.stringify(canvas.toJSON());
      
      // Remove any states after current index
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      
      // Add new state
      historyRef.current.push(state);
      historyIndexRef.current++;
      
      // Limit history to 50 states
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }
    };
    
    // Add snap-to-center functionality
    const centerLine = canvasSize.width / 2;
    const middleLine = canvasSize.height / 2;
    const snapZone = 10; // Pixels within which to snap

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Get object center
      const objCenterX = obj.left! + (obj.width! * obj.scaleX!) / 2;
      const objCenterY = obj.top! + (obj.height! * obj.scaleY!) / 2;
      
      // Snap to vertical center
      if (Math.abs(objCenterX - centerLine) < snapZone) {
        obj.set({
          left: centerLine - (obj.width! * obj.scaleX!) / 2,
        });
      }
      
      // Snap to horizontal middle
      if (Math.abs(objCenterY - middleLine) < snapZone) {
        obj.set({
          top: middleLine - (obj.height! * obj.scaleY!) / 2,
        });
      }
      
      // Remove edge snapping to allow objects to go off canvas
      // Objects can now freely move beyond canvas boundaries
    });

    // Enable text editing on double-click
    canvas.on('text:editing:entered', () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        // Text is being edited
      }
    });

    // Allow inline text editing
    canvas.on('mouse:dblclick', (e) => {
      if (e.target && e.target.type === 'text') {
        const textObj = e.target as any; // Type assertion for Fabric.js compatibility
        if (textObj.enterEditing) {
          textObj.enterEditing();
          textObj.selectAll();
        }
      }
    });

    // Canvas API for parent component
    const canvasApi = {
      addSticker: (sticker: Sticker) => {
        FabricImage.fromURL(sticker.src).then((img) => {
          // Calculate scale to make sticker 300x300
          const desiredSize = 300;
          const scaleX = desiredSize / (img.width || 100);
          const scaleY = desiredSize / (img.height || 100);
          const scale = Math.min(scaleX, scaleY); // Keep aspect ratio
          
          img.set({
            left: (canvas.width! - desiredSize) / 2,
            top: (canvas.height! - desiredSize) / 2,
            scaleX: scale,
            scaleY: scale,
            lockScalingFlip: true, // Prevent negative scaling
            centeredRotation: true,
            hasRotatingPoint: true, // Enable rotation handle
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      },

      addText: (text: string, options: TextOptions) => {
        const centerX = canvas.width! / 2;
        const textObj = new FabricText(text, {
          left: centerX,
          top: options.position === 'top' ? 50 : 
                options.position === 'bottom' ? canvas.height! - 80 : 
                canvas.height! / 2,
          fontSize: options.size || 48,
          fontFamily: options.font || 'Impact',
          fill: options.color || '#FFFFFF',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          textAlign: options.align || 'center',
          originX: 'center',
          originY: options.position === 'bottom' ? 'bottom' : 
                   options.position === 'custom' ? 'center' : 'top',
          editable: true,
        });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.renderAll();
      },

      updateSelectedText: (updates: Partial<TextOptions>) => {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'text') {
          const textObj = activeObject as FabricText;
          if (updates.font) textObj.set('fontFamily', updates.font);
          if (updates.size) textObj.set('fontSize', updates.size);
          if (updates.color) textObj.set('fill', updates.color);
          if (updates.stroke) textObj.set('stroke', updates.stroke);
          if (updates.strokeWidth !== undefined) textObj.set('strokeWidth', updates.strokeWidth);
          if (updates.align) textObj.set('textAlign', updates.align);
          canvas.renderAll();
        }
      },

      setBackground: (type: 'color' | 'image' | 'transparent', value?: string) => {
        if (type === 'color' && value) {
          canvas.backgroundColor = value;
          setBackgroundColor(value);
          canvas.renderAll();
        } else if (type === 'image' && value) {
          FabricImage.fromURL(value).then((img) => {
            canvas.backgroundImage = img;
            if (img.width && img.height) {
              img.scaleX = canvas.width / img.width;
              img.scaleY = canvas.height / img.height;
            }
            canvas.renderAll();
          });
        } else if (type === 'transparent') {
          canvas.backgroundColor = 'transparent';
          setBackgroundColor('transparent');
          canvas.renderAll();
        }
      },

      deleteSelected: () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.renderAll();
        }
      },

      clearCanvas: () => {
        canvas.clear();
        canvas.backgroundColor = backgroundColor;
        canvas.renderAll();
        // Reset history
        historyRef.current = [JSON.stringify(canvas.toJSON())];
        historyIndexRef.current = 0;
      },
      
      undo: () => {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          (canvas as any)._isUndoRedo = true;
          canvas.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
            canvas.renderAll();
            (canvas as any)._isUndoRedo = false;
          });
        }
      },
      
      redo: () => {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current++;
          (canvas as any)._isUndoRedo = true;
          canvas.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
            canvas.renderAll();
            (canvas as any)._isUndoRedo = false;
          });
        }
      },

      export: async (options: ExportOptions) => {
        // Add watermark if enabled
        if (options.watermark.enabled) {
          const watermark = new FabricText(options.watermark.text || 'BizarreBeasts ($BB)', {
            fontSize: 16,
            fill: 'rgba(255, 255, 255, ' + options.watermark.opacity + ')',
            fontFamily: 'Arial',
          });

          // Position watermark
          const positions = {
            'bottom-right': { left: canvas.width! - 150, top: canvas.height! - 30 },
            'bottom-left': { left: 20, top: canvas.height! - 30 },
            'top-right': { left: canvas.width! - 150, top: 20 },
            'top-left': { left: 20, top: 20 },
          };
          
          watermark.set(positions[options.watermark.position]);
          canvas.add(watermark);
          canvas.renderAll();
        }

        // Export canvas as PNG
        const dataURL = canvas.toDataURL({
          format: 'png', // Always use PNG for crisp text
          multiplier: 800 / canvas.width!, // Scale to 800x800 for export
        });

        // Remove watermark after export
        if (options.watermark.enabled) {
          const objects = canvas.getObjects();
          canvas.remove(objects[objects.length - 1]);
          canvas.renderAll();
        }

        // Handle download
        if (options.downloadToDevice) {
          const link = document.createElement('a');
          link.download = `meme-${Date.now()}.${options.format}`;
          link.href = dataURL;
          link.click();
        }

        // Handle Farcaster share
        if (options.shareToFarcaster) {
          // Share to Farcaster - open window immediately to avoid popup blocker
          const warpcastWindow = window.open('about:blank', '_blank');
          
          try {
            // Prepare the share URL
            const shareUrl = await shareMemeToFarcaster(dataURL, undefined, undefined, warpcastWindow);
            console.log('Farcaster share initiated');
          } catch (error) {
            console.error('Failed to share to Farcaster:', error);
            if (warpcastWindow) warpcastWindow.close();
          }
        }

        return dataURL;
      },
    };

    canvasApiRef.current = canvasApi;
    onCanvasReady(canvasApi);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        canvasApi.deleteSelected();
      }
      // Undo/Redo shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        canvasApi.undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        canvasApi.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [canvasSize]); // Removed onCanvasReady and backgroundColor to prevent loops

  // Always show color picker for BizarreBeasts, or if collection supports colors
  const showColorPicker = !selectedCollection || 
    selectedCollection.id === 'bizarrebeasts' ||
    selectedCollection.backgroundType === 'color' || 
    selectedCollection.backgroundType === 'both';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Canvas Controls Bar */}
      <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => {
              canvasApiRef.current?.undo();
            }}
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded hover:scale-105 transition-all text-xs sm:text-sm font-semibold"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={() => {
              canvasApiRef.current?.redo();
            }}
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 text-white rounded hover:scale-105 transition-all text-xs sm:text-sm font-semibold"
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </button>
          <button
            onClick={() => {
              const activeObject = fabricCanvasRef.current?.getActiveObject();
              if (activeObject && fabricCanvasRef.current) {
                fabricCanvasRef.current.remove(activeObject);
              }
            }}
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded hover:scale-105 transition-all text-xs sm:text-sm font-semibold"
          >
            Delete
          </button>
          <button
            onClick={() => {
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.clear();
                fabricCanvasRef.current.backgroundColor = backgroundColor;
                fabricCanvasRef.current.renderAll();
                // Reset history
                historyRef.current = [JSON.stringify(fabricCanvasRef.current.toJSON())];
                historyIndexRef.current = 0;
              }
            }}
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded hover:scale-105 transition-all text-xs sm:text-sm font-semibold"
          >
            Clear
          </button>
        </div>
        
        {/* Background Color Picker - Only show if collection supports colors */}
        {showColorPicker && (
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-white text-xs sm:text-sm">Background Color:</label>
            <input
              type="color"
              value={backgroundColor === 'transparent' ? '#000000' : backgroundColor}
              onChange={(e) => {
                setBackgroundColor(e.target.value);
                if (fabricCanvasRef.current) {
                  fabricCanvasRef.current.backgroundColor = e.target.value;
                  fabricCanvasRef.current.renderAll();
                }
              }}
              className="w-8 h-6 sm:w-10 sm:h-8 rounded cursor-pointer"
            />
            <button
              onClick={() => {
                if (fabricCanvasRef.current) {
                  fabricCanvasRef.current.backgroundColor = 'transparent';
                  fabricCanvasRef.current.renderAll();
                  setBackgroundColor('transparent');
                }
              }}
              className="px-2 sm:px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs sm:text-sm"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="relative bg-gray-700 rounded-lg p-2 sm:p-4 mx-auto">
        <div 
          className="relative mx-auto block border-2 border-gray-600 rounded overflow-visible"
          style={{ 
            maxWidth: '100%',
            width: canvasSize.width,
            height: canvasSize.height,
            // Checkerboard pattern for transparent background
            background: backgroundColor === 'transparent' 
              ? `repeating-conic-gradient(#e0e0e0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px`
              : backgroundColor
          }}
        >
          <canvas
            ref={canvasRef}
            className="rounded mx-auto block relative z-10"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 sm:mt-4 bg-dark-card border border-gem-crystal/20 rounded-lg">
        {/* Collapsible Header */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full p-3 sm:p-4 flex items-center justify-between text-white font-semibold text-sm hover:bg-gray-800/50 transition-colors rounded-lg"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            BizarreBeasts ($BB) Meme Generator Instructions
          </span>
          {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {/* Collapsible Content */}
        {showInstructions && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-gem-crystal font-semibold mb-1">🎨 Create Your BizarreBeasts Meme:</p>
                <ul className="text-gray-400 space-y-1 ml-4">
                  <li>• Click stickers to add to your canvas</li>
                  <li>• Drag to move and position anywhere</li>
                  <li>• Drag corner handles to resize</li>
                  <li>• Double-click text areas to edit</li>
                  <li>• Use Delete key or trash button to remove items</li>
                </ul>
              </div>
              
              <div>
                <p className="text-gem-purple font-semibold mb-1">🚀 Pro Tips:</p>
                <ul className="text-gray-400 space-y-1 ml-4">
                  <li>• Top & bottom text work best for classic meme format</li>
                  <li>• Layer stickers to create dynamic scenes</li>
                  <li>• Items snap to center for perfect alignment</li>
                </ul>
              </div>
              
              <div>
                <p className="text-gem-gold font-semibold mb-1">💎 Token Holder Benefits:</p>
                <p className="text-gray-400 ml-4 mb-1">Hold $BB tokens and empire boosters to unlock:</p>
                <ul className="text-gray-400 space-y-1 ml-8">
                  <li>• Exclusive sticker collections</li>
                  <li>• Remove watermarks</li>
                  <li>• Upload custom backgrounds</li>
                  <li>• Premium features</li>
                </ul>
              </div>
              
              <p className="text-white font-semibold text-center pt-2 border-t border-gray-700">
                Once you have created your BizarreBeasts Meme, click share! 🚀
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}