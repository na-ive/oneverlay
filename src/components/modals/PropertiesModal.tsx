import { useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { NumberInput } from '../ui/NumberInput';
import { Select } from '../ui/Select';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore, selectElements } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import { GOOGLE_FONTS } from '../../lib/fonts';
import type { OverlayElement, TextElement, ImageElement, BrowserElement } from '../../types/elements';

export function PropertiesModal() {
  const isOpen = useEditorStore((s) => s.isPropertiesOpen);
  const elementId = useEditorStore((s) => s.propertiesElementId);
  const selectedIds = useEditorStore((s) => s.selectedElementIds);
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

  if (!element || selectedIds.length > 1) return null;

  return (
    <Modal
      open={isOpen}
      onClose={closeProperties}
      title={`${element.name} — Properties`}
      width="540px"
    >
      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 flex flex-col gap-1.5">
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

          <div
            className="flex items-center gap-2 h-[34px] cursor-pointer select-none pl-2 shrink-0"
            onClick={() => handleUpdate({ locked: !element.locked })}
          >
            <input
              type="checkbox"
              checked={element.locked}
              onChange={(e) => handleUpdate({ locked: e.target.checked })}
              className="w-3.5 h-3.5 accent-accent rounded border-white/[0.1] bg-bg-primary/30 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-text-secondary font-medium">Locked</span>
          </div>
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
              label="Scale X"
              value={Number(element.scaleX.toFixed(2))}
              onChange={(v) => handleUpdate({ scaleX: v })}
              step={0.1}
            />
            <NumberInput
              label="Scale Y"
              value={Number(element.scaleY.toFixed(2))}
              onChange={(v) => handleUpdate({ scaleY: v })}
              step={0.1}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <NumberInput label="Crop L" value={Math.round(element.cropLeft)} onChange={(v) => handleUpdate({ cropLeft: v })} min={0} />
            <NumberInput label="Crop T" value={Math.round(element.cropTop)} onChange={(v) => handleUpdate({ cropTop: v })} min={0} />
            <NumberInput label="Crop R" value={Math.round(element.cropRight)} onChange={(v) => handleUpdate({ cropRight: v })} min={0} />
            <NumberInput label="Crop B" value={Math.round(element.cropBottom)} onChange={(v) => handleUpdate({ cropBottom: v })} min={0} />
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
          <Select
            value={element.fontWeight}
            onChange={(val) => onUpdate({ fontWeight: parseInt(val) })}
            options={[
              { value: 300, label: 'Light' },
              { value: 400, label: 'Regular' },
              { value: 500, label: 'Medium' },
              { value: 600, label: 'Semibold' },
              { value: 700, label: 'Bold' },
              { value: 800, label: 'Extra Bold' },
            ]}
          />
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
          <Select
            value={element.fontFamily}
            onChange={(val) => onUpdate({ fontFamily: val })}
            options={GOOGLE_FONTS.flatMap((group) => [
              { value: `label-${group.label}`, label: group.label, isLabel: true },
              ...group.fonts.map((f) => ({ value: f, label: f })),
            ])}
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
      <div className="grid grid-cols-2 gap-2 mt-2">
        <NumberInput
          label="Viewport Width"
          value={element.browserWidth}
          onChange={(v) => onUpdate({ browserWidth: v, width: v })}
          min={100}
        />
        <NumberInput
          label="Viewport Height"
          value={element.browserHeight}
          onChange={(v) => onUpdate({ browserHeight: v, height: v })}
          min={100}
        />
      </div>
    </div>
  );
}
