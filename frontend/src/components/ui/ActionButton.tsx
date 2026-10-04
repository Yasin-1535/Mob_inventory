import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'destructive'
    | 'ghost'
    | 'success'
    | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  isIconOnly?: boolean;
  tooltip?: string;
  disabledTooltip?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  isIconOnly = false,
  disabled = false,
  tooltip,
  disabledTooltip,
  title,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0';

  const sizeClasses = {
    xs: isIconOnly ? 'w-7 h-7 p-1 text-xs' : 'px-2 py-1 text-[11px] gap-1 h-7',
    sm: isIconOnly ? 'w-8 h-8 p-1.5 text-xs' : 'px-2.5 py-1.5 text-xs gap-1.5 h-8',
    md: isIconOnly ? 'w-9 h-9 p-2 text-xs' : 'px-3.5 py-2 text-xs gap-2 h-9',
    lg: isIconOnly ? 'w-10 h-10 p-2.5 text-sm' : 'px-4 py-2.5 text-sm gap-2 h-10',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#1552B3] hover:bg-[#104294] text-white shadow-xs focus:ring-[#1552B3]/40 border border-transparent',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-2xs focus:ring-slate-300 border border-slate-200',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs focus:ring-slate-300',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500/40 border border-transparent',
    destructive:
      'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 focus:ring-rose-500/30',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500/40 border border-transparent',
    warning:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-xs focus:ring-amber-400/40 border border-transparent',
  }[variant];

  const effectiveTitle = disabled && disabledTooltip ? disabledTooltip : tooltip || title;

  return (
    <button
      disabled={disabled || isLoading}
      title={effectiveTitle}
      aria-label={isIconOnly ? effectiveTitle : undefined}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 shrink-0" />
      )}
      {!isIconOnly && children && <span>{children}</span>}
      {!isLoading && Icon && iconPosition === 'right' && !isIconOnly && (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      )}
    </button>
  );
};

export default ActionButton;
