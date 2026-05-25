import { useCallback, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore, selectElements, selectCanvas } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { useContextMenuStore } from '../../store/contextMenuStore';
import { CanvasElement } from './CanvasElement';
import {
  LuType,
  LuImage,
  LuGlobe,
  LuSettings2,
  LuTrash2,
  LuCopyPlus,
  LuEye,
  LuEyeOff,
  LuArrowUpToLine,
  LuArrowDownToLine,
  LuArrowUp,
  LuArrowDown,
  LuCrosshair,
} from 'react-icons/lu';
import { APP_NAME } from '../../lib/constants';
import type { ContextMenuEntry } from '../../store/contextMenuStore';


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
  const removeElement = useSceneStore((s) => s.removeElement);
  const toggleVisibility = useSceneStore((s) => s.toggleVisibility);
  const reorderElement = useSceneStore((s) => s.reorderElement);
  const duplicateElement = useSceneStore((s) => s.duplicateElement);

  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const bottomDockHeight = useEditorStore((s) => s.bottomDockHeight);
  const openProperties = useEditorStore((s) => s.openProperties);
  const pushHistory = useHistoryStore((s) => s.push);
  const showMenu = useContextMenuStore((s) => s.show);

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

  // ── Context Menu ──

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Shift+right-click → native browser context menu
      if (e.shiftKey) return;
      e.preventDefault();

      // Determine if right-clicking on an element or blank canvas
      let clickedId: string | null = selectedId;

      if (stageRef.current) {
        const pointerPos = stageRef.current.getPointerPosition();
        if (pointerPos) {
          const shape = stageRef.current.getIntersection(pointerPos);
          if (shape && shape.name() !== 'canvas-bg') {
            let node: Konva.Node | null = shape;
            let foundId = '';
            while (node) {
              const id = node.id();
              if (id) {
                foundId = id;
                break;
              }
              node = node.getParent();
            }
            if (foundId) {
              clickedId = foundId;
              selectElement(foundId);
            }
          } else {
            selectElement(null);
            clickedId = null;
          }
        }
      }

      const clickedEl = clickedId ? elements.find((el) => el.id === clickedId) : null;

      if (clickedEl) {
        // ── Context menu for selected element ──
        const elIndex = elements.findIndex((el) => el.id === clickedEl.id);
        const canMoveUp = elIndex < elements.length - 1;
        const canMoveDown = elIndex > 0;

        const items: ContextMenuEntry[] = [
          {
            type: 'item',
            id: 'properties',
            label: 'Properties',
            icon: <LuSettings2 size={12} />,
            onClick: () => openProperties(clickedEl.id),
          },
          {
            type: 'item',
            id: 'duplicate',
            label: 'Duplicate',
            icon: <LuCopyPlus size={12} />,
            onClick: () => {
              pushHistory();
              duplicateElement(clickedEl.id);
            },
          },
          {
            type: 'item',
            id: 'toggle-visibility',
            label: clickedEl.hidden ? 'Show' : 'Hide',
            icon: clickedEl.hidden ? <LuEye size={12} /> : <LuEyeOff size={12} />,
            onClick: () => {
              pushHistory();
              toggleVisibility(clickedEl.id);
            },
          },
          { type: 'separator' },
          {
            type: 'item',
            id: 'move-top',
            label: 'Bring to Front',
            icon: <LuArrowUpToLine size={12} />,
            disabled: !canMoveUp,
            onClick: () => {
              pushHistory();
              reorderElement(elIndex, elements.length - 1);
            },
          },
          {
            type: 'item',
            id: 'move-up',
            label: 'Bring Forward',
            icon: <LuArrowUp size={12} />,
            disabled: !canMoveUp,
            onClick: () => {
              pushHistory();
              reorderElement(elIndex, elIndex + 1);
            },
          },
          {
            type: 'item',
            id: 'move-down',
            label: 'Send Backward',
            icon: <LuArrowDown size={12} />,
            disabled: !canMoveDown,
            onClick: () => {
              pushHistory();
              reorderElement(elIndex, elIndex - 1);
            },
          },
          {
            type: 'item',
            id: 'move-bottom',
            label: 'Send to Back',
            icon: <LuArrowDownToLine size={12} />,
            disabled: !canMoveDown,
            onClick: () => {
              pushHistory();
              reorderElement(elIndex, 0);
            },
          },
          { type: 'separator' },
          {
            type: 'item',
            id: 'center-canvas',
            label: 'Center on Canvas',
            icon: <LuCrosshair size={12} />,
            onClick: () => {
              pushHistory();
              updateElement(clickedEl.id, {
                x: Math.round((canvasWidth - clickedEl.width) / 2),
                y: Math.round((canvasHeight - clickedEl.height) / 2),
              });
            },
          },
          { type: 'separator' },
          {
            type: 'item',
            id: 'delete',
            label: 'Delete',
            icon: <LuTrash2 size={12} />,
            danger: true,
            onClick: () => {
              pushHistory();
              removeElement(clickedEl.id);
              selectElement(null);
            },
          },
        ];

        showMenu(e.clientX, e.clientY, items);
      } else {
        // ── Context menu for blank canvas ──
        const items: ContextMenuEntry[] = [
          {
            type: 'item',
            id: 'add-text',
            label: 'Add Text',
            icon: <LuType size={12} />,
            onClick: () => handleQuickAdd('text'),
          },
          {
            type: 'item',
            id: 'add-image',
            label: 'Add Image',
            icon: <LuImage size={12} />,
            onClick: () => handleQuickAdd('image'),
          },
          {
            type: 'item',
            id: 'add-browser',
            label: 'Add Browser Source',
            icon: <LuGlobe size={12} />,
            onClick: () => handleQuickAdd('browser'),
          },
        ];

        showMenu(e.clientX, e.clientY, items);
      }
    },
    [
      selectedId,
      elements,
      canvasWidth,
      canvasHeight,
      openProperties,
      duplicateElement,
      toggleVisibility,
      reorderElement,
      updateElement,
      removeElement,
      selectElement,
      handleQuickAdd,
      pushHistory,
      showMenu,
    ],
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
      onContextMenu={handleContextMenu}
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
