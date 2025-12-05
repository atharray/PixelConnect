/**
 * Core type definitions for PixelConnect
 * All types related to the compositor application
 */

// Canvas Configuration
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string | null; // Hex color or null for transparent
}

// Layer representation
export interface Layer {
  id: string; // UUID
  name: string; // User-defined or filename
  imageData: string; // Base64 data URI
  x: number; // Can be negative
  y: number; // Can be negative
  zIndex: number; // Higher = more in front
  visible: boolean;
  locked: boolean;
  opacity: number; // 0.0 to 1.0 (1.0 = fully opaque)
  width: number; // Image width in pixels
  height: number; // Image height in pixels
}

// Viewport state
export interface ViewportState {
  zoom: number; // Percentage (100 = actual size)
  panX: number; // Horizontal offset in pixels
  panY: number; // Vertical offset in pixels
}

// Grid configuration
export interface GridConfig {
  enabled: boolean;
  size: number; // Grid cell size in pixels
  color: string; // Hex color
  opacity: number; // 0.0 to 1.0
  snapToGrid: boolean;
}

// Ruler configuration
export interface Guide {
  axis: 'x' | 'y';
  position: number;
  id: string;
}

export interface RulerConfig {
  enabled: boolean;
  guides: Guide[];
}

// Project metadata
export interface ProjectMetadata {
  author: string;
  description: string;
  tags: string[];
}

// Complete project data
export interface ProjectData {
  version: string; // Semantic version
  projectName: string;
  created: string; // ISO 8601
  modified: string; // ISO 8601
  canvas: CanvasConfig;
  viewport: ViewportState;
  grid: GridConfig;
  rulers: RulerConfig;
  layers: Layer[];
  metadata: ProjectMetadata;
}

// Application state
export interface AppState {
  project: ProjectData;
  selectedLayerIds: string[];
  isDirty: boolean;
  history: HistoryState;
  ui: UIState;
}

// History tracking
export interface HistoryState {
  past: ProjectData[];
  future: ProjectData[];
  maxSteps: number;
}

// UI state
export interface UIState {
  activeTool: 'select' | 'pan' | 'zoom';
  showGrid: boolean;
  showRulers: boolean;
  clipboardLayers: Layer[];
  isDraggingLayer: boolean;
  dragLayerId: string | null;
  dragStartX: number;
  dragStartY: number;
}

// Linked project format (post-MVP)
export interface LinkedLayer {
  id: string;
  name: string;
  source: string; // Relative path
  x: number;
  y: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  width: number;
  height: number;
}

export interface LinkedProjectData {
  version: string;
  projectName: string;
  created: string;
  modified: string;
  canvas: CanvasConfig;
  viewport: ViewportState;
  grid: GridConfig;
  rulers: RulerConfig;
  layers: LinkedLayer[];
  metadata: ProjectMetadata;
}
