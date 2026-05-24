import { useCallback, useState, useRef, useEffect } from 'react';
import { LuPlus, LuTrash2, LuMonitorPlay, LuPencil, LuGripVertical } from 'react-icons/lu';
import { IconButton } from '../ui/IconButton';
import { useSceneStore } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import { useEditorStore } from '../../store/editorStore';

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
      if (scenes.length <= 1) return; // cannot delete last scene
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

  return (
    <div className="flex flex-col h-full border-r border-border" style={{ minWidth: '220px' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border shrink-0">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Scenes
        </span>
        <IconButton size="sm" tooltip="Add scene" onClick={handleAdd}>
          <LuPlus size={13} />
        </IconButton>
      </div>

      {/* Scenes list */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
              className={`
                flex items-center gap-2 px-1 py-1.5 border-b border-border/50
                transition-colors cursor-pointer group
                ${
                  isActive
                    ? 'bg-accent/10 border-l-2 border-l-accent'
                    : 'hover:bg-bg-hover/50 border-l-2 border-l-transparent'
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
                  className="flex-1 min-w-0 bg-bg-primary border border-accent rounded px-1 py-0.5 text-xs text-text-primary outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  onDoubleClick={(e) => handleStartRename(e, scene.id, scene.name)}
                  className={`text-xs truncate flex-1 select-none ${
                    isActive ? 'text-accent font-medium' : 'text-text-primary'
                  }`}
                >
                  {scene.name}
                </span>
              )}

              {/* Actions */}
              <div
                className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-1`}
              >
                {!isEditing && (
                  <IconButton
                    size="sm"
                    tooltip="Rename"
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
