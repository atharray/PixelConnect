/**
 * Grid overlay component
 * Renders a 1-pixel photoshop-style grid overlay
 * Grid is rendered in viewport coordinates, not canvas coordinates
 */

import { useEffect, useRef } from 'react';
import { ViewportState } from '../../types/compositor.types';

interface GridOverlayProps {
  canvas: HTMLCanvasElement | null;
  gridEnabled: boolean;
  viewport: ViewportState;
  canvasWidth: number;
  canvasHeight: number;
  gridDensity: number;
}

function GridOverlay({ canvas, gridEnabled, viewport, canvasWidth, canvasHeight, gridDensity }: GridOverlayProps) {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridCanvasRef.current || !canvas || !containerRef.current) {
      return;
    }

    const gridCanvas = gridCanvasRef.current;
    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    // Grid should only render at 125% zoom or higher
    // This allows visibility of grid lines regardless of density setting
    const minZoomRequired = 125;

    // Only draw if enabled and zoom is high enough
    if (!gridEnabled || viewport.zoom < minZoomRequired) {
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
      return;
    }

    const zoom = viewport.zoom / 100;
    
    // Set canvas to match visible viewport
    gridCanvas.width = containerRef.current.clientWidth;
    gridCanvas.height = containerRef.current.clientHeight;

    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Configure grid appearance - pure black lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    // Calculate the top-left corner of the canvas in screen space
    const centerX = gridCanvas.width / 2;
    const centerY = gridCanvas.height / 2;
    
    const canvasCenterWorldX = canvasWidth / 2;
    const canvasCenterWorldY = canvasHeight / 2;
    
    // World coordinates of top-left corner of visible canvas
    const worldStartX = canvasCenterWorldX - centerX / zoom + viewport.panX;
    const worldStartY = canvasCenterWorldY - centerY / zoom + viewport.panY;

    // Draw vertical grid lines (every N pixels based on density)
    const firstX = Math.floor(worldStartX / gridDensity) * gridDensity;
    const lastX = Math.ceil((worldStartX + gridCanvas.width / zoom) / gridDensity) * gridDensity;
    
    for (let worldX = firstX; worldX <= lastX; worldX += gridDensity) {
      // Calculate screen position and snap to whole pixels
      const screenX = Math.round((worldX - worldStartX) * zoom);
      
      // Only draw if within bounds
      if (screenX >= 0 && screenX <= gridCanvas.width) {
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, gridCanvas.height);
        ctx.stroke();
      }
    }

    // Draw horizontal grid lines (every N pixels based on density)
    const firstY = Math.floor(worldStartY / gridDensity) * gridDensity;
    const lastY = Math.ceil((worldStartY + gridCanvas.height / zoom) / gridDensity) * gridDensity;
    
    for (let worldY = firstY; worldY <= lastY; worldY += gridDensity) {
      // Calculate screen position and snap to whole pixels
      const screenY = Math.round((worldY - worldStartY) * zoom);
      
      // Only draw if within bounds
      if (screenY >= 0 && screenY <= gridCanvas.height) {
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(gridCanvas.width, screenY);
        ctx.stroke();
      }
    }
  }, [gridEnabled, viewport, canvasWidth, canvasHeight, canvas, gridDensity]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={gridCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}

export default GridOverlay;