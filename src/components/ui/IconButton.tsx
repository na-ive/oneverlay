import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  tooltipAlign?: 'center' | 'left' | 'right';
  active?: boolean;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md';
}

export function IconButton({
  children,
  tooltip,
  tooltipPlacement = 'top',
  tooltipAlign = 'center',
  active = false,
  variant = 'default',
  size = 'md',
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm';

  const variantClasses =
    variant === 'danger'
      ? 'hover:bg-danger/15 hover:text-danger'
      : 'hover:bg-bg-hover';

  const activeClass = active ? 'bg-accent/20 text-accent font-semibold' : 'bg-transparent';

  const placementClasses =
    tooltipPlacement === 'bottom'
      ? `top-full mt-2 ${
          tooltipAlign === 'left'
            ? 'left-0 translate-x-0'
            : tooltipAlign === 'right'
            ? 'right-0 left-auto translate-x-0'
            : 'left-1/2 -translate-x-1/2'
        }`
      : tooltipPlacement === 'left'
      ? 'right-full mr-2 top-1/2 -translate-y-1/2 left-auto translate-x-0'
      : tooltipPlacement === 'right'
      ? 'left-full ml-2 top-1/2 -translate-y-1/2 left-auto translate-x-0'
      : `bottom-full mb-2 ${
          tooltipAlign === 'left'
            ? 'left-0 translate-x-0'
            : tooltipAlign === 'right'
            ? 'right-0 left-auto translate-x-0'
            : 'left-1/2 -translate-x-1/2'
        }`;

  return (
    <button
      disabled={disabled}
      className={`
        ${sizeClasses}
        relative group/btn
        flex items-center justify-center rounded-xl
        border-none cursor-pointer
        text-text-secondary transition-all duration-200
        ${variantClasses}
        ${activeClass}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:text-text-primary'}
        ${className}
      `}
      {...props}
    >
      {children}
      {tooltip && !disabled && (
        <span
          className={`
            pointer-events-none absolute z-50 opacity-0 group-hover/btn:opacity-100 
            transition-opacity duration-150 delay-500 
            bg-[#18181b] border border-white/[0.08] text-text-primary 
            text-[10px] font-semibold px-2.5 py-1 rounded-xl 
            shadow-[0_8px_24px_rgba(0,0,0,0.6)] whitespace-nowrap 
            ${placementClasses}
          `}
        >
          {tooltip}
        </span>
      )}
    </button>
  );
}
