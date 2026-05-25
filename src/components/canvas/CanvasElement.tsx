import { useRef, useEffect, useCallback } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import type { OverlayElement } from '../../types/elements';
import { TextElementNode } from './TextElement';
import { ImageElementNode } from './ImageElement';
import { BrowserElementNode } from './BrowserElement';

interface CanvasElementProps {
  element: OverlayElement;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformStart: () => void;
  onTransformEnd: (node: Konva.Node) => void;
  onDoubleClick: () => void;
}

export function CanvasElement({
  element,
  isSelected,
  scale,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onDoubleClick,
}: CanvasElementProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = useCallback(() => {
    if (shapeRef.current) {
      onTransformEnd(shapeRef.current as Konva.Node);
    }
  }, [onTransformEnd]);

  const renderElement = () => {
    const commonProps = {
      ref: shapeRef,
      id: element.id,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      opacity: element.opacity,
      draggable: !element.locked,
      onClick: onSelect,
      onTap: onSelect,
      onDragStart,
      onDragEnd,
      onDblClick: onDoubleClick,
      onDblTap: onDoubleClick,
    };

    switch (element.type) {
      case 'text':
        return <TextElementNode element={element} {...commonProps} />;
      case 'image':
        return <ImageElementNode element={element} {...commonProps} />;
      case 'browser':
        return <BrowserElementNode element={element} {...commonProps} />;
    }
  };

  return (
    <>
      {renderElement()}
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
          borderStroke="#4a9eff"
          borderStrokeWidth={1.5 / scale}
          anchorStroke="#4a9eff"
          anchorFill="#1a1a2e"
          anchorSize={8 / scale}
          anchorCornerRadius={2 / scale}
          rotateAnchorOffset={20 / scale}
          onTransformStart={onTransformStart}
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraint
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
