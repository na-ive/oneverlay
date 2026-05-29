import { useRef, useEffect, useCallback } from 'react';
import { Transformer, Group, Rect, Line } from 'react-konva';
import type Konva from 'konva';
import type { OverlayElement } from '../../types/elements';
import { useEditorStore } from '../../store/editorStore';


interface CanvasElementProps {
  element: OverlayElement;
  isSelected: boolean;
  isSingleSelected: boolean;
  scale: number;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent | DragEvent>) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformStart: () => void;
  onTransformEnd: (node: Konva.Node) => void;
  boundBoxFunc?: (oldBox: any, newBox: any, keepRatio: boolean) => any;
  onDoubleClick: () => void;
}

export function CanvasElement({
  element,
  isSelected,
  isSingleSelected,
  scale,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  boundBoxFunc,
  onDoubleClick,
}: CanvasElementProps) {
  const toolMode = useEditorStore((s) => s.toolMode);
  const isHand = toolMode === 'hand';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Attach transformer and override getClientRect when selected
  useEffect(() => {
    if (shapeRef.current) {
      const group = shapeRef.current;
      // Override getClientRect to strictly adhere to the Group's width/height (ignoring children overflow)
      // This is necessary because Konva Transformer uses getClientRect to draw its bounds,
      // and natively it includes all children even if they are clipped.
      group.getClientRect = function (config?: any) {
        const width = this.width();
        const height = this.height();

        if (config && config.skipTransform) {
          return { x: 0, y: 0, width, height };
        }

        const transform = this.getAbsoluteTransform();
        const p1 = transform.point({ x: 0, y: 0 });
        const p2 = transform.point({ x: width, y: 0 });
        const p3 = transform.point({ x: width, y: height });
        const p4 = transform.point({ x: 0, y: height });

        const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
        const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
        const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
        const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      };
    }

    if (isSingleSelected && isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isSingleSelected]);

  const isCtrlDown = useRef(false);
  const isShiftDown = useRef(false);
  const transformState = useRef({
    x: 0, y: 0, rotation: 0,
    scaleX: 1, scaleY: 1,
    cropLeft: 0, cropTop: 0, cropRight: 0, cropBottom: 0,
    width: 0, height: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Control') isCtrlDown.current = true;
      if (e.key === 'Shift') isShiftDown.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      if (e.key === 'Control') isCtrlDown.current = false;
      if (e.key === 'Shift') isShiftDown.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleTransformStart = useCallback(() => {
    if (shapeRef.current) {
      transformState.current = {
        x: shapeRef.current.x(),
        y: shapeRef.current.y(),
        rotation: shapeRef.current.rotation(),
        scaleX: element.scaleX,
        scaleY: element.scaleY,
        cropLeft: element.cropLeft || 0,
        cropTop: element.cropTop || 0,
        cropRight: element.cropRight || 0,
        cropBottom: element.cropBottom || 0,
        width: shapeRef.current.width(),
        height: shapeRef.current.height(),
      };
    }
    onTransformStart();
  }, [element, onTransformStart]);

  const handleTransform = useCallback(() => {
    const node = shapeRef.current;
    const tr = trRef.current;
    if (!node || !tr) return;

    if (isCtrlDown.current) {
      const state = transformState.current;
      const activeAnchor = tr.getActiveAnchor();
      if (!activeAnchor) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // The true visual dimensions currently proposed by Transformer
      const currentVisualWidth = node.width() * scaleX;
      const currentVisualHeight = node.height() * scaleY;

      // The absolute change in visual dimensions since transformstart
      const deltaW_visual = currentVisualWidth - state.width * state.scaleX;
      const deltaH_visual = currentVisualHeight - state.height * state.scaleY;

      // Convert visual delta to source pixel delta
      const deltaW = deltaW_visual / state.scaleX;
      const deltaH = deltaH_visual / state.scaleY;

      let { cropLeft, cropTop, cropRight, cropBottom } = state;

      if (activeAnchor.includes('right')) cropRight -= deltaW;
      if (activeAnchor.includes('left')) cropLeft -= deltaW;
      if (activeAnchor.includes('bottom')) cropBottom -= deltaH;
      if (activeAnchor.includes('top')) cropTop -= deltaH;

      const oldCropLeft = state.cropLeft;
      const oldCropTop = state.cropTop;

      cropLeft = Math.max(0, cropLeft);
      cropRight = Math.max(0, cropRight);
      cropTop = Math.max(0, cropTop);
      cropBottom = Math.max(0, cropBottom);

      // Prevent cropping completely to 0 width
      if (cropLeft + cropRight >= element.width) {
        if (activeAnchor.includes('right')) cropRight = element.width - cropLeft - 1;
        else cropLeft = element.width - cropRight - 1;
      }
      if (cropTop + cropBottom >= element.height) {
        if (activeAnchor.includes('bottom')) cropBottom = element.height - cropTop - 1;
        else cropTop = element.height - cropBottom - 1;
      }

      // Calculate shift to maintain opposite anchor position
      const actualDeltaCropLeft = cropLeft - oldCropLeft;
      const actualDeltaCropTop = cropTop - oldCropTop;

      const shiftX_local = actualDeltaCropLeft * state.scaleX;
      const shiftY_local = actualDeltaCropTop * state.scaleY;

      const rad = (state.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const shiftX_global = shiftX_local * cos - shiftY_local * sin;
      const shiftY_global = shiftX_local * sin + shiftY_local * cos;

      const newX = state.x + shiftX_global;
      const newY = state.y + shiftY_global;

      // Revert node scale and apply corrected position
      node.scaleX(state.scaleX);
      node.scaleY(state.scaleY);
      node.x(newX);
      node.y(newY);

      node.setAttrs({ cropLeft, cropTop, cropRight, cropBottom });

      const newVisibleWidth = Math.max(1, element.width - cropLeft - cropRight);
      const newVisibleHeight = Math.max(1, element.height - cropTop - cropBottom);
      
      node.width(newVisibleWidth);
      node.height(newVisibleHeight);
      node.clipWidth(newVisibleWidth);
      node.clipHeight(newVisibleHeight);

      const innerNode = node.children && node.children[0];
      if (innerNode) {
        innerNode.x(-cropLeft);
        innerNode.y(-cropTop);
      }
    } else {
      const state = transformState.current;
      node.setAttrs({
        cropLeft: undefined,
        cropTop: undefined,
        cropRight: undefined,
        cropBottom: undefined,
      });

      node.width(state.width);
      node.height(state.height);
      node.clipWidth(state.width);
      node.clipHeight(state.height);

      const innerNode = node.children && node.children[0];
      if (innerNode) {
        innerNode.x(-state.cropLeft);
        innerNode.y(-state.cropTop);
      }
    }
  }, [element.width, element.height]);

  const handleTransformEnd = useCallback(() => {
    if (shapeRef.current) {
      onTransformEnd(shapeRef.current as Konva.Node);
    }
  }, [onTransformEnd]);

  const renderElement = () => {
    const cropLeft = element.cropLeft || 0;
    const cropTop = element.cropTop || 0;
    const cropRight = element.cropRight || 0;
    const cropBottom = element.cropBottom || 0;

    const visibleWidth = Math.max(1, element.width - cropLeft - cropRight);
    const visibleHeight = Math.max(1, element.height - cropTop - cropBottom);

    return (
      <Group
        ref={shapeRef}
        id={element.id}
        x={element.x}
        y={element.y}
        width={visibleWidth}
        height={visibleHeight}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        rotation={element.rotation}
        opacity={element.opacity}
        draggable={!element.locked && !isHand}
        listening={!isHand}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd(e);
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'default';
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = element.locked ? 'not-allowed' : 'move';
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
        onDblClick={(e) => {
          if (e.evt && e.evt.button === 0) {
            onDoubleClick();
          }
        }}
        onDblTap={onDoubleClick}
        clipX={0}
        clipY={0}
        clipWidth={visibleWidth}
        clipHeight={visibleHeight}
      >
        <Rect
          x={-cropLeft}
          y={-cropTop}
          width={element.width}
          height={element.height}
          fill="rgba(0,0,0,0.001)"
        />
        {isSelected && (
          <Group listening={false}>
            <Line
              points={[0, 0, visibleWidth, 0]}
              stroke={cropTop > 0 ? '#00ff00' : '#4a9eff'}
              dash={cropTop > 0 ? [5 / scale, 5 / scale] : []}
              strokeWidth={1.5 / scale}
              strokeScaleEnabled={false}
            />
            <Line
              points={[visibleWidth, 0, visibleWidth, visibleHeight]}
              stroke={cropRight > 0 ? '#00ff00' : '#4a9eff'}
              dash={cropRight > 0 ? [5 / scale, 5 / scale] : []}
              strokeWidth={1.5 / scale}
              strokeScaleEnabled={false}
            />
            <Line
              points={[visibleWidth, visibleHeight, 0, visibleHeight]}
              stroke={cropBottom > 0 ? '#00ff00' : '#4a9eff'}
              dash={cropBottom > 0 ? [5 / scale, 5 / scale] : []}
              strokeWidth={1.5 / scale}
              strokeScaleEnabled={false}
            />
            <Line
              points={[0, visibleHeight, 0, 0]}
              stroke={cropLeft > 0 ? '#00ff00' : '#4a9eff'}
              dash={cropLeft > 0 ? [5 / scale, 5 / scale] : []}
              strokeWidth={1.5 / scale}
              strokeScaleEnabled={false}
            />
          </Group>
        )}
      </Group>
    );
  };

  return (
    <>
      {renderElement()}
      {isSelected && isSingleSelected && !isHand && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={!isShiftDown.current}
          {...({ shiftBehavior: 'none' } as any)}
          borderEnabled={false}
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
          onTransformStart={handleTransformStart}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={(oldBox, newBox) => {
            if (isCtrlDown.current) return newBox;

            if (!isShiftDown.current) {
              const tr = trRef.current;
              if (tr) {
                const anchor = tr.getActiveAnchor();
                if (
                  anchor === 'middle-left' ||
                  anchor === 'middle-right' ||
                  anchor === 'top-center' ||
                  anchor === 'bottom-center'
                ) {
                  const ratio = oldBox.width / oldBox.height;
                  if (anchor === 'middle-left' || anchor === 'middle-right') {
                    newBox.height = newBox.width / ratio;
                    newBox.y = oldBox.y + (oldBox.height - newBox.height) / 2;
                  } else {
                    newBox.width = newBox.height * ratio;
                    newBox.x = oldBox.x + (oldBox.width - newBox.width) / 2;
                  }
                }
              }
            }

            // Minimum size constraint
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }

            if (boundBoxFunc) {
              return boundBoxFunc(oldBox, newBox, !isShiftDown.current);
            }

            return newBox;
          }}
        />
      )}
    </>
  );
}
