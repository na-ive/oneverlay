import { useEffect, useCallback, useRef } from 'react';
import { Navbar } from './Navbar';
import { BottomDock } from './BottomDock';
import { CanvasEditor } from '../canvas/CanvasEditor';
import { ElementsPanel } from '../panels/ElementsPanel';
import { ScenesPanel } from '../panels/ScenesPanel';
import { CanvasPanel } from '../panels/CanvasPanel';
import { ActionsPanel } from '../panels/ActionsPanel';
import { SettingsModal } from '../modals/SettingsModal';
import { PropertiesModal } from '../modals/PropertiesModal';
import { ContextMenu } from '../ui/ContextMenu';
import { usePersistence } from '../../hooks/usePersistence';
import { useHistoryStore } from '../../store/historyStore';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore } from '../../store/sceneStore';

export function EditorLayout() {
  usePersistence();

  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const removeElement = useSceneStore((s) => s.removeElement);
  const pushHistory = useHistoryStore((s) => s.push);

  const previousToolModeRef = useRef<'select' | 'hand'>('select');
  const isSpacePressedRef = useRef(false);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // Undo
      if (isCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo
      if (isCtrl && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }

      // Tool switches: V and H
      if (!isCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setToolMode('select');
      }
      if (!isCtrl && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setToolMode('hand');
      }

      // Spacebar hold
      if (e.key === ' ' || e.code === 'Space') {
        if (e.repeat) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        // Record current tool mode so we can restore it on keyup
        previousToolModeRef.current = useEditorStore.getState().toolMode;
        isSpacePressedRef.current = true;
        setToolMode('hand');
      }

      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        pushHistory();
        removeElement(selectedId);
        selectElement(null);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        selectElement(null);
      }
    },
    [undo, redo, selectedId, removeElement, selectElement, pushHistory, setToolMode],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        if (isSpacePressedRef.current) {
          isSpacePressedRef.current = false;
          setToolMode(previousToolModeRef.current);
        }
      }
    },
    [setToolMode],
  );

  useEffect(() => {
    const handleBlur = () => {
      if (isSpacePressedRef.current) {
        isSpacePressedRef.current = false;
        setToolMode(previousToolModeRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, setToolMode]);

  // Globally suppress the native browser context menu.
  // Shift+right-click is the escape hatch to access the browser's native menu.
  useEffect(() => {
    const suppress = (e: MouseEvent) => {
      if (!e.shiftKey) e.preventDefault();
    };
    document.addEventListener('contextmenu', suppress);
    return () => document.removeEventListener('contextmenu', suppress);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Navbar />

      <CanvasEditor />

      <BottomDock
        left={
          <div className="flex flex-1 min-w-0 h-full">
            <ScenesPanel />
            <div className="flex-1 flex flex-col min-w-0">
              <ElementsPanel />
            </div>
          </div>
        }
        center={<CanvasPanel />}
        right={<ActionsPanel />}
      />

      <SettingsModal />
      <PropertiesModal />
      <ContextMenu />
    </div>
  );
}
