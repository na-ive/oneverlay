import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuCheck } from 'react-icons/lu';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ left: 0, top: 0, bottom: 0, width: 0 });
  const [dropdownHeight, setDropdownHeight] = useState(0);

  const selectedOption = options.find((opt) => opt.value === value);

  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
      });
    }
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        updateCoords();
      } else {
        triggerRef.current?.blur();
      }
      return next;
    });
  }, [updateCoords]);

  const handleSelect = useCallback(
    (val: any) => {
      onChange(val);
      setIsOpen(false);
      triggerRef.current?.blur();
    },
    [onChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      triggerRef.current?.blur();
    };

    const handleClose = () => {
      setIsOpen(false);
      triggerRef.current?.blur();
    };

    window.addEventListener('mousedown', handleOutsideClick, { capture: true });
    window.addEventListener('scroll', handleClose, { capture: true });
    window.addEventListener('resize', handleClose);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick, { capture: true });
      window.removeEventListener('scroll', handleClose, { capture: true });
      window.removeEventListener('resize', handleClose);
    };
  }, [isOpen, updateCoords]);

  // Measure actual dropdown height when it opens to adjust alignment near edges
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownHeight(rect.height);
    } else {
      setDropdownHeight(0);
    }
  }, [isOpen]);

  // Determine portal container to render on top of native <dialog> (top layer)
  const portalContainer = triggerRef.current?.closest('dialog') || document.body;

  // Calculate if the dropdown should open upwards to prevent bottom screen overflow
  const actualHeight = dropdownHeight || Math.min(options.length * 36 + 8, 240);
  const spaceBelow = window.innerHeight - coords.bottom;
  const shouldShowTop = spaceBelow < actualHeight && coords.top > actualHeight;
  const topPos = shouldShowTop ? coords.top - actualHeight - 6 : coords.bottom + 6;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`
          select-trigger
          w-full flex items-center justify-between px-3 py-2 rounded-xl 
          border border-white/[0.08] bg-bg-primary/30 text-text-primary 
          text-xs outline-none cursor-pointer transition-all duration-200
          ${isOpen ? 'border-accent bg-bg-primary/60 shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'hover:border-white/[0.15]'}
        `}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <LuChevronDown
          size={12}
          className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-text-primary' : ''}`}
        />
      </button>

      {/* Options Dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed rounded-xl border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.65)] backdrop-blur-3xl py-1 z-[99999] max-h-60 overflow-y-auto overflow-x-hidden ${
              shouldShowTop ? 'select-dropdown-animate-up' : 'select-dropdown-animate-down'
            }`}
            style={{
              left: `${coords.left}px`,
              top: `${topPos}px`,
              width: `${coords.width}px`,
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2 text-xs 
                    transition-all duration-150 cursor-pointer border-none text-left
                    ${
                      isSelected
                        ? 'text-accent font-semibold bg-accent/[0.06] hover:bg-accent/[0.09]'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <LuCheck size={11} className="text-accent shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>,
          portalContainer,
        )}
    </div>
  );
}
