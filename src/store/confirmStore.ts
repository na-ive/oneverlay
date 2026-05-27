import { create } from 'zustand';
import type { ConfirmModalOptions } from '../components/modals/ConfirmModal';

interface ConfirmState {
  open: boolean;
  options: ConfirmModalOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
  showConfirm: (options: ConfirmModalOptions) => Promise<boolean>;
  showAlert: (options: Omit<ConfirmModalOptions, 'isAlert'>) => Promise<void>;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  options: null,
  onConfirm: () => {},
  onCancel: () => {},
  showConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        open: true,
        options,
        onConfirm: () => {
          set({ open: false });
          resolve(true);
        },
        onCancel: () => {
          set({ open: false });
          resolve(false);
        },
      });
    });
  },
  showAlert: (options) => {
    return new Promise<void>((resolve) => {
      set({
        open: true,
        options: { ...options, isAlert: true },
        onConfirm: () => {
          set({ open: false });
          resolve();
        },
        onCancel: () => {
          set({ open: false });
          resolve();
        },
      });
    });
  },
}));
