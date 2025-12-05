# PixelConnect - Pixel-Perfect Image Compositor

A web-based application for pixel-perfect image compositing, designed specifically for pixel art workflows. All rendering is done with zero interpolation and antialiasing, ensuring exact color accuracy and precise positioning.

## Features (MVP Complete)

### Core Canvas System
- **Default canvas size**: 2048×2048 pixels (user-configurable)
- **Background options**: Transparent (default) or any hex color via color picker
- **Pixel-perfect rendering**: All zoom levels maintain exact pixel alignment
- **Multi-layer support**: Compose unlimited layers with precise positioning

### Image Management
- **Upload**: Drag-and-drop or click to upload PNG, GIF, BMP, JPEG images
- **Layer operations**:
  - Add/remove layers dynamically
  - Duplicate layers with automatic offset
  - Rename layers
  - Toggle visibility (eye icon)
  - Lock/unlock to prevent accidental movement
  - Reorder with up/down arrows
  - Bring to front / Send to back

### Positioning
- **Manual positioning**: X/Y coordinate input fields with real-time canvas update
- **Drag-and-drop**: Click and drag any layer on canvas to reposition
- **Multi-layer dragging**: When multiple layers selected, drag any one to move all together
- **Bulk offset**: Apply relative movement to multiple selected layers at once

### Selection
- **Single select**: Click layer to select
- **Multi-select**: Ctrl/Cmd+Click to toggle selection
- **Range select**: Shift+Click to select range of layers
- **Select All / Deselect All**: Keyboard shortcuts or buttons

### Zoom & Navigation
- **Zoom levels**: 25%, 50%, 100%, 200%, 400%, 800%, 1600%
- **Zoom controls**: Buttons, dropdown, mouse wheel, keyboard shortcuts
- **Pan canvas**: Spacebar+drag to pan the viewport
- **Zoom centered**: Mouse wheel zooms at cursor position

### Grid System
- **Grid overlay**: Toggle-able pixel grid with customizable size
- **Grid sizes**: 1px, 2px, 4px, 8px, 16px, 32px
- **Snap-to-grid**: Magnetic snapping when moving layers
- **Customizable**: Grid color and opacity settings

### Project Save/Load
- **Save format**: `.pixcomp` files (embedded JSON with base64 images)
- **Save project**: Ctrl+S or Save button
- **Load project**: Ctrl+O or Load button
- **Auto-save**: 2-minute intervals to localStorage (with 1-hour recovery window)
- **Unsaved changes**: Visual indicator in title bar and beforeunload warning

### Export
- **Export as PNG**: Full canvas export with exact colors
- **Export scales**: 1x, 2x, 4x, 8x multipliers for Hi-DPI exports
- **Transparency**: Preserves transparent background if set
- **Quality**: Zero loss, exact pixel-for-pixel rendering

### History
- **Undo/Redo**: Ctrl+Z / Ctrl+Shift+Z with operation count display
- **History limit**: Last 50 operations
- **Debounced tracking**: Automatic history pushes during work

### Keyboard Shortcuts
| Action | Shortcut | Notes |
|--------|----------|-------|
| **Layer Movement** | | |
| Nudge 1px | Arrow Keys | Up/Down/Left/Right |
| Nudge 10px | Shift+Arrow Keys | Faster movement |
| **Selection** | | |
| Select layer | Click | Single layer |
| Multi-select | Ctrl/Cmd+Click | Add/remove from selection |
| Range select | Shift+Click | Select consecutive layers |
| Select all | Ctrl/Cmd+A | All layers |
| Deselect all | Ctrl/Cmd+D | Clear selection |
| **Editing** | | |
| Delete layers | Delete/Backspace | Removes selected layers |
| Copy layers | Ctrl/Cmd+C | Copies to clipboard |
| Paste layers | Ctrl/Cmd+V | Pastes with offset |
| **History** | | |
| Undo | Ctrl/Cmd+Z | Revert last action |
| Redo | Ctrl/Cmd+Shift+Z | Redo action |
| **Files** | | |
| Save project | Ctrl/Cmd+S | Download .pixcomp file |
| Load project | Ctrl/Cmd+O | Open .pixcomp file |
| **Zoom** | | |
| Zoom in | + | Next zoom level |
| Zoom out | - | Previous zoom level |
| Reset zoom | 0 | Back to 100% |
| Wheel zoom | Mouse Wheel | Zoom at cursor |
| **Pan** | | |
| Pan canvas | Spacebar+Drag | Move viewport |

## UI Layout

### Top Toolbar
- Project name editor
- File operations (New, Save, Load, Export)
- History controls (Undo, Redo)
- Grid controls (Toggle, Size, Snap)
- Zoom controls (In, Out, Presets)

