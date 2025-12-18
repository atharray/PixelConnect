import React, { useState, useEffect, useRef } from 'react';
import DraggableModal from './DraggableModal';
import useCompositorStore from '../../store/compositorStore';
import { Layer } from '../../types/compositor.types';
import { ALL_FONTS, SYSTEM_FONTS } from '../../utils/fonts';
import { rasterizeText } from '../../utils/textRasterizer';

interface TextLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLayer?: Layer; // If provided, we're editing an existing text layer
}

const CANVAS_PREVIEW_LAYER_ID = '__text_canvas_preview__';

const TextLayerModal: React.FC<TextLayerModalProps> = ({ isOpen, onClose, existingLayer }) => {
  const addLayer = useCompositorStore((state) => state.addLayer);
  const updateLayer = useCompositorStore((state) => state.updateLayer);
  const removeLayer = useCompositorStore((state) => state.removeLayer);
  const layers = useCompositorStore((state) => state.project.layers);
  
  // State
  const [text, setText] = useState<string>('Enter your text here');
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontFamily, setFontFamily] = useState<string>(SYSTEM_FONTS[0].value);
  const [color, setColor] = useState<string>('#000000');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fontSearch, setFontSearch] = useState<string>('');
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState<boolean>(false);
  const [previewOnCanvas, setPreviewOnCanvas] = useState<boolean>(false);
  const [disableTransparency, setDisableTransparency] = useState<boolean>(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previewUpdateTimeoutRef = useRef<number | null>(null);
  const originalVisibilityRef = useRef<boolean>(true);
  
  // Load existing layer data if editing
  useEffect(() => {
    if (existingLayer && existingLayer.textContent !== undefined) {
      setText(existingLayer.textContent);
      setFontSize(existingLayer.fontSize || 48);
      setFontFamily(existingLayer.fontFamily || SYSTEM_FONTS[0].value);
      setColor(existingLayer.fontColor || '#000000');
      setTextAlign(existingLayer.textAlign || 'left');
      setDisableTransparency(existingLayer.disableTransparency || false);
      originalVisibilityRef.current = existingLayer.visible;
    }
  }, [existingLayer]);
  
  // Auto-generate preview when inputs change
  useEffect(() => {
    if (text.trim()) {
      generatePreview();
    }
  }, [text, fontSize, fontFamily, color, textAlign, disableTransparency]);
  
  // Handle canvas preview
  useEffect(() => {
    if (previewOnCanvas && text.trim() && previewImage) {
      // Hide existing layer immediately to avoid duplicates
      if (existingLayer) {
        const currentLayers = useCompositorStore.getState().project.layers;
        const currentLayer = currentLayers.find(l => l.id === existingLayer.id);
        if (currentLayer && currentLayer.visible) {
          updateLayer(existingLayer.id, { visible: false });
        }
      }
      
      updateCanvasPreview();
    } else {
      removeCanvasPreview();
    }
  }, [previewOnCanvas, previewImage, text]);
  
  // Clean up canvas preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      removeCanvasPreview();
    }
  }, [isOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const generatePreview = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const result = await rasterizeText({
        text,
        fontSize,
        fontFamily,
        color,
        textAlign,
        lineHeight: 1.2,
        disableTransparency
      });
      
      setPreviewImage(result.dataUrl);
    } catch (error) {
      console.error('Failed to generate text preview:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const updateCanvasPreview = () => {
    if (!previewImage || !previewOnCanvas) return;
    
    // Cancel any pending preview update
    if (previewUpdateTimeoutRef.current !== null) {
      clearTimeout(previewUpdateTimeoutRef.current);
    }
    
    // Debounce the preview update to avoid race conditions
    previewUpdateTimeoutRef.current = window.setTimeout(() => {
      const currentLayers = useCompositorStore.getState().project.layers;
      const existingPreview = currentLayers.find(l => l.id === CANVAS_PREVIEW_LAYER_ID);
      
      // Create temporary image to get dimensions
      const img = new Image();
      img.src = previewImage;
      img.onload = () => {
        // Double-check for existing preview after image loads
        const latestLayers = useCompositorStore.getState().project.layers;
        const stillExists = latestLayers.find(l => l.id === CANVAS_PREVIEW_LAYER_ID);
        
        // Determine position from existing layer if available
        const x = existingLayer ? existingLayer.x : 0;
        const y = existingLayer ? existingLayer.y : 0;
        
        if (stillExists) {
          // Update existing preview layer
          updateLayer(CANVAS_PREVIEW_LAYER_ID, {
            imageData: previewImage,
            width: img.naturalWidth,
            height: img.naturalHeight,
            opacity: 0.7, // Slightly transparent to indicate it's a preview
            x,
            y
          });
        } else if (previewOnCanvas) {
          // Only create new preview layer if preview is still enabled and doesn't exist
          const previewLayer: Layer = {
            id: CANVAS_PREVIEW_LAYER_ID,
            name: '🔍 Canvas Preview (Temporary)',
            imageData: previewImage,
            x,
            y,
            zIndex: Date.now() + 1000000, // Very high z-index to appear on top
            visible: true,
            locked: true, // Lock to prevent accidental editing
            opacity: 0.7,
            width: img.naturalWidth,
            height: img.naturalHeight
          };
          addLayer(previewLayer);
        }
      };
    }, 50); // Small debounce delay
  };
  
  const removeCanvasPreview = () => {
    // Cancel any pending preview update
    if (previewUpdateTimeoutRef.current !== null) {
      clearTimeout(previewUpdateTimeoutRef.current);
      previewUpdateTimeoutRef.current = null;
    }
    
    const currentLayers = useCompositorStore.getState().project.layers;
    const existingPreview = currentLayers.find(l => l.id === CANVAS_PREVIEW_LAYER_ID);
    if (existingPreview) {
      removeLayer(CANVAS_PREVIEW_LAYER_ID);
    }

    // Always restore existing layer visibility if we're editing a layer
    // (we may have hidden it to show the preview)
    if (existingLayer) {
      const currentLayer = currentLayers.find(l => l.id === existingLayer.id);
      if (currentLayer && !currentLayer.visible) {
        updateLayer(existingLayer.id, { visible: true });
      }
    }
  };
  
  const handleCreate = async () => {
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await rasterizeText({
        text,
        fontSize,
        fontFamily,
        color,
        textAlign,
        lineHeight: 1.2,
        disableTransparency
      });
      
      if (existingLayer) {
        // Update existing layer
        updateLayer(existingLayer.id, {
          imageData: result.dataUrl,
          width: result.width,
          height: result.height,
          textContent: text,
          fontSize,
          fontFamily,
          fontColor: color,
          textAlign,
          disableTransparency,
          name: existingLayer.name // Keep existing name
        });
      } else {
        // Create new layer
        const newLayer: Layer = {
          id: crypto.randomUUID(),
          name: `Text: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`,
          imageData: result.dataUrl,
          x: 0,
          y: 0,
          zIndex: Date.now(),
          visible: true,
          locked: false,
          opacity: 1,
          width: result.width,
          height: result.height,
          textContent: text,
          fontSize,
          fontFamily,
          fontColor: color,
          textAlign,
          disableTransparency
        };
        
        addLayer(newLayer);
      }
      
      // Remove canvas preview before closing
      removeCanvasPreview();
      onClose();
    } catch (error) {
      console.error('Failed to create text layer:', error);
      alert('Failed to create text layer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Filter fonts based on search
  const filteredFonts = ALL_FONTS.filter(font =>
    font.name.toLowerCase().includes(fontSearch.toLowerCase())
  );
  
  // Group filtered fonts by category
  const filteredSystemFonts = filteredFonts.filter(f => f.category === 'system');
  const filteredGoogleFonts = filteredFonts.filter(f => f.category === 'google');
  
  // Get selected font name for display
  const selectedFont = ALL_FONTS.find(f => f.value === fontFamily);
  
  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={existingLayer ? 'Edit Text Layer' : 'Create Text Layer'}
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Text Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Text Content</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text here"
            className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Font Settings Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Font Family Picker */}
          <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-300">Font Family</label>
            <button
              onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-left flex items-center justify-between hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>{selectedFont?.name || 'Arial'}</span>
              <span className="text-gray-400">{isFontDropdownOpen ? '▲' : '▼'}</span>
            </button>
            
            {isFontDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
                {/* Search */}
                <div className="p-2 border-b border-gray-600 sticky top-0 bg-gray-700">
                  <input
                    type="text"
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="Search fonts..."
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* System Fonts */}
                {filteredSystemFonts.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-800">
                      System Fonts
                    </div>
                    {filteredSystemFonts.map(font => (
                      <button
                        key={font.value}
                        onClick={() => {
                          setFontFamily(font.value);
                          setIsFontDropdownOpen(false);
                          setFontSearch('');
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-600 ${
                          fontFamily === font.value ? 'bg-blue-600' : ''
                        }`}
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Google Fonts */}
                {filteredGoogleFonts.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-800">
                      Google Fonts
                    </div>
                    {filteredGoogleFonts.map(font => (
                      <button
                        key={font.value}
                        onClick={() => {
                          setFontFamily(font.value);
                          setIsFontDropdownOpen(false);
                          setFontSearch('');
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-600 ${
                          fontFamily === font.value ? 'bg-blue-600' : ''
                        }`}
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {filteredFonts.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-400">
                    No fonts found
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Font Size */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Font Size</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Math.max(8, Math.min(2000, parseInt(e.target.value) || 48)))}
              min="8"
              max="2000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Color and Alignment Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Color Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer bg-gray-700 border border-gray-600"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Text Alignment */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Text Alignment</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTextAlign('left')}
                className={`flex-1 px-3 py-2 rounded border ${
                  textAlign === 'left'
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                Left
              </button>
              <button
                onClick={() => setTextAlign('center')}
                className={`flex-1 px-3 py-2 rounded border ${
                  textAlign === 'center'
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                Center
              </button>
              <button
                onClick={() => setTextAlign('right')}
                className={`flex-1 px-3 py-2 rounded border ${
                  textAlign === 'right'
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                Right
              </button>
            </div>
          </div>
        </div>
        
        {/* Options Row */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={disableTransparency}
              onChange={(e) => setDisableTransparency(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer bg-gray-700 border-gray-600"
            />
            <span>Pixel Perfect (No Transparency)</span>
          </label>
        </div>
        
        {/* Preview */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Preview</label>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              <input
                type="checkbox"
                checked={previewOnCanvas}
                onChange={(e) => setPreviewOnCanvas(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Preview on Canvas</span>
            </label>
          </div>
          <div className="flex-1 bg-gray-800 border border-gray-600 rounded overflow-auto flex items-center justify-center p-4">
            {isProcessing && (
              <div className="text-gray-400">Generating preview...</div>
            )}
            {previewImage && !isProcessing && (
              <img
                src={previewImage}
                alt="Text preview"
                className="max-w-full max-h-full"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
            {!previewImage && !isProcessing && (
              <div className="text-gray-400">Preview will appear here</div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isProcessing || !text.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            {existingLayer ? 'Update Text Layer' : 'Create Text Layer'}
          </button>
        </div>
      </div>
    </DraggableModal>
  );
};

export default TextLayerModal;
