import React from 'react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  count?: number | string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  count,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 mb-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
          {title}
        </h2>
        {count !== undefined && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
            {count}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
            • {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

export default SectionHeader;
