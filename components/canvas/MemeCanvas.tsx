'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, FabricText, Rect as FabricRect } from 'fabric';
import { Sticker, TextOptions, ExportOptions, StickerCollection, BackgroundImage } from '@/types';
import { shareMemeToFarcaster } from '@/lib/farcaster';
import { downloadImageMobile, isMobileDevice } from '@/lib/mobile-utils';
import { useFarcaster } from '@/contexts/FarcasterContext';
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
  const { isInFarcaster, isMobile, shareImage } = useFarcaster();
  // History tracking removed since undo/redo removed
  // const historyRef = useRef<string[]>([]);
  // const historyIndexRef = useRef<number>(-1);
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
    
    // Restore existing data if available
    if (existingData) {
      canvas.loadFromJSON(existingData, () => {
        canvas.renderAll();
      });
    }
    
    // Track canvas events for debugging
    canvas.on('object:added', (e) => {
      console.log('➕ CANVAS EVENT: Object added:', e.target?.type);
    });
    canvas.on('object:removed', (e) => {
      console.log('➖ CANVAS EVENT: Object removed:', e.target?.type);
    });
    canvas.on('object:modified', (e) => {
      console.log('🔄 CANVAS EVENT: Object modified:', e.target?.type);
    });
    
    // Selection events for debugging
    canvas.on('selection:created', (e) => {
      console.log('🔵 CANVAS EVENT: Selection created:', e.selected?.[0]?.type);
    });
    canvas.on('selection:cleared', () => {
      console.log('⭕ CANVAS EVENT: Selection cleared');
    });
    canvas.on('selection:updated', (e) => {
      console.log('🔄 CANVAS EVENT: Selection updated:', e.selected?.[0]?.type);
    });
    
    // Enforce uniform scaling to maintain aspect ratio
    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Force uniform scaling by keeping scaleX and scaleY the same
      const scale = Math.max(obj.scaleX!, obj.scaleY!);
      obj.set({
        scaleX: scale,
        scaleY: scale
      });
    });
    
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
    
    // History saving removed since undo/redo removed
    
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

    // Add click-away behavior to deselect objects (DESKTOP ONLY)
    canvas.on('mouse:down', (e) => {
      // Completely skip deselection on ANY mobile/touch device
      // Check multiple indicators for mobile
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 ||
                           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Also check if this is a touch event
      const isTouchEvent = e.e && (
        e.e.type === 'touchstart' || 
        e.e.type === 'touchend' || 
        e.e.type === 'touchmove' ||
        (e.e as any).pointerType === 'touch'
      );
      
      if (isTouchDevice || isTouchEvent) {
        // NEVER deselect on mobile/touch - preserve all objects
        console.log('Mobile touch detected - preserving selection');
        return;
      }
      
      // Desktop only: deselect when clicking empty canvas
      if (!e.target && canvas.getActiveObject()) {
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    });

    // Canvas API for parent component
    const canvasApi = {
      addSticker: (sticker: Sticker) => {
        console.log('🎨 STICKER: Adding sticker:', sticker.src);
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
            uniformScaling: true, // Force uniform scaling to maintain aspect ratio
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
          console.log('✅ STICKER: Added successfully at center position');
        }).catch(error => {
          console.error('❌ STICKER: Failed to load image:', error);
        });
      },

      addText: (text: string, options: TextOptions) => {
        console.log('📝 TEXT: Adding text:', { text, options });
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
          uniformScaling: true, // Maintain aspect ratio for text
          lockScalingFlip: true,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          cornerColor: 'rgba(255, 255, 255, 0.9)',
          cornerSize: 12,
          transparentCorners: false,
          cornerStyle: 'circle',
        });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.renderAll();
        console.log('✅ TEXT: Added successfully at position:', options.position);
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
        console.log('🗑️ DELETE: Delete selected called');
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          console.log('✅ DELETE: Removing object type:', activeObject.type);
          canvas.remove(activeObject);
          canvas.discardActiveObject();
          canvas.renderAll();
          // History will be saved by the object:removed event listener
        } else {
          console.log('❌ DELETE: No object selected');
        }
      },

      /* Removed crop functionality
      toggleCropMode: () => {
        console.log('🔧 CROP: Toggle crop mode called. Current mode:', isCropMode, 'cropRect:', cropRect);
        
        // If we're in crop mode and have a crop rect, exit crop mode
        if (isCropMode && cropRect) {
          // EXITING CROP MODE - Apply the crop
          console.log('✂️ CROP: Applying crop to image');
          
          if (croppingImage) {
            const cropBounds = cropRect.getBoundingRect();
            const imgBounds = croppingImage.getBoundingRect();
            
            console.log('📊 CROP: Crop bounds:', cropBounds);
            console.log('📊 CROP: Image bounds:', imgBounds);
            
            // Calculate crop region relative to image
            const cropLeft = Math.max(0, cropBounds.left - imgBounds.left);
            const cropTop = Math.max(0, cropBounds.top - imgBounds.top);
            const cropWidth = Math.min(cropBounds.width, imgBounds.width - cropLeft);
            const cropHeight = Math.min(cropBounds.height, imgBounds.height - cropTop);
            
            console.log('📏 CROP: Calculated crop region:', {
              left: cropLeft,
              top: cropTop,
              width: cropWidth,
              height: cropHeight
            });
            
            // Apply clip path to image
            const clipPath = new FabricRect({
              left: cropLeft / croppingImage.scaleX!,
              top: cropTop / croppingImage.scaleY!,
              width: cropWidth / croppingImage.scaleX!,
              height: cropHeight / croppingImage.scaleY!,
              absolutePositioned: false,
              inverted: false,
            });
            
            croppingImage.set({
              clipPath: clipPath,
              selectable: true,
              evented: true,
              lockMovementX: false,
              lockMovementY: false,
              uniformScaling: true, // Maintain aspect ratio after crop
              lockScalingFlip: true,
              lockRotation: false,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              cornerColor: 'rgba(255, 255, 255, 0.9)',
            });
            
            // Remove crop rectangle
            canvas.remove(cropRect);
            console.log('✅ CROP: Crop applied successfully');
          }
          
          setCropRect(null);
          setCroppingImage(null);
          setIsCropMode(false);
          canvas.renderAll();
          return;
        }
        
        const activeObject = canvas.getActiveObject();
        
        if (!isCropMode) {
          // ENTERING CROP MODE
          if (!activeObject || (activeObject.type !== 'image' && activeObject.type !== 'group')) {
            alert('Please select a sticker/image to crop');
            console.log('❌ CROP: No image/sticker selected for cropping. Type:', activeObject?.type);
            return;
          }
          
          console.log('✅ CROP: Entering crop mode for image');
          setIsCropMode(true);
          setCroppingImage(activeObject);
          
          // Lock the image in place
          activeObject.set({
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
          });
          
          // Create crop rectangle overlay
          const imgBounds = activeObject.getBoundingRect();
          const rect = new FabricRect({
            left: imgBounds.left,
            top: imgBounds.top,
            width: imgBounds.width,
            height: imgBounds.height,
            fill: 'transparent',
            stroke: '#FF6B00',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            cornerColor: '#FF6B00',
            cornerStrokeColor: '#FF6B00',
            borderColor: '#FF6B00',
            cornerSize: 12,
            transparentCorners: false,
            hasRotatingPoint: false,
            lockRotation: true,
            // Keep aspect ratio locked
            lockUniScaling: false,
          });
          
          console.log('📐 CROP: Created crop rectangle with dimensions:', {
            width: imgBounds.width,
            height: imgBounds.height,
            left: imgBounds.left,
            top: imgBounds.top
          });
          
          canvas.add(rect);
          canvas.setActiveObject(rect);
          setCropRect(rect);
          canvas.renderAll();
        }
      },*/

      clearCanvas: () => {
        console.log('🧹 CLEAR: Clearing entire canvas');
        canvas.clear();
        canvas.backgroundColor = backgroundColor;
        canvas.renderAll();
        console.log('✅ CLEAR: Canvas cleared');
      },
      
      /* Removed undo/redo functionality
      undo: () => {
        console.log('↩️ UNDO: Undo called. Current index:', historyIndexRef.current, 'History length:', historyRef.current.length);
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          console.log('✅ UNDO: Moving to history index:', historyIndexRef.current);
          (canvas as any)._isUndoRedo = true;
          (canvas as any)._isLoadingFromHistory = true;
          
          // Clear canvas first to prevent duplicates
          canvas.clear();
          
          canvas.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
            canvas.backgroundColor = backgroundColor;
            canvas.renderAll();
            
            // Small delay before resetting flags
            setTimeout(() => {
              (canvas as any)._isUndoRedo = false;
              (canvas as any)._isLoadingFromHistory = false;
              console.log('✅ UNDO: State restored from history');
            }, 50);
          });
        } else {
          console.log('❌ UNDO: Already at the beginning of history');
        }
      },
      
      redo: () => {
        console.log('↪️ REDO: Redo called. Current index:', historyIndexRef.current, 'History length:', historyRef.current.length);
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current++;
          console.log('✅ REDO: Moving to history index:', historyIndexRef.current);
          (canvas as any)._isUndoRedo = true;
          (canvas as any)._isLoadingFromHistory = true;
          
          // Clear canvas first to prevent duplicates
          canvas.clear();
          
          canvas.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
            canvas.backgroundColor = backgroundColor;
            canvas.renderAll();
            
            // Small delay before resetting flags
            setTimeout(() => {
              (canvas as any)._isUndoRedo = false;
              (canvas as any)._isLoadingFromHistory = false;
              console.log('✅ REDO: State restored from history');
            }, 50);
          });
        } else {
          console.log('❌ REDO: Already at the end of history');
        }
      },*/

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
        // For download, use PNG for better quality
        const exportFormat = isSharing ? 'jpeg' : 'png';
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
          console.log('Starting download...');
          const extension = exportFormat === 'jpeg' ? 'jpg' : 'png';
          const filename = `meme-${Date.now()}.${extension}`;
          
          // Enhanced Farcaster and mobile detection
          const inFarcasterApp = isInFarcaster || 
                                window.location !== window.parent.location ||
                                window.self !== window.top;
          
          if (inFarcasterApp || isMobileDevice()) {
            console.log('Mobile/Farcaster download - using simplified approach');
            
            // For Farcaster app and mobile, use a simpler approach
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.download = filename;
            link.href = finalDataURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // If that doesn't work, try mobile download utils
            setTimeout(async () => {
              // Check if download worked by trying mobile methods
              if (inFarcasterApp || isMobileDevice()) {
                const success = await downloadImageMobile(finalDataURL, filename);
                if (!success) {
                  // Last resort: open in new tab
                  const newTab = window.open(finalDataURL, '_blank');
                  if (newTab) {
                    alert('Long press the image and select "Save Image" to download');
                  }
                }
              }
            }, 100);
          } else {
            // Desktop download
            console.log('Desktop download');
            const link = document.createElement('a');
            link.download = filename;
            link.href = finalDataURL;
            document.body.appendChild(link); // Add to DOM
            link.click();
            document.body.removeChild(link); // Remove from DOM
          }
        }

        // Handle Farcaster share
        if (options.shareToFarcaster) {
          console.log('Starting Farcaster share process');
          
          // Check environment
          const inFarcasterApp = isInFarcaster || 
                                window.location !== window.parent.location ||
                                window.self !== window.top;
          const isMobileBrowser = isMobileDevice() && !inFarcasterApp;
          
          try {
            // Always upload image first for consistent URL
            console.log('Uploading image to temporary storage');
            const uploadResponse = await fetch('/api/upload-temp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageData: finalDataURL }),
            });

            if (!uploadResponse.ok) {
              throw new Error('Failed to upload image');
            }
            
            const { imageUrl } = await uploadResponse.json();
            console.log('Image uploaded successfully:', imageUrl);
            
            // Prepopulated text
            const shareText = `...\n\nCheck out BizarreBeasts ($BB) and hold 25M tokens to join /bizarrebeasts! 🚀 👹\n\nCC @bizarrebeast\n\nhttps://bbapp.bizarrebeasts.io`;
            
            // Create compose URL
            const baseUrl = 'https://warpcast.com/~/compose';
            const params = new URLSearchParams();
            params.append('text', shareText);
            params.append('embeds[]', imageUrl);
            params.append('channelKey', 'bizarrebeasts');
            const shareUrl = `${baseUrl}?${params.toString()}`;
            
            // Simplified share logic - just open the URL appropriately
            console.log('Environment:', { 
              inFarcasterApp, 
              isMobileBrowser, 
              isMobile, 
              isInFarcaster,
              userAgent: navigator.userAgent 
            });
            
            // For mobile (both Farcaster app and browser), use direct navigation
            // For desktop, open in new window
            if (isMobileDevice() || inFarcasterApp || isInFarcaster) {
              console.log('Mobile/Farcaster - using direct navigation');
              // This works for:
              // - Farcaster app (opens composer within app)
              // - Mobile browser (opens Farcaster app if installed, otherwise web)
              window.location.href = shareUrl;
            } else {
              console.log('Desktop - opening in new window');
              // Desktop: Open in new window
              window.open(shareUrl, '_blank');
            }
            
          } catch (error) {
            console.error('Share failed:', error);
            
            // Fallback: Just download the image
            const extension = exportFormat === 'jpeg' ? 'jpg' : 'png';
            const filename = `meme-${Date.now()}.${extension}`;
            
            if (isMobileDevice() || inFarcasterApp) {
              await downloadImageMobile(finalDataURL, filename);
              alert('Image saved! Share it manually on Farcaster.');
            } else {
              // Desktop fallback
              const link = document.createElement('a');
              link.download = filename;
              link.href = finalDataURL;
              link.click();
              alert('Image downloaded! You can share it on Farcaster.');
            }
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
              console.log('🔘 BUTTON: Delete button clicked');
              canvasApiRef.current?.deleteSelected();
            }}
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded hover:scale-105 transition-all text-xs sm:text-sm font-semibold"
            title="Delete selected item (or press Delete key)"
          >
            Delete
          </button>
          <button
            onClick={() => {
              console.log('🔘 BUTTON: Clear button clicked');
              canvasApiRef.current?.clearCanvas();
            }}
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded hover:scale-105 transition-all text-xs sm:text-sm font-semibold"
            title="Clear entire canvas"
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
                  <li>• Click stickers to add them to your canvas</li>
                  <li>• Drag to move and position anywhere</li>
                  <li>• Drag corner handles to resize (maintains aspect ratio)</li>
                  <li>• Hold Shift while rotating for 15° angle snapping</li>
                  <li>• Double-click text to edit inline</li>
                  <li>• Use Delete key or Delete button to remove selected items</li>
                  <li>• Clear button removes everything and resets canvas</li>
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