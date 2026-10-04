import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  colorScheme?: string;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

const colorSchemeMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  red: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  iconBgColor,
  iconColor,
  valueColor = 'text-slate-900',
  trend,
  className = '',
  onClick,
}) => {
  const scheme = colorScheme ? colorSchemeMap[colorScheme.toLowerCase()] : undefined;
  const resolvedBgColor = iconBgColor || (scheme ? scheme.bg : 'bg-blue-50');
  const resolvedIconColor = iconColor || (scheme ? scheme.text : 'text-[#1552B3]');
  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-card hover:border-slate-300 transition-all flex items-start justify-between ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <p className={`text-xl sm:text-2xl font-bold mt-1 font-mono tracking-tight ${valueColor} truncate`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="mt-1.5 flex items-center gap-1">
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          </div>
        )}
      </div>

      {Icon && (
        <div
          className={`w-10 h-10 ${resolvedBgColor} ${resolvedIconColor} rounded-lg flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      )}
    </div>
  );
};

export const StatCard = KpiCard;
export default KpiCard;
