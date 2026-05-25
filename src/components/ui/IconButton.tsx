import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tooltip?: string;
  active?: boolean;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md';
}

export function IconButton({
  children,
  tooltip,
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

  return (
    <button
      title={tooltip}
      disabled={disabled}
      className={`
        ${sizeClasses}
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
    </button>
  );
}
