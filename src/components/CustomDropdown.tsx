import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  label: string;
  value: string | string[];
  options: DropdownOption[];
  onChange: (val: any) => void;
  multi?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  fullWidth?: boolean;
  hideLabel?: boolean;
  variant?: 'default' | 'josaa';
}

export const CustomDropdown = ({
  label,
  value,
  options,
  onChange,
  multi = false,
  disabled = false,
  searchable = false,
  className = '',
  fullWidth = false,
  hideLabel = false,
  variant = 'default'
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Recalculate menu position on open
  const recalcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = Math.min(320, options.length * 38 + (searchable ? 56 : 12));
    const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: Math.max(rect.width, 200),
      maxWidth: 340,
      zIndex: 9999,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4, top: 'auto' }
        : { top: rect.bottom + 4, bottom: 'auto' }),
    });
  }, [options.length, searchable]);

  useEffect(() => {
    if (isOpen) {
      recalcPosition();
      window.addEventListener('scroll', recalcPosition, true);
      window.addEventListener('resize', recalcPosition);
    }
    return () => {
      window.removeEventListener('scroll', recalcPosition, true);
      window.removeEventListener('resize', recalcPosition);
    };
  }, [isOpen, recalcPosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    if (multi) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter((v: string) => v !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearch('');
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multi) {
      onChange([]);
    }
    setIsOpen(false);
  };

  const displayValue = () => {
    if (multi) {
      const vals = Array.isArray(value) ? value : [];
      if (vals.length === 0) return 'All';
      if (vals.length === 1) {
        return options.find(o => o.value === vals[0])?.label || vals[0];
      }
      return `${vals.length} selected`;
    }
    return options.find(o => o.value === value)?.label || String(value) || 'All';
  };

  const hasSelection = multi
    ? Array.isArray(value) && value.length > 0
    : !!value;

  const filteredOptions = searchable && search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen) recalcPosition();
          setIsOpen(prev => !prev);
          if (isOpen) setSearch('');
        }}
        className={`
          flex items-center gap-1.5 py-1.5 pl-3 pr-2.5 outline-none transition-all
          ${variant === 'josaa' 
             ? `bg-white text-[#212529] rounded-md text-sm border 
                ${isOpen ? 'border-[#b00a2b] ring-1 ring-[#b00a2b]/20' : 'border-[#e4c4c4] hover:border-[#d4aaaa]'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
             : `bg-[#fbeaea] text-[#1e3a5f] rounded-full text-sm font-semibold border
                ${isOpen ? 'border-[#982b35] bg-[#f5d5d7] ring-1 ring-[#982b35]/20' : 'border-[#f4d4d4] hover:bg-[#f6e1e1] hover:border-pink-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
          }
          shadow-sm whitespace-nowrap ${fullWidth ? 'w-full justify-between' : ''}
        `}
      >
        <span className="flex items-center gap-1 min-w-0">
          {!hideLabel && <span className="opacity-70 font-medium shrink-0">{label}</span>}
          <span className={`truncate ${variant === 'josaa' ? 'font-normal text-[13.5px]' : 'font-bold'} ${fullWidth ? '' : 'max-w-[130px]'}`}>{displayValue()}</span>
        </span>
        {multi && hasSelection ? (
          <span
            role="button"
            onClick={clearAll}
            className="size-4 rounded-full bg-[#982b35] flex items-center justify-center shrink-0 hover:bg-[#7a2028] transition-colors"
            title="Clear filter"
          >
            <X className="size-2.5 text-white" strokeWidth={3} />
          </span>
        ) : (
          <ChevronDown className={`size-3.5 opacity-60 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !disabled && typeof document !== 'undefined' && (
        <div
          ref={menuRef}
          style={menuStyle}
          className="overflow-y-auto bg-white border border-[#f4d4d4] shadow-2xl rounded-xl py-1.5 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent"
          onMouseDown={e => e.stopPropagation()}
        >
          {searchable && (
            <div className="px-2.5 pb-2 pt-1.5 sticky top-0 bg-white z-10 border-b border-gray-100 mb-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-pink-300 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {/* Clear All for multi */}
          {multi && Array.isArray(value) && value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3.5 py-1.5 text-xs text-[#982b35] font-bold hover:bg-red-50 transition-colors border-b border-gray-100 mb-1"
            >
              Clear all ({value.length} selected)
            </button>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
          ) : (
            filteredOptions.map((opt, i) => {
              const isSelected = multi
                ? Array.isArray(value) && value.includes(opt.value)
                : value === opt.value;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  className={`
                    w-full text-left px-3.5 py-2 text-sm flex items-center justify-between gap-3 transition-colors
                    ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-pink-50 cursor-pointer'}
                    ${isSelected && !multi ? 'bg-pink-50 text-[#982b35] font-bold' : 'text-gray-700 font-medium'}
                  `}
                >
                  <span className="break-words">{opt.label}</span>
                  {multi ? (
                    <div className={`size-4 rounded flex items-center justify-center shrink-0 border transition-colors ${isSelected ? 'bg-[#982b35] border-[#982b35]' : 'border-gray-300'}`}>
                      {isSelected && <Check className="size-3 text-white" strokeWidth={4} />}
                    </div>
                  ) : (
                    isSelected && <Check className="size-4 text-[#982b35] shrink-0" strokeWidth={3} />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
