import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useContextMenuStore } from '../../store/contextMenuStore';
import type { ContextMenuEntry } from '../../store/contextMenuStore';

export function ContextMenu() {
  const open = useContextMenuStore((s) => s.open);
  const x = useContextMenuStore((s) => s.x);
  const y = useContextMenuStore((s) => s.y);
  const items = useContextMenuStore((s) => s.items);
  const hide = useContextMenuStore((s) => s.hide);

  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, visible: false });

  // State synchronization when menu coordinates or open status change
  const [lastOpen, setLastOpen] = useState(open);
  const [lastX, setLastX] = useState(x);
  const [lastY, setLastY] = useState(y);

  if (open !== lastOpen || x !== lastX || y !== lastY) {
    setLastOpen(open);
    setLastX(x);
    setLastY(y);
    setPos({ left: x, top: y, visible: false });
  }

  // Close on outside click, scroll, Escape
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      hide();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };

    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, { capture: true });
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('keydown', onKey);
    };
  }, [open, hide]);

  // Measure and position menu to flip/clamp so it is fully visible
  useLayoutEffect(() => {
    if (!open || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x;
    let top = y;

    // Flip upward if menu goes below bottom boundary
    if (top + rect.height > vh - 8) {
      top = y - rect.height;
    }
    // Flip leftward if menu goes past right boundary
    if (left + rect.width > vw - 8) {
      left = x - rect.width;
    }

    // Safeguard clamping
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    if (left + rect.width > vw - 8) left = vw - rect.width - 8;
    if (top + rect.height > vh - 8) top = vh - rect.height - 8;

    setPos({ left, top, visible: true });
  }, [open, x, y, items]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="context-menu-root fixed z-[9999] min-w-[180px] max-w-[260px] py-1.5 rounded-2xl border border-white/[0.10] shadow-[0_16px_48px_rgba(0,0,0,0.65)] backdrop-blur-2xl select-none"
      style={{
        left: pos.left,
        top: pos.top,
        visibility: pos.visible ? 'visible' : 'hidden',
        backgroundColor: 'rgba(22, 22, 26, 0.95)',
        animation: pos.visible ? 'ctxFadeIn 0.1s ease-out' : 'none',
      }}
    >
      {items.map((entry, idx) => {
        if (entry.type === 'separator') {
          return (
            <div
              key={idx}
              className="my-1 mx-2 border-t border-white/[0.07]"
            />
          );
        }

        return (
          <button
            key={entry.id}
            disabled={entry.disabled}
            onClick={() => {
              hide();
              entry.onClick();
            }}
            className={`
              w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium
              transition-all duration-100 cursor-pointer border-none bg-transparent text-left
              rounded-lg mx-1 my-0.5
              ${entry.disabled
                ? 'text-text-muted cursor-not-allowed opacity-50'
                : entry.danger
                  ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
                  : 'text-text-primary hover:bg-white/[0.07] hover:text-white'
              }
            `}
            style={{ width: 'calc(100% - 8px)' }}
          >
            {entry.icon && (
              <span className="shrink-0 opacity-70 w-3.5 flex items-center justify-center">
                {entry.icon}
              </span>
            )}
            <span className="flex-1 truncate">{entry.label}</span>
            {entry.shortcut && (
              <span className="text-[10px] text-text-muted shrink-0 ml-2">
                {entry.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
