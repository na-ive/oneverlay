import { create } from 'zustand';

export interface ContextMenuItem {
  type: 'item';
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface ContextMenuSeparator {
  type: 'separator';
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuEntry[];
  show: (x: number, y: number, items: ContextMenuEntry[]) => void;
  hide: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  open: false,
  x: 0,
  y: 0,
  items: [],

  show: (x, y, items) => set({ open: true, x, y, items }),
  hide: () => set({ open: false, items: [] }),
}));
