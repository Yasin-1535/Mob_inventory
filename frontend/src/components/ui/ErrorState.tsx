import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import ActionButton from './ActionButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while loading this information. Please try refreshing.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-rose-200 p-8 text-center flex flex-col items-center justify-center shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm font-normal">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <ActionButton
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={RotateCcw}
          >
            Try Again
          </ActionButton>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
