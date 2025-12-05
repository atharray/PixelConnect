import useCompositorStore from '../../store/compositorStore';
import LayerItem from './LayerItem';

/**
 * Layer panel component
 * Displays list of layers and layer management controls
 */
function LayerPanel() {
  const project = useCompositorStore((state) => state.project);
  const selectedLayerIds = useCompositorStore((state) => state.selectedLayerIds);
  const selectAllLayers = useCompositorStore((state) => state.selectAllLayers);
  const deselectAllLayers = useCompositorStore((state) => state.deselectAllLayers);
  const deleteSelectedLayers = useCompositorStore((state) => state.deleteSelectedLayers);

  // Sort layers by z-index for display (highest z-index at top)
  const sortedLayers = [...project.layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleDeleteSelected = () => {
    if (selectedLayerIds.length === 0) {
      console.warn('[DEBUG] No layers selected for deletion');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedLayerIds.length} layer${selectedLayerIds.length !== 1 ? 's' : ''}?`
    );

    if (confirmed) {
      console.log(`[DEBUG] Deleting ${selectedLayerIds.length} selected layer(s)`);
      deleteSelectedLayers();
    }
  };

  return (
    <div className="h-full flex flex-col bg-canvas-bg">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Layers</h2>

        {/* Layer Panel Controls */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={selectAllLayers}
            disabled={project.layers.length === 0}
            className="flex-1 min-w-16 px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-300 bg-panel-bg hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Select all layers (Ctrl+A)"
          >
            All
          </button>

          <button
            onClick={deselectAllLayers}
            disabled={selectedLayerIds.length === 0}
            className="flex-1 min-w-16 px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-300 bg-panel-bg hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Deselect all layers (Ctrl+D)"
          >
            None
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedLayerIds.length === 0}
            className="flex-1 min-w-16 px-2 py-1 text-xs font-medium text-red-400 hover:text-red-300 bg-panel-bg hover:bg-red-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete selected layers (Delete)"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-gray-500">
            <div className="mb-2">No layers yet</div>
            <div className="text-xs">Upload images to get started</div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sortedLayers.map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerIds.includes(layer.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {project.layers.length > 0 && (
        <div className="px-3 py-2 border-t border-border text-xs text-gray-500">
          {project.layers.length} layer{project.layers.length !== 1 ? 's' : ''}
          {selectedLayerIds.length > 0 && ` • ${selectedLayerIds.length} selected`}
        </div>
      )}
    </div>
  );
}

export default LayerPanel;
