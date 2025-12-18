import useCompositorStore from '../../store/compositorStore';

/**
 * Zoom controls component
 * Provides zoom in/out, reset, and preset zoom levels
 */
function ZoomControls() {
  const viewport = useCompositorStore((state) => state.project.viewport);
  const setViewport = useCompositorStore((state) => state.setViewport);

  const ZOOM_LEVELS = [25, 50, 100, 200, 400, 800, 1600, 3200];

  const handleZoom = (zoomLevel: number) => {
    // console.log(`[DEBUG] Zoom level changed to ${zoomLevel}%`);
    setViewport({ zoom: zoomLevel });
  };

  const handleZoomIn = () => {
    const currentZoom = viewport.zoom;
    const nextZoom = ZOOM_LEVELS.find((z) => z > currentZoom) || ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    handleZoom(nextZoom);
  };

  const handleZoomOut = () => {
    const currentZoom = viewport.zoom;
    const nextZoom = [...ZOOM_LEVELS].reverse().find((z) => z < currentZoom) || ZOOM_LEVELS[0];
    handleZoom(nextZoom);
  };

  const handleResetZoom = () => {
    setViewport({ zoom: 100, panX: 0, panY: 0 });
  };

  return (
    <div className="flex items-center gap-2 bg-canvas-bg rounded px-2 py-1">
      <button
        onClick={handleZoomOut}
        className="px-2 py-1 text-sm font-medium text-gray-300 hover:text-white bg-panel-bg hover:bg-gray-700 rounded transition-colors"
        title="Zoom Out"
      >
        −
      </button>

      <div className="relative group">
        <button
          className="px-3 py-1 text-sm font-medium text-gray-300 hover:text-white bg-panel-bg hover:bg-gray-700 rounded transition-colors min-w-16 text-right"
          title="Click to select zoom level"
        >
          {viewport.zoom}%
        </button>

        {/* Dropdown menu */}
        <div className="absolute right-0 mt-1 w-24 bg-panel-bg border border-border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          {ZOOM_LEVELS.map((zoom) => (
            <button
              key={zoom}
              onClick={() => handleZoom(zoom)}
              className={`w-full text-left px-3 py-1 text-sm transition-colors ${
                viewport.zoom === zoom
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {zoom}%
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleZoomIn}
        className="px-2 py-1 text-sm font-medium text-gray-300 hover:text-white bg-panel-bg hover:bg-gray-700 rounded transition-colors"
        title="Zoom In"
      >
        +
      </button>

      <div className="w-px h-4 bg-border"></div>

      <button
        onClick={handleResetZoom}
        className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
        title="Reset zoom to 100% and center canvas"
      >
        Reset
      </button>
    </div>
  );
}

export default ZoomControls;
