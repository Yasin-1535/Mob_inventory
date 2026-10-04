import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface ActionMenuProps {
  items?: ActionMenuItem[];
  actions?: ActionMenuItem[];
  size?: 'xs' | 'sm' | 'md';
  align?: 'left' | 'right';
  className?: string;
  triggerAriaLabel?: string;
  trigger?: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  menuWidth?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  actions,
  size = 'sm',
  align = 'right',
  className = '',
  triggerAriaLabel = 'More actions',
  trigger,
  menuWidth = 'w-48',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItems = items || actions || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    xs: 'w-7 h-7 p-1 text-xs',
    sm: 'w-8 h-8 p-1.5 text-xs',
    md: 'w-9 h-9 p-2 text-xs',
  }[size];

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {trigger ? (
        trigger({ isOpen, toggle: () => setIsOpen((prev) => !prev) })
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-label={triggerAriaLabel}
          title={triggerAriaLabel}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 cursor-pointer ${sizeClasses}`}
        >
          <MoreVertical className="w-3.5 h-3.5 shrink-0" />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 mt-1 ${menuWidth} rounded-xl bg-white shadow-lg border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isDanger = item.variant === 'danger';
            const isSuccess = item.variant === 'success';

            const textColor = item.disabled
              ? 'text-slate-300 cursor-not-allowed'
              : isDanger
              ? 'text-rose-600 hover:bg-rose-50'
              : isSuccess
              ? 'text-emerald-700 hover:bg-emerald-50'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900';

            return (
              <button
                key={index}
                type="button"
                disabled={item.disabled}
                title={item.disabled ? item.disabledTooltip : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.disabled) return;
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${textColor}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
