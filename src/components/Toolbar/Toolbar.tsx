import { useState } from 'react';
import useCompositorStore from '../../store/compositorStore';
import ZoomControls from './ZoomControls';
import FileOperations from './FileOperations';
import HistoryControls from './HistoryControls';
import GridControls from './GridControls';

/**
 * Top toolbar component
 * Contains project name, file operations, zoom controls
 */
function Toolbar() {
  const project = useCompositorStore((state) => state.project);
  const setProjectName = useCompositorStore((state) => state.setProjectName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(project.projectName);

  const handleNameSave = () => {
    if (tempName.trim()) {
      setProjectName(tempName.trim());
      console.log(`[DEBUG] Project name updated to: ${tempName.trim()}`);
    } else {
      setTempName(project.projectName);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setTempName(project.projectName);
      setIsEditingName(false);
    }
  };

  return (
    <div className="h-16 bg-panel-bg border-b border-border flex items-center justify-between px-4 gap-4">
      {/* Left: Project Name Section */}
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xs">
        <div className="text-lg font-semibold whitespace-nowrap">PixelConnect</div>
        <div className="text-gray-500">|</div>
        
        {isEditingName ? (
          <input
            autoFocus
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 bg-canvas-bg border border-blue-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Project name..."
          />
        ) : (
          <button
            onClick={() => {
              setTempName(project.projectName);
              setIsEditingName(true);
            }}
            className="flex-1 text-left px-2 py-1 text-gray-300 hover:text-white hover:bg-canvas-bg rounded transition-colors truncate"
            title="Click to rename project"
          >
            {project.projectName}
          </button>
        )}
      </div>

      {/* Center: File and History Operations */}
      <div className="flex items-center gap-2">
        <FileOperations />
        <div className="w-px h-6 bg-border"></div>
        <HistoryControls />
        <div className="w-px h-6 bg-border"></div>
        <GridControls />
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center gap-2 ml-auto">
        <ZoomControls />
      </div>
    </div>
  );
}

export default Toolbar;
