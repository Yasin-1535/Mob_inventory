import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  ShoppingBag,
  Boxes,
  RotateCcw,
  CreditCard,
  DollarSign,
  Package,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface HistoryEventItem {
  id: string;
  date: string;
  type:
    | 'SALE'
    | 'PURCHASE'
    | 'ADJUSTMENT'
    | 'DAMAGE'
    | 'RETURN'
    | 'ORDER'
    | 'PAYMENT'
    | 'EXPENSE'
    | string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeStatus?: string;
  quantityChange?: number;
  stockBefore?: number;
  stockAfter?: number;
  amount?: number;
  reference?: string;
  party?: string;
  meta?: string;
}

export interface HistoryHierarchyProps {
  events: HistoryEventItem[];
  maxItems?: number;
  onViewAll?: () => void;
  viewAllLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  className?: string;
  isCompact?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const HistoryHierarchy: React.FC<HistoryHierarchyProps> = ({
  events,
  maxItems,
  onViewAll,
  viewAllLabel = 'View All History',
  emptyTitle = 'No activity recorded',
  emptySubtitle = 'Historical transactions will appear here organized by month and date.',
  className = '',
  isCompact = false,
}) => {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Display limited items if maxItems is provided
  const visibleEvents = useMemo(() => {
    if (maxItems && maxItems > 0 && events.length > maxItems) {
      return events.slice(0, maxItems);
    }
    return events;
  }, [events, maxItems]);

  // Group events by Month -> Date
  const groupedHierarchy = useMemo(() => {
    const monthMap: Record<
      string,
      {
        monthLabel: string;
        dateMap: Record<string, HistoryEventItem[]>;
        totalEvents: number;
      }
    > = {};

    visibleEvents.forEach((ev) => {
      let monthLabel = 'Recent Activity';
      let dateLabel = 'Today';

      try {
        const d = new Date(ev.date);
        if (!isNaN(d.getTime())) {
          monthLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
          dateLabel = d.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        }
      } catch {
        // fallback
      }

      if (!monthMap[monthLabel]) {
        monthMap[monthLabel] = {
          monthLabel,
          dateMap: {},
          totalEvents: 0,
        };
      }

      if (!monthMap[monthLabel].dateMap[dateLabel]) {
        monthMap[monthLabel].dateMap[dateLabel] = [];
      }

      monthMap[monthLabel].dateMap[dateLabel].push(ev);
      monthMap[monthLabel].totalEvents += 1;
    });

    return Object.values(monthMap);
  }, [visibleEvents]);

  const toggleMonth = (label: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [label]: prev[label] === undefined ? false : !prev[label],
    }));
  };

  const isMonthExpanded = (label: string) => {
    return expandedMonths[label] !== false; // default expanded
  };

  const getTypeIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'SALE') return <Receipt className="w-3.5 h-3.5 text-blue-600" />;
    if (t === 'PURCHASE') return <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />;
    if (t === 'DAMAGE') return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
    if (t === 'RETURN') return <RotateCcw className="w-3.5 h-3.5 text-purple-600" />;
    if (t === 'PAYMENT') return <CreditCard className="w-3.5 h-3.5 text-indigo-600" />;
    if (t === 'EXPENSE') return <DollarSign className="w-3.5 h-3.5 text-amber-600" />;
    if (t === 'ORDER') return <Package className="w-3.5 h-3.5 text-sky-600" />;
    return <Boxes className="w-3.5 h-3.5 text-slate-600" />;
  };

  const getTypeBg = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'SALE') return 'bg-blue-50 border-blue-100';
    if (t === 'PURCHASE') return 'bg-emerald-50 border-emerald-100';
    if (t === 'DAMAGE') return 'bg-rose-50 border-rose-100';
    if (t === 'RETURN') return 'bg-purple-50 border-purple-100';
    if (t === 'PAYMENT') return 'bg-indigo-50 border-indigo-100';
    if (t === 'EXPENSE') return 'bg-amber-50 border-amber-100';
    return 'bg-slate-50 border-slate-200';
  };

  if (events.length === 0) {
    return (
      <div className={`p-8 text-center bg-white rounded-xl border border-slate-200 ${className}`}>
        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-xs font-bold text-slate-700">{emptyTitle}</h4>
        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {groupedHierarchy.map((monthGroup) => {
        const expanded = isMonthExpanded(monthGroup.monthLabel);

        return (
          <div
            key={monthGroup.monthLabel}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
          >
            {/* MONTH HEADER (Task 11: Do not repeat month on every row) */}
            <div
              onClick={() => toggleMonth(monthGroup.monthLabel)}
              className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1552B3]" />
                <span className="text-xs font-bold text-slate-900 tracking-wide">
                  {monthGroup.monthLabel}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {monthGroup.totalEvents} events
                </span>
              </div>
              <div className="text-slate-400 hover:text-slate-700">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* EXPANDABLE DATE GROUPS & TRANSACTIONS */}
            {expanded && (
              <div className="divide-y divide-slate-100">
                {Object.entries(monthGroup.dateMap).map(([dateLabel, items]) => (
                  <div key={dateLabel} className="p-3 sm:p-4">
                    {/* DATE LABEL */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1552B3]" />
                      <span className="text-[11px] font-bold text-slate-700 tracking-wider">
                        {dateLabel}
                      </span>
                    </div>

                    {/* EVENTS ON THIS DATE */}
                    <div className="space-y-2 pl-3 border-l-2 border-slate-100">
                      {items.map((item) => {
                        const hasQty = item.quantityChange !== undefined;
                        const isPos = (item.quantityChange || 0) > 0;
                        const hasStockShift =
                          item.stockBefore !== undefined && item.stockAfter !== undefined;

                        return (
                          <div
                            key={item.id}
                            className="bg-slate-50/60 hover:bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${getTypeBg(
                                  item.type
                                )}`}
                              >
                                {getTypeIcon(item.type)}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 truncate">
                                    {item.title}
                                  </span>
                                  {item.reference && (
                                    <span className="font-mono text-[10px] text-slate-400">
                                      ({item.reference})
                                    </span>
                                  )}
                                  {item.badgeStatus && (
                                    <StatusBadge status={item.badgeStatus} size="sm" />
                                  )}
                                </div>
                                {item.subtitle && (
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {item.subtitle}
                                  </p>
                                )}
                                {item.party && (
                                  <p className="text-[10px] text-slate-400 truncate">
                                    Party: <strong className="text-slate-600">{item.party}</strong>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* RIGHT-SIDE METRICS: Quantity, Stock Shift, Amount */}
                            <div className="flex items-center sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                              {hasQty && (
                                <span
                                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                    isPos
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {isPos ? `+${item.quantityChange}` : item.quantityChange} units
                                </span>
                              )}

                              {hasStockShift && (
                                <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                                  <span>{item.stockBefore}</span>
                                  <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                                  <span className="font-bold text-slate-800">{item.stockAfter}</span>
                                </div>
                              )}

                              {item.amount !== undefined && (
                                <span className="font-mono font-bold text-slate-900">
                                  ₹{item.amount.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* VIEW ALL ACTION BUTTON (Short List Principle - Task 21) */}
      {onViewAll && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1552B3] hover:text-[#104294] hover:underline cursor-pointer py-1 px-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span>{viewAllLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryHierarchy;
