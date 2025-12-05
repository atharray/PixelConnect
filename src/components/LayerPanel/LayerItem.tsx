import { useState } from 'react';
import useCompositorStore from '../../store/compositorStore';
import { Layer } from '../../types/compositor.types';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
}

/**
 * Individual layer item component
 * Displays layer thumbnail, name, and controls
 */
function LayerItem({ layer, isSelected }: LayerItemProps) {
  const selectLayer = useCompositorStore((state) => state.selectLayer);
  const updateLayer = useCompositorStore((state) => state.updateLayer);
  const removeLayer = useCompositorStore((state) => state.removeLayer);
  const reorderLayer = useCompositorStore((state) => state.reorderLayer);
  const bringLayerToFront = useCompositorStore((state) => state.bringLayerToFront);
  const sendLayerToBack = useCompositorStore((state) => state.sendLayerToBack);
  const duplicateLayer = useCompositorStore((state) => state.duplicateLayer);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(layer.name);

  const handleSelectLayer = (e: React.MouseEvent) => {
    const multiSelect = e.ctrlKey || e.metaKey;
    selectLayer(layer.id, multiSelect);
    console.log(`[DEBUG] Layer selected: ${layer.name} (multiSelect: ${multiSelect})`);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayer(layer.id, { visible: !layer.visible });
    console.log(`[DEBUG] Layer visibility toggled: ${layer.name} -> ${!layer.visible}`);
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayer(layer.id, { locked: !layer.locked });
    console.log(`[DEBUG] Layer lock toggled: ${layer.name} -> ${!layer.locked}`);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      updateLayer(layer.id, { name: tempName.trim() });
      console.log(`[DEBUG] Layer renamed: ${layer.name} -> ${tempName.trim()}`);
    } else {
      setTempName(layer.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setTempName(layer.name);
      setIsEditingName(false);
    }
  };

  const handleRemoveLayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Remove layer "${layer.name}"?`);
    if (confirmed) {
      removeLayer(layer.id);
      console.log(`[DEBUG] Layer removed: ${layer.name}`);
    }
  };

  const handleDuplicateLayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateLayer(layer.id);
    console.log(`[DEBUG] Layer duplicated: ${layer.name}`);
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    reorderLayer(layer.id, 'up');
    console.log(`[DEBUG] Layer moved up: ${layer.name}`);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    reorderLayer(layer.id, 'down');
    console.log(`[DEBUG] Layer moved down: ${layer.name}`);
  };

  const handleBringToFront = (e: React.MouseEvent) => {
    e.stopPropagation();
    bringLayerToFront(layer.id);
    console.log(`[DEBUG] Layer brought to front: ${layer.name}`);
  };

  const handleSendToBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    sendLayerToBack(layer.id);
    console.log(`[DEBUG] Layer sent to back: ${layer.name}`);
  };

  return (
    <div
      onClick={handleSelectLayer}
      className={`group p-2 rounded border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-900 border-blue-500 text-white'
          : 'bg-panel-bg border-border text-gray-300 hover:bg-gray-800'
      }`}
    >
      {/* Layer Header */}
      <div className="flex items-center gap-2 mb-1">
        {/* Thumbnail */}
        <div className="w-8 h-8 flex-shrink-0 bg-canvas-bg border border-gray-600 rounded overflow-hidden">
          <img
            src={layer.imageData}
            alt={layer.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Layer Name */}
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-1 py-0 bg-canvas-bg border border-blue-400 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-300"
              placeholder="Layer name..."
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTempName(layer.name);
                setIsEditingName(true);
              }}
              className="w-full text-left text-xs font-medium truncate hover:underline"
              title={layer.name}
            >
              {layer.name}
            </button>
          )}
        </div>

        {/* Visibility Toggle */}
        <button
          onClick={handleToggleVisibility}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded transition-colors hover:bg-gray-600"
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? '👁️' : '🚫'}
        </button>

        {/* Lock Toggle */}
        <button
          onClick={handleToggleLock}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded transition-colors hover:bg-gray-600"
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>
      </div>

      {/* Layer Info */}
      <div className="text-xs text-gray-500 px-10 mb-2">
        {layer.width}×{layer.height} • z:{layer.zIndex}
      </div>

      {/* Layer Controls */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleMoveUp}
          className="flex-1 px-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Move up (↑)"
        >
          ↑
        </button>
        <button
          onClick={handleMoveDown}
          className="flex-1 px-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Move down (↓)"
        >
          ↓
        </button>
        <button
          onClick={handleBringToFront}
          className="flex-1 px-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Bring to front"
        >
          ⬆️
        </button>
        <button
          onClick={handleSendToBack}
          className="flex-1 px-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Send to back"
        >
          ⬇️
        </button>
        <button
          onClick={handleDuplicateLayer}
          className="flex-1 px-1 py-1 text-xs bg-blue-700 hover:bg-blue-600 rounded transition-colors"
          title="Duplicate layer"
        >
          📋
        </button>
        <button
          onClick={handleRemoveLayer}
          className="flex-1 px-1 py-1 text-xs bg-red-700 hover:bg-red-600 rounded transition-colors"
          title="Remove layer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default LayerItem;
