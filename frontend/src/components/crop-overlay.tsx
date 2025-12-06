import { useRef, useEffect, useState, useCallback } from 'react';
import { Rect, Transformer, Group, Line } from 'react-konva';
import Konva from 'konva';
import { CropArea, AspectRatio } from '../types';

interface CropOverlayProps {
  cropArea: CropArea;
  imageWidth: number;
  imageHeight: number;
  paddingX: number;
  paddingY: number;
  aspectRatio: AspectRatio;
  onCropChange: (area: CropArea) => void;
}

// Track if Ctrl key is held for center-based resize
let isCtrlHeld = false;

const ASPECT_RATIO_VALUES: Record<AspectRatio, number | null> = {
  'free': null,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  '9:16': 9 / 16,
  '3:4': 3 / 4,
};

export function CropOverlay({
  cropArea,
  imageWidth,
  imageHeight,
  paddingX,
  paddingY,
  aspectRatio,
  onCropChange,
}: CropOverlayProps) {
  const cropRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const transformStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (trRef.current && cropRef.current) {
      trRef.current.nodes([cropRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, []);

  // Track Ctrl key for center-based resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        isCtrlHeld = true;
        setCtrlPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        isCtrlHeld = false;
        setCtrlPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const constrainCrop = useCallback((newArea: CropArea): CropArea => {
    let { x, y, width, height } = newArea;

    // Ensure minimum size
    width = Math.max(20, width);
    height = Math.max(20, height);

    // Apply aspect ratio if set
    const ratio = ASPECT_RATIO_VALUES[aspectRatio];
    if (ratio !== null) {
      // Maintain aspect ratio based on width
      height = width / ratio;
    }

    // Constrain to image bounds (with padding offset)
    x = Math.max(paddingX, Math.min(x, paddingX + imageWidth - width));
    y = Math.max(paddingY, Math.min(y, paddingY + imageHeight - height));

    // Ensure we don't exceed bounds
    if (x + width > paddingX + imageWidth) {
      width = paddingX + imageWidth - x;
      if (ratio !== null) {
        height = width / ratio;
      }
    }
    if (y + height > paddingY + imageHeight) {
      height = paddingY + imageHeight - y;
      if (ratio !== null) {
        width = height * ratio;
      }
    }

    return { x, y, width, height };
  }, [aspectRatio, imageWidth, imageHeight, paddingX, paddingY]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const constrained = constrainCrop({
      x: e.target.x(),
      y: e.target.y(),
      width: cropArea.width,
      height: cropArea.height,
    });
    onCropChange(constrained);
  };

  // Store original position when transform starts
  const handleTransformStart = () => {
    transformStartRef.current = {
      x: cropArea.x,
      y: cropArea.y,
      width: cropArea.width,
      height: cropArea.height,
    };
  };

  const handleTransform = () => {
    const node = cropRef.current;
    if (!node || !transformStartRef.current) return;

    // If Ctrl is held, perform center-based resize
    if (isCtrlHeld) {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Calculate new dimensions
      const newWidth = Math.max(20, transformStartRef.current.width * scaleX);
      const newHeight = Math.max(20, transformStartRef.current.height * scaleY);

      // Calculate the center of the original crop area
      const centerX = transformStartRef.current.x + transformStartRef.current.width / 2;
      const centerY = transformStartRef.current.y + transformStartRef.current.height / 2;

      // Calculate new position to keep center fixed
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;

      // Apply constraints and update
      const constrained = constrainCrop({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });

      // Update node position to reflect center-based resize
      node.x(constrained.x);
      node.y(constrained.y);
      node.width(constrained.width);
      node.height(constrained.height);
      node.scaleX(1);
      node.scaleY(1);

      // Notify parent
      onCropChange(constrained);
    }
  };

  const handleTransformEnd = () => {
    const node = cropRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    let newArea: CropArea;

    // If Ctrl was held during transform, use center-based calculation
    if (isCtrlHeld && transformStartRef.current) {
      const newWidth = Math.max(20, transformStartRef.current.width * scaleX);
      const newHeight = Math.max(20, transformStartRef.current.height * scaleY);
      const centerX = transformStartRef.current.x + transformStartRef.current.width / 2;
      const centerY = transformStartRef.current.y + transformStartRef.current.height / 2;

      newArea = {
        x: centerX - newWidth / 2,
        y: centerY - newHeight / 2,
        width: newWidth,
        height: newHeight,
      };
    } else {
      newArea = {
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        height: Math.max(20, node.height() * scaleY),
      };
    }

    const constrained = constrainCrop(newArea);
    onCropChange(constrained);
    transformStartRef.current = null;
  };

  const totalWidth = imageWidth + paddingX * 2;
  const totalHeight = imageHeight + paddingY * 2;

  return (
    <Group>
      {/* Dark overlay outside crop area */}
      {/* Top */}
      <Rect
        x={0}
        y={0}
        width={totalWidth}
        height={cropArea.y}
        fill="rgba(0,0,0,0.6)"
        listening={false}
      />
      {/* Bottom */}
      <Rect
        x={0}
        y={cropArea.y + cropArea.height}
        width={totalWidth}
        height={totalHeight - (cropArea.y + cropArea.height)}
        fill="rgba(0,0,0,0.6)"
        listening={false}
      />
      {/* Left */}
      <Rect
        x={0}
        y={cropArea.y}
        width={cropArea.x}
        height={cropArea.height}
        fill="rgba(0,0,0,0.6)"
        listening={false}
      />
      {/* Right */}
      <Rect
        x={cropArea.x + cropArea.width}
        y={cropArea.y}
        width={totalWidth - (cropArea.x + cropArea.width)}
        height={cropArea.height}
        fill="rgba(0,0,0,0.6)"
        listening={false}
      />

      {/* Crop selection rectangle */}
      <Rect
        ref={cropRef}
        x={cropArea.x}
        y={cropArea.y}
        width={cropArea.width}
        height={cropArea.height}
        stroke={ctrlPressed ? "#10b981" : "#3b82f6"}
        strokeWidth={2}
        dash={[5, 5]}
        draggable
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      />

      {/* Center crosshair indicator when Ctrl is held */}
      {ctrlPressed && (
        <>
          <Line
            points={[
              cropArea.x + cropArea.width / 2 - 10, cropArea.y + cropArea.height / 2,
              cropArea.x + cropArea.width / 2 + 10, cropArea.y + cropArea.height / 2
            ]}
            stroke="#10b981"
            strokeWidth={2}
            listening={false}
          />
          <Line
            points={[
              cropArea.x + cropArea.width / 2, cropArea.y + cropArea.height / 2 - 10,
              cropArea.x + cropArea.width / 2, cropArea.y + cropArea.height / 2 + 10
            ]}
            stroke="#10b981"
            strokeWidth={2}
            listening={false}
          />
        </>
      )}

      {/* Grid lines (rule of thirds) */}
      <Rect
        x={cropArea.x + cropArea.width / 3}
        y={cropArea.y}
        width={1}
        height={cropArea.height}
        fill="rgba(255,255,255,0.3)"
        listening={false}
      />
      <Rect
        x={cropArea.x + (cropArea.width * 2) / 3}
        y={cropArea.y}
        width={1}
        height={cropArea.height}
        fill="rgba(255,255,255,0.3)"
        listening={false}
      />
      <Rect
        x={cropArea.x}
        y={cropArea.y + cropArea.height / 3}
        width={cropArea.width}
        height={1}
        fill="rgba(255,255,255,0.3)"
        listening={false}
      />
      <Rect
        x={cropArea.x}
        y={cropArea.y + (cropArea.height * 2) / 3}
        width={cropArea.width}
        height={1}
        fill="rgba(255,255,255,0.3)"
        listening={false}
      />

      <Transformer
        ref={trRef}
        keepRatio={aspectRatio !== 'free'}
        enabledAnchors={
          aspectRatio === 'free'
            ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']
            : ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        }
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 20 || newBox.height < 20) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </Group>
  );
}
