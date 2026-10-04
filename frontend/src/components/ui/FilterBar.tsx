import React from 'react';

export interface FilterBarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 ${className}`}
    >
      <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap sm:flex-nowrap justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
