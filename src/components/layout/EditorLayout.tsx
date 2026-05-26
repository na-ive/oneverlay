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
import { HelpModal } from '../modals/HelpModal';
import { OnboardingModal } from '../modals/OnboardingModal';
import { AddElementModal } from '../modals/AddElementModal';
import { ContextMenu } from '../ui/ContextMenu';
import { usePersistence } from '../../hooks/usePersistence';
import { useHistoryStore } from '../../store/historyStore';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore } from '../../store/sceneStore';
import { SECRET_KEY_STORAGE_KEY } from '../../lib/api';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Link } from 'react-router-dom';
import { LuMonitor, LuArrowLeft } from 'react-icons/lu';


export function EditorLayout() {
  usePersistence();
  const { isDesktop } = useWindowSize();

  const setOnboardingOpen = useEditorStore((s) => s.setOnboardingOpen);

  // Dynamic page scroll locking (prevents scrollbars on workspace view)
  useEffect(() => {
    document.title = 'Oneverlay - Editor';
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  // First-run detection: show onboarding if no secret key is stored
  useEffect(() => {
    const hasKey = !!localStorage.getItem(SECRET_KEY_STORAGE_KEY);
    if (!hasKey) {
      setOnboardingOpen(true);
    }
  }, [setOnboardingOpen]);

  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const removeElement = useSceneStore((s) => s.removeElement);
  const pushHistory = useHistoryStore((s) => s.push);

  const previousToolModeRef = useRef<'select' | 'hand'>('select');
  const isSpacePressedRef = useRef(false);
  const isNudgingRef = useRef(false);
  const nudgeTimeoutRef = useRef<any>(null);

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

      // Arrow keys nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const activeId = useEditorStore.getState().selectedElementId;
        if (!activeId) return;

        const sceneState = useSceneStore.getState();
        const activeScene = sceneState.scenes.find((s) => s.id === sceneState.activeSceneId) || sceneState.scenes[0];
        const element = activeScene.elements.find((el) => el.id === activeId);
        if (!element || element.locked) return;

        e.preventDefault();

        // Start nudge session if not active (saves state for single Undo step)
        if (!isNudgingRef.current) {
          pushHistory();
          isNudgingRef.current = true;
        }

        // Clear existing end-session timeout
        if (nudgeTimeoutRef.current) {
          clearTimeout(nudgeTimeoutRef.current);
        }

        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;

        sceneState.updateElement(activeId, {
          x: element.x + dx,
          y: element.y + dy,
        });
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

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (nudgeTimeoutRef.current) {
          clearTimeout(nudgeTimeoutRef.current);
        }
        nudgeTimeoutRef.current = setTimeout(() => {
          isNudgingRef.current = false;
        }, 600);
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
      isNudgingRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
      }
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

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 relative">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        {/* Modal style container without header */}
        <div
          className="rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl animate-slide-up text-left"
          style={{
            width: 'min(480px, 92vw)',
            backgroundColor: 'rgba(24, 24, 27, 0.92)',
          }}
        >
          {/* Body */}
          <div className="p-10 md:p-12 flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <LuMonitor size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-text-primary uppercase tracking-wide">
              Desktop Only Workspace
            </h3>
            
            <p className="text-text-secondary leading-relaxed text-sm md:text-base max-w-sm">
              Oneverlay Editor is designed for desktop workflows. Please open the editor on a desktop device for the best experience.
            </p>
            
            <div className="w-full h-[1px] bg-white/[0.04] my-1" />
            
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-text-primary text-sm md:text-base font-bold transition-all border border-white/[0.06] cursor-pointer"
            >
              <LuArrowLeft size={18} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      <HelpModal />
      <OnboardingModal />
      <AddElementModal />
      <ContextMenu />
    </div>
  );
}
