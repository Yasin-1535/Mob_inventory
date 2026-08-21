import React from 'react';

export type StatusVariant =
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Active'
  | 'Pending'
  | 'PENDING'
  | 'ACCEPTED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PAID'
  | 'SETTLED'
  | 'PROCESSING'
  | 'SHIPPED'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-gray-50 text-gray-700 border-gray-200';

  if (
    normalized === 'IN STOCK' ||
    normalized === 'ACTIVE' ||
    normalized === 'DELIVERED' ||
    normalized === 'COMPLETED' ||
    normalized === 'PAID' ||
    normalized === 'SETTLED'
  ) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (
    normalized === 'LOW STOCK' ||
    normalized === 'PENDING' ||
    normalized === 'PENDING APPROVAL'
  ) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (
    normalized === 'OUT OF STOCK' ||
    normalized === 'SUSPENDED' ||
    normalized === 'CANCELLED' ||
    normalized === 'REJECTED'
  ) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (
    normalized === 'DISPATCHED' ||
    normalized === 'ACCEPTED' ||
    normalized === 'PROCESSING' ||
    normalized === 'SHIPPED'
  ) {
    colorClasses = 'bg-blue-50 text-[#1552B3] border-blue-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colorClasses} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
