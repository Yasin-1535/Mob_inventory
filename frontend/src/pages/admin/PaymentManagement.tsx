import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  X,
  Wallet,
  Building,
  Calendar,
  List,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useStore, PaymentItem } from '../../context/StoreContext';
import AdminLayout from '../../components/AdminLayout';
import {
  ActionButton,
  HistoryHierarchy,
  HistoryEventItem,
  EmptyState,
  StatusBadge,
} from '../../components/ui';

export const PaymentManagement: React.FC = () => {
  const { payments, addPaymentRecord, sales, purchaseRequests } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RECEIPT' | 'DISBURSEMENT'>('ALL');
  const [viewMode, setViewMode] = useState<'ledger' | 'timeline'>('ledger');
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [paymentType, setPaymentType] = useState<'RECEIPT' | 'DISBURSEMENT'>('RECEIPT');
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentItem['paymentMethod']>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Extract available months dynamically from actual payment records
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    payments.forEach((p) => {
      if (p.paymentDate) {
        try {
          const d = new Date(p.paymentDate);
          if (!isNaN(d.getTime())) {
            monthsSet.add(
              d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            );
          }
        } catch {}
      }
    });
    return Array.from(monthsSet);
  }, [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'ALL' || p.paymentType === typeFilter;

      let matchesMonth = true;
      if (selectedMonth !== 'ALL') {
        try {
          const d = new Date(p.paymentDate);
          const mStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          matchesMonth = mStr === selectedMonth;
        } catch {
          matchesMonth = false;
        }
      }

      return matchesSearch && matchesType && matchesMonth;
    });
  }, [payments, searchTerm, typeFilter, selectedMonth]);

  // Short list vs full list (Task 21 Short List Principle: default 8 records)
  const displayedPayments = showAllRecords
    ? filteredPayments
    : filteredPayments.slice(0, 8);

  // History events for Timeline view
  const historyEvents = useMemo<HistoryEventItem[]>(() => {
    return filteredPayments.map((p) => {
      const isReceipt = p.paymentType === 'RECEIPT';
      return {
        id: p.id,
        date: p.paymentDate,
        type: 'PAYMENT',
        title: `${isReceipt ? 'Customer Receipt' : 'Supplier Settlement'} • ${p.partyName}`,
        subtitle: `${p.paymentNumber} • Mode: ${p.paymentMethod} • Ref: ${p.referenceNumber} ${p.notes ? `• ${p.notes}` : ''}`,
        badgeText: isReceipt ? 'Inbound Receipt' : 'Disbursement',
        badgeStatus: isReceipt ? 'Delivered' : 'Pending',
        amount: isReceipt ? p.amount : -p.amount,
        reference: p.referenceNumber,
        party: p.partyName,
      };
    });
  }, [filteredPayments]);

  const totalReceipts = payments
    .filter((p) => p.paymentType === 'RECEIPT')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDisbursements = payments
    .filter((p) => p.paymentType === 'DISBURSEMENT')
    .reduce((sum, p) => sum + p.amount, 0);

  // Outstanding Receivables from Sales
  const customerReceivables = sales
    .filter((s) => s.paymentStatus === 'PENDING')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // Outstanding Payables from Purchases
  const supplierPayables = purchaseRequests
    .filter((p) => p.settlementStatus === 'PENDING')
    .reduce((sum, p) => sum + p.totalCost, 0);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !amount) return;

    addPaymentRecord({
      paymentType,
      partyName,
      partyType,
      amount: Number(amount),
      paymentMethod,
      referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-4)}`,
      paymentDate,
      notes,
    });

    setIsModalOpen(false);
    setPartyName('');
    setAmount('');
    setReferenceNumber('');
    setNotes('');
  };

  return (
    <AdminLayout
      title="Payments & Cash Flow"
      subtitle="Track customer receipts, supplier disbursements, and outstanding receivables & payables"
      actions={
        <ActionButton
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Record Payment
        </ActionButton>
      }
    >
      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Received</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">₹{totalReceipts.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500 mt-1">Customer payments collected</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Paid Out</span>
            <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">₹{totalDisbursements.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500 mt-1">Supplier settlements disbursed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To Receive (Receivables)</span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">₹{customerReceivables.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500 mt-1">Pending customer collections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To Pay (Payables)</span>
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">₹{supplierPayables.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500 mt-1">Pending supplier invoices</p>
        </div>
      </div>

      {/* Filter and Search Bar: Month directly after Search */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search party, payment #, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
            />
          </div>

          {/* Month Selector directly after Search (Task 8 & 17) */}
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

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:border-[#1552B3] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Payment Types</option>
              <option value="RECEIPT">Customer Receipts (In)</option>
              <option value="DISBURSEMENT">Supplier Settlements (Out)</option>
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
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Payment Records Found"
          description="No transaction records match the selected month or search criteria."
          actionLabel="Record New Payment"
          onAction={() => setIsModalOpen(true)}
        />
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW (Task 17 & 11 Month -> Date Hierarchy) */
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Payment History Timeline
              </h2>
              <p className="text-[11px] text-gray-400">
                Month-wise and date-wise cash flow transaction chronology
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {filteredPayments.length} total entries
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
                Payment Ledger
              </h2>
              <span className="text-[11px] text-gray-400">
                {showAllRecords
                  ? `Showing all ${filteredPayments.length} records`
                  : `Showing recent ${displayedPayments.length} of ${filteredPayments.length} records`}
              </span>
            </div>
            {filteredPayments.length > 8 && (
              <ActionButton
                variant="ghost"
                size="xs"
                onClick={() => setShowAllRecords(!showAllRecords)}
              >
                {showAllRecords ? 'Show Compact (8)' : `View All (${filteredPayments.length})`}
              </ActionButton>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {displayedPayments.map((p) => {
              const isReceipt = p.paymentType === 'RECEIPT';
              return (
                <div
                  key={p.id}
                  className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isReceipt ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {isReceipt ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{p.partyName}</span>
                        <span className="text-gray-400 font-mono text-[11px]">
                          • {p.paymentDate}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isReceipt
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isReceipt ? 'Customer Receipt' : 'Supplier Settlement'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-700">
                          {p.paymentMethod}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1 truncate">
                        <span className="font-mono">{p.paymentNumber}</span> • Ref:{' '}
                        <span className="font-mono">{p.referenceNumber}</span>{' '}
                        {p.notes ? `• ${p.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <p
                      className={`text-sm font-bold font-mono ${
                        isReceipt ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isReceipt ? '+' : '-'}₹{p.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-gray-400">Payment Settled</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Short List Principle Footer */}
          {!showAllRecords && filteredPayments.length > 8 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <ActionButton
                variant="outline"
                size="xs"
                onClick={() => setShowAllRecords(true)}
              >
                View All {filteredPayments.length} Transactions
              </ActionButton>
            </div>
          )}
        </div>
      )}

      {/* New Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 text-[#1552B3] rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Record Payment Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('RECEIPT');
                    setPartyType('CUSTOMER');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    paymentType === 'RECEIPT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Payment Received (In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('DISBURSEMENT');
                    setPartyType('SUPPLIER');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    paymentType === 'DISBURSEMENT'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Payment Made (Out)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {partyType === 'CUSTOMER' ? 'Customer Name' : 'Supplier Name'}
                </label>
                <input
                  type="text"
                  placeholder={partyType === 'CUSTOMER' ? 'e.g. Rahul Sharma' : 'e.g. ABC Electronics'}
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reference # (Optional)</label>
                  <input
                    type="text"
                    placeholder="Invoice # or UTR"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:bg-white focus:border-[#1552B3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via HDFC Bank, partial settlement"
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
                  Save Entry
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PaymentManagement;
