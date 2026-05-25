import { useCallback, useState, useRef, useEffect } from 'react';
import {
  LuPlus,
  LuTrash2,
  LuMonitorPlay,
  LuPencil,
  LuGripVertical,
  LuCopyPlus,
  LuArrowUpToLine,
  LuArrowDownToLine,
  LuArrowUp,
  LuArrowDown,
} from 'react-icons/lu';
import { v4 as uuidv4 } from 'uuid';
import { IconButton } from '../ui/IconButton';
import { useSceneStore } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import { useEditorStore } from '../../store/editorStore';
import { useContextMenuStore } from '../../store/contextMenuStore';
import type { ContextMenuEntry } from '../../store/contextMenuStore';

export function ScenesPanel() {
  const scenes = useSceneStore((s) => s.scenes);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const addScene = useSceneStore((s) => s.addScene);
  const removeScene = useSceneStore((s) => s.removeScene);
  const setActiveScene = useSceneStore((s) => s.setActiveScene);
  const setSceneName = useSceneStore((s) => s.setSceneName);
  const reorderScene = useSceneStore((s) => s.reorderScene);
  const pushHistory = useHistoryStore((s) => s.push);
  const selectElement = useEditorStore((s) => s.selectElement);
  const showMenu = useContextMenuStore((s) => s.show);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleAdd = useCallback(() => {
    pushHistory();
    addScene();
    selectElement(null);
  }, [addScene, pushHistory, selectElement]);

  const handleDelete = useCallback(
    (id: string) => {
      if (scenes.length <= 1) return;
      pushHistory();
      removeScene(id);
      selectElement(null);
    },
    [scenes.length, removeScene, pushHistory, selectElement],
  );

  const handleSelect = useCallback(
    (id: string) => {
      if (id === activeSceneId) return;
      pushHistory();
      setActiveScene(id);
      selectElement(null);
    },
    [activeSceneId, setActiveScene, pushHistory, selectElement],
  );

  const handleStartRename = useCallback((e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentName);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (editingId) {
      if (editValue.trim()) {
        const scene = scenes.find((s) => s.id === editingId);
        if (scene && scene.name !== editValue.trim()) {
          pushHistory();
          setSceneName(editingId, editValue.trim());
        }
      }
      setEditingId(null);
    }
  }, [editingId, editValue, scenes, pushHistory, setSceneName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleFinishRename();
      } else if (e.key === 'Escape') {
        setEditingId(null);
      }
    },
    [handleFinishRename],
  );

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
      reorderScene(dragIndex, targetIndex);
      setDragIndex(null);
    },
    [dragIndex, reorderScene, pushHistory],
  );

  // ── Context Menu Handlers ──

  /** Right-click on the panel background → add scene */
  const handlePanelContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Shift+right-click = native browser context menu
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();

      const items: ContextMenuEntry[] = [
        {
          type: 'item',
          id: 'add-scene',
          label: 'Add Scene',
          icon: <LuPlus size={12} />,
          onClick: handleAdd,
        },
      ];

      showMenu(e.clientX, e.clientY, items);
    },
    [handleAdd, showMenu],
  );

  /** Right-click on a specific scene item */
  const handleSceneContextMenu = useCallback(
    (e: React.MouseEvent, sceneId: string, sceneName: string, index: number) => {
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();

      const canDelete = scenes.length > 1;
      const canMoveUp = index > 0;
      const canMoveDown = index < scenes.length - 1;

      const items: ContextMenuEntry[] = [
        {
          type: 'item',
          id: 'rename',
          label: 'Rename',
          icon: <LuPencil size={12} />,
          onClick: () => {
            setEditingId(sceneId);
            setEditValue(sceneName);
          },
        },
        {
          type: 'item',
          id: 'duplicate',
          label: 'Duplicate',
          icon: <LuCopyPlus size={12} />,
          onClick: () => {
            const snapshot = useSceneStore.getState();
            const original = snapshot.scenes.find((s) => s.id === sceneId);
            if (!original) return;
            pushHistory();
            // Insert duplicated scene after the current one
            const dup = {
              ...original,
              id: uuidv4(),
              name: `${original.name} Copy`,
              updatedAt: Date.now(),
              elements: original.elements.map((el) => ({ ...el })),
            };
            useSceneStore.setState((state) => {
              const newScenes = [...state.scenes];
              newScenes.splice(index + 1, 0, dup);
              return { scenes: newScenes, activeSceneId: dup.id, updatedAt: Date.now() };
            });
            selectElement(null);
          },
        },
        { type: 'separator' },
        {
          type: 'item',
          id: 'move-top',
          label: 'Move to Top',
          icon: <LuArrowUpToLine size={12} />,
          disabled: !canMoveUp,
          onClick: () => {
            pushHistory();
            reorderScene(index, 0);
          },
        },
        {
          type: 'item',
          id: 'move-up',
          label: 'Move Up',
          icon: <LuArrowUp size={12} />,
          disabled: !canMoveUp,
          onClick: () => {
            pushHistory();
            reorderScene(index, index - 1);
          },
        },
        {
          type: 'item',
          id: 'move-down',
          label: 'Move Down',
          icon: <LuArrowDown size={12} />,
          disabled: !canMoveDown,
          onClick: () => {
            pushHistory();
            reorderScene(index, index + 1);
          },
        },
        {
          type: 'item',
          id: 'move-bottom',
          label: 'Move to Bottom',
          icon: <LuArrowDownToLine size={12} />,
          disabled: !canMoveDown,
          onClick: () => {
            pushHistory();
            reorderScene(index, scenes.length - 1);
          },
        },
        { type: 'separator' },
        {
          type: 'item',
          id: 'delete',
          label: 'Delete Scene',
          icon: <LuTrash2 size={12} />,
          danger: true,
          disabled: !canDelete,
          onClick: () => handleDelete(sceneId),
        },
      ];

      showMenu(e.clientX, e.clientY, items);
    },
    [scenes, pushHistory, reorderScene, handleDelete, selectElement, showMenu],
  );

  return (
    <div
      className="flex flex-col h-full border-r border-white/[0.06] bg-bg-secondary/20"
      style={{ minWidth: '220px' }}
      onContextMenu={handlePanelContextMenu}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider pl-1">
          Scenes
        </span>
        <IconButton size="sm" tooltip="Add scene" onClick={handleAdd}>
          <LuPlus size={13} />
        </IconButton>
      </div>

      {/* Scenes list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {scenes.map((scene, index) => {
          const isActive = scene.id === activeSceneId;
          const isEditing = scene.id === editingId;

          return (
            <div
              key={scene.id}
              draggable={!isEditing}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onContextMenu={(e) => handleSceneContextMenu(e, scene.id, scene.name, index)}
              className={`
                flex items-center gap-2 px-2.5 py-1.5 mx-2 my-0.5 rounded-xl
                transition-all duration-200 cursor-pointer group
                ${
                  isActive
                    ? 'bg-accent/12 text-accent shadow-sm shadow-accent/5'
                    : 'hover:bg-white/[0.04] text-text-secondary hover:text-text-primary'
                }
              `}
              onClick={() => handleSelect(scene.id)}
            >
              {/* Drag handle */}
              <div className="drag-handle text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <LuGripVertical size={11} />
              </div>

              <div className="shrink-0 flex items-center justify-center w-4">
                <LuMonitorPlay
                  size={12}
                  className={isActive ? 'text-accent' : 'text-text-muted'}
                />
              </div>

              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-w-0 bg-bg-primary/50 border border-accent rounded-lg px-2 py-0.5 text-xs text-text-primary outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  onDoubleClick={(e) => handleStartRename(e, scene.id, scene.name)}
                  className={`text-xs truncate flex-1 select-none ${
                    isActive ? 'font-semibold text-accent' : 'text-text-primary'
                  }`}
                >
                  {scene.name}
                </span>
              )}

              {/* Actions */}
              <div
                className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 gap-0.5`}
              >
                {!isEditing && (
                  <IconButton
                    size="sm"
                    tooltip="Rename"
                    tooltipPlacement="left"
                    onClick={(e) => handleStartRename(e, scene.id, scene.name)}
                  >
                    <LuPencil size={11} />
                  </IconButton>
                )}
                {!isEditing && scenes.length > 1 && (
                  <IconButton
                    size="sm"
                    variant="danger"
                    tooltip="Delete"
                    tooltipPlacement="left"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(scene.id);
                    }}
                  >
                    <LuTrash2 size={11} />
                  </IconButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
