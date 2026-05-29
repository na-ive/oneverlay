import { create } from 'zustand';
import { DOCK_DEFAULT_HEIGHT } from '../lib/constants';
import type { ElementType, OverlayElement } from '../types/elements';

interface EditorState {
  // ── Selection ──
  selectedElementIds: string[];
  selectElement: (id: string | null, multi?: boolean, shift?: boolean, elements?: OverlayElement[]) => void;

  // ── Modals ──
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  isPropertiesOpen: boolean;
  setPropertiesOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  isAddElementOpen: boolean;
  addElementType: ElementType | null;
  openAddElementModal: (type: ElementType) => void;
  closeAddElementModal: () => void;
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

export const useEditorStore = create<EditorState>((set, get) => ({
  // ── Selection ──
  selectedElementIds: [],
  selectElement: (id, multi, shift, elements) => {
    const current = get().selectedElementIds;
    if (id === null) {
      set({ selectedElementIds: [] });
      return;
    }
    
    if (shift && elements && current.length > 0) {
      const lastSelected = current[current.length - 1];
      const idx1 = elements.findIndex((e) => e.id === lastSelected);
      const idx2 = elements.findIndex((e) => e.id === id);
      
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const newSelection = elements.slice(start, end + 1).map((e) => e.id);
        
        // combine with current, preserving order/unique
        const combined = Array.from(new Set([...current, ...newSelection]));
        set({ selectedElementIds: combined });
        return;
      }
    }
    
    if (multi) {
      if (current.includes(id)) {
        set({ selectedElementIds: current.filter((i) => i !== id) });
      } else {
        set({ selectedElementIds: [...current, id] });
      }
      return;
    }
    
    set({ selectedElementIds: [id] });
  },

  // ── Modals ──
  isSettingsOpen: false,
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isPropertiesOpen: false,
  setPropertiesOpen: (open) => set({ isPropertiesOpen: open }),
  isHelpOpen: false,
  setHelpOpen: (open) => set({ isHelpOpen: open }),
  isOnboardingOpen: false,
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
  isAddElementOpen: false,
  addElementType: null,
  openAddElementModal: (type) => set({ isAddElementOpen: true, addElementType: type }),
  closeAddElementModal: () => set({ isAddElementOpen: false, addElementType: null }),
  propertiesElementId: null,
  openProperties: (id) =>
    set({ isPropertiesOpen: true, propertiesElementId: id, selectedElementIds: [id] }),
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
