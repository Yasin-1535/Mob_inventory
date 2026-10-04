import React from 'react';

export interface LoadingStateProps {
  type?: 'card' | 'table' | 'kpi' | 'list';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'card',
  count = 4,
  className = '',
}) => {
  const items = Array.from({ length: count });

  if (type === 'kpi') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse flex items-start justify-between"
          >
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
              <div className="h-6 w-32 bg-slate-200 rounded"></div>
              <div className="h-2.5 w-24 bg-slate-100 rounded"></div>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
        <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-4 animate-pulse">
          <div className="h-3 w-28 bg-slate-200 rounded"></div>
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
          <div className="h-3 w-16 bg-slate-200 rounded ml-auto"></div>
        </div>
        <div className="divide-y divide-slate-100 p-4 space-y-4">
          {items.map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse pt-2">
              <div className="w-9 h-9 bg-slate-100 rounded-lg shrink-0"></div>
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-1/3 bg-slate-200 rounded"></div>
                <div className="h-2.5 w-1/4 bg-slate-100 rounded"></div>
              </div>
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 w-16 bg-slate-200 rounded"></div>
            <div className="h-4 w-12 bg-slate-100 rounded-full"></div>
          </div>
          <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
          <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
          <div className="h-12 bg-slate-50 rounded-lg border border-slate-100"></div>
          <div className="h-8 bg-slate-100 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingState;
