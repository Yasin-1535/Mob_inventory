import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  X,
  Package,
  List,
  Eye,
} from 'lucide-react';
import { useStore, InvoiceItem } from '../../context/StoreContext';
import AdminLayout from '../../components/AdminLayout';
import {
  ActionButton,
  ActionMenu,
  HistoryHierarchy,
  HistoryEventItem,
  StatusBadge,
  EmptyState,
} from '../../components/ui';

export const InvoiceManagement: React.FC = () => {
  const { invoices } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // Available months derived from actual invoice timestamps
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.date) {
        try {
          const d = new Date(inv.date);
          if (!isNaN(d.getTime())) {
            monthsSet.add(
              d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            );
          }
        } catch {}
      }
    });
    return Array.from(monthsSet);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customerPhone && inv.customerPhone.includes(searchTerm));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' ? inv.paymentStatus === 'PAID' : inv.paymentStatus !== 'PAID');

      let matchesMonth = true;
      if (selectedMonth !== 'ALL') {
        try {
          const d = new Date(inv.date);
          const mStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          matchesMonth = mStr === selectedMonth;
        } catch {
          matchesMonth = false;
        }
      }

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [invoices, searchTerm, statusFilter, selectedMonth]);

  // Short list principle: default 8 records
  const displayedInvoices = showAllRecords
    ? filteredInvoices
    : filteredInvoices.slice(0, 8);

  // Timeline events for HistoryHierarchy
  const historyEvents = useMemo<HistoryEventItem[]>(() => {
    return filteredInvoices.map((inv) => ({
      id: inv.id,
      date: inv.date,
      type: 'SALE',
      title: `Invoice #${inv.invoiceNumber} • ${inv.customerName}`,
      subtitle: `${inv.items.length} line item(s) • Method: ${inv.paymentMethod} ${inv.balanceAmount > 0 ? `• Balance Due: ₹${inv.balanceAmount.toLocaleString('en-IN')}` : '• Paid in full'}`,
      badgeText: inv.paymentStatus,
      badgeStatus: inv.paymentStatus === 'PAID' ? 'Delivered' : 'Pending',
      amount: inv.grandTotal,
      party: inv.customerName,
      reference: inv.invoiceNumber,
    }));
  }, [filteredInvoices]);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const paidInvoicesCount = invoices.filter((inv) => inv.paymentStatus === 'PAID').length;
  const pendingInvoicesCount = invoices.filter((inv) => inv.paymentStatus !== 'PAID').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout
      title="Invoices & Billing"
      subtitle="View, manage, and print sales invoices, tax receipts, and customer billing statements"
    >
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Invoiced Amount</span>
            <div className="w-9 h-9 bg-blue-50 text-[#1552B3] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">₹{totalInvoiced.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500 mt-1">{invoices.length} invoices generated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid Invoices</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{paidInvoicesCount}</p>
          <p className="text-[11px] text-gray-500 mt-1">Cleared in full</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unpaid / Balance Due</span>
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{pendingInvoicesCount}</p>
          <p className="text-[11px] text-gray-500 mt-1">Pending collections</p>
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
              placeholder="Search invoice # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
            />
          </div>

          {/* Month Selector directly after Search (Task 8 & 15) */}
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

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:border-[#1552B3] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid in Full</option>
              <option value="PENDING">Balance Pending</option>
            </select>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
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
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Invoices Found"
          description="No invoice records match your search criteria or selected month."
        />
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW (Month -> Date Hierarchy) */
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Invoice History Timeline
              </h2>
              <p className="text-[11px] text-gray-400">
                Month-wise and date-wise billing transactions
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {filteredInvoices.length} total entries
            </span>
          </div>

          <HistoryHierarchy events={historyEvents} />
        </div>
      ) : (
        /* LIST VIEW WITH SHORT LIST PRINCIPLE */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Sales Invoices Directory
              </h2>
              <span className="text-[11px] text-gray-400">
                {showAllRecords
                  ? `Showing all ${filteredInvoices.length} invoices`
                  : `Showing recent ${displayedInvoices.length} of ${filteredInvoices.length} invoices`}
              </span>
            </div>
            {filteredInvoices.length > 8 && (
              <ActionButton
                variant="ghost"
                size="xs"
                onClick={() => setShowAllRecords(!showAllRecords)}
              >
                {showAllRecords ? 'Show Compact (8)' : `View All (${filteredInvoices.length})`}
              </ActionButton>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {displayedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#1552B3] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{inv.invoiceNumber}</span>
                      <span className="text-gray-400 font-mono text-[11px]">• {inv.date}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-700">
                        {inv.paymentMethod}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 mt-1 truncate">
                      Customer: {inv.customerName}
                    </p>
                    <p className="text-gray-500 truncate">
                      {inv.items.length} item(s) {inv.customerPhone ? `• Phone: ${inv.customerPhone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold font-mono text-gray-900">
                      ₹{inv.grandTotal.toLocaleString('en-IN')}
                    </p>
                    {inv.balanceAmount > 0 ? (
                      <p className="text-[10px] text-rose-600 font-semibold font-mono">
                        Due: ₹{inv.balanceAmount.toLocaleString('en-IN')}
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-600 font-semibold">Cleared</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ActionButton
                      variant="outline"
                      size="xs"
                      icon={Eye}
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      View
                    </ActionButton>

                    <ActionButton
                      variant="secondary"
                      size="xs"
                      icon={Printer}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setTimeout(() => window.print(), 200);
                      }}
                    >
                      Print
                    </ActionButton>

                    <ActionMenu
                      size="xs"
                      actions={[
                        {
                          label: 'Print Invoice',
                          icon: Printer,
                          onClick: () => {
                            setSelectedInvoice(inv);
                            setTimeout(() => window.print(), 200);
                          },
                        },
                        {
                          label: 'View Detailed Receipt',
                          icon: Eye,
                          onClick: () => setSelectedInvoice(inv),
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Short List Principle Footer */}
          {!showAllRecords && filteredInvoices.length > 8 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <ActionButton
                variant="outline"
                size="xs"
                onClick={() => setShowAllRecords(true)}
              >
                View All {filteredInvoices.length} Invoices
              </ActionButton>
            </div>
          )}
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            {/* Header controls (hidden in print) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6 print:hidden">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Invoice Document Preview
              </span>
              <div className="flex items-center gap-2">
                <ActionButton
                  variant="primary"
                  size="sm"
                  icon={Printer}
                  onClick={handlePrint}
                >
                  Print Invoice
                </ActionButton>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div id="printable-invoice" className="space-y-6 text-gray-800">
              <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">SMART INVENTORY</h1>
                  <p className="text-xs text-gray-500 mt-1">Electronics & Smartphone Retail Hub</p>
                  <p className="text-xs text-gray-500">GSTIN: 27AABCS1429B1Z8</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 font-mono">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">Date: {selectedInvoice.date}</p>
                  <span className={`inline-block mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedInvoice.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 uppercase font-bold text-[10px] tracking-wider block mb-1">Billed To</span>
                  <p className="font-bold text-gray-900 text-sm">{selectedInvoice.customerName}</p>
                  {selectedInvoice.customerPhone && (
                    <p className="text-gray-600 mt-0.5">Phone: {selectedInvoice.customerPhone}</p>
                  )}
                  {selectedInvoice.customerAddress && (
                    <p className="text-gray-600 mt-0.5">{selectedInvoice.customerAddress}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-gray-400 uppercase font-bold text-[10px] tracking-wider block mb-1">Payment Method</span>
                  <p className="font-bold text-gray-900">{selectedInvoice.paymentMethod}</p>
                  <p className="text-gray-500 mt-0.5">Status: {selectedInvoice.paymentStatus}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{item.productName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{item.sku}</p>
                        </td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900">₹{item.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>GST Tax:</span>
                      <span className="font-mono">₹{selectedInvoice.taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{selectedInvoice.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#1552B3]">₹{selectedInvoice.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Amount Paid:</span>
                    <span className="font-mono text-emerald-600">₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedInvoice.balanceAmount > 0 && (
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>Balance Due:</span>
                      <span className="font-mono">₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Terms */}
              <div className="border-t border-gray-100 pt-4 text-[11px] text-gray-400 text-center">
                <p>Thank you for your business! Goods once sold are covered under standard manufacturer warranty terms.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default InvoiceManagement;
