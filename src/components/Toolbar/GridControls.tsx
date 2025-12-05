import useCompositorStore from '../../store/compositorStore';

/**
 * Grid controls component
 * Allows toggling grid and configuring grid settings
 */
function GridControls() {
  const gridConfig = useCompositorStore((state) => state.project.grid);
  const setGridConfig = useCompositorStore((state) => state.setGridConfig);
  const toggleGrid = useCompositorStore((state) => state.toggleGrid);

  const handleGridSizeChange = (size: number) => {
    setGridConfig({ size });
    console.log(`[DEBUG] Grid size changed to ${size}px`);
  };

  const handleSnapToGridToggle = () => {
    setGridConfig({ snapToGrid: !gridConfig.snapToGrid });
    console.log(`[DEBUG] Snap to grid toggled: ${!gridConfig.snapToGrid}`);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleGrid}
        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
          gridConfig.enabled
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'text-gray-300 hover:text-white bg-panel-bg hover:bg-gray-700'
        }`}
        title="Toggle grid overlay"
      >
        ◆
      </button>

      {gridConfig.enabled && (
        <>
          <div className="relative group">
            <button
              className="px-2 py-1 text-xs font-medium text-gray-300 hover:text-white bg-panel-bg hover:bg-gray-700 rounded transition-colors"
              title="Grid size"
            >
              {gridConfig.size}px
            </button>

            {/* Grid size dropdown */}
            <div className="absolute left-0 mt-1 w-20 bg-panel-bg border border-border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {[1, 2, 4, 8, 16, 32].map((size) => (
                <button
                  key={size}
                  onClick={() => handleGridSizeChange(size)}
                  className={`w-full text-left px-2 py-1 text-xs transition-colors ${
                    gridConfig.size === size
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSnapToGridToggle}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              gridConfig.snapToGrid
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'text-gray-400 hover:text-gray-300 bg-panel-bg hover:bg-gray-700'
            }`}
            title="Snap to grid when moving layers"
          >
            🧲
          </button>
        </>
      )}
    </div>
  );
}

export default GridControls;
