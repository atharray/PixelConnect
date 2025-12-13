import React, { useState, useEffect, useRef } from 'react';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
}

const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  initialPosition = { x: 100, y: 100 },
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        
        setPosition((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed flex flex-col bg-panel-bg border border-border rounded shadow-lg overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 50,
        minWidth: '300px',
        maxWidth: '90vw',
        maxHeight: '90vh',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-canvas-bg border-b border-border cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white focus:outline-none p-1 rounded hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 text-gray-300 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default DraggableModal;
