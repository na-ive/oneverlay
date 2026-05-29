import { useCallback, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Stage, Layer, Rect, Line, Group, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore, selectElements, selectCanvas } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { useContextMenuStore } from '../../store/contextMenuStore';
import { useConfirmStore } from '../../store/confirmStore';
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
import { loadGoogleFont } from '../../lib/fonts';
import { rotateAroundCenter, getActualBoundingBox } from '../../lib/math';
import type { ContextMenuEntry } from '../../store/contextMenuStore';
interface HTMLTextElementProps {
  el: TextElement;
  updateElement: (id: string, updates: Partial<OverlayElement>) => void;
}

const HTMLTextElement = ({ el, updateElement }: HTMLTextElementProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useLayoutEffect(() => {
    let mounted = true;
    setFontLoaded(false);

    loadGoogleFont(el.fontFamily).then(() => {
      if (mounted) {
        setFontLoaded(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [el.fontFamily]);

  useLayoutEffect(() => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      const height = ref.current.offsetHeight;
      if (width !== el.width || height !== el.height) {
        updateElement(el.id, { width, height });
      }
    }
  }, [el.text, el.fontSize, el.fontFamily, el.fontWeight, el.id, updateElement, fontLoaded]);

  return (
    <span
      ref={ref}
      style={{
        fontSize: `${el.fontSize}px`,
        color: el.color,
        fontFamily: fontLoaded ? el.fontFamily : 'Arial',
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
  const multiTrRef = useRef<Konva.Transformer>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const elements = useSceneStore(selectElements);
  const canvasWidth = useSceneStore((s) => selectCanvas(s).width);
  const canvasHeight = useSceneStore((s) => selectCanvas(s).height);
  
  const updateElement = useSceneStore((s) => s.updateElement);
  const removeElement = useSceneStore((s) => s.removeElement);
  const toggleVisibility = useSceneStore((s) => s.toggleVisibility);
  const reorderElement = useSceneStore((s) => s.reorderElement);
  const duplicateElement = useSceneStore((s) => s.duplicateElement);

  const selectedIds = useEditorStore((s) => s.selectedElementIds);

  // Update multiTrRef when selection changes
  useEffect(() => {
    if (selectedIds.length > 1 && multiTrRef.current && stageRef.current) {
      // Find all selected nodes by ID
      const nodes = selectedIds.map(id => stageRef.current?.findOne(`#${id}`)).filter(Boolean) as Konva.Node[];
      multiTrRef.current.nodes(nodes);
      multiTrRef.current.getLayer()?.batchDraw();
    } else if (selectedIds.length <= 1 && multiTrRef.current) {
      multiTrRef.current.nodes([]);
      multiTrRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, elements]);
  const selectElement = useEditorStore((s) => s.selectElement);
  const bottomDockHeight = useEditorStore((s) => s.bottomDockHeight);
  const openProperties = useEditorStore((s) => s.openProperties);
  const openAddElementModal = useEditorStore((s) => s.openAddElementModal);
  const pushHistory = useHistoryStore((s) => s.push);
  const showMenu = useContextMenuStore((s) => s.show);
  const toolMode = useEditorStore((s) => s.toolMode);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });
  const dragStartPositions = useRef<{ [key: string]: { x: number; y: number } }>({});

  // Guides refs
  const guidesLayerRef = useRef<Konva.Layer>(null);
  const hGuideRef = useRef<Konva.Line>(null);
  const vGuideRef = useRef<Konva.Line>(null);
  
  // Distance guides refs
  const distGuideTopRef = useRef<Konva.Group>(null);
  const distGuideBottomRef = useRef<Konva.Group>(null);
  const distGuideLeftRef = useRef<Konva.Group>(null);
  const distGuideRightRef = useRef<Konva.Group>(null);

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

  const handleDragEnd = useCallback(
    () => {
      const currentSelectedIds = useEditorStore.getState().selectedElementIds;
      const updates = currentSelectedIds.map(sid => {
        const n = stageRef.current?.findOne(`#${sid}`);
        if (n) return { id: sid, x: n.x(), y: n.y() };
        return null;
      }).filter(Boolean) as {id: string, x: number, y: number}[];
      
      useSceneStore.getState().moveElements(updates);

      if (vGuideRef.current) vGuideRef.current.hide();
      if (hGuideRef.current) hGuideRef.current.hide();
      
      [distGuideTopRef, distGuideBottomRef, distGuideLeftRef, distGuideRightRef].forEach(ref => {
        if (ref.current) ref.current.hide();
      });

      if (guidesLayerRef.current) guidesLayerRef.current.batchDraw();
    },
    [],
  );

  // Drag move (Snapping logic)
  const handleDragMove = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const el = elements.find((el) => el.id === id);
      if (!el) return;

      const SNAP_THRESHOLD = 5 / scale;
      
      // calculate dx, dy from the element's start position
      const startPos = dragStartPositions.current[id];
      if (!startPos) return; // fallback
      const dx = node.x() - startPos.x;
      const dy = node.y() - startPos.y;

      // move other selected elements visually
      const currentSelectedIds = useEditorStore.getState().selectedElementIds;
      currentSelectedIds.forEach(sid => {
        if (sid === id) return;
        const otherNode = stageRef.current?.findOne(`#${sid}`);
        const otherStartPos = dragStartPositions.current[sid];
        if (otherNode && otherStartPos) {
          otherNode.x(otherStartPos.x + dx);
          otherNode.y(otherStartPos.y + dy);
        }
      });
      
      let groupMinX = Infinity;
      let groupMinY = Infinity;
      let groupMaxX = -Infinity;
      let groupMaxY = -Infinity;

      currentSelectedIds.forEach(sid => {
        const sEl = elements.find(el => el.id === sid);
        const sNode = stageRef.current?.findOne(`#${sid}`);
        if (sEl && sNode) {
          const box = getActualBoundingBox({ ...sEl, x: sNode.x(), y: sNode.y() });
          groupMinX = Math.min(groupMinX, box.minX);
          groupMinY = Math.min(groupMinY, box.minY);
          groupMaxX = Math.max(groupMaxX, box.maxX);
          groupMaxY = Math.max(groupMaxY, box.maxY);
        }
      });

      const groupCenterX = (groupMinX + groupMaxX) / 2;
      const groupCenterY = (groupMinY + groupMaxY) / 2;
      
      const targetsX: number[] = [0, canvasWidth / 2, canvasWidth];
      const targetsY: number[] = [0, canvasHeight / 2, canvasHeight];

      elements.forEach((other) => {
        if (currentSelectedIds.includes(other.id) || other.hidden) return;
        const otherBox = getActualBoundingBox(other);
        targetsX.push(otherBox.minX, otherBox.centerX, otherBox.maxX);
        targetsY.push(otherBox.minY, otherBox.centerY, otherBox.maxY);
      });

      let closestXDist = Infinity;
      let snapX: number | null = null;
      let shiftX = 0;
      let isCanvasSnapX = false;

      const pointsX = [groupMinX, groupCenterX, groupMaxX];
      for (const px of pointsX) {
        for (const tx of [0, canvasWidth / 2, canvasWidth]) {
          const dist = Math.abs(px - tx);
          if (dist < SNAP_THRESHOLD && (!isCanvasSnapX || dist < closestXDist)) {
            closestXDist = dist;
            snapX = tx;
            shiftX = tx - px;
            isCanvasSnapX = true;
          }
        }
        for (const tx of targetsX) {
          if (tx === 0 || tx === canvasWidth / 2 || tx === canvasWidth) continue; 
          const dist = Math.abs(px - tx);
          if (dist < SNAP_THRESHOLD && !isCanvasSnapX && dist < closestXDist) {
            closestXDist = dist;
            snapX = tx;
            shiftX = tx - px;
          }
        }
      }

      if (snapX !== null) {
        selectedIds.forEach(sid => {
          const n = stageRef.current?.findOne(`#${sid}`);
          if (n) n.x(n.x() + shiftX);
        });
        if (vGuideRef.current) {
          vGuideRef.current.points([snapX, -10000, snapX, 10000]);
          vGuideRef.current.show();
        }
      } else {
        if (vGuideRef.current) vGuideRef.current.hide();
      }

      let closestYDist = Infinity;
      let snapY: number | null = null;
      let shiftY = 0;
      let isCanvasSnapY = false;

      const pointsY = [groupMinY, groupCenterY, groupMaxY];
      for (const py of pointsY) {
        for (const ty of [0, canvasHeight / 2, canvasHeight]) {
          const dist = Math.abs(py - ty);
          if (dist < SNAP_THRESHOLD && (!isCanvasSnapY || dist < closestYDist)) {
            closestYDist = dist;
            snapY = ty;
            shiftY = ty - py;
            isCanvasSnapY = true;
          }
        }
        for (const ty of targetsY) {
          if (ty === 0 || ty === canvasHeight / 2 || ty === canvasHeight) continue;
          const dist = Math.abs(py - ty);
          if (dist < SNAP_THRESHOLD && !isCanvasSnapY && dist < closestYDist) {
            closestYDist = dist;
            snapY = ty;
            shiftY = ty - py;
          }
        }
      }
      if (snapX !== null) {
        currentSelectedIds.forEach(sid => {
          const n = stageRef.current?.findOne(`#${sid}`);
          if (n) n.x(n.x() + shiftX);
        });
        if (vGuideRef.current) {
          vGuideRef.current.points([snapX, -10000, snapX, 10000]);
          vGuideRef.current.show();
        }
      } else {
        if (vGuideRef.current) vGuideRef.current.hide();
      }

      if (snapY !== null) {
        currentSelectedIds.forEach(sid => {
          const n = stageRef.current?.findOne(`#${sid}`);
          if (n) n.y(n.y() + shiftY);
        });
        if (hGuideRef.current) {
          hGuideRef.current.points([-10000, snapY, 10000, snapY]);
          hGuideRef.current.show();
        }
      } else {
        if (hGuideRef.current) hGuideRef.current.hide();
      }

      // Synchronize HTML DOM element instantly during drag
      currentSelectedIds.forEach(sid => {
        const n = stageRef.current?.findOne(`#${sid}`);
        if (!n) return;
        const htmlEl = document.getElementById(`html-overlay-${sid}`);
        if (htmlEl) {
          htmlEl.style.left = `${n.x() * scale}px`;
          htmlEl.style.top = `${n.y() * scale}px`;
        }
      });
      
      // Update Distance Guides
      const updateDistGuide = (groupRef: React.RefObject<Konva.Group | null>, linePts: number[], textX: number, textY: number, text: string, visible: boolean) => {
        const group = groupRef.current;
        if (!group) return;
        if (visible) {
          group.show();
          const line = group.findOne('Line') as Konva.Line;
          const textNode = group.findOne('Text') as Konva.Text;
          if (line) line.points(linePts);
          if (textNode) {
            textNode.text(text);
            textNode.x(textX);
            textNode.y(textY);
          }
        } else {
          group.hide();
        }
      };

      // We need the updated box after snapping
      const finalBox = {
        minX: groupMinX + shiftX,
        minY: groupMinY + shiftY,
        maxX: groupMaxX + shiftX,
        maxY: groupMaxY + shiftY,
        centerX: groupCenterX + shiftX,
        centerY: groupCenterY + shiftY,
      };
      
      // Top
      if (finalBox.minY > 0) {
        updateDistGuide(distGuideTopRef, [finalBox.centerX, 0, finalBox.centerX, finalBox.minY], finalBox.centerX + 10, finalBox.minY / 2 - 8, `${Math.round(finalBox.minY)} px`, true);
      } else {
        updateDistGuide(distGuideTopRef, [], 0, 0, '', false);
      }
      
      // Bottom
      if (finalBox.maxY < canvasHeight) {
        const dist = canvasHeight - finalBox.maxY;
        updateDistGuide(distGuideBottomRef, [finalBox.centerX, finalBox.maxY, finalBox.centerX, canvasHeight], finalBox.centerX + 10, finalBox.maxY + dist / 2 - 8, `${Math.round(dist)} px`, true);
      } else {
        updateDistGuide(distGuideBottomRef, [], 0, 0, '', false);
      }
      
      // Left
      if (finalBox.minX > 0) {
        updateDistGuide(distGuideLeftRef, [0, finalBox.centerY, finalBox.minX, finalBox.centerY], finalBox.minX / 2 - 20, finalBox.centerY - 20, `${Math.round(finalBox.minX)} px`, true);
      } else {
        updateDistGuide(distGuideLeftRef, [], 0, 0, '', false);
      }
      
      // Right
      if (finalBox.maxX < canvasWidth) {
        const dist = canvasWidth - finalBox.maxX;
        updateDistGuide(distGuideRightRef, [finalBox.maxX, finalBox.centerY, canvasWidth, finalBox.centerY], finalBox.maxX + dist / 2 - 20, finalBox.centerY - 20, `${Math.round(dist)} px`, true);
      } else {
        updateDistGuide(distGuideRightRef, [], 0, 0, '', false);
      }

      if (guidesLayerRef.current) {
        guidesLayerRef.current.batchDraw();
      }
    },
    [elements, canvasWidth, canvasHeight, scale],
  );

  // Drag start — push history
  const handleDragStart = useCallback((id?: string) => {
    pushHistory();
    const newPositions: { [key: string]: { x: number; y: number } } = {};
    const sceneState = useSceneStore.getState();
    const activeScene = sceneState.scenes.find((s) => s.id === sceneState.activeSceneId) || sceneState.scenes[0];
    
    const currentSelectedIds = useEditorStore.getState().selectedElementIds;
    activeScene.elements.forEach((el) => {
      if (currentSelectedIds.includes(el.id) || el.id === id) {
        newPositions[el.id] = { x: el.x, y: el.y };
      }
    });
    dragStartPositions.current = newPositions;
  }, [pushHistory]);

  // Transform end (resize or crop)
  const handleTransformEnd = useCallback(
    (id: string, node: Konva.Node) => {
      if (vGuideRef.current) vGuideRef.current.hide();
      if (hGuideRef.current) hGuideRef.current.hide();
      if (guidesLayerRef.current) guidesLayerRef.current.batchDraw();

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

  // Snapping logic for transform
  const handleTransformBoundBox = useCallback((id: string, oldBox: any, newBox: any, keepRatio: boolean = true) => {
    const SNAP_THRESHOLD = 10 / scale; // Note: SNAP_THRESHOLD in logical pixels
    
    // Convert absolute stage coordinates to logical canvas coordinates
    const lNewX = (newBox.x - offsetX) / scale;
    const lNewY = (newBox.y - offsetY) / scale;
    const lNewW = Math.max(1, newBox.width / scale);
    const lNewH = Math.max(1, newBox.height / scale);

    const lOldX = (oldBox.x - offsetX) / scale;
    const lOldY = (oldBox.y - offsetY) / scale;
    const lOldW = Math.max(1, oldBox.width / scale);
    const lOldH = Math.max(1, oldBox.height / scale);

    // Find all snapping targets for X and Y edges
    const targetsX: number[] = [0, canvasWidth];
    const targetsY: number[] = [0, canvasHeight];

    elements.forEach((other) => {
      if (other.id === id || other.hidden) return;
      const otherBox = getActualBoundingBox(other);
      targetsX.push(otherBox.minX, otherBox.maxX);
      targetsY.push(otherBox.minY, otherBox.maxY);
    });

    // Check which edges are changing
    const isChangingMinX = Math.abs(lNewX - lOldX) > 0.001;
    const isChangingMaxX = Math.abs((lNewX + lNewW) - (lOldX + lOldW)) > 0.001;
    const isChangingMinY = Math.abs(lNewY - lOldY) > 0.001;
    const isChangingMaxY = Math.abs((lNewY + lNewH) - (lOldY + lOldH)) > 0.001;

    // Determine anchors (stationary opposite edge)
    const anchorX = isChangingMinX ? (lOldX + lOldW) : lOldX;
    const anchorY = isChangingMinY ? (lOldY + lOldH) : lOldY;

    let snapX = null;
    let snapY = null;
    let distX = Infinity;
    let distY = Infinity;

    if (isChangingMinX) {
      for (const tx of targetsX) {
        const d = Math.abs(lNewX - tx);
        if (d < SNAP_THRESHOLD && d < distX) { distX = d; snapX = tx; }
      }
    } else if (isChangingMaxX) {
      const maxX = lNewX + lNewW;
      for (const tx of targetsX) {
        const d = Math.abs(maxX - tx);
        if (d < SNAP_THRESHOLD && d < distX) { distX = d; snapX = tx; }
      }
    }

    if (isChangingMinY) {
      for (const ty of targetsY) {
        const d = Math.abs(lNewY - ty);
        if (d < SNAP_THRESHOLD && d < distY) { distY = d; snapY = ty; }
      }
    } else if (isChangingMaxY) {
      const maxY = lNewY + lNewH;
      for (const ty of targetsY) {
        const d = Math.abs(maxY - ty);
        if (d < SNAP_THRESHOLD && d < distY) { distY = d; snapY = ty; }
      }
    }

    let finalW = lNewW;
    let finalH = lNewH;

    if (keepRatio) {
      if (snapX !== null || snapY !== null) {
        let scaleFactor = 1;
        if (snapX !== null && distX <= distY) {
          const targetW = Math.abs(snapX - anchorX);
          scaleFactor = targetW / lNewW;
          snapY = null; // hide Y guide
        } else if (snapY !== null) {
          const targetH = Math.abs(snapY - anchorY);
          scaleFactor = targetH / lNewH;
          snapX = null; // hide X guide
        }
        finalW = lNewW * scaleFactor;
        finalH = lNewH * scaleFactor;
      }
    } else {
      if (snapX !== null) {
        finalW = Math.abs(snapX - anchorX);
      }
      if (snapY !== null) {
        finalH = Math.abs(snapY - anchorY);
      }
    }

    // Minimum size constraint before finalizing X and Y
    if (finalW * scale < 5) finalW = lOldW;
    if (finalH * scale < 5) finalH = lOldH;

    const finalX = isChangingMinX ? (anchorX - finalW) : anchorX;
    const finalY = isChangingMinY ? (anchorY - finalH) : anchorY;

    // Apply back to newBox
    newBox.x = finalX * scale + offsetX;
    newBox.y = finalY * scale + offsetY;
    newBox.width = finalW * scale;
    newBox.height = finalH * scale;

    // Show/hide guides (vGuideRef and hGuideRef are inside a Layer that uses scale/offsetX, so they expect logical coords!)
    if (snapX !== null && vGuideRef.current) {
      vGuideRef.current.points([snapX, -10000, snapX, 10000]);
      vGuideRef.current.show();
    } else if (snapX === null && vGuideRef.current) {
      vGuideRef.current.hide();
    }

    if (snapY !== null && hGuideRef.current) {
      hGuideRef.current.points([-10000, snapY, 10000, snapY]);
      hGuideRef.current.show();
    } else if (snapY === null && hGuideRef.current) {
      hGuideRef.current.hide();
    }

    if (guidesLayerRef.current) guidesLayerRef.current.batchDraw();

    return newBox;
  }, [elements, canvasWidth, canvasHeight, scale, offsetX, offsetY]);

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
                id: 'rotate-0',
                label: 'Reset Rotation (0°)',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, rotateAroundCenter(clickedEl, 0));
                },
              },
              { type: 'separator' },
              {
                type: 'item',
                id: 'rotate-90',
                label: 'Rotate 90° CW',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, rotateAroundCenter(clickedEl, Math.round((clickedEl.rotation + 90) % 360)));
                },
              },
              {
                type: 'item',
                id: 'rotate-180',
                label: 'Rotate 180°',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, rotateAroundCenter(clickedEl, Math.round((clickedEl.rotation + 180) % 360)));
                },
              },
              {
                type: 'item',
                id: 'rotate-270',
                label: 'Rotate 90° CCW',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, rotateAroundCenter(clickedEl, Math.round((clickedEl.rotation + 270) % 360)));
                },
              },
            ],
          },
          {
            type: 'item',
            id: 'center-canvas-submenu',
            label: 'Center on Canvas',
            icon: <LuCrosshair size={12} />,
            submenu: [
              {
                type: 'item',
                id: 'center-both',
                label: 'Both',
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
                id: 'center-horizontal',
                label: 'Horizontally',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, {
                    x: Math.round((canvasWidth - clickedEl.width) / 2),
                  });
                },
              },
              {
                type: 'item',
                id: 'center-vertical',
                label: 'Vertically',
                onClick: () => {
                  pushHistory();
                  updateElement(clickedEl.id, {
                    y: Math.round((canvasHeight - clickedEl.height) / 2),
                  });
                },
              },
            ],
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
              useConfirmStore.getState().showConfirm({
                title: 'Delete Element',
                message: 'Are you sure you want to delete this element?',
                confirmText: 'Delete',
                isDanger: true,
              }).then((confirmed) => {
                if (confirmed) {
                  pushHistory();
                  removeElement(clickedEl.id);
                  selectElement(null);
                }
              });
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
      selectedIds,
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
            transform: `translate(${-(el.cropLeft || 0)}px, ${-(el.cropTop || 0)}px) rotate(${el.rotation}deg) scale(${scale * el.scaleX}, ${scale * el.scaleY})`,
            transformOrigin: `${el.cropLeft || 0}px ${el.cropTop || 0}px`,
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
            const urlStr = browserEl.url?.trim().toLowerCase() || '';
            const isSafeUrl = urlStr.startsWith('http://') || urlStr.startsWith('https://');
            const shouldRenderIframe = hasUrl && isSafeUrl;

            return (
              <div
                id={`html-overlay-${el.id}`}
                key={el.id}
                style={{
                  ...commonStyle,
                  borderRadius: '4px',
                }}
                onMouseDown={handleMouseDown}
              >
                {/* Transparent click catcher to prevent direct iframe interaction during layout */}
                <div className="absolute inset-0 z-10 cursor-pointer" />
                {shouldRenderIframe ? (
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
                id={`html-overlay-${el.id}`}
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
                id={`html-overlay-${el.id}`}
                key={el.id}
                style={{
                  ...commonStyle,
                  width: 'auto',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
        {/* Guides Layer (Rendered below elements so handlers stay on top) */}
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale} ref={guidesLayerRef} listening={false}>
          <Line
            ref={vGuideRef}
            points={[0, -10000, 0, 10000]}
            stroke="#4a9eff"
            strokeWidth={1 / scale}
            dash={[4 / scale, 4 / scale]}
            visible={false}
          />
          <Line
            ref={hGuideRef}
            points={[-10000, 0, 10000, 0]}
            stroke="#4a9eff"
            strokeWidth={1 / scale}
            dash={[4 / scale, 4 / scale]}
            visible={false}
          />
          
          {/* Distance Guides */}
          {[distGuideTopRef, distGuideBottomRef, distGuideLeftRef, distGuideRightRef].map((ref, i) => (
            <Group ref={ref} key={i} visible={false}>
              <Line stroke="#4a9eff" strokeWidth={1.5 / scale} />
              <Text 
                fill="#ffffff" 
                stroke="#000000"
                strokeWidth={2.5 / scale}
                fillAfterStrokeEnabled={true}
                fontSize={12 / scale} 
                fontFamily="monospace" 
                fontStyle="bold" 
                align="center" 
              />
            </Group>
          ))}
        </Layer>

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
            const isSel = selectedIds.includes(el.id);
            return (
              <CanvasElement
                key={el.id}
                element={el}
                isSelected={isSel}
                isSingleSelected={selectedIds.length === 1}
                scale={scale}
                onSelect={(e) => {
                  const isMulti = e.evt.ctrlKey || e.evt.metaKey;
                  const isRange = e.evt.shiftKey;
                  selectElement(el.id, isMulti, isRange, elements);
                }}
                onDragStart={(e) => {
                  const isMulti = e.evt.ctrlKey || e.evt.metaKey;
                  const isRange = e.evt.shiftKey;
                  if (!selectedIds.includes(el.id)) {
                    selectElement(el.id, isMulti, isRange, elements);
                  }
                  handleDragStart(el.id);
                }}
                onDragMove={(e) => handleDragMove(el.id, e)}
                onDragEnd={() => handleDragEnd()}
                onTransformStart={handleDragStart}
                onTransformEnd={(node) => handleTransformEnd(el.id, node)}
                boundBoxFunc={(oldBox, newBox) => handleTransformBoundBox(el.id, oldBox, newBox)}
                onDoubleClick={() => handleDoubleClick(el.id)}
              />
            );
          })}
          
          {/* Multi-select Bounding Box */}
          {selectedIds.length > 1 && (
            <Transformer
              ref={multiTrRef}
              resizeEnabled={false}
              rotateEnabled={false}
              enabledAnchors={[]}
              borderStroke="#4a9eff"
              borderStrokeWidth={1 / scale}
              padding={0}
            />
          )}
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
