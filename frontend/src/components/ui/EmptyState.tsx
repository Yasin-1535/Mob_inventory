import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import ActionButton from './ActionButton';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100/80 text-slate-400 flex items-center justify-center mb-3.5 shadow-inner">
        <Icon className="w-7 h-7" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm font-normal">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <ActionButton
            variant="primary"
            size="sm"
            onClick={onAction}
            icon={actionIcon}
          >
            {actionLabel}
          </ActionButton>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
