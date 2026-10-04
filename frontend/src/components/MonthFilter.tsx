import React from 'react';
import { Calendar, Filter } from 'lucide-react';

export interface MonthFilterProps {
  selectedYear: number | 'ALL';
  selectedMonth: number | 'ALL'; // 0 = Jan, 11 = Dec, 'ALL' = All months
  onChange: (year: number | 'ALL', month: number | 'ALL') => void;
  availableYears?: number[];
  className?: string;
}

export const MonthFilter: React.FC<MonthFilterProps> = ({
  selectedYear,
  selectedMonth,
  onChange,
  availableYears = [2026, 2025, 2024],
  className = '',
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const isAllTime = selectedYear === 'ALL' && selectedMonth === 'ALL';
  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
  const isPreviousMonth = selectedYear === prevYear && selectedMonth === prevMonth;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Quick Presets */}
      <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
        <button
          type="button"
          onClick={() => onChange('ALL', 'ALL')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
            isAllTime
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Months
        </button>

        <button
          type="button"
          onClick={() => onChange(currentYear, currentMonth)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
            isCurrentMonth
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          This Month ({monthNames[currentMonth]?.slice(0, 3)})
        </button>

        <button
          type="button"
          onClick={() => onChange(prevYear, prevMonth)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
            isPreviousMonth
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Last Month ({monthNames[prevMonth]?.slice(0, 3)})
        </button>
      </div>

      {/* Year & Month Dropdowns for Custom Periods */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              onChange(selectedYear === 'ALL' ? currentYear : selectedYear, val);
            }}
            className="pl-2.5 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Months</option>
            {monthNames.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              onChange(val, selectedMonth);
            }}
            className="pl-2.5 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default MonthFilter;
