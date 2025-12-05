/**
 * Grid overlay component
 * Renders a pixel grid on top of the canvas
 */

import { useEffect, useRef } from 'react';
import { GridConfig } from '../../types/compositor.types';

interface GridOverlayProps {
  canvas: HTMLCanvasElement | null;
  viewport: { zoom: number; panX: number; panY: number };
  gridConfig: GridConfig;
}

function GridOverlay({ canvas, viewport, gridConfig }: GridOverlayProps) {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!gridCanvasRef.current || !canvas || !gridConfig.enabled) {
      return;
    }

    const gridCanvas = gridCanvasRef.current;
    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match main canvas
    gridCanvas.width = canvas.width;
    gridCanvas.height = canvas.height;

    ctx.fillStyle = gridConfig.color;
    ctx.globalAlpha = gridConfig.opacity;

    const gridSize = gridConfig.size;

    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.fillRect(x, 0, 1, canvas.height);
    }

    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    ctx.globalAlpha = 1;

    console.log(`[DEBUG] Grid overlay rendered: ${gridSize}px, opacity: ${gridConfig.opacity}`);
  }, [canvas, gridConfig]);

  if (!gridConfig.enabled) {
    return null;
  }

  return (
    <canvas
      ref={gridCanvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        transform: `scale(${viewport.zoom / 100})`,
        transformOrigin: 'top left',
      }}
    />
  );
}

export default GridOverlay;
