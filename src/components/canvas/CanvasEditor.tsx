import { useCallback, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { CanvasElement } from './CanvasElement';


export function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const elements = useSceneStore((s) => s.elements);
  const canvasWidth = useSceneStore((s) => s.canvas.width);
  const canvasHeight = useSceneStore((s) => s.canvas.height);
  const moveElement = useSceneStore((s) => s.moveElement);
  const resizeElement = useSceneStore((s) => s.resizeElement);
  const updateElement = useSceneStore((s) => s.updateElement);

  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const bottomDockHeight = useEditorStore((s) => s.bottomDockHeight);
  const openProperties = useEditorStore((s) => s.openProperties);
  const pushHistory = useHistoryStore((s) => s.push);

  const { scale, offsetX, offsetY } = useCanvasZoom(
    containerSize.width,
    containerSize.height,
  );

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [bottomDockHeight]);

  // Click on empty canvas area → deselect
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (e.target === stageRef.current || e.target.name() === 'canvas-bg') {
        selectElement(null);
      }
    },
    [selectElement],
  );

  // Drag end
  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      moveElement(id, e.target.x(), e.target.y());
    },
    [moveElement],
  );

  // Drag start — push history
  const handleDragStart = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  // Transform end (resize)
  const handleTransformEnd = useCallback(
    (id: string, node: Konva.Node) => {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and apply to width/height
      node.scaleX(1);
      node.scaleY(1);

      const newWidth = Math.max(10, node.width() * scaleX);
      const newHeight = Math.max(10, node.height() * scaleY);

      resizeElement(id, newWidth, newHeight);
      moveElement(id, node.x(), node.y());
      updateElement(id, { rotation: node.rotation() });
    },
    [resizeElement, moveElement, updateElement],
  );

  // Double-click to open properties
  const handleDoubleClick = useCallback(
    (id: string) => {
      openProperties(id);
    },
    [openProperties],
  );

  // Sort by zIndex for rendering order
  const sortedElements = [...elements]
    .filter((el) => !el.hidden)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-canvas)' }}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {/* Canvas background */}
          <Rect
            name="canvas-bg"
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="#0a0a0a"
            stroke="#333"
            strokeWidth={1 / scale}
          />

          {/* Elements */}
          {sortedElements.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={selectedId === element.id}
              scale={scale}
              onSelect={() => selectElement(element.id)}
              onDragStart={handleDragStart}
              onDragEnd={(e) => handleDragEnd(element.id, e)}
              onTransformStart={handleDragStart}
              onTransformEnd={(node) => handleTransformEnd(element.id, node)}
              onDoubleClick={() => handleDoubleClick(element.id)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Resolution label */}
      <div className="absolute bottom-2 right-3 text-[10px] text-text-muted select-none pointer-events-none">
        {canvasWidth}×{canvasHeight} · {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
