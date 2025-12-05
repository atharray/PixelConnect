/**
 * Custom hook for handling keyboard shortcuts
 * Implements all essential shortcuts from the requirements
 */

import { useEffect, useRef } from 'react';
import useCompositorStore from '../store/compositorStore';

export function useKeyboardShortcuts() {
  const project = useCompositorStore((state) => state.project);
  const selectedLayerIds = useCompositorStore((state) => state.selectedLayerIds);
  const selectAllLayers = useCompositorStore((state) => state.selectAllLayers);
  const deselectAllLayers = useCompositorStore((state) => state.deselectAllLayers);
  const deleteSelectedLayers = useCompositorStore((state) => state.deleteSelectedLayers);
  const moveSelectedLayers = useCompositorStore((state) => state.moveSelectedLayers);
  const setViewport = useCompositorStore((state) => state.setViewport);
  const undo = useCompositorStore((state) => state.undo);
  const redo = useCompositorStore((state) => state.redo);
  const copySelectedLayers = useCompositorStore((state) => state.copySelectedLayers);
  const pasteSelectedLayers = useCompositorStore((state) => state.pasteSelectedLayers);

  const isPanningRef = useRef(false);
  const panStartXRef = useRef(0);
  const panStartYRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Allow Ctrl+S and Ctrl+O even in input fields
        if (!((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'o'))) {
          return;
        }
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      // Spacebar: Start pan mode
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        isPanningRef.current = true;
        console.log('[DEBUG] Pan mode activated (Spacebar)');
        return;
      }

      // Arrow keys for nudging
      if (!isShift && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const movements: Record<string, [number, number]> = {
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
        };
        const [dx, dy] = movements[event.key];
        if (selectedLayerIds.length > 0) {
          moveSelectedLayers(dx, dy);
          console.log(`[DEBUG] Keyboard nudge: Arrow${event.key} - moving ${dx}, ${dy}`);
        }
        return;
      }

      // Shift + Arrow keys for 10px nudge
      if (isShift && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const movements: Record<string, [number, number]> = {
          ArrowUp: [0, -10],
          ArrowDown: [0, 10],
          ArrowLeft: [-10, 0],
          ArrowRight: [10, 0],
        };
        const [dx, dy] = movements[event.key];
        if (selectedLayerIds.length > 0) {
          moveSelectedLayers(dx, dy);
          console.log(`[DEBUG] Keyboard nudge: Shift+Arrow${event.key} - moving ${dx}, ${dy}`);
        }
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (isCtrlOrCmd && event.key === 'z' && !isShift) {
        event.preventDefault();
        console.log('[DEBUG] Undo triggered by Ctrl+Z');
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if (isCtrlOrCmd && event.key === 'z' && isShift) {
        event.preventDefault();
        console.log('[DEBUG] Redo triggered by Ctrl+Shift+Z');
        redo();
        return;
      }

      // Delete / Backspace: Remove selected layers
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedLayerIds.length > 0) {
          event.preventDefault();
          const confirmed = window.confirm(
            `Delete ${selectedLayerIds.length} layer${selectedLayerIds.length !== 1 ? 's' : ''}?`
          );
          if (confirmed) {
            console.log(`[DEBUG] Delete triggered by ${event.key} - removing ${selectedLayerIds.length} layer(s)`);
            deleteSelectedLayers();
          }
        }
        return;
      }

      // Ctrl/Cmd + A: Select all layers
      if (isCtrlOrCmd && event.key === 'a') {
        event.preventDefault();
        if (project.layers.length > 0) {
          console.log('[DEBUG] Select all triggered by Ctrl+A');
          selectAllLayers();
        }
        return;
      }

      // Ctrl/Cmd + D: Deselect all layers
      if (isCtrlOrCmd && event.key === 'd') {
        event.preventDefault();
        console.log('[DEBUG] Deselect all triggered by Ctrl+D');
        deselectAllLayers();
        return;
      }

      // Ctrl/Cmd + C: Copy selected layers
      if (isCtrlOrCmd && event.key === 'c') {
        if (selectedLayerIds.length > 0) {
          event.preventDefault();
          console.log(`[DEBUG] Copy triggered by Ctrl+C - copying ${selectedLayerIds.length} layer(s)`);
          copySelectedLayers();
        }
        return;
      }

      // Ctrl/Cmd + V: Paste copied layers
      if (isCtrlOrCmd && event.key === 'v') {
        event.preventDefault();
        const clipboardLayers = useCompositorStore.getState().ui.clipboardLayers;
        if (clipboardLayers.length > 0) {
          console.log(`[DEBUG] Paste triggered by Ctrl+V - pasting ${clipboardLayers.length} layer(s)`);
          pasteSelectedLayers();
        } else {
          console.warn('[DEBUG] Paste triggered but clipboard is empty');
        }
        return;
      }

      // +/-: Zoom in/out
      if ((event.key === '+' || event.key === '=') && !isCtrlOrCmd) {
        event.preventDefault();
        const currentZoom = project.viewport.zoom;
        const zoomLevels = [25, 50, 100, 200, 400, 800, 1600];
        const nextZoom = zoomLevels.find((z) => z > currentZoom) || zoomLevels[zoomLevels.length - 1];
        console.log(`[DEBUG] Zoom in triggered by + - ${currentZoom}% -> ${nextZoom}%`);
        setViewport({ zoom: nextZoom });
        return;
      }

      if (event.key === '-' && !isCtrlOrCmd) {
        event.preventDefault();
        const currentZoom = project.viewport.zoom;
        const zoomLevels = [25, 50, 100, 200, 400, 800, 1600];
        const nextZoom = [...zoomLevels].reverse().find((z) => z < currentZoom) || zoomLevels[0];
        console.log(`[DEBUG] Zoom out triggered by - - ${currentZoom}% -> ${nextZoom}%`);
        setViewport({ zoom: nextZoom });
        return;
      }

      // 0: Reset zoom to 100%
      if (event.key === '0') {
        event.preventDefault();
        console.log('[DEBUG] Reset zoom triggered by 0 key');
        setViewport({ zoom: 100 });
        return;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Spacebar: Stop pan mode
      if (event.code === 'Space') {
        isPanningRef.current = false;
        console.log('[DEBUG] Pan mode deactivated (Spacebar released)');
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (isPanningRef.current) {
        panStartXRef.current = event.clientX;
        panStartYRef.current = event.clientY;
        console.log('[DEBUG] Pan drag started');
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isPanningRef.current && (event.buttons & 1) === 1) {
        const deltaX = event.clientX - panStartXRef.current;
        const deltaY = event.clientY - panStartYRef.current;

        const zoom = project.viewport.zoom / 100;
        const panDeltaX = -deltaX / zoom;
        const panDeltaY = -deltaY / zoom;

        setViewport({
          panX: project.viewport.panX + panDeltaX,
          panY: project.viewport.panY + panDeltaY,
        });

        panStartXRef.current = event.clientX;
        panStartYRef.current = event.clientY;

        console.log(`[DEBUG] Panning - delta (${panDeltaX}, ${panDeltaY})`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [
    selectedLayerIds,
    project,
    selectAllLayers,
    deselectAllLayers,
    deleteSelectedLayers,
    moveSelectedLayers,
    setViewport,
    undo,
    redo,
    copySelectedLayers,
    pasteSelectedLayers,
  ]);
}

export default useKeyboardShortcuts;
