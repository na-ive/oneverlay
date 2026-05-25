import { useCallback } from 'react';
import { NumberInput } from '../ui/NumberInput';
import { Select } from '../ui/Select';
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
    (value: string) => {
      const preset = RESOLUTION_PRESETS.find((p) => p.label === value);
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
      <div className="flex items-center px-4 h-[38px] border-b border-white/[0.06] shrink-0">
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
          <Select
            value={currentPresetLabel}
            onChange={handlePreset}
            options={[
              ...(currentPresetLabel === 'Custom' ? [{ value: 'Custom', label: 'Custom' }] : []),
              ...RESOLUTION_PRESETS.map((p) => ({ value: p.label, label: p.label })),
            ]}
          />
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
