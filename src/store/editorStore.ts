import { create } from 'zustand';
import { DOCK_DEFAULT_HEIGHT } from '../lib/constants';

interface EditorState {
  // ── Selection ──
  selectedElementId: string | null;
  selectElement: (id: string | null) => void;

  // ── Modals ──
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  isPropertiesOpen: boolean;
  setPropertiesOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  propertiesElementId: string | null;
  openProperties: (id: string) => void;
  closeProperties: () => void;

  // ── Canvas zoom ──
  zoom: number;
  setZoom: (zoom: number) => void;
  panX: number;
  panY: number;
  setPan: (panX: number, panY: number) => void;
  resetPan: () => void;

  // ── Tool Mode ──
  toolMode: 'select' | 'hand';
  setToolMode: (mode: 'select' | 'hand') => void;

  // ── Bottom dock ──
  bottomDockHeight: number;
  setBottomDockHeight: (height: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // ── Selection ──
  selectedElementId: null,
  selectElement: (id) => set({ selectedElementId: id }),

  // ── Modals ──
  isSettingsOpen: false,
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isPropertiesOpen: false,
  setPropertiesOpen: (open) => set({ isPropertiesOpen: open }),
  isHelpOpen: false,
  setHelpOpen: (open) => set({ isHelpOpen: open }),
  isOnboardingOpen: false,
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
  propertiesElementId: null,
  openProperties: (id) =>
    set({ isPropertiesOpen: true, propertiesElementId: id, selectedElementId: id }),
  closeProperties: () =>
    set({ isPropertiesOpen: false, propertiesElementId: null }),

  // ── Canvas zoom ──
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  panX: 0,
  panY: 0,
  setPan: (panX, panY) => set({ panX, panY }),
  resetPan: () => set({ panX: 0, panY: 0 }),

  // ── Tool Mode ──
  toolMode: 'select',
  setToolMode: (toolMode) => set({ toolMode }),

  // ── Bottom dock ──
  bottomDockHeight: DOCK_DEFAULT_HEIGHT,
  setBottomDockHeight: (height) => set({ bottomDockHeight: height }),
}));
