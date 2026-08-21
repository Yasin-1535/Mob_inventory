import React, { useState } from 'react';
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
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../data/mockOrders';

export const OrderManagement: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatusTab === 'All' || o.status === selectedStatusTab;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const processingOrders = orders.filter((o) => o.status === 'Processing' || o.status === 'Confirmed').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const STATUS_OPTIONS: Order['status'][] = [
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];

  return (
    <AdminLayout
      title="Customer Order Fulfillment"
      subtitle="Track customer shipments, process dispatch workflows, and generate invoices"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">All-Time Orders</p>
            <p className="text-xl font-bold text-gray-900 mt-1 font-mono">{totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Pending Dispatch</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{processingOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Fulfilled & Delivered</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{deliveredOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Gross Merchandise Value</p>
            <p className="text-xl font-bold text-[#1552B3] mt-1">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order # or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
            {['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatusTab(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedStatusTab === status
                      ? 'bg-[#1552B3] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Placed Date</th>
                  <th className="py-3 px-4">Status Transition</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No orders found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                        <span className="text-[10px] text-gray-400">
                          Via {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-gray-600 text-[11px]">
                              {item.quantity}x {item.productName}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[10px] text-gray-400 italic">
                              +{order.items.length - 2} more items
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {order.date}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(
                              order.id,
                              e.target.value as Order['status']
                            )
                          }
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'Shipped'
                              ? 'bg-blue-50 text-[#1552B3] border-blue-200'
                              : order.status === 'Processing' || order.status === 'Confirmed'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveInvoiceOrder(order)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Official Tax Invoice
                  </h2>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {activeInvoiceOrder.orderNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">
                    Billed To
                  </span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {activeInvoiceOrder.customerName}
                  </p>
                  <p className="text-gray-500 text-[11px]">Authorized Customer</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">
                    Order Date
                  </span>
                  <p className="font-mono text-gray-900 mt-0.5">
                    {activeInvoiceOrder.date}
                  </p>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#1552B3] text-[10px] font-semibold">
                    {activeInvoiceOrder.status}
                  </span>
                </div>
              </div>

              {/* Items list */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px]">
                    {activeInvoiceOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-gray-900">
                          {item.productName}
                        </td>
                        <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right">₹{item.price.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="space-y-1 text-right pt-2">
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Subtotal:</span>
                  <span>₹{activeInvoiceOrder.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>GST (Included 18%):</span>
                  <span>₹{Math.round(activeInvoiceOrder.totalAmount * 0.18).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Delivery Charges:</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-[#1552B3]">
                    ₹{activeInvoiceOrder.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => alert('Printing receipt preview...')}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="px-4 py-1.5 bg-[#1552B3] text-white text-xs font-semibold rounded-lg hover:bg-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default OrderManagement;
