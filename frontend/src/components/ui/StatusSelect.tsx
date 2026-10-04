import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type StandardStatus =
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Damaged'
  | 'Active'
  | 'Suspended'
  | 'Pending'
  | 'Paid'
  | 'Partial'
  | 'Overdue'
  | string;

export interface StatusSelectProps {
  value: StandardStatus;
  onChange: (newStatus: any) => void;
  options?: StandardStatus[];
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

interface StatusStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const getStatusStyle = (status: string): StatusStyle => {
  const norm = status?.toUpperCase().trim() || '';

  // Green / Success
  if (
    [
      'DELIVERED',
      'IN STOCK',
      'ACTIVE',
      'PAID',
      'COMPLETED',
      'SETTLED',
      'APPROVED',
      'GOOD',
      'RECEIVED',
    ].includes(norm)
  ) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    };
  }

  // Amber / Warning-Progress
  if (
    [
      'PROCESSING',
      'LOW STOCK',
      'PENDING',
      'PENDING APPROVAL',
      'PARTIAL',
      'PARTIALLY PAID',
      'AWAITING',
    ].includes(norm)
  ) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    };
  }

  // Red / Destructive
  if (
    [
      'CANCELLED',
      'OUT OF STOCK',
      'DAMAGED',
      'SUSPENDED',
      'REJECTED',
      'OVERDUE',
    ].includes(norm)
  ) {
    return {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    };
  }

  // Indigo / Purple / In Transit
  if (['SHIPPED', 'IN TRANSIT', 'DISPATCHED', 'RETURNED'].includes(norm)) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500',
    };
  }

  // Blue / Informational (Confirmed, Accepted)
  if (['CONFIRMED', 'ACCEPTED', 'ORDERED', 'REQUESTED', 'INSPECTED'].includes(norm)) {
    return {
      bg: 'bg-blue-50',
      text: 'text-[#1552B3]',
      border: 'border-blue-200',
      dot: 'bg-[#1552B3]',
    };
  }

  // Default slate
  return {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };
};

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  options = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
  disabled = false,
  size = 'sm',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStyle = getStatusStyle(value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (status: StandardStatus) => {
    if (disabled) return;
    onChange(status);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1 gap-1.5' : 'text-xs px-3 py-1.5 gap-2';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between font-semibold rounded-lg border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${currentStyle.dot}`} />
          <span>{value}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform text-current opacity-70 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 min-w-[140px] w-auto bg-white rounded-xl shadow-lg border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div role="listbox" className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const optStyle = getStatusStyle(option);
              const isSelected = option.toLowerCase() === value?.toLowerCase();

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? `${optStyle.bg} ${optStyle.text} font-bold` : 'text-slate-700'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${optStyle.dot}`} />
                    <span>{option}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-current shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusSelect;
