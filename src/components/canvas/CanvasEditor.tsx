import { useCallback, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore, selectElements, selectCanvas } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { useContextMenuStore } from '../../store/contextMenuStore';
import { CanvasElement } from './CanvasElement';
import type { TextElement, ImageElement, BrowserElement, OverlayElement } from '../../types/elements';
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
  LuRotateCw,
  LuRefreshCw,
  LuLock,
  LuLockOpen,
} from 'react-icons/lu';
import { APP_NAME } from '../../lib/constants';
import { createElement } from '../../lib/defaults';
import type { ContextMenuEntry } from '../../store/contextMenuStore';
interface HTMLTextElementProps {
  el: TextElement;
  updateElement: (id: string, updates: Partial<OverlayElement>) => void;
}

const HTMLTextElement = ({ el, updateElement }: HTMLTextElementProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      const height = ref.current.offsetHeight;
      if (width !== el.width || height !== el.height) {
        updateElement(el.id, { width, height });
      }
    }
  }, [el.text, el.fontSize, el.fontFamily, el.fontWeight, el.id, updateElement]);

  return (
    <span
      ref={ref}
      style={{
        fontSize: `${el.fontSize}px`,
        color: el.color,
        fontFamily: el.fontFamily,
        fontWeight: el.fontWeight,
        whiteSpace: 'pre-wrap',
        userSelect: 'none',
        display: 'inline-block',
      }}
    >
      {el.text}
    </span>
  );
};

interface HTMLImageElementProps {
  el: ImageElement;
  updateElement: (id: string, updates: Partial<OverlayElement>) => void;
}

