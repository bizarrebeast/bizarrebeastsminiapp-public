'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, FabricText, Rect as FabricRect } from 'fabric';
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
  const [isCropMode, setIsCropMode] = useState(false);
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
    
    // Preserve existing canvas data if canvas exists
    let existingData = null;
    if (fabricCanvasRef.current) {
      existingData = JSON.stringify(fabricCanvasRef.current.toJSON());
      fabricCanvasRef.current.dispose();
    }

    // Initialize Fabric.js canvas with responsive size
    const canvas = new Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: 'transparent',
      uniformScaling: false, // Allow proportional scaling with shift key
      centeredRotation: true,
      centeredScaling: true,
      // Improve selection visibility
      selectionColor: 'rgba(100, 100, 255, 0.3)',
      selectionBorderColor: 'rgba(255, 255, 255, 0.8)',
      selectionLineWidth: 2,
      selectionDashArray: [10, 5],
    });

    fabricCanvasRef.current = canvas;
    
    // Restore existing data if available, otherwise save initial state
    if (existingData) {
      canvas.loadFromJSON(existingData, () => {
        canvas.renderAll();
      });
      // Keep existing history
    } else {
      // Save initial state
      historyRef.current = [JSON.stringify(canvas.toJSON())];
      historyIndexRef.current = 0;
    }
    
    // Track changes for undo/redo
    canvas.on('object:added', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());
    canvas.on('object:modified', () => saveHistory());
    
    // Add shift-based rotation snapping like Canva
    canvas.on('object:rotating', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Check if shift key is pressed
      if (e.e.shiftKey) {
        const snapAngle = 15; // Snap to 15-degree increments
        const angle = Math.round(obj.angle! / snapAngle) * snapAngle;
        obj.angle = angle;
      }
    });
    
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
    
    // Add snap-to-center and edge snapping functionality
    const centerLine = canvasSize.width / 2;
    const middleLine = canvasSize.height / 2;
    const snapZone = 10; // Pixels within which to snap

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Get object dimensions
      const objWidth = obj.width! * obj.scaleX!;
      const objHeight = obj.height! * obj.scaleY!;
      const objCenterX = obj.left! + objWidth / 2;
      const objCenterY = obj.top! + objHeight / 2;
      
      // Snap to vertical center
      if (Math.abs(objCenterX - centerLine) < snapZone) {
        obj.set({
          left: centerLine - objWidth / 2,
        });
      }
      
      // Snap to horizontal middle
      if (Math.abs(objCenterY - middleLine) < snapZone) {
        obj.set({
          top: middleLine - objHeight / 2,
        });
      }
      
      // Edge snapping
      // Snap to left edge
      if (Math.abs(obj.left!) < snapZone) {
        obj.set({ left: 0 });
      }
      
      // Snap to right edge
      if (Math.abs(obj.left! + objWidth - canvasSize.width) < snapZone) {
        obj.set({ left: canvasSize.width - objWidth });
      }
      
      // Snap to top edge
      if (Math.abs(obj.top!) < snapZone) {
        obj.set({ top: 0 });
      }
      
      // Snap to bottom edge
      if (Math.abs(obj.top! + objHeight - canvasSize.height) < snapZone) {
        obj.set({ top: canvasSize.height - objHeight });
      }
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

    // Add click-away behavior to deselect objects
    canvas.on('mouse:down', (e) => {
      // If no target (clicking on empty canvas) and there's an active object
      if (!e.target && canvas.getActiveObject()) {
        canvas.discardActiveObject();
        canvas.renderAll();
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
            borderColor: 'rgba(255, 255, 255, 0.9)',
            cornerColor: 'rgba(255, 255, 255, 0.9)',
            cornerSize: 12,
            transparentCorners: false,
            cornerStyle: 'circle',
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
          borderColor: 'rgba(255, 255, 255, 0.9)',
          cornerColor: 'rgba(255, 255, 255, 0.9)',
          cornerSize: 12,
          transparentCorners: false,
          cornerStyle: 'circle',
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

      toggleCropMode: () => {
        const activeObject = canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'image') {
          alert('Please select an image to crop');
          return;
        }
        
        setIsCropMode(!isCropMode);
        
        if (!isCropMode) {
          // Entering crop mode
          activeObject.set({
            selectable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            borderColor: 'rgba(255, 165, 0, 0.9)',
            cornerColor: 'rgba(255, 165, 0, 0.9)',
          });
          canvas.renderAll();
        } else {
          // Exiting crop mode - apply basic crop by adjusting clipPath
          const cropRect = new FabricRect({
            left: 0,
            top: 0,
            width: activeObject.width! * activeObject.scaleX!,
            height: activeObject.height! * activeObject.scaleY!,
            absolutePositioned: true,
          });
          
          activeObject.clipPath = cropRect;
          activeObject.set({
            borderColor: 'rgba(255, 255, 255, 0.9)',
            cornerColor: 'rgba(255, 255, 255, 0.9)',
          });
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

        // Determine export settings based on use case
        const exportSize = 800; // Target size in pixels
        const isSharing = options.shareToFarcaster;
        
        // For sharing, use JPEG with compression for smaller file size
        // For download, use PNG for better quality (unless JPEG is specifically requested)
        const exportFormat = isSharing ? 'jpeg' : (options.format === 'jpg' ? 'jpeg' : 'png');
        const quality = isSharing ? 0.85 : 0.95; // Lower quality for sharing, higher for download
        
        // Export canvas with appropriate settings
        const dataURL = canvas.toDataURL({
          format: exportFormat,
          quality: exportFormat === 'jpeg' ? quality : undefined, // Quality only applies to JPEG
          multiplier: exportSize / canvas.width!, // Scale to target size
        });

        // Remove watermark after export
        if (options.watermark.enabled) {
          const objects = canvas.getObjects();
          canvas.remove(objects[objects.length - 1]);
          canvas.renderAll();
        }

        // Optional: Further compress if file size is still too large
        const compressImage = async (dataUrl: string, maxSizeKB: number = 500): Promise<string> => {
          // Check current size
          const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
          const sizeInKB = sizeInBytes / 1024;
          
          if (sizeInKB <= maxSizeKB || exportFormat === 'png') {
            return dataUrl; // Already small enough or PNG (don't recompress)
          }
          
          // Progressively reduce quality for JPEG
          let currentQuality = quality;
          let compressedDataUrl = dataUrl;
          
          while (sizeInKB > maxSizeKB && currentQuality > 0.3) {
            currentQuality -= 0.1;
            compressedDataUrl = canvas.toDataURL({
              format: 'jpeg',
              quality: currentQuality,
              multiplier: exportSize / canvas.width!,
            });
            
            const newSize = Math.round((compressedDataUrl.length * 3) / 4) / 1024;
            if (newSize <= maxSizeKB) break;
          }
          
          return compressedDataUrl;
        };

        // Compress for sharing if needed
        let finalDataURL = dataURL;
        if (isSharing) {
          finalDataURL = await compressImage(dataURL, 300); // Target 300KB for social sharing
        }

        // Handle download
        if (options.downloadToDevice) {
          const link = document.createElement('a');
          const extension = exportFormat === 'jpeg' ? 'jpg' : 'png';
          link.download = `meme-${Date.now()}.${extension}`;
          link.href = finalDataURL;
          link.click();
        }

        // Handle Farcaster share
        if (options.shareToFarcaster) {
          // Share to Farcaster - open window immediately to avoid popup blocker
          const warpcastWindow = window.open('about:blank', '_blank');
          
          try {
            // Use compressed version for sharing
            const shareUrl = await shareMemeToFarcaster(finalDataURL, undefined, undefined, warpcastWindow);
            console.log('Farcaster share initiated with compressed image');
          } catch (error) {
            console.error('Failed to share to Farcaster:', error);
            if (warpcastWindow) warpcastWindow.close();
          }
        }

        return finalDataURL;
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
          <button
            onClick={() => {
              canvasApiRef.current?.toggleCropMode();
            }}
            className={`px-2 sm:px-3 py-1 rounded hover:scale-105 transition-all text-xs sm:text-sm font-semibold ${
              isCropMode 
                ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
            }`}
            title="Toggle crop mode for images (Basic implementation)"
          >
            {isCropMode ? 'Exit Crop' : 'Crop'}
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
                  <li>• Click Crop button to crop selected images (basic)</li>
                </ul>
              </div>
              
              <div>
                <p className="text-gem-purple font-semibold mb-1">🚀 Pro Tips:</p>
                <ul className="text-gray-400 space-y-1 ml-4">
                  <li>• Top & bottom text work best for classic meme format</li>
                  <li>• Layer stickers to create dynamic scenes</li>
                  <li>• Items snap to center and edges for perfect alignment</li>
                  <li>• Click away from objects to deselect them</li>
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