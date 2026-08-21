import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-[#1552B3]',
  valueColor = 'text-gray-900',
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between transition-all hover:shadow-sm ${className}`}
    >
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
        <p className={`text-xl font-bold mt-1 font-mono tracking-tight ${valueColor} truncate`}>
          {value}
        </p>
        {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">{subtitle}</p>}
        {trend && (
          <p
            className={`text-[10px] font-semibold mt-1 flex items-center ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </p>
        )}
      </div>

      {Icon && (
        <div className={`w-10 h-10 ${iconBgColor} ${iconColor} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default KpiCard;
