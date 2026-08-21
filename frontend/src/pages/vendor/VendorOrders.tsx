import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Eye,
  X,
  Printer,
  DollarSign,
  FileText,
} from 'lucide-react';
import VendorLayout from '../../components/VendorLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../data/mockOrders';
import { isVendorOwner } from '../../utils/vendorUtils';

export const VendorOrders: React.FC = () => {
  const { user } = useAuth();
  const { orders, products } = useStore();

  const vendorName = user?.shopName || user?.name || 'ABC Electronics';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);

  // Identify vendor's products & names
  const vendorProductNames = useMemo(() => {
    const names = new Set<string>();
    products
      .filter((p) => isVendorOwner(p.vendor, undefined, user))
      .forEach((p) => {
        names.add(p.name.toLowerCase());
      });
    return names;
  }, [products, user]);

  // Filter orders containing items supplied by this vendor
  const vendorOrders = useMemo(() => {
    return orders
      .map((order) => {
        const matchingItems = order.items.filter((item) =>
          vendorProductNames.has(item.productName.toLowerCase())
        );

        if (matchingItems.length === 0) return null;

        const vendorSubtotal = matchingItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          ...order,
          items: matchingItems,
          totalAmount: vendorSubtotal,
        };
      })
      .filter((o): o is Order => o !== null);
  }, [orders, vendorProductNames]);

  const filteredOrders = useMemo(() => {
    return vendorOrders.filter((o) => {
      const matchesSearch =
        !searchQuery ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatusTab === 'All' || o.status === selectedStatusTab;

      return matchesSearch && matchesStatus;
    });
  }, [vendorOrders, searchQuery, selectedStatusTab]);

  // KPIs
  const totalOrdersCount = vendorOrders.length;
  const pendingOrdersCount = vendorOrders.filter(
    (o) => o.status === 'Processing' || o.status === 'Confirmed'
  ).length;
  const deliveredOrdersCount = vendorOrders.filter((o) => o.status === 'Delivered').length;
  const totalRevenue = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <VendorLayout
      title="Vendor Item Order Tracker"
      subtitle={`Customer sales orders & warehouse dispatch status for products supplied by ${vendorName}`}
    >
      <div className="space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Customer Orders"
            value={totalOrdersCount}
            subtitle="Containing your items"
            icon={ShoppingCart}
            iconBgColor="bg-blue-50"
            iconColor="text-[#1552B3]"
          />
          <KpiCard
            title="Pending Dispatch"
            value={pendingOrdersCount}
            subtitle="Processing in central hub"
            icon={Clock}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            valueColor={pendingOrdersCount > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
          <KpiCard
            title="Fulfilled & Delivered"
            value={deliveredOrdersCount}
            subtitle="Completed customer deliveries"
            icon={CheckCircle2}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Gross Order Volume"
            value={`₹${totalRevenue.toLocaleString()}`}
            subtitle="Supplied items revenue"
            icon={DollarSign}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </div>

        {/* Filter Bar & Tabs */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search orders by order # or product name..."
          />

          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
            {['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatusTab(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedStatusTab === status
                      ? 'bg-[#1552B3] text-white shadow-2xs'
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
                  <th className="py-3 px-4">Supplied Items</th>
                  <th className="py-3 px-4">Order Value</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400">
                      No orders found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-gray-800">{item.productName}</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {order.date}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveOrderModal(order)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-[#1552B3] hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Packing Slip</span>
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

      {/* Order Packing Slip Modal */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Vendor Item Dispatch Slip
                  </h3>
                  <p className="text-[11px] font-mono text-gray-500">
                    {activeOrderModal.orderNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveOrderModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 text-[11px]">Fulfillment Hub</span>
                  <p className="font-semibold text-gray-900">Smart Inventory Central Warehouse</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px]">Order Placed Date</span>
                  <p className="font-mono text-gray-900">{activeOrderModal.date}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px]">Payment Method</span>
                  <p className="font-semibold text-gray-900">{activeOrderModal.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px]">Fulfillment Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={activeOrderModal.status} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Supplied Items Breakdown</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeOrderModal.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                            ₹{item.price.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
                <span className="font-bold text-blue-900">Total Supplied Value:</span>
                <span className="text-base font-mono font-bold text-[#1552B3]">
                  ₹{activeOrderModal.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Packing Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOrderModal(null)}
                className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default VendorOrders;
