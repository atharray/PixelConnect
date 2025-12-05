/**
 * Zustand store for global application state management
 * Handles project data, layers, selection, and UI state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  AppState, 
  ProjectData, 
  Layer, 
  CanvasConfig,
  ViewportState,
  GridConfig,
  ProjectMetadata,
  HistoryState,
  UIState
} from '../types/compositor.types';
import { applyGridSnap } from '../utils/gridUtils';

// Default project configuration
const DEFAULT_PROJECT_DATA: ProjectData = {
  version: '1.0.0',
  projectName: 'Untitled',
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  canvas: {
    width: 2048,
    height: 2048,
    backgroundColor: null, // Transparent by default
  },
  viewport: {
    zoom: 100,
    panX: 0,
    panY: 0,
  },
  grid: {
    enabled: false,
    size: 8,
    color: '#808080',
    opacity: 0.3,
    snapToGrid: false,
  },
  rulers: {
    enabled: false,
    guides: [],
  },
  layers: [],
  metadata: {
    author: '',
    description: '',
    tags: [],
  },
};

const DEFAULT_HISTORY: HistoryState = {
  past: [],
  future: [],
  maxSteps: 50,
};

const DEFAULT_UI: UIState = {
  activeTool: 'select',
  showGrid: false,
  showRulers: false,
  clipboardLayers: [],
  isDraggingLayer: false,
  dragLayerId: null,
  dragStartX: 0,
  dragStartY: 0,
};

interface CompositorStore extends AppState {
  // Project operations
  setProjectName: (name: string) => void;
  setCanvasConfig: (config: Partial<CanvasConfig>) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  setGridConfig: (config: Partial<GridConfig>) => void;
  setProjectMetadata: (metadata: Partial<ProjectMetadata>) => void;

  // Layer operations
  addLayer: (layer: Omit<Layer, 'id'>) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  duplicateLayer: (layerId: string) => void;
  moveLayer: (layerId: string, deltaX: number, deltaY: number) => void;
  reorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  bringLayerToFront: (layerId: string) => void;
  sendLayerToBack: (layerId: string) => void;

  // Multi-layer operations
  selectLayer: (layerId: string, multiSelect?: boolean) => void;
  selectAllLayers: () => void;
  deselectAllLayers: () => void;
  selectLayerRange: (fromId: string, toId: string) => void;
  moveSelectedLayers: (deltaX: number, deltaY: number) => void;
  deleteSelectedLayers: () => void;
  toggleVisibilitySelected: () => void;

  // Drag operations
  startDraggingLayer: (layerId: string, startX: number, startY: number) => void;
  updateDragPosition: (currentX: number, currentY: number) => void;
  stopDraggingLayer: () => void;

  // History operations
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // UI operations
  setActiveTool: (tool: 'select' | 'pan' | 'zoom') => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  copySelectedLayers: () => void;
  pasteSelectedLayers: () => void;

  // File operations
  resetProject: () => void;
  loadProject: (projectData: ProjectData) => void;
  markDirty: () => void;
  markClean: () => void;
}

const useCompositorStore = create<CompositorStore>()(
  devtools(
    (set) => ({
      // Initial state
      project: DEFAULT_PROJECT_DATA,
      selectedLayerIds: [],
      isDirty: false,
      history: DEFAULT_HISTORY,
      ui: DEFAULT_UI,

      // Project operations
      setProjectName: (name: string) => {
        set((state) => ({
          project: {
            ...state.project,
            projectName: name,
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      setCanvasConfig: (config: Partial<CanvasConfig>) => {
        set((state) => ({
          project: {
            ...state.project,
            canvas: {
              ...state.project.canvas,
              ...config,
            },
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      setViewport: (viewport: Partial<ViewportState>) => {
        set((state) => ({
          project: {
            ...state.project,
            viewport: {
              ...state.project.viewport,
              ...viewport,
            },
          },
        }));
      },

      setGridConfig: (config: Partial<GridConfig>) => {
        set((state) => ({
          project: {
            ...state.project,
            grid: {
              ...state.project.grid,
              ...config,
            },
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      setProjectMetadata: (metadata: Partial<ProjectMetadata>) => {
        set((state) => ({
          project: {
            ...state.project,
            metadata: {
              ...state.project.metadata,
              ...metadata,
            },
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      // Layer operations
      addLayer: (layer: Omit<Layer, 'id'>) => {
        set((state) => ({
          project: {
            ...state.project,
            layers: [
              ...state.project.layers,
              {
                ...layer,
                id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              },
            ],
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      removeLayer: (layerId: string) => {
        set((state) => ({
          project: {
            ...state.project,
            layers: state.project.layers.filter((l) => l.id !== layerId),
            modified: new Date().toISOString(),
          },
          selectedLayerIds: state.selectedLayerIds.filter((id) => id !== layerId),
          isDirty: true,
        }));
      },

      updateLayer: (layerId: string, updates: Partial<Layer>) => {
        set((state) => ({
          project: {
            ...state.project,
            layers: state.project.layers.map((layer) =>
              layer.id === layerId
                ? {
                    ...layer,
                    ...updates,
                  }
                : layer
            ),
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      duplicateLayer: (layerId: string) => {
        set((state) => {
          const layerToClone = state.project.layers.find((l) => l.id === layerId);
          if (!layerToClone) return state;

          const newLayer: Layer = {
            ...layerToClone,
            id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${layerToClone.name} (copy)`,
            zIndex: Math.max(...state.project.layers.map((l) => l.zIndex), 0) + 1,
          };

          return {
            project: {
              ...state.project,
              layers: [...state.project.layers, newLayer],
              modified: new Date().toISOString(),
            },
            isDirty: true,
          };
        });
      },

      moveLayer: (layerId: string, deltaX: number, deltaY: number) => {
        set((state) => ({
          project: {
            ...state.project,
            layers: state.project.layers.map((layer) => {
              if (layer.id === layerId && !layer.locked) {
                let newX = layer.x + deltaX;
                let newY = layer.y + deltaY;

                // Apply grid snapping if enabled
                if (state.project.grid.snapToGrid) {
                  [newX, newY] = applyGridSnap(newX, newY, state.project.grid.size, true);
                } else {
                  newX = Math.floor(newX);
                  newY = Math.floor(newY);
                }

                return { ...layer, x: newX, y: newY };
              }
              return layer;
            }),
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      reorderLayer: (layerId: string, direction: 'up' | 'down') => {
        set((state) => {
          const currentZIndex = state.project.layers.find((l) => l.id === layerId)?.zIndex;
          if (currentZIndex === undefined) return state;

          const zIndices = state.project.layers.map((l) => l.zIndex).sort((a, b) => a - b);
          const currentPos = zIndices.indexOf(currentZIndex);

          if (
            (direction === 'up' && currentPos === zIndices.length - 1) ||
            (direction === 'down' && currentPos === 0)
          ) {
            return state;
          }

          const newZIndex =
            direction === 'up' ? zIndices[currentPos + 1] : zIndices[currentPos - 1];
          const otherLayerId = state.project.layers.find((l) => l.zIndex === newZIndex)?.id;

          if (!otherLayerId) return state;

          return {
            project: {
              ...state.project,
              layers: state.project.layers.map((layer) => {
                if (layer.id === layerId) return { ...layer, zIndex: newZIndex };
                if (layer.id === otherLayerId) return { ...layer, zIndex: currentZIndex };
                return layer;
              }),
              modified: new Date().toISOString(),
            },
            isDirty: true,
          };
        });
      },

      bringLayerToFront: (layerId: string) => {
        set((state) => {
          const maxZIndex = Math.max(...state.project.layers.map((l) => l.zIndex), 0);
          return {
            project: {
              ...state.project,
              layers: state.project.layers.map((layer) =>
                layer.id === layerId ? { ...layer, zIndex: maxZIndex + 1 } : layer
              ),
              modified: new Date().toISOString(),
            },
            isDirty: true,
          };
        });
      },

      sendLayerToBack: (layerId: string) => {
        set((state) => {
          const minZIndex = Math.min(...state.project.layers.map((l) => l.zIndex), 0);
          return {
            project: {
              ...state.project,
              layers: state.project.layers.map((layer) =>
                layer.id === layerId ? { ...layer, zIndex: minZIndex - 1 } : layer
              ),
              modified: new Date().toISOString(),
            },
            isDirty: true,
          };
        });
      },

      // Multi-layer operations
      selectLayer: (layerId: string, multiSelect: boolean = false) => {
        set((state) => {
          if (multiSelect) {
            return {
              selectedLayerIds: state.selectedLayerIds.includes(layerId)
                ? state.selectedLayerIds.filter((id) => id !== layerId)
                : [...state.selectedLayerIds, layerId],
            };
          }
          return { selectedLayerIds: [layerId] };
        });
      },

      selectAllLayers: () => {
        set((state) => ({
          selectedLayerIds: state.project.layers.map((l) => l.id),
        }));
      },

      deselectAllLayers: () => {
        set({ selectedLayerIds: [] });
      },

      selectLayerRange: (fromId: string, toId: string) => {
        set((state) => {
          const layerIds = state.project.layers.map((l) => l.id);
          const fromIndex = layerIds.indexOf(fromId);
          const toIndex = layerIds.indexOf(toId);

          if (fromIndex === -1 || toIndex === -1) return state;

          const [start, end] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
          const selectedLayerIds = layerIds.slice(start, end + 1);

          return { selectedLayerIds };
        });
      },

      moveSelectedLayers: (deltaX: number, deltaY: number) => {
        set((state) => ({
          project: {
            ...state.project,
            layers: state.project.layers.map((layer) => {
              if (state.selectedLayerIds.includes(layer.id) && !layer.locked) {
                let newX = layer.x + deltaX;
                let newY = layer.y + deltaY;

                // Apply grid snapping if enabled
                if (state.project.grid.snapToGrid) {
                  [newX, newY] = applyGridSnap(newX, newY, state.project.grid.size, true);
                } else {
                  newX = Math.floor(newX);
                  newY = Math.floor(newY);
                }

                return { ...layer, x: newX, y: newY };
              }
              return layer;
            }),
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      deleteSelectedLayers: () => {
        set((state) => ({
          project: {
            ...state.project,
            layers: state.project.layers.filter(
              (l) => !state.selectedLayerIds.includes(l.id)
            ),
            modified: new Date().toISOString(),
          },
          selectedLayerIds: [],
          isDirty: true,
        }));
      },

      toggleVisibilitySelected: () => {
        set((state) => {
          const allVisible = state.selectedLayerIds.every((id) =>
            state.project.layers.find((l) => l.id === id)?.visible
          );

          return {
            project: {
              ...state.project,
              layers: state.project.layers.map((layer) =>
                state.selectedLayerIds.includes(layer.id)
                  ? { ...layer, visible: !allVisible }
                  : layer
              ),
              modified: new Date().toISOString(),
            },
            isDirty: true,
          };
        });
      },

      // Drag operations
      startDraggingLayer: (layerId: string, startX: number, startY: number) => {
        set((state) => ({
          ui: {
            ...state.ui,
            isDraggingLayer: true,
            dragLayerId: layerId,
            dragStartX: startX,
            dragStartY: startY,
          },
        }));
      },

      updateDragPosition: (currentX: number, currentY: number) => {
        set((state) => {
          if (!state.ui.isDraggingLayer || !state.ui.dragLayerId) return state;

          const deltaX = currentX - state.ui.dragStartX;
          const deltaY = currentY - state.ui.dragStartY;

          // Move the dragged layer and all selected layers
          const layersToMove = state.selectedLayerIds.includes(state.ui.dragLayerId)
            ? state.selectedLayerIds
            : [state.ui.dragLayerId];

          return {
            project: {
              ...state.project,
              layers: state.project.layers.map((layer) => {
                if (layersToMove.includes(layer.id) && !layer.locked) {
                  let newX = layer.x + deltaX;
                  let newY = layer.y + deltaY;

                  // Apply grid snapping if enabled
                  if (state.project.grid.snapToGrid) {
                    [newX, newY] = applyGridSnap(newX, newY, state.project.grid.size, true);
                  } else {
                    newX = Math.floor(newX);
                    newY = Math.floor(newY);
                  }

                  return { ...layer, x: newX, y: newY };
                }
                return layer;
              }),
              modified: new Date().toISOString(),
            },
            ui: {
              ...state.ui,
              dragStartX: currentX,
              dragStartY: currentY,
            },
            isDirty: true,
          };
        });
      },

      stopDraggingLayer: () => {
        set((state) => ({
          ui: {
            ...state.ui,
            isDraggingLayer: false,
            dragLayerId: null,
            dragStartX: 0,
            dragStartY: 0,
          },
        }));
      },

      // History operations
      pushHistory: () => {
        set((state) => {
          const newPast = [...state.history.past, state.project];
          if (newPast.length > state.history.maxSteps) {
            newPast.shift();
          }

          return {
            history: {
              ...state.history,
              past: newPast,
              future: [],
            },
          };
        });
      },

      undo: () => {
        set((state) => {
          if (state.history.past.length === 0) return state;

          const newPast = [...state.history.past];
          const previousProject = newPast.pop();
          const newFuture = [state.project, ...state.history.future];

          return {
            project: previousProject || state.project,
            history: {
              ...state.history,
              past: newPast,
              future: newFuture,
            },
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.history.future.length === 0) return state;

          const newFuture = [...state.history.future];
          const nextProject = newFuture.shift();
          const newPast = [...state.history.past, state.project];

          return {
            project: nextProject || state.project,
            history: {
              ...state.history,
              past: newPast,
              future: newFuture,
            },
          };
        });
      },

      // UI operations
      setActiveTool: (tool: 'select' | 'pan' | 'zoom') => {
        set((state) => ({
          ui: {
            ...state.ui,
            activeTool: tool,
          },
        }));
      },

      toggleGrid: () => {
        set((state) => ({
          project: {
            ...state.project,
            grid: {
              ...state.project.grid,
              enabled: !state.project.grid.enabled,
            },
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      toggleRulers: () => {
        set((state) => ({
          project: {
            ...state.project,
            rulers: {
              ...state.project.rulers,
              enabled: !state.project.rulers.enabled,
            },
            modified: new Date().toISOString(),
          },
          isDirty: true,
        }));
      },

      copySelectedLayers: () => {
        set((state) => ({
          ui: {
            ...state.ui,
            clipboardLayers: state.project.layers.filter((l) =>
              state.selectedLayerIds.includes(l.id)
            ),
          },
        }));
      },

      pasteSelectedLayers: () => {
        set((state) => {
          const maxZIndex = Math.max(...state.project.layers.map((l) => l.zIndex), 0);

          const pastedLayers: Layer[] = state.ui.clipboardLayers.map((layer, index) => ({
            ...layer,
            id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: layer.x + 10, // Offset to show pasted layers
            y: layer.y + 10,
            zIndex: maxZIndex + index + 1,
          }));

          return {
            project: {
              ...state.project,
              layers: [...state.project.layers, ...pastedLayers],
              modified: new Date().toISOString(),
            },
            selectedLayerIds: pastedLayers.map((l) => l.id),
            isDirty: true,
          };
        });
      },

      // File operations
      resetProject: () => {
        set({
          project: DEFAULT_PROJECT_DATA,
          selectedLayerIds: [],
          isDirty: false,
          history: DEFAULT_HISTORY,
          ui: DEFAULT_UI,
        });
      },

      loadProject: (projectData: ProjectData) => {
        set({
          project: projectData,
          selectedLayerIds: [],
          isDirty: false,
          history: DEFAULT_HISTORY,
          ui: DEFAULT_UI,
        });
      },

      markDirty: () => {
        set({ isDirty: true });
      },

      markClean: () => {
        set({ isDirty: false });
      },
    }),
    {
      name: 'CompositorStore',
      enabled: true,
    }
  )
);

export default useCompositorStore;
