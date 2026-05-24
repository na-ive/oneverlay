import { useCallback, type InputHTMLAttributes } from 'react';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({
  value,
  onChange,
  label,
  suffix,
  min,
  max,
  step = 1,
  className = '',
  ...props
}: NumberInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        const clamped = Math.min(Math.max(val, min ?? -Infinity), max ?? Infinity);
        onChange(clamped);
      }
    },
    [onChange, min, max],
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary text-xs outline-none focus:border-accent transition-colors"
          {...props}
        />
        {suffix && (
          <span className="text-[11px] text-text-muted whitespace-nowrap">{suffix}</span>
        )}
      </div>
    </div>
  );
}
