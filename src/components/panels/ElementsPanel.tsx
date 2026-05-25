import { useCallback, useState } from 'react';
import {
  LuPlus,
  LuEye,
  LuEyeOff,
  LuTrash2,
  LuType,
  LuImage,
  LuGlobe,
  LuGripVertical,
  LuSettings2,
  LuCopyPlus,
  LuArrowUpToLine,
  LuArrowDownToLine,
  LuArrowUp,
  LuArrowDown,
  LuCrosshair,
  LuRotateCw,
  LuRefreshCw,
} from 'react-icons/lu';
import { v4 as uuidv4 } from 'uuid';
import { IconButton } from '../ui/IconButton';
import { useSceneStore, selectElements } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { useContextMenuStore } from '../../store/contextMenuStore';
import { createElement } from '../../lib/defaults';
import type { ElementType, OverlayElement } from '../../types/elements';
import type { ContextMenuEntry } from '../../store/contextMenuStore';

const TYPE_ICONS: Record<ElementType, typeof LuType> = {
  text: LuType,
  image: LuImage,
  browser: LuGlobe,
};

export function ElementsPanel() {
  const elements = useSceneStore(selectElements);
  const addElement = useSceneStore((s) => s.addElement);
  const removeElement = useSceneStore((s) => s.removeElement);
  const toggleVisibility = useSceneStore((s) => s.toggleVisibility);
  const reorderElement = useSceneStore((s) => s.reorderElement);
  const duplicateElement = useSceneStore((s) => s.duplicateElement);
  const updateElement = useSceneStore((s) => s.updateElement);
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const openProperties = useEditorStore((s) => s.openProperties);
  const pushHistory = useHistoryStore((s) => s.push);
  const showMenu = useContextMenuStore((s) => s.show);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Display order is reversed (top = highest z-index)
  const displayElements = [...elements].reverse();

  const handleAdd = useCallback(
    (type: ElementType) => {
      pushHistory();
      addElement(type);
      setShowAddMenu(false);

      // Auto-select and open properties for the newly added element
      const updatedElements = selectElements(useSceneStore.getState());
      const newElement = updatedElements[updatedElements.length - 1];
      if (newElement) {
        selectElement(newElement.id);
        openProperties(newElement.id);
      }
    },
    [addElement, selectElement, openProperties, pushHistory],
  );

  const handleDelete = useCallback(
    (id: string) => {
      pushHistory();
      removeElement(id);
      if (selectedId === id) selectElement(null);
    },
    [removeElement, selectedId, selectElement, pushHistory],
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      pushHistory();
      toggleVisibility(id);
    },
    [toggleVisibility, pushHistory],
  );

  // Drag reorder handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragIndex === null || dragIndex === targetIndex) return;
      pushHistory();
      reorderElement(dragIndex, targetIndex);
      setDragIndex(null);
    },
    [dragIndex, reorderElement, pushHistory],
  );

  // ── Context Menu Handlers ──

  /** Right-click on blank panel area → add element submenu */
  const handlePanelContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();

      const items: ContextMenuEntry[] = [
        {
          type: 'item',
          id: 'add-text',
          label: 'Add Text',
          icon: <LuType size={12} />,
          onClick: () => handleAdd('text'),
        },
        {
          type: 'item',
          id: 'add-image',
          label: 'Add Image',
          icon: <LuImage size={12} />,
          onClick: () => handleAdd('image'),
        },
        {
          type: 'item',
          id: 'add-browser',
          label: 'Add Browser Source',
          icon: <LuGlobe size={12} />,
          onClick: () => handleAdd('browser'),
        },
      ];

      showMenu(e.clientX, e.clientY, items);
    },
    [handleAdd, showMenu],
  );

  /** Right-click on a specific element row */
  const handleElementContextMenu = useCallback(
    (e: React.MouseEvent, el: OverlayElement, displayIdx: number) => {
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();

      // realIndex in the underlying (non-reversed) array
      const realIndex = elements.length - 1 - displayIdx;
      const canMoveUp = realIndex < elements.length - 1; // higher z-index
      const canMoveDown = realIndex > 0; // lower z-index

      const items: ContextMenuEntry[] = [
        {
          type: 'item',
          id: 'properties',
          label: 'Properties',
          icon: <LuSettings2 size={12} />,
          onClick: () => openProperties(el.id),
        },
        {
          type: 'item',
          id: 'duplicate',
          label: 'Duplicate',
          icon: <LuCopyPlus size={12} />,
          onClick: () => {
            pushHistory();
            duplicateElement(el.id);
          },
        },
        {
          type: 'item',
          id: 'toggle-visibility',
          label: el.hidden ? 'Show' : 'Hide',
          icon: el.hidden ? <LuEye size={12} /> : <LuEyeOff size={12} />,
          onClick: () => handleToggleVisibility(el.id),
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
            reorderElement(realIndex, elements.length - 1);
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
            reorderElement(realIndex, realIndex + 1);
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
            reorderElement(realIndex, realIndex - 1);
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
            reorderElement(realIndex, 0);
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
                updateElement(el.id, {
                  rotation: Math.round((el.rotation + 90) % 360),
                });
              },
            },
            {
              type: 'item',
              id: 'rotate-180',
              label: 'Rotate 180°',
              onClick: () => {
                pushHistory();
                updateElement(el.id, {
                  rotation: Math.round((el.rotation + 180) % 360),
                });
              },
            },
            {
              type: 'item',
              id: 'rotate-270',
              label: 'Rotate 90° CCW',
              onClick: () => {
                pushHistory();
                updateElement(el.id, {
                  rotation: Math.round((el.rotation + 270) % 360),
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
            const state = useSceneStore.getState();
            const activeScene = state.scenes.find((s) => s.id === state.activeSceneId) || state.scenes[0];
            const canvas = activeScene.canvas;
            pushHistory();
            updateElement(el.id, {
              x: Math.round((canvas.width - el.width) / 2),
              y: Math.round((canvas.height - el.height) / 2),
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
            const defaultEl = createElement(el.type);
            updateElement(el.id, {
              ...defaultEl,
              id: el.id,
              name: el.name,
              zIndex: el.zIndex,
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
          onClick: () => handleDelete(el.id),
        },
      ];

      showMenu(e.clientX, e.clientY, items);
    },
    [
      elements,
      openProperties,
      duplicateElement,
      handleToggleVisibility,
      reorderElement,
      updateElement,
      handleDelete,
      pushHistory,
      showMenu,
    ],
  );

  return (
    <div
      className="flex flex-col h-full bg-bg-secondary/10"
      onContextMenu={handlePanelContextMenu}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider pl-1">
          Elements
        </span>
        <div className="relative">
          <IconButton
            size="sm"
            tooltip="Add element"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            <LuPlus size={13} />
          </IconButton>

          {/* Add menu dropdown */}
          {showAddMenu && (
            <div
              className="absolute bottom-full right-0 mb-2 rounded-2xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl py-1.5 z-50 min-w-[140px]"
              style={{ backgroundColor: 'rgba(32, 32, 36, 0.85)' }}
            >
              {(['text', 'image', 'browser'] as ElementType[]).map((type) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleAdd(type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-all cursor-pointer border-none bg-transparent text-left capitalize"
                  >
                    <Icon size={13} className="text-text-secondary" />
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Elements list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {displayElements.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[11px] text-text-muted">No elements yet</p>
          </div>
        )}

        {displayElements.map((el, displayIdx) => {
          const realIndex = elements.length - 1 - displayIdx;
          return (
            <ElementRow
              key={el.id}
              element={el}
              index={realIndex}
              isSelected={selectedId === el.id}
              onSelect={() => selectElement(el.id)}
              onToggleVisibility={() => handleToggleVisibility(el.id)}
              onDelete={() => handleDelete(el.id)}
              onOpenProperties={() => openProperties(el.id)}
              onDragStart={() => handleDragStart(realIndex)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(realIndex)}
              onContextMenu={(e) => handleElementContextMenu(e, el, displayIdx)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Element Row ──

interface ElementRowProps {
  element: OverlayElement;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onOpenProperties: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function ElementRow({
  element,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
  onOpenProperties,
  onDragStart,
  onDragOver,
  onDrop,
  onContextMenu,
}: ElementRowProps) {
  const Icon = TYPE_ICONS[element.type];

  return (
    <div
      className={`
        flex items-center gap-1 px-2.5 py-1.5 mx-2 my-0.5 rounded-xl
        transition-all duration-200 cursor-pointer group
        ${
          isSelected
            ? 'bg-accent/12 text-accent shadow-sm shadow-accent/5'
            : 'hover:bg-white/[0.04] text-text-secondary hover:text-text-primary'
        }
      `}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag handle */}
      <div className="drag-handle text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <LuGripVertical size={11} />
      </div>

      {/* Visibility */}
      <IconButton
        size="sm"
        tooltip={element.hidden ? 'Show' : 'Hide'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
      >
        {element.hidden ? (
          <LuEyeOff size={12} className="text-text-muted" />
        ) : (
          <LuEye size={12} className={isSelected ? 'text-accent' : ''} />
        )}
      </IconButton>

      {/* Type icon + name */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-1">
        <Icon size={12} className={`shrink-0 ${isSelected ? 'text-accent' : 'text-text-secondary'}`} />
        <span
          className={`text-xs truncate ${
            element.hidden
              ? 'text-text-muted line-through'
              : isSelected
              ? 'font-semibold text-accent'
              : 'text-text-primary'
          }`}
        >
          {element.name}
        </span>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <IconButton
          size="sm"
          tooltip="Properties"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProperties();
          }}
        >
          <LuSettings2 size={11} />
        </IconButton>
        <IconButton
          size="sm"
          variant="danger"
          tooltip="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <LuTrash2 size={11} />
        </IconButton>
      </div>
    </div>
  );
}
