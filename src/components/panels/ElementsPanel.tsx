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
import { useSceneStore } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import type { ElementType, OverlayElement } from '../../types/elements';

const TYPE_ICONS: Record<ElementType, typeof LuType> = {
  text: LuType,
  image: LuImage,
  browser: LuGlobe,
};

export function ElementsPanel() {
  const elements = useSceneStore((s) => s.elements);
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
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border shrink-0">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
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
              className="absolute bottom-full right-0 mb-1 rounded-md border border-border shadow-lg py-1 z-50 min-w-[140px]"
              style={{ backgroundColor: 'var(--color-bg-elevated)' }}
            >
              {(['text', 'image', 'browser'] as ElementType[]).map((type) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleAdd(type)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border-none bg-transparent text-left capitalize"
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
      <div className="flex-1 overflow-y-auto min-h-0">
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
        flex items-center gap-1 px-1 py-0.5 border-b border-border/50
        transition-colors cursor-pointer group
        ${isSelected ? 'bg-accent/10' : 'hover:bg-bg-hover/50'}
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
          <LuEye size={12} />
        )}
      </IconButton>

      {/* Type icon + name */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <Icon size={12} className="text-text-secondary shrink-0" />
        <span
          className={`text-xs truncate ${
            element.hidden ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {element.name}
        </span>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
