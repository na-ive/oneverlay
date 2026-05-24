import { useCallback } from 'react';
import { LuMinus, LuPlus, LuRotateCcw } from 'react-icons/lu';
import { NumberInput } from '../ui/NumberInput';
import { IconButton } from '../ui/IconButton';
import { useSceneStore } from '../../store/sceneStore';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { RESOLUTION_PRESETS } from '../../lib/constants';
import { zoomIn, zoomOut, zoomReset } from '../../hooks/useCanvasZoom';

export function CanvasPanel() {
  const canvas = useSceneStore((s) => s.canvas);
  const setCanvasSize = useSceneStore((s) => s.setCanvasSize);
  const zoom = useEditorStore((s) => s.zoom);
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
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center px-3 py-1.5 border-b border-border shrink-0">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Canvas
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Resolution preset */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">
            Preset
          </label>
          <select
            value={currentPresetLabel}
            onChange={handlePreset}
            className="w-full px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary text-xs outline-none focus:border-accent transition-colors cursor-pointer"
          >
            {currentPresetLabel === 'Custom' && (
              <option value="Custom" disabled>
                Custom
              </option>
            )}
            {RESOLUTION_PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
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

        {/* Zoom controls */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">
            Zoom
          </label>
          <div className="flex items-center gap-1">
            <IconButton size="sm" tooltip="Zoom out" onClick={zoomOut}>
              <LuMinus size={12} />
            </IconButton>
            <span className="flex-1 text-center text-xs text-text-primary tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <IconButton size="sm" tooltip="Zoom in" onClick={zoomIn}>
              <LuPlus size={12} />
            </IconButton>
            <IconButton size="sm" tooltip="Reset zoom" onClick={zoomReset}>
              <LuRotateCcw size={11} />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
