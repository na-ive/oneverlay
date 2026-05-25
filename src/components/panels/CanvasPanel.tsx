import { useCallback } from 'react';
import { NumberInput } from '../ui/NumberInput';
import { useSceneStore, selectCanvas } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import { RESOLUTION_PRESETS } from '../../lib/constants';

export function CanvasPanel() {
  const canvas = useSceneStore(selectCanvas);
  const setCanvasSize = useSceneStore((s) => s.setCanvasSize);
  const pushHistory = useHistoryStore((s) => s.push);

  const handleWidthChange = useCallback(
    (w: number) => {
      pushHistory();
      setCanvasSize(w, canvas.height);
    },
    [canvas.height, setCanvasSize, pushHistory],
  );

  const handleHeightChange = useCallback(
    (h: number) => {
      pushHistory();
      setCanvasSize(canvas.width, h);
    },
    [canvas.width, setCanvasSize, pushHistory],
  );

  const handlePreset = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const preset = RESOLUTION_PRESETS.find((p) => p.label === e.target.value);
      if (preset) {
        pushHistory();
        setCanvasSize(preset.width, preset.height);
      }
    },
    [setCanvasSize, pushHistory],
  );

  const currentPresetLabel =
    RESOLUTION_PRESETS.find(
      (p) => p.width === canvas.width && p.height === canvas.height,
    )?.label || 'Custom';

  return (
    <div className="flex flex-col h-full bg-bg-secondary/10">
      {/* Panel header */}
      <div className="flex items-center px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Canvas
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Resolution preset */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Preset
          </label>
          <select
            value={currentPresetLabel}
            onChange={handlePreset}
            className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 transition-all cursor-pointer"
          >
            {currentPresetLabel === 'Custom' && (
              <option value="Custom" disabled>
                Custom
              </option>
            )}
            {RESOLUTION_PRESETS.map((p) => (
              <option key={p.label} value={p.label} className="bg-bg-surface text-text-primary">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Width / Height */}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Width"
            value={canvas.width}
            onChange={handleWidthChange}
            min={100}
            max={7680}
            suffix="px"
          />
          <NumberInput
            label="Height"
            value={canvas.height}
            onChange={handleHeightChange}
            min={100}
            max={4320}
            suffix="px"
          />
        </div>

      </div>
    </div>
  );
}
