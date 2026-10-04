import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Trash2,
  Calendar,
  Building,
  Zap,
  Briefcase,
  Megaphone,
  Wrench,
  Truck,
  Box,
  HelpCircle,
  X,
  Filter,
  List,
  Check,
} from 'lucide-react';
import { useStore, ExpenseItem } from '../../context/StoreContext';
import AdminLayout from '../../components/AdminLayout';
import {
  ActionButton,
  HistoryHierarchy,
  HistoryEventItem,
  EmptyState,
} from '../../components/ui';

export const ExpenseManagement: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'ledger' | 'timeline'>('ledger');
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [category, setCategory] = useState<ExpenseItem['category']>('Electricity & Utilities');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<ExpenseItem['paymentMethod']>('UPI');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  const categories: ExpenseItem['category'][] = [
    'Rent',
    'Electricity & Utilities',
    'Salaries',
    'Marketing',
    'Maintenance',
    'Logistics & Transport',
    'Packaging',
    'Other',
  ];

  // Extract available months dynamically from actual expense records
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    expenses.forEach((e) => {
      if (e.date) {
        try {
          const d = new Date(e.date);
          if (!isNaN(d.getTime())) {
            monthsSet.add(
              d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            );
          }
        } catch {}
      }
    });
    return Array.from(monthsSet);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.recipient && e.recipient.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;

      let matchesMonth = true;
      if (selectedMonth !== 'ALL') {
        try {
          const d = new Date(e.date);
          const mStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          matchesMonth = mStr === selectedMonth;
        } catch {
          matchesMonth = false;
        }
      }

      return matchesSearch && matchesCat && matchesMonth;
    });
  }, [expenses, searchTerm, selectedCategory, selectedMonth]);

  // Short list vs full list (Task 21 Short List Principle: default 8 records)
  const displayedExpenses = showAllRecords
    ? filteredExpenses
    : filteredExpenses.slice(0, 8);

  // History events for Timeline view (Task 18 & 11)
  const historyEvents = useMemo<HistoryEventItem[]>(() => {
    return filteredExpenses.map((exp) => ({
      id: exp.id,
      date: exp.date,
      type: 'EXPENSE',
      title: `${exp.category} • ${exp.title}`,
      subtitle: `${exp.expenseNumber} • Method: ${exp.paymentMethod} ${exp.recipient ? `• Paid to: ${exp.recipient}` : ''} ${exp.notes ? `• ${exp.notes}` : ''}`,
      badgeText: exp.category,
      badgeStatus: 'Pending',
      amount: -exp.amount,
      party: exp.recipient || 'Operating Overhead',
      reference: exp.expenseNumber,
    }));
  }, [filteredExpenses]);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryIcon = (cat: ExpenseItem['category']) => {
    switch (cat) {
      case 'Rent':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'Electricity & Utilities':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Salaries':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'Marketing':
        return <Megaphone className="w-4 h-4 text-rose-500" />;
      case 'Maintenance':
        return <Wrench className="w-4 h-4 text-indigo-500" />;
      case 'Logistics & Transport':
        return <Truck className="w-4 h-4 text-cyan-600" />;
      case 'Packaging':
        return <Box className="w-4 h-4 text-orange-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    addExpense({
      category,
      title,
      amount: Number(amount),
      date,
      paymentMethod,
      recipient,
      notes,
    });

    setIsModalOpen(false);
    setTitle('');
    setAmount('');
    setRecipient('');
    setNotes('');
  };

  return (
    <AdminLayout
      title="Business Expenses"
      subtitle="Track showroom overheads, utility bills, salaries, logistics, and operational costs"
      actions={
        <ActionButton
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Add Expense
        </ActionButton>
      }
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expenses</span>
            <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">₹{totalExpenseAmount.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500 mt-1">{expenses.length} logged business expenditure entries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Largest Expense</span>
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            ₹{Math.max(0, ...expenses.map((e) => e.amount)).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Rent & Staff Payroll overheads</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Operational Categories</span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{categories.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Configured business cost channels</p>
        </div>
      </div>

      {/* Filter and Search Bar: Month selector directly after Search */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, #, or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
            />
          </div>

          {/* Month Selector directly after Search (Task 8 & 18) */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:border-[#1552B3] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:border-[#1552B3] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode: Ledger vs Timeline */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('ledger')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'ledger'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-[#1552B3] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No Expenses Logged"
          description="No expenses match your search query or selected month filter."
          actionLabel="Log New Expense"
          onAction={() => setIsModalOpen(true)}
        />
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW (Task 18 & 11 Month -> Date Hierarchy) */
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Expense History Timeline
              </h2>
              <p className="text-[11px] text-gray-400">
                Month-wise and date-wise business operational expenditures
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {filteredExpenses.length} total expenditures
            </span>
          </div>

          <HistoryHierarchy events={historyEvents} />
        </div>
      ) : (
        /* LEDGER VIEW WITH SHORT LIST PRINCIPLE (Task 21) */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Expense Ledger
              </h2>
              <span className="text-[11px] text-gray-400">
                {showAllRecords
                  ? `Showing all ${filteredExpenses.length} records`
                  : `Showing recent ${displayedExpenses.length} of ${filteredExpenses.length} records`}
              </span>
            </div>
            {filteredExpenses.length > 8 && (
              <ActionButton
                variant="ghost"
                size="xs"
                onClick={() => setShowAllRecords(!showAllRecords)}
              >
                {showAllRecords ? 'Show Compact (8)' : `View All (${filteredExpenses.length})`}
              </ActionButton>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {displayedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                    {getCategoryIcon(exp.category)}
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{exp.title}</span>
                      <span className="text-gray-400 font-mono text-[11px]">• {exp.date}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-1 truncate">
                      <span className="font-mono">{exp.expenseNumber}</span> • Mode:{' '}
                      <strong className="text-gray-700 font-mono">{exp.paymentMethod}</strong>
                      {exp.recipient && ` • Recipient: ${exp.recipient}`}
                      {exp.notes && ` • ${exp.notes}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                  <p className="text-sm font-bold font-mono text-rose-600">
                    -₹{exp.amount.toLocaleString('en-IN')}
                  </p>
                  <ActionButton
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    onClick={() => deleteExpense(exp.id)}
                    className="text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>

          {/* Short List Principle Footer */}
          {!showAllRecords && filteredExpenses.length > 8 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <ActionButton
                variant="outline"
                size="xs"
                onClick={() => setShowAllRecords(true)}
              >
                View All {filteredExpenses.length} Expenses
              </ActionButton>
            </div>
          )}
        </div>
      )}

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Record Business Expense</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cost Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expense Title / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly broadband, Cleaning supplies, Showroom AC repair"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:bg-white focus:border-[#1552B3] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient / Vendor</label>
                  <input
                    type="text"
                    placeholder="Payee or Entity"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional tax or voucher note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <ActionButton
                  variant="outline"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  variant="primary"
                  type="submit"
                  icon={Check}
                >
                  Save Expense
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ExpenseManagement;
