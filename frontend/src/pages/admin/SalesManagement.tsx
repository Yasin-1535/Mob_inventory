import React, { useState, useMemo } from 'react';
import {
  Receipt,
  DollarSign,
  TrendingUp,
  Package,
  Plus,
  X,
  CheckCircle2,
  FileText,
  Printer,
  ShoppingBag,
  User,
  Phone,
  Tag,
  CreditCard,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  AlertCircle,
  Trash2,
  History,
  MoreVertical,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { useStore, SaleRecord } from '../../context/StoreContext';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  ActionButton,
  ActionMenu,
  IconButton,
  SearchBar,
  Select,
  FilterBar,
  EmptyState,
  Modal,
  FormField,
  FormSection,
  HistoryHierarchy,
  HistoryEventItem,
} from '../../components/ui';
import { ProductAutocompleteSelect } from '../../components/ProductAutocompleteSelect';


export interface ISaleCartLine {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export const SalesManagement: React.FC = () => {
  const { sales, products, customers, vendors, createSaleTransaction } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'timeline'>('table');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);

  // New Sale Modal State (Multi-Item POS)
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [buyerType, setBuyerType] = useState<'CUSTOMER' | 'VENDOR'>('CUSTOMER');
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
  const [customerName, setCustomerName] = useState(customers[0]?.name || 'Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.phone || '');
  const [cartLines, setCartLines] = useState<ISaleCartLine[]>(() => [
    {
      sku: products[0]?.sku || '',
      quantity: 1,
      unitPrice: products[0]?.price || 0,
    },
  ]);
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [taxAmount, setTaxAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING' | 'PARTIAL'>('PAID');
  const [saleNotes, setSaleNotes] = useState('');
  const [successInvoiceNum, setSuccessInvoiceNum] = useState<string | null>(null);

  // Add Item to sale cart
  const addCartLine = () => {
    const existingSkus = new Set(cartLines.map((c) => c.sku));
    const nextProd = products.find((p) => !existingSkus.has(p.sku) && p.stock > 0) || products[0];
    if (nextProd) {
      setCartLines((prev) => [
        ...prev,
        {
          sku: nextProd.sku,
          quantity: 1,
          unitPrice: nextProd.price,
        },
      ]);
    }
  };

  // Remove Item from sale cart
  const removeCartLine = (index: number) => {
    if (cartLines.length <= 1) return;
    setCartLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item in sale cart
  const updateCartLine = (index: number, updates: Partial<ISaleCartLine>) => {
    setCartLines((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const updated = { ...it, ...updates };
        if (updates.sku && updates.sku !== it.sku) {
          const newProd = products.find((p) => p.sku === updates.sku);
          if (newProd) {
            updated.unitPrice = newProd.price;
          }
        }
        return updated;
      })
    );
  };

  // Subtotal and Total calculations
  const cartSubtotal = useMemo(() => {
    return cartLines.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  }, [cartLines]);

  const cartTotalAmount = useMemo(() => {
    return Math.max(0, cartSubtotal - (Number(discountAmount) || 0) + (Number(taxAmount) || 0));
  }, [cartSubtotal, discountAmount, taxAmount]);

  // Available months dynamically extracted from sales history (Task 8 & 13)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    sales.forEach((s) => {
      if (s.date) {
        try {
          const d = new Date(s.date);
          if (!isNaN(d.getTime())) {
            monthSet.add(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
          }
        } catch {}
      }
    });
    return ['All', ...Array.from(monthSet)];
  }, [sales]);

  // Available brands in sales history
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    sales.forEach((s) => {
      if (s.brand && s.brand !== 'N/A') brands.add(s.brand);
    });
    return ['All', ...Array.from(brands)];
  }, [sales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (s.saleId && s.saleId.toLowerCase().includes(q)) ||
        (s.productName && s.productName.toLowerCase().includes(q)) ||
        (s.sku && s.sku.toLowerCase().includes(q)) ||
        (s.brand && s.brand.toLowerCase().includes(q)) ||
        (s.soldBy && s.soldBy.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q));

      const matchesBrand = selectedBrand === 'All' || (s.brand && s.brand.toLowerCase() === selectedBrand.toLowerCase());
      const matchesPayment = selectedPayment === 'All' || s.paymentMethod === selectedPayment;
      const matchesStatus =
        selectedStatus === 'All' ||
        s.saleStatus === selectedStatus ||
        s.paymentStatus === selectedStatus;

      let matchesMonth = true;
      if (selectedMonth !== 'All') {
        try {
          const d = new Date(s.date);
          if (!isNaN(d.getTime())) {
            matchesMonth = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) === selectedMonth;
          }
        } catch {
          matchesMonth = false;
        }
      }

      return matchesSearch && matchesBrand && matchesPayment && matchesStatus && matchesMonth;
    });
  }, [sales, searchQuery, selectedMonth, selectedBrand, selectedPayment, selectedStatus]);

  // Timeline events for HistoryHierarchy
  const timelineSalesEvents: HistoryEventItem[] = useMemo(() => {
    return filteredSales.map((s) => ({
      id: s.id,
      date: s.date,
      type: 'SALE',
      title: `${s.productName} (${s.sku})`,
      subtitle: `Invoice: ${s.saleId} • Customer: ${s.customerName || 'Walk-in'} • ${s.paymentMethod}`,
      reference: s.saleId,
      quantityChange: -s.quantity,
      amount: s.totalAmount,
      party: s.customerName || 'Walk-in Customer',
      badgeStatus: s.paymentStatus === 'PAID' ? 'Delivered' : 'Pending',
    }));
  }, [filteredSales]);

  // KPIs
  const totalSalesCount = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalUnitsSold = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const avgOrderValue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartLines.length === 0) return;

    // Validate every line item (Task 1C)
    for (const line of cartLines) {
      const prod = products.find((p) => p.sku === line.sku);
      if (!prod) {
        alert('Invalid product selected in sale items.');
        return;
      }
      if (line.quantity <= 0) {
        alert(`Quantity for "${prod.name}" must be at least 1.`);
        return;
      }
      if (line.quantity > prod.stock) {
        alert(`Insufficient stock for "${prod.name}". Available stock: ${prod.stock}, requested: ${line.quantity}.`);
        return;
      }
    }

    const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
    const finalPartyName = buyerType === 'VENDOR' ? (selectedVendor?.name || customerName) : customerName;
    const finalPartyPhone = buyerType === 'VENDOR' ? (selectedVendor?.phone || customerPhone) : customerPhone;

    const saleItems = cartLines.map((line) => {
      const prod = products.find((p) => p.sku === line.sku) || products[0];
      return {
        product: prod,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      };
    });

    const res = createSaleTransaction({
      buyerType,
      vendorId: buyerType === 'VENDOR' ? (selectedVendor?.id || 'ven-custom') : undefined,
      vendorName: buyerType === 'VENDOR' ? finalPartyName : undefined,
      customerName: finalPartyName,
      customerPhone: finalPartyPhone,
      items: saleItems,
      discountAmount: Number(discountAmount) || 0,
      taxAmount: Number(taxAmount) || 0,
      paymentMethod,
      paymentStatus,
      notes: saleNotes,
    });

    // Sync with backend API if logged in
    try {
      await api.post('/sales', {
        buyerType,
        vendorId: buyerType === 'VENDOR' ? selectedVendor?.id : undefined,
        vendorName: buyerType === 'VENDOR' ? finalPartyName : undefined,
        customerName: finalPartyName,
        customerPhone: finalPartyPhone,
        items: cartLines.map((line) => {
          const prod = products.find((p) => p.sku === line.sku);
          return {
            productId: prod?.id,
            productName: prod?.name || line.sku,
            sku: line.sku,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          };
        }),
        discountAmount: Number(discountAmount) || 0,
        taxAmount: Number(taxAmount) || 0,
        totalAmount: cartTotalAmount,
        paymentMethod,
        paymentStatus,
        saleStatus: 'COMPLETED',
        notes: saleNotes,
      });
    } catch {}

    setSuccessInvoiceNum(res.invoice.invoiceNumber);
    setIsNewSaleOpen(false);
    setSaleNotes('');
    setDiscountAmount('');
    setTaxAmount('');
    setCartLines([{ sku: products[0]?.sku || '', quantity: 1, unitPrice: products[0]?.price || 0 }]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout
      title="Sales & Invoicing"
      subtitle="Point-of-sale transactions, auto-deducting inventory, order records, and receipt vouchers"
      actions={
        <div className="flex items-center space-x-2">
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => setIsNewSaleOpen(true)}
          >
            New Sale (POS)
          </ActionButton>
        </div>
      }
    >
      {/* Success Notification Banner */}
      {successInvoiceNum && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Sale Completed Successfully!</p>
              <p className="text-[11px] text-emerald-700">
                Invoice <strong>{successInvoiceNum}</strong> generated, stock deducted in real-time, and receipt ready.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessInvoiceNum(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total Sales Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle={`${totalSalesCount} completed orders`}
          icon={DollarSign}
          colorScheme="emerald"
        />
        <KpiCard
          title="Units Sold"
          value={totalUnitsSold}
          subtitle="Deducted from warehouse stock"
          icon={Package}
          colorScheme="blue"
        />
        <KpiCard
          title="Avg Order Ticket"
          value={`₹${avgOrderValue.toLocaleString('en-IN')}`}
          subtitle="Net revenue per order"
          icon={TrendingUp}
          colorScheme="indigo"
        />
        <KpiCard
          title="Completed Transactions"
          value={totalSalesCount}
          subtitle="All recorded retail sales"
          icon={Receipt}
          colorScheme="amber"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            enableProductAutocomplete
            products={products}
            placeholder="Search sale ID, customer, product, SKU..."
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Month selector directly next to search (Task 8 & 13) */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3] font-medium"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m === 'All' ? 'All Months' : m}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
          >
            {availableBrands.map((b) => (
              <option key={b} value={b}>
                {b === 'All' ? 'All Brands' : b}
              </option>
            ))}
          </select>

          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
          >
            <option value="All">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
          >
            <option value="All">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'timeline' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Timeline History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sales Content Area */}
      {filteredSales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Sales Transactions Found"
          description="Try adjusting your search criteria or register a new retail sale using the POS action above."
          actionLabel="Create New Sale"
          onAction={() => setIsNewSaleOpen(true)}
        />
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW (Task 13: Month -> Date Hierarchy) */
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Sales Transaction Timeline ({filteredSales.length} records)
              </h3>
              <p className="text-[11px] text-gray-500">Organized by Year → Month → Date</p>
            </div>
          </div>
          <HistoryHierarchy
            events={timelineSalesEvents}
            emptyTitle="No sales found for selected period"
            emptySubtitle="Try selecting another month or clearing search filters."
          />
        </div>
      ) : viewMode === 'table' ? (
        /* DENSE TABLE VIEW */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Sales Records ({filteredSales.length})
            </h2>
            <span className="text-[11px] text-gray-400">Real-time inventory deduction verified</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Transaction ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product & SKU</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(showAllHistory ? filteredSales : filteredSales.slice(0, 8)).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900 font-mono">{sale.saleId}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{sale.date}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-medium text-gray-800">{sale.customerName || 'Walk-in Customer'}</p>
                        {(sale.vendorId || sale.notes?.includes('VENDOR')) && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                            Vendor
                          </span>
                        )}
                      </div>
                      {sale.customerPhone && (
                        <p className="text-[10px] text-gray-400 font-mono">{sale.customerPhone}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900 line-clamp-1">{sale.productName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {sale.sku} • {sale.brand}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900 font-mono">
                      {sale.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      ₹{sale.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                      ₹{sale.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={
                          sale.paymentStatus === 'PAID' || sale.saleStatus === 'COMPLETED'
                            ? 'Delivered'
                            : 'Pending'
                        }
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <ActionButton
                          variant="ghost"
                          size="xs"
                          icon={FileText}
                          onClick={() => setReceiptSale(sale)}
                          tooltip="View Voucher"
                        >
                          Voucher
                        </ActionButton>
                        <ActionMenu
                          items={[
                            {
                              label: 'View Receipt',
                              icon: Eye,
                              onClick: () => setReceiptSale(sale),
                            },
                            {
                              label: 'Print Voucher',
                              icon: Printer,
                              onClick: () => setReceiptSale(sale),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Short List Principle Footer (Task 21) */}
          {filteredSales.length > 8 && (
            <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-xs px-4">
              <span className="text-gray-500">
                {showAllHistory
                  ? `Showing all ${filteredSales.length} sales`
                  : `Showing 8 of ${filteredSales.length} recent sales`}
              </span>
              <button
                type="button"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="font-bold text-[#1552B3] hover:underline cursor-pointer"
              >
                {showAllHistory ? 'Show Short List (8 items)' : `View All (${filteredSales.length}) Sales`}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* CARD-BASED SALES LIST */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllHistory ? filteredSales : filteredSales.slice(0, 8)).map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                    <span className="font-mono font-bold text-xs text-gray-900">{sale.saleId}</span>
                    <StatusBadge
                      status={
                        sale.paymentStatus === 'PAID' || sale.saleStatus === 'COMPLETED'
                          ? 'Delivered'
                          : 'Pending'
                      }
                      size="sm"
                    />
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">
                    {sale.productName}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    SKU: {sale.sku} • {sale.brand}
                  </p>

                  <div className="my-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Buyer:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-800">{sale.customerName || 'Walk-in Customer'}</span>
                        {(sale.vendorId || sale.notes?.includes('VENDOR')) && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                            Vendor
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quantity:</span>
                      <span className="font-mono font-bold text-gray-900">{sale.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unit Price:</span>
                      <span className="font-mono text-gray-700">₹{sale.unitPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-100 font-bold text-sm text-gray-900">
                      <span>Total Amount:</span>
                      <span className="font-mono text-emerald-600">₹{sale.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">{sale.date}</span>
                  <div className="flex items-center gap-1.5">
                    <ActionButton
                      variant="outline"
                      size="xs"
                      icon={FileText}
                      onClick={() => setReceiptSale(sale)}
                    >
                      Voucher
                    </ActionButton>
                    <ActionMenu
                      items={[
                        {
                          label: 'View Receipt',
                          icon: Eye,
                          onClick: () => setReceiptSale(sale),
                        },
                        {
                          label: 'Print Voucher',
                          icon: Printer,
                          onClick: () => setReceiptSale(sale),
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Short List Principle Footer (Task 21) */}
          {filteredSales.length > 8 && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs px-4">
              <span className="text-gray-500">
                {showAllHistory
                  ? `Showing all ${filteredSales.length} sales`
                  : `Showing 8 of ${filteredSales.length} recent sales`}
              </span>
              <button
                type="button"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="font-bold text-[#1552B3] hover:underline cursor-pointer"
              >
                {showAllHistory ? 'Show Short List (8 items)' : `View All (${filteredSales.length}) Sales`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Sale Modal (POS) */}
      <Modal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        title="Create New Point-of-Sale Transaction"
        description="Select item, enter customer details, and calculate retail sale with automatic inventory deduction."
        size="lg"
      >
        <form onSubmit={handleCreateSale} className="space-y-4">
          <FormSection
            title="Buyer Information"
            description="Select whether selling to an external Retail Customer or a registered Vendor (B2B wholesale)"
          >
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Sale Direction / Buyer Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBuyerType('CUSTOMER')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    buyerType === 'CUSTOMER'
                      ? 'bg-blue-50 border-[#1552B3] text-[#1552B3] shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Retail Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBuyerType('VENDOR');
                    const ven = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
                    if (ven) {
                      setCustomerName(ven.name);
                      setCustomerPhone(ven.phone || '');
                    }
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    buyerType === 'VENDOR'
                      ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Vendor (B2B Wholesale)
                </button>
              </div>
            </div>

            {buyerType === 'VENDOR' ? (
              <div className="space-y-3 bg-purple-50/40 p-3 rounded-xl border border-purple-100">
                <FormField label="Select Target Vendor (Buyer)" required helperText="Sale will be logged as Admin → Sold to Vendor">
                  <select
                    value={selectedVendorId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setSelectedVendorId(vId);
                      const ven = vendors.find((v) => v.id === vId);
                      if (ven) {
                        setCustomerName(ven.name);
                        setCustomerPhone(ven.phone || '');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:border-purple-600 focus:outline-none font-medium text-gray-800"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.company || 'Vendor'}) — Contact: {v.phone || 'N/A'}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Vendor Business Name">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      required
                    />
                  </FormField>
                  <FormField label="Vendor Contact / Phone">
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </FormField>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Customer Name" required>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                    required
                  />
                </FormField>

                <FormField label="Customer Contact / Mobile">
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                  />
                </FormField>
              </div>
            )}
          </FormSection>

          <FormSection
            title={`Sale Items (${cartLines.length})`}
            description="Add one or more products to this sale. Stock is deducted upon completion."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Line Items</span>
                <button
                  type="button"
                  onClick={addCartLine}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1552B3] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product Line
                </button>
              </div>

              <div className="space-y-2.5">
                {cartLines.map((line, idx) => {
                  const lineProd = products.find((p) => p.sku === line.sku) || products[0];
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50/90 rounded-xl border border-gray-200 text-xs space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-700">Item #{idx + 1}</span>
                        {cartLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCartLine(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                        <div className="md:col-span-6">
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Product
                          </label>
                          <ProductAutocompleteSelect
                            value={line.sku}
                            products={products}
                            onChange={(selectedProd) => {
                              if (selectedProd) {
                                updateCartLine(idx, {
                                  sku: selectedProd.sku,
                                  unitPrice: selectedProd.price,
                                });
                              }
                            }}
                            placeholder="Type product name, model, brand, or SKU..."
                            showStock
                            showPrice
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Qty (Max: {lineProd?.stock || 0})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={lineProd?.stock || 1}
                            value={line.quantity}
                            onChange={(e) =>
                              updateCartLine(idx, { quantity: Math.max(1, Number(e.target.value)) })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#1552B3]"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Unit Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) =>
                              updateCartLine(idx, { unitPrice: Math.max(0, Number(e.target.value)) })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#1552B3]"
                          />
                        </div>

                        <div className="md:col-span-2 text-right">
                          <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                            Line Total
                          </label>
                          <span className="font-mono font-bold text-gray-900 text-xs block py-1.5">
                            ₹{(line.unitPrice * line.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {(lineProd?.category === 'Mobiles' || lineProd?.mobileType) && (
                        <div className="mt-1 p-2 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] text-blue-700 flex items-center justify-between">
                          <span>📱 Serialized Mobile: {line.quantity} IMEI(s) will be attached for warranty & returns.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-gray-700">
                <span>Subtotal ({cartLines.length} item{cartLines.length > 1 ? 's' : ''}):</span>
                <span className="font-mono text-sm text-gray-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Pricing, Discounts & Taxes"
            description="Adjustment values applied to calculate gross ticket total"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Discount (₹)">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none font-mono"
                />
              </FormField>

              <FormField label="Taxes / GST (₹)">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none font-mono"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <FormField label="Payment Method">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Other">Other / Store Credit</option>
                </select>
              </FormField>

              <FormField label="Payment Status">
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                >
                  <option value="PAID">Paid in Full</option>
                  <option value="PENDING">Pending Payment</option>
                  <option value="PARTIAL">Partial Payment</option>
                </select>
              </FormField>
            </div>

            {/* Total Amount Summary Callout */}
            <div className="mt-4 p-4 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Total Due Amount</span>
                <span className="text-[11px] text-gray-500">Gross total ({cartLines.length} item lines) including adjustments</span>
              </div>
              <span className="text-xl font-black text-[#1552B3] font-mono">
                ₹{cartTotalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </FormSection>

          <FormField label="Transaction Notes (Optional)">
            <input
              type="text"
              placeholder="e.g. Serial / IMEI number, customer remark, or warranty details"
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
            />
          </FormField>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
            <ActionButton
              variant="outline"
              type="button"
              onClick={() => setIsNewSaleOpen(false)}
            >
              Cancel
            </ActionButton>
            <ActionButton variant="primary" type="submit">
              Complete POS Sale
            </ActionButton>
          </div>
        </form>
      </Modal>

      {/* Polished Sale Receipt / Transaction Detail Modal */}
      {receiptSale && (
        <Modal
          isOpen={Boolean(receiptSale)}
          onClose={() => setReceiptSale(null)}
          title="Sales Transaction Voucher"
          description={`Order #${receiptSale.saleId} • Recorded ${receiptSale.date}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Header Callout */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Received</p>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                ₹{receiptSale.totalAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Paid via {receiptSale.paymentMethod}</p>
            </div>

            {/* Line Items Detail */}
            <div className="border border-gray-100 rounded-xl p-3 bg-white space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900">{receiptSale.customerName || 'Walk-in Customer'}</span>
              </div>

              {receiptSale.items && receiptSale.items.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden my-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                      <tr>
                        <th className="py-1.5 px-2.5">Item</th>
                        <th className="py-1.5 px-2 text-center">Qty</th>
                        <th className="py-1.5 px-2.5 text-right">Price</th>
                        <th className="py-1.5 px-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {receiptSale.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2.5">
                            <span className="font-bold text-gray-900">{it.productName}</span>
                            <span className="block text-[10px] font-mono text-gray-400">{it.sku}</span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-gray-800">{it.quantity}</td>
                          <td className="py-1.5 px-2.5 text-right font-mono text-gray-600">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-gray-900">₹{(it.unitPrice * it.quantity).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Item:</span>
                    <span className="font-semibold text-gray-900 text-right">{receiptSale.productName}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">SKU / Brand:</span>
                    <span className="font-mono text-gray-700">
                      {receiptSale.sku} ({receiptSale.brand})
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Quantity Sold:</span>
                    <span className="font-bold text-gray-900 font-mono">{receiptSale.quantity} units</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Unit Selling Price:</span>
                    <span className="font-mono text-gray-700">₹{receiptSale.unitPrice.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              {receiptSale.notes && (
                <div className="flex justify-between pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Notes:</span>
                  <span className="text-gray-700 italic">{receiptSale.notes}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <ActionButton
                variant="outline"
                icon={Printer}
                onClick={handlePrint}
              >
                Print Voucher
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={() => setReceiptSale(null)}
              >
                Done
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default SalesManagement;
