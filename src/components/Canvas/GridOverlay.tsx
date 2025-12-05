/**
 * Grid overlay component
 * Renders a pixel grid on top of the canvas
 */

import { useEffect, useRef } from 'react';
import { GridConfig, Layer } from '../../types/compositor.types';

interface GridOverlayProps {
  canvas: HTMLCanvasElement | null;
  gridConfig: GridConfig;
  layers: Layer[];
}

function GridOverlay({ canvas, gridConfig, layers }: GridOverlayProps) {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!gridCanvasRef.current || !canvas) {
      return;
    }

    const gridCanvas = gridCanvasRef.current;
    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match main canvas
    gridCanvas.width = canvas.width;
    gridCanvas.height = canvas.height;

    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Draw alignment grid if enabled
    if (gridConfig.enabled) {
      ctx.strokeStyle = gridConfig.color;
      ctx.globalAlpha = gridConfig.opacity;
      ctx.lineWidth = 1;

      const gridSize = gridConfig.size;

      // Draw vertical lines
      for (let x = gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }, [canvas, gridConfig, layers]);

  return (
    <canvas
      ref={gridCanvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default GridOverlay;
