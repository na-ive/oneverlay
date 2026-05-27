import { Modal } from '../ui/Modal';
import { LuTriangleAlert, LuInfo } from 'react-icons/lu';
import { useConfirmStore } from '../../store/confirmStore';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isAlert?: boolean;
}

export function ConfirmModal() {
  const { open, options, onConfirm, onCancel } = useConfirmStore();

  if (!options) return null;

  return (
    <Modal open={open} onClose={onCancel} title={options.title} width="400px">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${options.isDanger ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
            {options.isDanger ? <LuTriangleAlert size={18} /> : <LuInfo size={18} />}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {options.message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.06]">
          {!options.isAlert && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-white/[0.08] bg-transparent hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
            >
              {options.cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              options.isDanger
                ? 'border-danger/30 bg-danger/10 hover:bg-danger/20 text-danger'
                : 'border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent'
            }`}
          >
            {options.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
