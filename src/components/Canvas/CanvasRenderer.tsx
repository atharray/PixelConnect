import { useEffect, useRef, useState } from 'react';
import useCompositorStore from '../../store/compositorStore';
import GridOverlay from './GridOverlay';
import Rulers from './Rulers';

/**
 * Canvas renderer component
 * Handles drawing and pixel-perfect rendering
 */
function CanvasRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const project = useCompositorStore((state) => state.project);
  const selectedLayerIds = useCompositorStore((state) => state.selectedLayerIds);
  const selectLayer = useCompositorStore((state) => state.selectLayer);
  const deselectAllLayers = useCompositorStore((state) => state.deselectAllLayers);
  const startDraggingLayer = useCompositorStore((state) => state.startDraggingLayer);
  const updateDragPosition = useCompositorStore((state) => state.updateDragPosition);
  const stopDraggingLayer = useCompositorStore((state) => state.stopDraggingLayer);
  const setViewport = useCompositorStore((state) => state.setViewport);

  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  /**
   * Decode base64 image data and cache it
   */
  useEffect(() => {
    const loadImages = async () => {
      const newImages = new Map<string, HTMLImageElement>();

      for (const layer of project.layers) {
        if (!loadedImages.has(layer.id) || loadedImages.get(layer.id)?.src !== layer.imageData) {
          try {
            const img = new Image();
            img.src = layer.imageData;
            
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error(`Failed to load image for layer: ${layer.name}`));
            });

            newImages.set(layer.id, img);
            console.log(`[DEBUG] Image loaded for layer: ${layer.name} (${layer.width}x${layer.height})`);
          } catch (error) {
            console.error(`[DEBUG] Error loading image for layer ${layer.name}:`, error);
          }
        }
      }

      setLoadedImages((prev) => new Map([...prev, ...newImages]));
    };

    loadImages();
  }, [project.layers]);

  /**
   * Initialize viewport to show canvas centered and fit on screen
   */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Only run once on mount - check if viewport is at defaults
    if (project.viewport.zoom !== 100 || project.viewport.panX !== 0 || project.viewport.panY !== 0) {
      return;
    }

    // Calculate zoom to fit canvas in view
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const canvasWidth = project.canvas.width;
    const canvasHeight = project.canvas.height;

    // Calculate zoom with some padding (90% of available space)
    const zoomX = (containerWidth / canvasWidth) * 100 * 0.9;
    const zoomY = (containerHeight / canvasHeight) * 100 * 0.9;
    const zoomToFit = Math.min(zoomX, zoomY, 100); // Don't zoom in, max 100%

    console.log(`[DEBUG] Initializing viewport - zoom to fit: ${zoomToFit.toFixed(1)}%`);
    setViewport({ zoom: Math.max(zoomToFit, 10) }); // Minimum 10% zoom
  }, []); // Empty deps - only run once on mount

  /**
   * Render canvas
   * CRITICAL: Must set imageSmoothingEnabled = false for pixel-perfect rendering
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[DEBUG] Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[DEBUG] Failed to get canvas context');
      return;
    }

    // CRITICAL: Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;

    // Set canvas size
    canvas.width = project.canvas.width;
    canvas.height = project.canvas.height;

    console.log(`[DEBUG] Canvas size set to ${canvas.width}x${canvas.height}`);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background color if set
    if (project.canvas.backgroundColor) {
      ctx.fillStyle = project.canvas.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log(`[DEBUG] Background color applied: ${project.canvas.backgroundColor}`);
    }

    // Sort layers by z-index for rendering
    const sortedLayers = [...project.layers]
      .filter((layer) => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    console.log(`[DEBUG] Rendering ${sortedLayers.length} visible layers`);

    // Render each layer
    for (const layer of sortedLayers) {
      const img = loadedImages.get(layer.id);
      if (!img) {
        console.warn(`[DEBUG] Image not loaded for layer: ${layer.name}`);
        continue;
      }

      // Use floor to ensure integer positioning for pixel precision
      const x = Math.floor(layer.x);
      const y = Math.floor(layer.y);

      // Apply opacity
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;

      ctx.drawImage(img, x, y);
      
      // Restore opacity
      ctx.globalAlpha = prevAlpha;
      
      console.log(`[DEBUG] Layer rendered: ${layer.name} at (${x}, ${y}) with opacity ${ctx.globalAlpha}`);
    }
  }, [project, loadedImages]);

  /**
   * Calculate world coordinates from mouse position
   * This accounts for the canvas transform: translate(-panX*zoom, -panY*zoom) scale(zoom)
   */
  const getWorldCoordinates = (screenX: number, screenY: number): { x: number; y: number } => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    // Get the canvas viewport container bounds
    const containerRect = container.getBoundingClientRect();
    
    // Position relative to the container
    const relativeX = screenX - containerRect.left - 20; // 20px for ruler
    const relativeY = screenY - containerRect.top - 20;  // 20px for ruler
    
    // The canvas is centered in the viewport and has zoom applied
    // Get the container's working area (excluding rulers)
    const viewportWidth = containerRect.width - 20;
    const viewportHeight = containerRect.height - 20;
    
    // Center offset (where the canvas appears centered)
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    
    // Distance from center
    const offsetFromCenterX = relativeX - centerX;
    const offsetFromCenterY = relativeY - centerY;
    
    // Account for zoom and pan
    // The canvas is scaled by zoom/100, so we divide screen distance by zoom
    const zoom = project.viewport.zoom / 100;
    const canvasDistX = offsetFromCenterX / zoom;
    const canvasDistY = offsetFromCenterY / zoom;
    
    // Center of canvas in world coordinates
    const canvasCenterX = project.canvas.width / 2;
    const canvasCenterY = project.canvas.height / 2;
    
    // Apply pan offset
    const worldX = canvasCenterX + canvasDistX + project.viewport.panX;
    const worldY = canvasCenterY + canvasDistY + project.viewport.panY;
    
    console.log(`[DEBUG] Screen (${screenX.toFixed(0)}, ${screenY.toFixed(0)}) -> relative (${relativeX.toFixed(1)}, ${relativeY.toFixed(1)}) -> offset (${offsetFromCenterX.toFixed(1)}, ${offsetFromCenterY.toFixed(1)}) -> canvas dist (${canvasDistX.toFixed(1)}, ${canvasDistY.toFixed(1)}) -> world (${worldX.toFixed(1)}, ${worldY.toFixed(1)})`);
    
    return { x: worldX, y: worldY };
  };

  /**
   * Handle canvas mouse events for layer dragging and panning
   */
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('[DEBUG] Canvas mouse down event fired');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[DEBUG] Canvas ref not available');
      return;
    }

    // Middle-click (button 1) for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      console.log('[DEBUG] Started panning with middle-click');
      return;
    }

    // Left-click (button 0) for layer selection/dragging
    if (e.button !== 0) {
      console.log(`[DEBUG] Ignoring mouse button ${e.button}`);
      return;
    }

    const { x: worldX, y: worldY } = getWorldCoordinates(e.clientX, e.clientY);

    console.log(
      `[DEBUG] Left-click at world (${worldX.toFixed(1)}, ${worldY.toFixed(1)})`
    );

    // Find layer at this position (check in reverse order - top layer first)
    const sortedLayers = [...project.layers]
      .filter((layer) => layer.visible)
      .sort((a, b) => b.zIndex - a.zIndex);

    console.log(`[DEBUG] Checking ${sortedLayers.length} layers for click intersection`);

    for (const layer of sortedLayers) {
      if (
        worldX >= layer.x &&
        worldX < layer.x + layer.width &&
        worldY >= layer.y &&
        worldY < layer.y + layer.height
      ) {
        console.log(`[DEBUG] Layer clicked: ${layer.name} at (${layer.x}, ${layer.y}) size (${layer.width}x${layer.height})`);

        const isMultiSelect = e.ctrlKey || e.metaKey;
        selectLayer(layer.id, isMultiSelect);
        startDraggingLayer(layer.id, worldX, worldY);
        console.log(`[DEBUG] Started dragging layer: ${layer.name}`);
        return;
      } else {
        console.log(`[DEBUG] Layer ${layer.name} at (${layer.x}, ${layer.y}) size (${layer.width}x${layer.height}) - no hit`);
      }
    }

    console.log('[DEBUG] No layer clicked - deselecting all');
    deselectAllLayers();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x: worldX, y: worldY } = getWorldCoordinates(e.clientX, e.clientY);

    // Update hover coordinates
    setHoverCoords({ x: Math.floor(worldX), y: Math.floor(worldY) });

    // Handle middle-click panning
    if (isPanning) {
      const zoom = project.viewport.zoom / 100;
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      // Pan inversely proportional to zoom
      const newPanX = project.viewport.panX - (deltaX / zoom);
      const newPanY = project.viewport.panY - (deltaY / zoom);
      
      setViewport({ panX: newPanX, panY: newPanY });
      setPanStart({ x: e.clientX, y: e.clientY });
      console.log(`[DEBUG] Panning - new offset (${newPanX.toFixed(1)}, ${newPanY.toFixed(1)})`);
      return;
    }

    const isDragging = useCompositorStore.getState().ui.isDraggingLayer;
    if (isDragging) {
      updateDragPosition(worldX, worldY);
      console.log(
        `[DEBUG] Dragging - world position (${worldX.toFixed(1)}, ${worldY.toFixed(1)})`
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    stopDraggingLayer();
    console.log('[DEBUG] Layer drag ended');
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const direction = e.deltaY > 0 ? -1 : 1;
    const currentZoom = project.viewport.zoom;
    const zoomLevels = [25, 50, 100, 200, 400, 800, 1600];

    let newZoom = currentZoom;
    if (direction > 0) {
      newZoom = zoomLevels.find((z) => z > currentZoom) || zoomLevels[zoomLevels.length - 1];
    } else {
      newZoom =
        [...zoomLevels].reverse().find((z) => z < currentZoom) || zoomLevels[0];
    }

    console.log(`[DEBUG] Mouse wheel zoom: ${currentZoom}% -> ${newZoom}%`);
    setViewport({ zoom: newZoom });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-canvas-bg overflow-hidden"
      style={{ paddingTop: '20px', paddingLeft: '20px' }}
    >
      {/* Rulers */}
      <Rulers
        canvasWidth={project.canvas.width}
        canvasHeight={project.canvas.height}
        hoverCoords={hoverCoords}
        zoom={project.viewport.zoom}
        panX={project.viewport.panX}
        panY={project.viewport.panY}
      />

      {/* Canvas container with centering */}
      <div
        className="w-full h-full overflow-hidden flex items-center justify-center"
        style={{ width: 'calc(100% - 20px)', height: 'calc(100% - 20px)' }}
      >
        <div
          style={{
            transform: `translate(${-project.viewport.panX * (project.viewport.zoom / 100)}px, ${-project.viewport.panY * (project.viewport.zoom / 100)}px) scale(${project.viewport.zoom / 100})`,
            transformOrigin: 'center center',
            position: 'absolute',
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleCanvasWheel}
            className="cursor-pointer border border-gray-600"
            style={{
              imageRendering: 'pixelated',
            }}
          />
        
          {/* Grid Overlay */}
          <GridOverlay
            canvas={canvasRef.current}
            viewport={project.viewport}
            gridConfig={project.grid}
          />
        </div>
      </div>

      {/* Coordinate Display */}
      <div className="absolute bottom-4 right-4 bg-panel-bg border border-border rounded px-3 py-2 text-xs text-gray-400 space-y-1">
        <div>Canvas: {project.canvas.width}x{project.canvas.height}</div>
        <div>Zoom: {project.viewport.zoom}%</div>
        <div>Layers: {project.layers.length}</div>
        {hoverCoords && <div>Coords: ({hoverCoords.x}, {hoverCoords.y})</div>}
        <div className="text-gray-500 text-xs mt-2 pt-2 border-t border-border">Middle-click to pan</div>
      </div>

      {/* Selected Layers Info */}
      {selectedLayerIds.length > 0 && (
        <div className="absolute top-4 right-4 bg-panel-bg border border-blue-600 rounded px-3 py-2 text-xs text-blue-400">
          Selected: {selectedLayerIds.length} layer{selectedLayerIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default CanvasRenderer;
