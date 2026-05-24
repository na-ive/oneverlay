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
} from 'react-icons/lu';
import { IconButton } from '../ui/IconButton';
import { useSceneStore, selectElements } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import type { ElementType, OverlayElement } from '../../types/elements';

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
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const openProperties = useEditorStore((s) => s.openProperties);
  const pushHistory = useHistoryStore((s) => s.push);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleAdd = useCallback(
    (type: ElementType) => {
      pushHistory();
      addElement(type);
      setShowAddMenu(false);
    },
    [addElement, pushHistory],
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

  // Reversed for display (top = highest z-index)
  const displayElements = [...elements].reverse();

  return (
    <div className="flex flex-col h-full bg-bg-secondary/10">
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
