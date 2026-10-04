import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  FileText,
  Eye,
  X,
  Printer,
  Calendar,
  CreditCard,
  User,
  Filter,
  Check,
  Ban,
  ArrowRight,
  History,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../data/mockOrders';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  StatusSelect,
  ActionButton,
  ActionMenu,
  IconButton,
  SearchBar,
  Select,
  FilterBar,
  EmptyState,
  Modal,
  Tabs,
  HistoryHierarchy,
  HistoryEventItem,
} from '../../components/ui';

export const OrderManagement: React.FC = () => {
  const { orders, updateOrderStatus, products } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'duration'>('table');
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  const STATUS_OPTIONS: Order['status'][] = [
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q));

      const matchesStatus =
        selectedStatusTab === 'All' ||
        o.status.toLowerCase() === selectedStatusTab.toLowerCase();

      const matchesPayment =
        selectedPaymentFilter === 'All' ||
        o.paymentMethod.toLowerCase() === selectedPaymentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, selectedStatusTab, selectedPaymentFilter]);

  // Convert to History Hierarchy events (Task 11 & 15: Year -> Month -> Date -> Events)
  const historyEvents = useMemo<HistoryEventItem[]>(() => {
    return filteredOrders.map((o) => ({
      id: o.id,
      date: o.date,
      type: 'ORDER',
      title: `${o.orderNumber} — ${o.customerName}`,
      subtitle: o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
      badgeStatus: o.status,
      badgeText: o.status,
      amount: o.totalAmount,
      reference: o.orderNumber,
      party: o.customerName,
      meta: `Payment: ${o.paymentMethod}`,
    }));
  }, [filteredOrders]);

  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (o) => o.status === 'Processing' || o.status === 'Confirmed'
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const handlePrintInvoice = () => {
    window.print();
  };

  const getRowActionItems = (order: Order) => {
    const isDelivered = order.status === 'Delivered';
    const isCancelled = order.status === 'Cancelled';
    const isProcessing = order.status === 'Processing' || order.status === 'Confirmed';
    const isShipped = order.status === 'Shipped';

    return [
      {
        label: 'View Order Details',
        icon: Eye,
        onClick: () => setSelectedDetailOrder(order),
      },
      {
        label: 'View Tax Invoice',
        icon: FileText,
        onClick: () => setActiveInvoiceOrder(order),
      },
      {
        label: 'Mark as Shipped',
        icon: Truck,
        disabled: !isProcessing,
        disabledTooltip: isDelivered ? 'Order already delivered' : 'Can only ship processing orders',
        onClick: () => updateOrderStatus(order.id, 'Shipped'),
      },
      {
        label: 'Mark as Delivered',
        icon: CheckCircle2,
        variant: 'success' as const,
        disabled: !isShipped,
        disabledTooltip: isDelivered ? 'Order already delivered' : 'Order must be shipped first',
        onClick: () => updateOrderStatus(order.id, 'Delivered'),
      },
      {
        label: 'Cancel Order',
        icon: Ban,
        variant: 'danger' as const,
        disabled: isDelivered || isCancelled,
        disabledTooltip: isDelivered
          ? 'Cannot cancel a delivered order'
          : isCancelled
          ? 'Order is already cancelled'
          : undefined,
        onClick: () => {
          if (window.confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
            updateOrderStatus(order.id, 'Cancelled');
          }
        },
      },
    ];
  };

  return (
    <AdminLayout
      title="Order Management & Fulfillment"
      subtitle="Track customer order dispatch stages, delivery progress, order slips, and tax invoices"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Orders"
            value={totalOrders}
            subtitle="All recorded retail orders"
            icon={ShoppingCart}
            colorScheme="blue"
          />
          <KpiCard
            title="Pending Dispatch"
            value={processingOrders}
            subtitle="Confirmed & processing items"
            icon={Clock}
            colorScheme="amber"
          />
          <KpiCard
            title="Fulfilled & Delivered"
            value={deliveredOrders}
            subtitle="Completed customer orders"
            icon={CheckCircle2}
            colorScheme="emerald"
          />
          <KpiCard
            title="Gross Merchandise Value"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            subtitle="Total value of orders"
            icon={Package}
            colorScheme="indigo"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              enableProductAutocomplete
              products={products}
              placeholder="Search by order #, customer, or items..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={selectedPaymentFilter}
              onChange={(e) => setSelectedPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              <option value="All">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>

            {/* Duration View Toggle */}
            <div className="col-span-2 sm:col-span-1 flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode((prev) => (prev === 'duration' ? 'table' : 'duration'))}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer w-full sm:w-auto ${
                  viewMode === 'duration' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Duration"
              >
                <History className="w-3.5 h-3.5" />
                <span>Duration</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 border-b border-gray-200 scrollbar-none">
          {['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatusTab(status)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatusTab === status
                  ? 'bg-[#1552B3] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === 'All' ? 'All Orders' : status}
            </button>
          ))}
        </div>

        {/* Orders Content Area */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No Orders Found"
            description="No orders match your filter criteria. Try clearing search keywords or selecting all statuses."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedStatusTab('All');
              setSelectedPaymentFilter('All');
            }}
          />
        ) : viewMode === 'duration' ? (
          /* DURATION HIERARCHY */
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Order Duration & History ({filteredOrders.length} records)
                </h3>
                <p className="text-[11px] text-gray-500">Organized by Year → Month → Date</p>
              </div>
            </div>
            <HistoryHierarchy
              events={historyEvents}
              emptyTitle="No orders in this period"
              emptySubtitle="Try adjusting your filter or search keywords."
            />
          </div>
        ) : (
          /* DENSE TABLE VIEW WITH COLOR-CODED STATUS SELECTOR */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Order Records ({filteredOrders.length})
              </h2>
              <span className="text-[11px] text-gray-400">
                Fulfillment status auto-notifies order tracking
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Order Ref & Date</th>
                    <th className="py-3 px-4">Customer Party</th>
                    <th className="py-3 px-4">Ordered Items</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-center">Fulfillment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 font-mono">{order.orderNumber}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{order.date}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                        <p className="text-[10px] text-gray-400">Retail Client</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-gray-700 text-[11px]">
                              <span className="font-bold font-mono">{item.quantity}x</span>{' '}
                              {item.productName}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[10px] text-gray-400 italic">
                              +{order.items.length - 2} additional item(s)
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 text-sm">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {order.paymentMethod}
                        </span>
                      </td>
                      {/* COLOR-CODED STATUS SELECTOR */}
                      <td className="py-3 px-4 text-center">
                        <StatusSelect
                          value={order.status}
                          options={STATUS_OPTIONS}
                          onChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                        />
                      </td>
                      {/* STANDARDIZED ROW ACTIONS: Invoice, Details, More */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <ActionButton
                            variant="ghost"
                            size="xs"
                            icon={Eye}
                            title="View Order Details"
                            onClick={() => setSelectedDetailOrder(order)}
                          >
                            <span className="hidden xl:inline">Details</span>
                          </ActionButton>
                          <ActionButton
                            variant="outline"
                            size="xs"
                            icon={FileText}
                            title="View Invoice"
                            onClick={() => setActiveInvoiceOrder(order)}
                          >
                            <span className="hidden sm:inline">Invoice</span>
                          </ActionButton>
                          <ActionMenu
                            size="xs"
                            items={getRowActionItems(order)}
                            triggerAriaLabel={`Actions for ${order.orderNumber}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedDetailOrder && (
        <Modal
          isOpen={Boolean(selectedDetailOrder)}
          onClose={() => setSelectedDetailOrder(null)}
          title={`Order Details — ${selectedDetailOrder.orderNumber}`}
          description={`Placed on ${selectedDetailOrder.date} by ${selectedDetailOrder.customerName}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Fulfillment Status
                </span>
                <div className="mt-1">
                  <StatusSelect
                    value={selectedDetailOrder.status}
                    options={STATUS_OPTIONS}
                    onChange={(newStatus) => {
                      updateOrderStatus(selectedDetailOrder.id, newStatus);
                      setSelectedDetailOrder({ ...selectedDetailOrder, status: newStatus });
                    }}
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Order Total
                </span>
                <span className="text-lg font-black text-[#1552B3] font-mono">
                  ₹{selectedDetailOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedDetailOrder.customerName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-medium text-slate-800">{selectedDetailOrder.paymentMethod}</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-slate-500 block font-semibold">Items List:</span>
                {selectedDetailOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-800 font-medium">
                      {it.quantity}x {it.productName}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(it.quantity * it.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <ActionButton
                variant="outline"
                icon={FileText}
                onClick={() => {
                  const target = selectedDetailOrder;
                  setSelectedDetailOrder(null);
                  setActiveInvoiceOrder(target);
                }}
              >
                Open Tax Invoice
              </ActionButton>
              <ActionButton variant="primary" onClick={() => setSelectedDetailOrder(null)}>
                Done
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Modal */}
      {activeInvoiceOrder && (
        <Modal
          isOpen={Boolean(activeInvoiceOrder)}
          onClose={() => setActiveInvoiceOrder(null)}
          title="Tax Invoice & Order Receipt"
          description={`Order #${activeInvoiceOrder.orderNumber} • ${activeInvoiceOrder.date}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Billed Customer
                </span>
                <p className="font-bold text-slate-900 mt-0.5 text-sm">
                  {activeInvoiceOrder.customerName}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Payment Mode: {activeInvoiceOrder.paymentMethod}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Order Status
                </span>
                <div className="mt-1 sm:flex sm:justify-end">
                  <StatusSelect
                    value={activeInvoiceOrder.status}
                    options={STATUS_OPTIONS}
                    onChange={(newStatus) => {
                      updateOrderStatus(activeInvoiceOrder.id, newStatus);
                      setActiveInvoiceOrder({ ...activeInvoiceOrder, status: newStatus });
                    }}
                  />
                </div>
                <p className="text-slate-400 font-mono text-[10px] mt-1">
                  {activeInvoiceOrder.date}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeInvoiceOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-900">{item.productName}</td>
                      <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        ₹{item.price.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono">
                  ₹{activeInvoiceOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (Included):</span>
                <span className="font-mono">
                  ₹{Math.round(activeInvoiceOrder.totalAmount * 0.18).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping / Delivery:</span>
                <span className="text-emerald-700 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2 mt-1">
                <span>Grand Total:</span>
                <span className="text-[#1552B3] font-mono">
                  ₹{activeInvoiceOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <ActionButton variant="outline" icon={Printer} onClick={handlePrintInvoice}>
                Print Invoice
              </ActionButton>
              <ActionButton variant="primary" onClick={() => setActiveInvoiceOrder(null)}>
                Done
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default OrderManagement;
