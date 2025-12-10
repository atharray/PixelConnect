import { useEffect } from 'react';
import useCompositorStore from '../../store/compositorStore';
import { savePreferences, loadPreferences } from '../../hooks/useLocalStorage';

/**
 * Canvas settings component
 * Allows configuration of canvas size and background
 */
function CanvasSettings() {
  const canvas = useCompositorStore((state) => state.project.canvas);
  const setCanvasConfig = useCompositorStore((state) => state.setCanvasConfig);

  // Sync canvas border settings to localStorage
  useEffect(() => {
    const preferences = loadPreferences();
    preferences.canvasBorderColor = canvas.borderColor;
    preferences.canvasBorderWidth = canvas.borderWidth;
    preferences.canvasBorderOpacity = canvas.borderOpacity;
    savePreferences(preferences);
  }, [canvas.borderColor, canvas.borderWidth, canvas.borderOpacity]);

  const handleWidthChange = (value: string) => {
    const width = parseInt(value);
    if (!isNaN(width) && width > 0) {
      setCanvasConfig({ width });
      // console.log(`[DEBUG] Canvas width changed to ${width}`);
    }
  };

  const handleHeightChange = (value: string) => {
    const height = parseInt(value);
    if (!isNaN(height) && height > 0) {
      setCanvasConfig({ height });
      // console.log(`[DEBUG] Canvas height changed to ${height}`);
    }
  };

  const handleBackgroundColorChange = (value: string) => {
    if (value === 'transparent') {
      setCanvasConfig({ backgroundColor: null });
      // console.log('[DEBUG] Canvas background set to transparent');
    } else if (value.startsWith('#')) {
      setCanvasConfig({ backgroundColor: value });
      // console.log(`[DEBUG] Canvas background color changed to ${value}`);
    }
  };

  const handleBorderColorChange = (value: string) => {
    setCanvasConfig({ borderColor: value });
    // console.log(`[DEBUG] Canvas border color changed to ${value}`);
  };

  const handleBorderWidthChange = (value: string) => {
    const width = parseInt(value);
    if (!isNaN(width) && width >= 0) {
      setCanvasConfig({ borderWidth: width });
      // console.log(`[DEBUG] Canvas border width changed to ${width}`);
    }
  };

  const handleBorderOpacityChange = (value: string) => {
    const opacity = parseFloat(value);
    if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
      setCanvasConfig({ borderOpacity: opacity });
      // console.log(`[DEBUG] Canvas border opacity changed to ${opacity}`);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs font-semibold text-gray-300">Canvas</div>

      {/* Canvas Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Width</label>
          <input
            type="number"
            value={canvas.width}
            onChange={(e) => handleWidthChange(e.target.value)}
            min={1}
            className="w-full px-2 py-1 bg-canvas-bg border border-border rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Width"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Height</label>
          <input
            type="number"
            value={canvas.height}
            onChange={(e) => handleHeightChange(e.target.value)}
            min={1}
            className="w-full px-2 py-1 bg-canvas-bg border border-border rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Height"
          />
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Background</label>
        <div className="flex gap-1">
          <input
            type="color"
            value={canvas.backgroundColor || '#ffffff'}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            className="flex-1 h-8 rounded cursor-pointer border border-border"
            title="Pick background color"
          />
          <button
            onClick={() => handleBackgroundColorChange('transparent')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              canvas.backgroundColor === null
                ? 'bg-blue-600 text-white'
                : 'bg-panel-bg text-gray-400 hover:text-gray-300'
            }`}
            title="Set background to transparent"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Border Settings */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="text-xs font-semibold text-gray-300">Border</div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Color</label>
            <input
              type="color"
              value={canvas.borderColor || '#000000'}
              onChange={(e) => handleBorderColorChange(e.target.value)}
              className="w-full h-8 rounded cursor-pointer border border-border"
              title="Pick border color"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Width (px)</label>
            <input
              type="number"
              value={canvas.borderWidth || 0}
              onChange={(e) => handleBorderWidthChange(e.target.value)}
              min={0}
              max={100}
              className="w-full px-2 py-1 bg-canvas-bg border border-border rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={canvas.borderOpacity || 1}
            onChange={(e) => handleBorderOpacityChange(e.target.value)}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            title="Border opacity (0 = transparent, 1 = opaque)"
          />
        </div>
      </div>
    </div>
  );
}

export default CanvasSettings;
