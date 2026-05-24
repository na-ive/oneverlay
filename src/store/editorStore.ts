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
  propertiesElementId: string | null;
  openProperties: (id: string) => void;
  closeProperties: () => void;

  // ── Canvas zoom ──
  zoom: number;
  setZoom: (zoom: number) => void;

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
  propertiesElementId: null,
  openProperties: (id) =>
    set({ isPropertiesOpen: true, propertiesElementId: id, selectedElementId: id }),
  closeProperties: () =>
    set({ isPropertiesOpen: false, propertiesElementId: null }),

  // ── Canvas zoom ──
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),

  // ── Bottom dock ──
  bottomDockHeight: DOCK_DEFAULT_HEIGHT,
  setBottomDockHeight: (height) => set({ bottomDockHeight: height }),
}));
