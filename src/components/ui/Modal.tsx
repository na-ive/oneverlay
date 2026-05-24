import { useRef, useEffect, useCallback, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = '480px' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      className="rounded-3xl"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      style={{ maxWidth: '95vw', backgroundColor: 'transparent' }}
    >
      <div
        className="rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
        style={{
          width,
          backgroundColor: 'rgba(24, 24, 27, 0.92)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.06]"
          style={{ backgroundColor: 'rgba(32, 32, 36, 0.4)' }}
        >
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider m-0">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/[0.08] hover:scale-105 active:scale-95 transition-all cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-7">{children}</div>
      </div>
    </dialog>
  );
}
