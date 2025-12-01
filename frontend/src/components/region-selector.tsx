import { useState, useCallback, useEffect } from 'react';

interface RegionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (x: number, y: number, width: number, height: number) => void;
  screenWidth: number;
  screenHeight: number;
}

export function RegionSelector({
  isOpen,
  onClose,
  onSelect,
  screenWidth,
  screenHeight,
}: RegionSelectorProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDrawing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;
      setCurrentPos({ x: e.clientX, y: e.clientY });
    },
    [isDrawing]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Calculate selection rectangle
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    // Only capture if selection is meaningful (at least 10x10)
    if (width > 10 && height > 10) {
      onSelect(x, y, width, height);
    }

    // Reset
    setStartPos({ x: 0, y: 0 });
    setCurrentPos({ x: 0, y: 0 });
  }, [isDrawing, startPos, currentPos, onSelect]);

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate selection box position and size
  const selectionX = Math.min(startPos.x, currentPos.x);
  const selectionY = Math.min(startPos.y, currentPos.y);
  const selectionWidth = Math.abs(currentPos.x - startPos.x);
  const selectionHeight = Math.abs(currentPos.y - startPos.y);

  return (
    <div
      className="fixed inset-0 z-[9999] cursor-crosshair select-none"
      style={{ background: 'rgba(0, 0, 0, 0.3)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 text-white rounded-lg text-sm">
        Drag to select region. Press ESC to cancel.
      </div>

      {/* Selection rectangle */}
      {isDrawing && (
        <>
          {/* Darkened overlay around selection */}
          <div
            className="absolute bg-black/50"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: selectionY,
            }}
          />
          <div
            className="absolute bg-black/50"
            style={{
              top: selectionY + selectionHeight,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <div
            className="absolute bg-black/50"
            style={{
              top: selectionY,
              left: 0,
              width: selectionX,
              height: selectionHeight,
            }}
          />
          <div
            className="absolute bg-black/50"
            style={{
              top: selectionY,
              left: selectionX + selectionWidth,
              right: 0,
              height: selectionHeight,
            }}
          />

          {/* Selection border */}
          <div
            className="absolute border-2 border-blue-500 bg-transparent"
            style={{
              left: selectionX,
              top: selectionY,
              width: selectionWidth,
              height: selectionHeight,
            }}
          >
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500" />
          </div>

          {/* Size indicator */}
          <div
            className="absolute px-2 py-1 bg-blue-500 text-white text-xs rounded"
            style={{
              left: selectionX + selectionWidth / 2 - 40,
              top: selectionY + selectionHeight + 8,
            }}
          >
            {selectionWidth} x {selectionHeight}
          </div>
        </>
      )}
    </div>
  );
}
