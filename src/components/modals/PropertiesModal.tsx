import { useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { NumberInput } from '../ui/NumberInput';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore, selectElements } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import type { OverlayElement, TextElement, ImageElement, BrowserElement } from '../../types/elements';

export function PropertiesModal() {
  const isOpen = useEditorStore((s) => s.isPropertiesOpen);
  const elementId = useEditorStore((s) => s.propertiesElementId);
  const closeProperties = useEditorStore((s) => s.closeProperties);
  const elements = useSceneStore(selectElements);
  const updateElement = useSceneStore((s) => s.updateElement);
  const pushHistory = useHistoryStore((s) => s.push);

  const element = elements.find((el) => el.id === elementId) || null;

  const handleUpdate = useCallback(
    (updates: Partial<OverlayElement>) => {
      if (!elementId) return;
      pushHistory();
      updateElement(elementId, updates);
    },
    [elementId, updateElement, pushHistory],
  );

  if (!element) return null;

  return (
    <Modal
      open={isOpen}
      onClose={closeProperties}
      title={`${element.name} — Properties`}
      width="540px"
    >
      <div className="space-y-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Name
          </label>
          <input
            type="text"
            value={element.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
          />
        </div>

        {/* Transform */}
        <div>
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide mb-1.5 block pl-1">
            Transform
          </label>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={element.x} onChange={(v) => handleUpdate({ x: v })} />
            <NumberInput label="Y" value={element.y} onChange={(v) => handleUpdate({ y: v })} />
            <NumberInput
              label="Width"
              value={element.width}
              onChange={(v) => handleUpdate({ width: v })}
              min={1}
            />
            <NumberInput
              label="Height"
              value={element.height}
              onChange={(v) => handleUpdate({ height: v })}
              min={1}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <NumberInput
              label="Rotation"
              value={element.rotation}
              onChange={(v) => handleUpdate({ rotation: v })}
              min={0}
              max={360}
              suffix="°"
            />
            <NumberInput
              label="Opacity"
              value={Math.round(element.opacity * 100)}
              onChange={(v) => handleUpdate({ opacity: v / 100 })}
              min={0}
              max={100}
              suffix="%"
            />
          </div>
        </div>

        {/* Type-specific properties */}
        {element.type === 'text' && (
          <TextProperties element={element} onUpdate={handleUpdate} />
        )}
        {element.type === 'image' && (
          <ImageProperties element={element} onUpdate={handleUpdate} />
        )}
        {element.type === 'browser' && (
          <BrowserProperties element={element} onUpdate={handleUpdate} />
        )}
      </div>
    </Modal>
  );
}

// ── Type-specific property editors ──

function TextProperties({
  element,
  onUpdate,
}: {
  element: TextElement;
  onUpdate: (updates: Partial<TextElement>) => void;
}) {
  return (
    <div className="space-y-3 pt-3 border-t border-white/[0.06]">
      <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide block pl-1">
        Text
      </label>

      <textarea
        value={element.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all resize-y"
        placeholder="Enter text..."
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Font Size"
          value={element.fontSize}
          onChange={(v) => onUpdate({ fontSize: v })}
          min={1}
          max={500}
          suffix="px"
        />
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Font Weight
          </label>
          <select
            value={element.fontWeight}
            onChange={(e) => onUpdate({ fontWeight: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 transition-all cursor-pointer"
          >
            <option value={300} className="bg-bg-surface text-text-primary">Light</option>
            <option value={400} className="bg-bg-surface text-text-primary">Regular</option>
            <option value={500} className="bg-bg-surface text-text-primary">Medium</option>
            <option value={600} className="bg-bg-surface text-text-primary">Semibold</option>
            <option value={700} className="bg-bg-surface text-text-primary">Bold</option>
            <option value={800} className="bg-bg-surface text-text-primary">Extra Bold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-8 h-8 rounded-xl border border-white/[0.08] cursor-pointer bg-transparent shrink-0"
            />
            <input
              type="text"
              value={element.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all font-mono"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Font Family
          </label>
          <input
            type="text"
            value={element.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
            placeholder="Inter"
          />
        </div>
      </div>
    </div>
  );
}

function ImageProperties({
  element,
  onUpdate,
}: {
  element: ImageElement;
  onUpdate: (updates: Partial<ImageElement>) => void;
}) {
  return (
    <div className="space-y-3 pt-3 border-t border-white/[0.06]">
      <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide block pl-1">
        Image Source
      </label>
      <input
        type="url"
        value={element.imageUrl}
        onChange={(e) => onUpdate({ imageUrl: e.target.value })}
        className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
        placeholder="https://example.com/image.png"
      />
      {element.imageUrl && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-bg-primary/40 p-1">
          <img
            src={element.imageUrl}
            alt="Preview"
            className="w-full h-auto max-h-32 object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}

function BrowserProperties({
  element,
  onUpdate,
}: {
  element: BrowserElement;
  onUpdate: (updates: Partial<BrowserElement>) => void;
}) {
  return (
    <div className="space-y-3 pt-3 border-t border-white/[0.06]">
      <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide block pl-1">
        Browser Source URL
      </label>
      <input
        type="url"
        value={element.url}
        onChange={(e) => onUpdate({ url: e.target.value })}
        className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
        placeholder="https://example.com"
      />
    </div>
  );
}
