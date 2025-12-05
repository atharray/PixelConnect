/**
 * Rulers component
 * Displays pixel rulers on the top and left edges
 * Shows current hover coordinates
 */

interface RulersProps {
  canvasWidth: number;
  canvasHeight: number;
  hoverCoords: { x: number; y: number } | null;
  zoom: number;
  panX: number;
  panY: number;
}

function Rulers({ canvasWidth, canvasHeight, hoverCoords, zoom, panX, panY }: RulersProps) {
  const zoomFactor = zoom / 100;
  const rulerSize = 20; // pixels for ruler width/height

  // Render horizontal ruler
  const renderHorizontalRuler = () => {
    const marks = [];
    const stepSize = zoom > 100 ? 10 : zoom > 50 ? 20 : 50; // Adaptive step size
    
    for (let i = 0; i < canvasWidth; i += stepSize) {
      const screenX = i * zoomFactor - panX * zoomFactor;
      if (screenX > -50 && screenX < 10000) { // Only render visible marks
        const isMainMark = i % (stepSize * 5) === 0;
        const height = isMainMark ? 10 : 5;
        
        marks.push(
          <g key={`h-${i}`}>
            <line
              x1={screenX}
              y1={rulerSize - height}
              x2={screenX}
              y2={rulerSize}
              stroke="#666"
              strokeWidth="1"
            />
            {isMainMark && (
              <text
                x={screenX}
                y={rulerSize - 8}
                fontSize="9"
                fill="#888"
                textAnchor="middle"
              >
                {i}
              </text>
            )}
          </g>
        );
      }
    }
    
    return marks;
  };

  // Render vertical ruler
  const renderVerticalRuler = () => {
    const marks = [];
    const stepSize = zoom > 100 ? 10 : zoom > 50 ? 20 : 50;
    
    for (let i = 0; i < canvasHeight; i += stepSize) {
      const screenY = i * zoomFactor - panY * zoomFactor;
      if (screenY > -50 && screenY < 10000) {
        const isMainMark = i % (stepSize * 5) === 0;
        const width = isMainMark ? 10 : 5;
        
        marks.push(
          <g key={`v-${i}`}>
            <line
              x1={rulerSize - width}
              y1={screenY}
              x2={rulerSize}
              y2={screenY}
              stroke="#666"
              strokeWidth="1"
            />
            {isMainMark && (
              <text
                x={rulerSize - 12}
                y={screenY}
                fontSize="9"
                fill="#888"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {i}
              </text>
            )}
          </g>
        );
      }
    }
    
    return marks;
  };

  return (
    <>
      {/* Horizontal Ruler */}
      <svg
        className="absolute top-0 left-0 bg-panel-bg border-b border-border"
        width="100%"
        height={rulerSize}
        style={{ zIndex: 10 }}
      >
        {renderHorizontalRuler()}
        
        {/* Hover position indicator */}
        {hoverCoords && (
          <>
            <line
              x1={hoverCoords.x * zoomFactor - panX * zoomFactor}
              y1={0}
              x2={hoverCoords.x * zoomFactor - panX * zoomFactor}
              y2={rulerSize}
              stroke="#4a9eff"
              strokeWidth="1"
              opacity="0.7"
            />
            <text
              x={hoverCoords.x * zoomFactor - panX * zoomFactor + 2}
              y={rulerSize - 5}
              fontSize="9"
              fill="#4a9eff"
              fontWeight="bold"
            >
              {hoverCoords.x}
            </text>
          </>
        )}
      </svg>

      {/* Vertical Ruler */}
      <svg
        className="absolute top-0 left-0 bg-panel-bg border-r border-border"
        width={rulerSize}
        height="100%"
        style={{ zIndex: 10 }}
      >
        {renderVerticalRuler()}
        
        {/* Hover position indicator */}
        {hoverCoords && (
          <>
            <line
              x1={0}
              y1={hoverCoords.y * zoomFactor - panY * zoomFactor}
              x2={rulerSize}
              y2={hoverCoords.y * zoomFactor - panY * zoomFactor}
              stroke="#4a9eff"
              strokeWidth="1"
              opacity="0.7"
            />
            <text
              x={5}
              y={hoverCoords.y * zoomFactor - panY * zoomFactor - 2}
              fontSize="9"
              fill="#4a9eff"
              fontWeight="bold"
              dominantBaseline="middle"
            >
              {hoverCoords.y}
            </text>
          </>
        )}
      </svg>

      {/* Corner square */}
      <div
        className="absolute top-0 left-0 bg-panel-bg border-b border-r border-border"
        style={{ width: rulerSize, height: rulerSize, zIndex: 10 }}
      />
    </>
  );
}

export default Rulers;
