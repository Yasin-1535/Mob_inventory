import React from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  className = '',
  children,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {error && (
          <span className="text-[11px] font-medium text-rose-600 truncate max-w-[200px]">
            {error}
          </span>
        )}
      </div>
      <div>{children}</div>
      {helperText && !error && (
        <p className="text-[11px] text-slate-400 font-normal leading-tight">
          {helperText}
        </p>
      )}
    </div>
  );
};

export interface FormSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  description,
  children,
  className = '',
}) => {
  const effectiveSubtitle = subtitle || description;
  return (
    <div className={`space-y-3 pt-4 first:pt-0 border-t first:border-t-0 border-slate-100 ${className}`}>
      <div className="pb-1">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
          {title}
        </h4>
        {effectiveSubtitle && (
          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
            {effectiveSubtitle}
          </p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export default FormField;
