import React from 'react';

export type StatusVariant =
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Damaged'
  | 'Active'
  | 'Suspended'
  | 'Pending'
  | 'Pending Approval'
  | 'PENDING'
  | 'ACCEPTED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PAID'
  | 'PARTIAL'
  | 'SETTLED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'CONFIRMED'
  | 'REQUESTED'
  | 'APPROVED'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'REFUNDED'
  | 'REJECTED'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
}) => {
  if (!status) return null;

  const normalized = status.toString().toUpperCase().trim();

  // Emerald / Success
  const isSuccess = [
    'IN STOCK',
    'ACTIVE',
    'DELIVERED',
    'COMPLETED',
    'PAID',
    'SETTLED',
    'APPROVED',
    'GOOD',
    'RECEIVED & STOCKED',
  ].includes(normalized);

  // Amber / Warning
  const isWarning = [
    'LOW STOCK',
    'PENDING',
    'PENDING APPROVAL',
    'PARTIAL',
    'IN TRANSIT',
    'AWAITING',
  ].includes(normalized);

  // Rose / Danger
  const isDanger = [
    'OUT OF STOCK',
    'SUSPENDED',
    'CANCELLED',
    'REJECTED',
    'DAMAGED',
  ].includes(normalized);

  // Blue / Info
  const isInfo = [
    'DISPATCHED',
    'ACCEPTED',
    'PROCESSING',
    'SHIPPED',
    'CONFIRMED',
    'REQUESTED',
    'INSPECTED',
    'REFUNDED',
    'RECEIVED',
    'SALES_RETURN',
    'PURCHASE_RETURN',
  ].includes(normalized);

  let colorClasses = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (isSuccess) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (isWarning) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (isDanger) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (isInfo) {
    colorClasses = 'bg-blue-50 text-[#1552B3] border-blue-200';
    dotColor = 'bg-[#1552B3]';
  }

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[10px] gap-1';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border tracking-wide uppercase ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <span className="truncate">{status}</span>
    </span>
  );
};

export default StatusBadge;
