import { useState, useRef, useEffect } from 'react';
import useCompositorStore from '../../store/compositorStore';
import { Layer } from '../../types/compositor.types';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
}

// Global drag state shared across all LayerItem instances
let globalDraggedLayerId: string | null = null;

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
  const [isDragOver, setIsDragOver] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Set up global listeners to handle mouseup and mouse leaving window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (globalDraggedLayerId) {
        console.log(`[DEBUG] Global drag released`);
        globalDraggedLayerId = null;
        setIsDragOver(false);
      }
    };

    // Listen for mouseup anywhere in the document
    document.addEventListener('mouseup', handleGlobalMouseUp);

    // Also listen for when mouse leaves the window entirely
    const handleMouseLeaveWindow = (e: MouseEvent) => {
      // clientY < 0 means mouse left the top of the window
      // clientX < 0 or clientX > window.innerWidth means left/right
      // clientY > window.innerHeight means bottom
      if (e.clientY < 0 || e.clientX < 0 || e.clientX > window.innerWidth || e.clientY > window.innerHeight) {
        if (globalDraggedLayerId) {
          console.log(`[DEBUG] Mouse left window, canceling drag`);
          globalDraggedLayerId = null;
          setIsDragOver(false);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseLeaveWindow);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleMouseLeaveWindow);
    };
  }, []);

  const handleSelectLayer = (e: React.MouseEvent) => {
    const multiSelect = e.ctrlKey || e.metaKey;
    selectLayer(layer.id, multiSelect);
    console.log(`[DEBUG] Layer selected: ${layer.name} (multiSelect: ${multiSelect})`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if clicking on control buttons - don't start drag
    if ((e.target as HTMLElement).closest('button') || isEditingName) {
      return;
    }

    // Start drag by setting global dragged layer
    globalDraggedLayerId = layer.id;
    
    // If not selected, select it
    if (!isSelected) {
      selectLayer(layer.id, false);
    }
    
    console.log(`[DEBUG] Starting drag of layer: ${layer.name}`);
  };

  const handleMouseEnter = () => {
    if (!globalDraggedLayerId || globalDraggedLayerId === layer.id) {
      setIsDragOver(false);
      return;
    }

    setIsDragOver(true);
    
    // Determine direction to move: if dragged layer has lower z-index, move it up
    const draggedLayer = useCompositorStore.getState().project.layers.find(l => l.id === globalDraggedLayerId);
    const direction = draggedLayer && draggedLayer.zIndex < layer.zIndex ? 'up' : 'down';
    
    reorderLayer(globalDraggedLayerId, direction);
    console.log(`[DEBUG] Swapped: moved layer ${globalDraggedLayerId} ${direction}`);
  };

  const handleMouseLeave = () => {
    setIsDragOver(false);
  };

  const handleMouseUp = () => {
    if (globalDraggedLayerId) {
      console.log(`[DEBUG] Drag released`);
      globalDraggedLayerId = null;
    }
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
      ref={elementRef}
      onClick={handleSelectLayer}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      className={`group p-2 rounded border transition-all cursor-pointer select-none ${
        isDragOver ? 'bg-green-900 border-green-400 scale-105' : ''
      } ${
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
