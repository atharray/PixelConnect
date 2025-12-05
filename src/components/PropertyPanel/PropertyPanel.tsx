import useCompositorStore from '../../store/compositorStore';
import PositionInputs from './PositionInputs';
import OpacityControl from './OpacityControl';
import CanvasSettings from './CanvasSettings';

/**
 * Property panel component
 * Displays properties for selected layers and canvas settings
 */
function PropertyPanel() {
  const project = useCompositorStore((state) => state.project);
  const selectedLayerIds = useCompositorStore((state) => state.selectedLayerIds);
  const selectedLayers = project.layers.filter((layer) =>
    selectedLayerIds.includes(layer.id)
  );

  return (
    <div className="h-full flex flex-col bg-canvas-bg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-gray-300">Properties</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedLayerIds.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <div className="mb-2">No layer selected</div>
            <div className="text-xs">Select a layer to edit properties</div>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {/* Selected Layers Info */}
            <div className="bg-panel-bg rounded p-2 text-xs text-gray-400">
              <div className="font-semibold text-gray-300 mb-1">Selected</div>
              {selectedLayers.map((layer) => (
                <div key={layer.id} className="truncate">
                  {layer.name}
                </div>
              ))}
            </div>

            {/* Position Controls (if single layer selected) */}
            {selectedLayerIds.length === 1 && selectedLayers.length > 0 && <PositionInputs layer={selectedLayers[0]} />}

            {/* Opacity Controls (if single layer selected) */}
            {selectedLayerIds.length === 1 && selectedLayers.length > 0 && <OpacityControl layer={selectedLayers[0]} />}

            {/* Bulk Position Controls (if multiple layers selected) */}
            {selectedLayerIds.length > 1 && <BulkPositionControls />}
          </div>
        )}
      </div>

      {/* Canvas Settings */}
      <div className="border-t border-border">
        <CanvasSettings />
      </div>
    </div>
  );
}

/**
 * Bulk position controls for multiple selected layers
 */
function BulkPositionControls() {
  const moveSelectedLayers = useCompositorStore((state) => state.moveSelectedLayers);
  const selectedLayerIds = useCompositorStore((state) => state.selectedLayerIds);

  const handleOffset = (deltaX: number, deltaY: number) => {
    console.log(
      `[DEBUG] Moving ${selectedLayerIds.length} layers by (${deltaX}, ${deltaY})`
    );
    moveSelectedLayers(deltaX, deltaY);
  };

  return (
    <div className="bg-panel-bg rounded p-3 space-y-3">
      <div className="text-xs font-semibold text-gray-300">Move Selected</div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Offset X</label>
          <input
            type="number"
            defaultValue={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value) || 0;
                handleOffset(value, 0);
                (e.target as HTMLInputElement).value = '0';
              }
            }}
            className="w-full px-2 py-1 bg-canvas-bg border border-border rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Pixels"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Offset Y</label>
          <input
            type="number"
            defaultValue={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value) || 0;
                handleOffset(0, value);
                (e.target as HTMLInputElement).value = '0';
              }
            }}
            className="w-full px-2 py-1 bg-canvas-bg border border-border rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Pixels"
          />
        </div>
      </div>

      <div className="flex gap-1 text-xs">
        <button
          onClick={() => handleOffset(-1, 0)}
          className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Move left 1px (Shift+←)"
        >
          ←
        </button>
        <button
          onClick={() => handleOffset(1, 0)}
          className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Move right 1px (Shift+→)"
        >
          →
        </button>
        <button
          onClick={() => handleOffset(0, -1)}
          className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Move up 1px (Shift+↑)"
        >
          ↑
        </button>
        <button
          onClick={() => handleOffset(0, 1)}
          className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Move down 1px (Shift+↓)"
        >
          ↓
        </button>
      </div>
    </div>
  );
}

export default PropertyPanel;
