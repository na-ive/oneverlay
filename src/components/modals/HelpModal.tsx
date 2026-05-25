import { useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { useEditorStore } from '../../store/editorStore';

interface ShortcutItem {
  keys: string[];
  label: string;
  hold?: boolean;
  combo?: boolean;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export function HelpModal() {
  const isOpen = useEditorStore((s) => s.isHelpOpen);
  const setOpen = useEditorStore((s) => s.setHelpOpen);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Tools',
      items: [
        { keys: ['V'], label: 'Select Tool' },
        { keys: ['H'], label: 'Hand / Pan Tool' },
        { keys: ['Space'], label: 'Pan Tool (Hold)', hold: true },
      ],
    },
    {
      title: 'Canvas & Selection',
      items: [
        { keys: ['Esc'], label: 'Deselect Element' },
        { keys: ['Del', 'Backspace'], label: 'Delete Selected Element' },
        { keys: ['Arrows'], label: 'Nudge Element by 1px' },
        { keys: ['Shift', 'Arrows'], label: 'Nudge Element by 10px', combo: true },
        { keys: ['Ctrl', 'Mouse'], label: 'Crop Element', combo: true },
        { keys: ['Shift', 'Mouse'], label: 'Stretch Element', combo: true },
      ],
    },
    {
      title: 'History',
      items: [
        { keys: ['Ctrl', 'Z'], label: 'Undo', combo: true },
        { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo', combo: true },
        { keys: ['Ctrl', 'Y'], label: 'Redo (Alternative)', combo: true },
      ],
    },
  ];

  return (
    <Modal open={isOpen} onClose={handleClose} title="Keyboard Shortcuts" width="480px">
      <div className="space-y-6">
        {shortcutGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider pl-1">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-xs text-text-secondary font-medium">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((key, keyIdx) => (
                      <span key={key} className="flex items-center gap-1">
                        {keyIdx > 0 && !item.combo && (
                          <span className="text-[10px] text-text-muted">or</span>
                        )}
                        {keyIdx > 0 && item.combo && (
                          <span className="text-[10px] text-text-muted">+</span>
                        )}
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-text-primary bg-white/[0.08] border border-white/[0.12] rounded-md shadow-sm">
                          {key}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
