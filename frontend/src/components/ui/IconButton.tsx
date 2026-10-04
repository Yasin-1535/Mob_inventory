import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string; // Accessible label (required)
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 p-1 text-xs',
    md: 'w-8 h-8 p-1.5 text-xs',
    lg: 'w-9 h-9 p-2 text-sm',
  }[size];

  const variantClasses = {
    primary: 'bg-[#1552B3] text-white hover:bg-[#104294] shadow-xs',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700',
    ghost: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
  }[variant];

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4 shrink-0" />
    </button>
  );
};

export default IconButton;