### Left Panel - Layers
- Layer list (sorted by Z-index, highest at top)
- Layer item features:
  - Thumbnail preview
  - Name editor (click to rename)
  - Visibility toggle (👁️/🚫)
  - Lock toggle (🔒/🔓)
  - Dimensions and Z-index display
  - Controls: Move up/down, bring to front, send to back, duplicate, delete
- Bulk controls: Select All, None, Delete

### Center - Canvas
- Interactive pixel-perfect canvas
- Grid overlay (when enabled)
- Drag layer repositioning
- Multi-select support
- Coordinate display
- Selected layers indicator

### Right Panel - Properties
- Selected layer properties:
  - Layer name
  - X/Y position inputs
  - Width/Height (read-only)
  - Z-index (read-only)
- Bulk position controls (when multiple layers selected)
- Canvas settings:
  - Canvas size (W×H)
  - Background color picker
  - Transparent option

## Technical Specifications

### Color Accuracy
- **No interpolation**: `imageSmoothingEnabled = false` on all canvases
- **No antialiasing**: Pixel-perfect rendering at all zoom levels
- **No compression**: PNG exports maintain exact colors
- **Original formats**: Preserves images as provided

### Performance
- **Debounced rendering**: Only redraws when necessary
- **Layer caching**: Images cached in memory
- **Efficient sorting**: Z-index sort only when order changes
- **Drag optimization**: Real-time updates without blocking

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- Canvas API fully supported
- No vendor-specific features required

### Data Format (.pixcomp)
```json
{
  "version": "1.0.0",
  "projectName": "my_composition",
  "created": "2025-12-04T10:30:00Z",
  "modified": "2025-12-04T11:45:00Z",
  "canvas": {
    "width": 2048,
    "height": 2048,
    "backgroundColor": null
  },
  "viewport": {
    "zoom": 100,
    "panX": 0,
    "panY": 0
  },
  "grid": {
    "enabled": false,
    "size": 8,
    "color": "#808080",
    "opacity": 0.3,
    "snapToGrid": false
  },
  "rulers": {
    "enabled": false,
    "guides": []
  },
  "layers": [
    {
      "id": "layer_abc123",
      "name": "head.png",
      "imageData": "data:image/png;base64,...",
      "x": 100,
      "y": 200,
      "zIndex": 5,
      "visible": true,
      "locked": false,
      "width": 128,
      "height": 128
    }
  ],
  "metadata": {
    "author": "",
    "description": "",
    "tags": []
  }
}
```

## Getting Started

### Installation
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Deploy to GitHub Pages
The static build output in `dist/` can be deployed directly to GitHub Pages.

## Development

### Project Structure
```
src/
├── components/
│   ├── Canvas/
│   │   ├── Canvas.tsx
│   │   ├── CanvasRenderer.tsx
│   │   └── GridOverlay.tsx
│   ├── LayerPanel/
│   │   ├── LayerPanel.tsx
│   │   └── LayerItem.tsx
│   ├── PropertyPanel/
│   │   ├── PropertyPanel.tsx
│   │   ├── PositionInputs.tsx
│   │   ├── CanvasSettings.tsx
│   │   └── BulkPositionControls.tsx
│   └── Toolbar/
│       ├── Toolbar.tsx
│       ├── FileOperations.tsx
│       ├── ZoomControls.tsx
│       ├── HistoryControls.tsx
│       └── GridControls.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   └── useAutoHistory.ts
├── store/
│   └── compositorStore.ts (Zustand)
├── types/
│   └── compositor.types.ts
├── utils/
│   ├── canvasRenderer.ts
│   ├── projectSerializer.ts
│   └── gridUtils.ts
├── App.tsx
├── main.tsx
└── index.css
```

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **State**: Zustand (with devtools)
- **Styling**: Tailwind CSS
- **Canvas**: HTML5 Canvas API
- **Storage**: localStorage (auto-save) + File API (save/load)

### Debug Mode
All console logging is prefixed with `[DEBUG]` for easy filtering. Browser DevTools filter by `[DEBUG]` to see verbose logging.

## Known Limitations

- No ruler guides (planned for future release)
- No layer groups/hierarchy (planned)
- No animation/sprite sheet export (planned)
- No touch device support yet (planned)
- Single undo/redo chain (no branching)

## Future Enhancements

- Linked project format (config + separate images)
- Export project as ZIP archive
- Layer groups and folder structure
- Copy/paste layer support improvements
- Opacity controls for layers
- Keyboard shortcut customization
- Touch device support
- Cloud storage integration
- Plugin system for extensions

## License

Refer to LICENSE file in repository.

---

**Version**: 1.0.0 (MVP)  
**Last Updated**: 2025-12-05  
**Status**: Ready for production use
