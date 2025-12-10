import useCompositorStore from '../../store/compositorStore';

/**
 * Grid toggle button component
 * Simple toggle for enabling/disabling the pixel grid with density control
 */
function GridToggle() {
  const gridEnabled = useCompositorStore((state) => state.project.grid.enabled);
  const gridDensity = useCompositorStore((state) => state.project.grid.density);
  const toggleGrid = useCompositorStore((state) => state.toggleGrid);
  const setGridDensity = useCompositorStore((state) => state.setGridDensity);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleGrid}
        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
          gridEnabled
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'text-gray-300 hover:text-white bg-panel-bg hover:bg-gray-700'
        }`}
        title="Toggle pixel grid (shows lines between pixels)"
      >
        #
      </button>

      {gridEnabled && (
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-400">Density:</label>
          <input
            type="range"
            min="1"
            max="8"
            value={gridDensity}
            onChange={(e) => setGridDensity(parseInt(e.target.value))}
            className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            title={`Grid density: every ${gridDensity} pixel(s)`}
          />
          <span className="text-xs text-gray-400 w-6">{gridDensity}</span>
        </div>
      )}
    </div>
  );
}

export default GridToggle;
