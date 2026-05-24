import { useCallback, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore, selectElements, selectCanvas } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { CanvasElement } from './CanvasElement';
import { LuType, LuImage, LuGlobe } from 'react-icons/lu';
import { APP_NAME } from '../../lib/constants';


export function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const elements = useSceneStore(selectElements);
  const canvasWidth = useSceneStore((s) => selectCanvas(s).width);
  const canvasHeight = useSceneStore((s) => selectCanvas(s).height);
  const addElement = useSceneStore((s) => s.addElement);
  const moveElement = useSceneStore((s) => s.moveElement);
  const resizeElement = useSceneStore((s) => s.resizeElement);
  const updateElement = useSceneStore((s) => s.updateElement);

  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const bottomDockHeight = useEditorStore((s) => s.bottomDockHeight);
  const openProperties = useEditorStore((s) => s.openProperties);
  const pushHistory = useHistoryStore((s) => s.push);

  const handleQuickAdd = useCallback(
    (type: 'text' | 'image' | 'browser') => {
      pushHistory();
      addElement(type);
      
      // Auto-select the newly added element
      const updatedElements = selectElements(useSceneStore.getState());
      const newElement = updatedElements[updatedElements.length - 1];
      if (newElement) {
        selectElement(newElement.id);
        openProperties(newElement.id);
      }
    },
    [addElement, selectElement, openProperties, pushHistory],
  );

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

      {/* Empty canvas guide */}
      {elements.length === 0 && (
        <div
          className="absolute pointer-events-none select-none z-10 flex flex-col items-center justify-center overflow-hidden"
          style={{
            left: `${offsetX}px`,
            top: `${offsetY}px`,
            width: `${canvasWidth * scale}px`,
            height: `${canvasHeight * scale}px`,
          }}
        >
          <div
            className="flex flex-col items-center text-center max-w-md pointer-events-auto p-4 transition-transform duration-200"
            style={{
              transform: scale < 0.65 ? `scale(${scale / 0.65})` : 'none',
            }}
          >
            {/* Page title */}
            <span className="text-5xl font-black uppercase tracking-widest text-text-primary">
              {APP_NAME}
            </span>

            {/* Description text */}
            <p className="text-sm text-text-secondary mt-3 mb-8 max-w-sm leading-relaxed">
              Add your first element to start designing and composing your custom stream overlay.
            </p>

            {/* Quick CTA buttons in 1 row */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleQuickAdd('text')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-bg-surface hover:bg-bg-hover text-text-primary text-xs font-semibold hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <LuType size={13} className="text-text-secondary" />
                Text
              </button>
              <button
                onClick={() => handleQuickAdd('image')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-bg-surface hover:bg-bg-hover text-text-primary text-xs font-semibold hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <LuImage size={13} className="text-text-secondary" />
                Image
              </button>
              <button
                onClick={() => handleQuickAdd('browser')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-bg-surface hover:bg-bg-hover text-text-primary text-xs font-semibold hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <LuGlobe size={13} className="text-text-secondary" />
                Browser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