const HTMLImageElement = ({ el, updateElement }: HTMLImageElementProps) => {
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (el.width !== img.naturalWidth || el.height !== img.naturalHeight) {
      updateElement(el.id, {
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  };

  if (!el.imageUrl) {
    return (
      <div className="w-full h-full bg-[#1e2a3a] border border-[#2a3a4a] rounded flex items-center justify-center text-text-muted text-xs select-none">
        <span>🖼 Image</span>
      </div>
    );
  }

  return (
    <img
      src={el.imageUrl}
      alt={el.name}
      onLoad={handleLoad}
      className="w-full h-full object-cover pointer-events-none select-none"
      style={{ pointerEvents: 'none' }}
    />
  );
};

function isPointInElement(px: number, py: number, el: OverlayElement) {
  const dx = px - el.x;
  const dy = py - el.y;
  const rad = (-el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const cropLeft = el.cropLeft || 0;
  const cropTop = el.cropTop || 0;
  const cropRight = el.cropRight || 0;
  const cropBottom = el.cropBottom || 0;

  const width = el.width - cropLeft - cropRight;
  const height = el.height - cropTop - cropBottom;

  const visualX = localX / el.scaleX;
  const visualY = localY / el.scaleY;

  return visualX >= 0 && visualX <= width && visualY >= 0 && visualY <= height;
}

export function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const elements = useSceneStore(selectElements);
  const canvasWidth = useSceneStore((s) => selectCanvas(s).width);
  const canvasHeight = useSceneStore((s) => selectCanvas(s).height);
  const moveElement = useSceneStore((s) => s.moveElement);
  const updateElement = useSceneStore((s) => s.updateElement);
  const removeElement = useSceneStore((s) => s.removeElement);
  const toggleVisibility = useSceneStore((s) => s.toggleVisibility);
  const reorderElement = useSceneStore((s) => s.reorderElement);
  const duplicateElement = useSceneStore((s) => s.duplicateElement);

  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const bottomDockHeight = useEditorStore((s) => s.bottomDockHeight);
  const openProperties = useEditorStore((s) => s.openProperties);
  const openAddElementModal = useEditorStore((s) => s.openAddElementModal);
  const pushHistory = useHistoryStore((s) => s.push);
  const showMenu = useContextMenuStore((s) => s.show);
  const toolMode = useEditorStore((s) => s.toolMode);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

  const handleMouseDown = useCallback(() => {
    const currentToolMode = useEditorStore.getState().toolMode;
    if (currentToolMode !== 'hand') return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const store = useEditorStore.getState();
    panStartRef.current = {
      startX: pointer.x,
      startY: pointer.y,
      panX: store.panX,
      panY: store.panY,
    };
    setIsPanning(true);
  }, []);

  const handleMouseMove = useCallback(() => {
    if (!isPanning) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const { startX, startY, panX: initialPanX, panY: initialPanY } = panStartRef.current;
    const dx = pointer.x - startX;
    const dy = pointer.y - startY;

    useEditorStore.getState().setPan(initialPanX + dx, initialPanY + dy);
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  const handleTouchStart = useCallback(() => {
    const currentToolMode = useEditorStore.getState().toolMode;
    if (currentToolMode !== 'hand') return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const store = useEditorStore.getState();
    panStartRef.current = {
      startX: pointer.x,
      startY: pointer.y,
      panX: store.panX,
      panY: store.panY,
    };
    setIsPanning(true);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (!isPanning) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const { startX, startY, panX: initialPanX, panY: initialPanY } = panStartRef.current;
    const dx = pointer.x - startX;
    const dy = pointer.y - startY;

    useEditorStore.getState().setPan(initialPanX + dx, initialPanY + dy);
  }, [isPanning]);

  const handleQuickAdd = useCallback(
    (type: 'text' | 'image' | 'browser') => {
      openAddElementModal(type);
    },
    [openAddElementModal],
  );

  const { scale, offsetX, offsetY } = useCanvasZoom(
    containerSize.width,
    containerSize.height,
  );

  const valuesRef = useRef({ scale, offsetX, offsetY, canvasWidth, canvasHeight });
  useEffect(() => {
    valuesRef.current = { scale, offsetX, offsetY, canvasWidth, canvasHeight };
  }, [scale, offsetX, offsetY, canvasWidth, canvasHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const { offsetX: currentOffsetX, offsetY: currentOffsetY, canvasWidth: cw, canvasHeight: ch } = valuesRef.current;

      const direction = e.deltaY < 0 ? 1 : -1;
      const zoomStep = 0.05;
      const oldZoom = useEditorStore.getState().zoom;

      const ZOOM_MIN = 0.1;
      const ZOOM_MAX = 5;
      const newZoom = Math.min(Math.max(oldZoom + direction * zoomStep, ZOOM_MIN), ZOOM_MAX);

      if (newZoom === oldZoom) return;

      const padding = 40;
      const availW = container.clientWidth - padding * 2;
      const availH = container.clientHeight - padding * 2;
      const fitScale = Math.min(availW / cw, availH / ch, 1);

      const oldScale = fitScale * oldZoom;
      const newScale = fitScale * newZoom;

      const localX = (pointer.x - currentOffsetX) / oldScale;
      const localY = (pointer.y - currentOffsetY) / oldScale;

      const newDefaultOffsetX = (container.clientWidth - cw * newScale) / 2;
      const newDefaultOffsetY = (container.clientHeight - ch * newScale) / 2;

      const newPanX = pointer.x - localX * newScale - newDefaultOffsetX;
      const newPanY = pointer.y - localY * newScale - newDefaultOffsetY;

      useEditorStore.getState().setZoom(newZoom);
      useEditorStore.getState().setPan(newPanX, newPanY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

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

  // Transform end (resize or crop)
  const handleTransformEnd = useCallback(
    (id: string, node: Konva.Node) => {
      const updates: Partial<OverlayElement> = {
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      };

      // Extract crop from node if it was set
      if (node.attrs.cropLeft !== undefined) {
        updates.cropLeft = node.attrs.cropLeft;
        updates.cropTop = node.attrs.cropTop;
        updates.cropRight = node.attrs.cropRight;
        updates.cropBottom = node.attrs.cropBottom;
      }

      updateElement(id, updates);
    },
    [updateElement],
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
      let clickedId: string | null = null;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const localX = (clientX - offsetX) / scale;
        const localY = (clientY - offsetY) / scale;

        const clickedEl = [...elements]
          .filter((el) => !el.hidden)
          .reverse() // check top-most first
          .find((el) => isPointInElement(localX, localY, el));

        if (clickedEl) {
          clickedId = clickedEl.id;
          selectElement(clickedEl.id);
        } else {
          selectElement(null);
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
          {
            type: 'item',
            id: 'toggle-lock',
            label: clickedEl.locked ? 'Unlock' : 'Lock',
            icon: clickedEl.locked ? <LuLockOpen size={12} /> : <LuLock size={12} />,
            onClick: () => {
              pushHistory();
              updateElement(clickedEl.id, { locked: !clickedEl.locked });
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
            id: 'rotate-submenu',
            label: 'Rotate',
            icon: <LuRotateCw size={12} />,
            submenu: [
              {
                type: 'item',
                id: 'rotate-90',
                label: 'Rotate 90° CW',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, {
                    rotation: Math.round((clickedEl.rotation + 90) % 360),
                  });
                },
              },
              {
                type: 'item',
                id: 'rotate-180',
                label: 'Rotate 180°',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, {
                    rotation: Math.round((clickedEl.rotation + 180) % 360),
                  });
                },
              },
              {
                type: 'item',
                id: 'rotate-270',
                label: 'Rotate 90° CCW',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, {
                    rotation: Math.round((clickedEl.rotation + 270) % 360),
                  });
                },
              },
            ],
          },
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
          {
            type: 'item',
            id: 'reset-defaults',
            label: 'Reset to Defaults',
            icon: <LuRefreshCw size={12} />,
            onClick: () => {
              pushHistory();
              const defaultEl = createElement(clickedEl.type);
              updateElement(clickedEl.id, {
                ...defaultEl,
                id: clickedEl.id,
                name: clickedEl.name,
                zIndex: clickedEl.zIndex,
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
      className="flex-1 min-h-0 overflow-hidden relative z-0"
      style={{ backgroundColor: 'var(--color-bg-canvas)' }}
      onContextMenu={handleContextMenu}
    >
      {/* Canvas background in DOM (below the Stage) */}
      <div
        className="absolute pointer-events-none shadow-2xl transition-all duration-75"
        style={{
          left: `${offsetX}px`,
          top: `${offsetY}px`,
          width: `${canvasWidth * scale}px`,
          height: `${canvasHeight * scale}px`,
          backgroundColor: '#0a0a0a',
        }}
      />

      {/* HTML Elements Layer (rendered natively for perfect stacking order) */}
      <div
        className="absolute pointer-events-none overflow-hidden select-none"
        style={{
          left: `${offsetX}px`,
          top: `${offsetY}px`,
          width: `${canvasWidth * scale}px`,
          height: `${canvasHeight * scale}px`,
          pointerEvents: 'none',
        }}
      >
        {sortedElements.map((el) => {
          const zIndex = 10 + el.zIndex;

          const commonStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${el.x * scale}px`,
            top: `${el.y * scale}px`,
            width: `${el.width}px`,
            height: `${el.height}px`,
            transform: `rotate(${el.rotation}deg) scale(${scale * el.scaleX}, ${scale * el.scaleY})`,
            transformOrigin: 'top left',
            opacity: el.opacity,
            clipPath: `inset(${el.cropTop || 0}px ${el.cropRight || 0}px ${el.cropBottom || 0}px ${el.cropLeft || 0}px)`,
            zIndex,
            pointerEvents: toolMode === 'hand' ? 'none' : 'auto', // Allow clicks to select
          };

          const handleMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            selectElement(el.id);
          };

          if (el.type === 'browser') {
            const browserEl = el as BrowserElement;
            const hasUrl = !!browserEl.url && browserEl.url !== 'about:blank';
            return (
              <div
                key={el.id}
                style={{
                  ...commonStyle,
                  width: `${browserEl.browserWidth}px`,
                  height: `${browserEl.browserHeight}px`,
                  clipPath: `inset(${browserEl.cropTop}px ${browserEl.cropRight}px ${browserEl.cropBottom}px ${browserEl.cropLeft}px)`,
                  borderRadius: '4px',
                }}
                onMouseDown={handleMouseDown}
              >
                {/* Transparent click catcher to prevent direct iframe interaction during layout */}
                <div className="absolute inset-0 z-10 cursor-pointer" />
                {hasUrl ? (
                  <iframe
                    src={browserEl.url}
                    title={`browser-source-${browserEl.id}`}
                    className="w-full h-full border-0 pointer-events-none"
                    style={{
                      backgroundColor: 'transparent',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#16213e] border border-[#2a3a4a] rounded flex flex-col items-center justify-center text-text-muted text-xs select-none">
                    <span>🌐 Empty Browser Source</span>
                  </div>
                )}
              </div>
            );
          }

          if (el.type === 'image') {
            const imageEl = el as ImageElement;
            return (
              <div
                key={el.id}
                style={{ ...commonStyle, borderRadius: '4px' }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-0 z-10 cursor-pointer" />
                <HTMLImageElement el={imageEl} updateElement={updateElement} />
              </div>
            );
          }

          if (el.type === 'text') {
            const textEl = el as TextElement;
            return (
              <div
                key={el.id}
                style={{
                  ...commonStyle,
                  width: 'auto',
                  height: 'auto',
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-0 z-10 cursor-pointer" />
                <HTMLTextElement el={textEl} updateElement={updateElement} />
              </div>
            );
          }

          return null;
        })}
      </div>

      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 9999, // Render transformer handles on top of all HTML elements
          pointerEvents: 'auto',
          cursor: toolMode === 'hand' ? (isPanning ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          {/* Canvas background outline only */}
          <Rect
            name="canvas-bg"
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="transparent"
            stroke="#333"
            strokeWidth={1 / scale}
          />

          {/* Render all elements in Konva for dragging and selection */}
          {elements.map((el) => {
            if (el.hidden) return null;
            const isSel = el.id === selectedId;
            return (
              <CanvasElement
                key={el.id}
                element={el}
                isSelected={isSel}
                scale={scale}
                onSelect={() => selectElement(el.id)}
                onDragStart={() => {
                  selectElement(el.id);
                  handleDragStart();
                }}
                onDragEnd={(e) => handleDragEnd(el.id, e)}
                onTransformStart={handleDragStart}
                onTransformEnd={(node) => handleTransformEnd(el.id, node)}
                onDoubleClick={() => handleDoubleClick(el.id)}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Resolution label */}
      <div className="absolute bottom-2 right-3 text-[10px] text-text-muted select-none pointer-events-none">
        {canvasWidth}×{canvasHeight} · {Math.round(scale * 100)}%
      </div>

      {/* Empty canvas guide */}
      {elements.length === 0 && (
        <div
          className="absolute pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden"
          style={{
            left: `${offsetX}px`,
            top: `${offsetY}px`,
            width: `${canvasWidth * scale}px`,
            height: `${canvasHeight * scale}px`,
            zIndex: 10000,
          }}
        >
          <div
            className="flex flex-col items-center text-center max-w-xl pointer-events-auto p-8 transition-transform duration-200"
            style={{
              transform: scale < 0.65 ? `scale(${scale / 0.65})` : 'none',
            }}
          >
            {/* Page title */}
            <h1 className="text-7xl font-black uppercase tracking-widest text-text-primary drop-shadow-sm select-none">
              {APP_NAME}
            </h1>

            {/* Description text */}
            <p className="text-base text-text-secondary mt-4 mb-10 max-w-md leading-relaxed select-none">
              Add your first element to start designing and composing your custom stream overlay.
            </p>

            {/* Quick CTA buttons in 1 row */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleQuickAdd('text')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/[0.08] bg-bg-surface hover:bg-bg-hover text-text-primary text-sm font-semibold transition-all cursor-pointer hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <LuType size={16} className="text-text-secondary" />
                Text
              </button>
              <button
                onClick={() => handleQuickAdd('image')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/[0.08] bg-bg-surface hover:bg-bg-hover text-text-primary text-sm font-semibold transition-all cursor-pointer hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <LuImage size={16} className="text-text-secondary" />
                Image
              </button>
              <button
                onClick={() => handleQuickAdd('browser')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/[0.08] bg-bg-surface hover:bg-bg-hover text-text-primary text-sm font-semibold transition-all cursor-pointer hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <LuGlobe size={16} className="text-text-secondary" />
                Browser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
