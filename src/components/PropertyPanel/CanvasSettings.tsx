import useCompositorStore from '../../store/compositorStore';

/**
 * Canvas settings component
 * Allows configuration of canvas size and background
 */
function CanvasSettings() {
  const canvas = useCompositorStore((state) => state.project.canvas);
  const setCanvasConfig = useCompositorStore((state) => state.setCanvasConfig);

  const handleWidthChange = (value: string) => {
    const width = parseInt(value);
    if (!isNaN(width) && width > 0) {
      setCanvasConfig({ width });
      console.log(`[DEBUG] Canvas width changed to ${width}`);
    }
  };

  const handleHeightChange = (value: string) => {
    const height = parseInt(value);
    if (!isNaN(height) && height > 0) {
      setCanvasConfig({ height });
      console.log(`[DEBUG] Canvas height changed to ${height}`);
    }
  };

  const handleBackgroundColorChange = (value: string) => {
    if (value === 'transparent') {
      setCanvasConfig({ backgroundColor: null });
      console.log('[DEBUG] Canvas background set to transparent');
    } else if (value.startsWith('#')) {
      setCanvasConfig({ backgroundColor: value });
      console.log(`[DEBUG] Canvas background color changed to ${value}`);
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
    </div>
  );
}

export default CanvasSettings;
