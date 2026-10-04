import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  options,
  children,
  className = '',
  icon,
  ...props
}) => {
  return (
    <div className="relative inline-block w-full sm:w-auto">
      {icon && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {icon}
        </div>
      )}
      <select
        className={`w-full appearance-none bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg py-2 ${
          icon ? 'pl-8' : 'pl-3'
        } pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] focus:bg-white transition-all cursor-pointer ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};

export default Select;
