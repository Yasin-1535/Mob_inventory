import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Boxes,
  FileText,
  ShoppingCart,
  CreditCard,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import VendorLayout from '../components/VendorLayout';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { isVendorOwner } from '../utils/vendorUtils';

export const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { products, purchaseRequests, orders, sales, updatePurchaseRequestStatus } = useStore();

  const vendorName = user?.shopName || user?.name || 'ABC Electronics';

  // Vendor scoped items
  const vendorProducts = products.filter((p) => isVendorOwner(p.vendor, undefined, user));

  const vendorRequests = purchaseRequests.filter((r) => isVendorOwner(r.vendorName, undefined, user));

  const vendorSales = sales.filter((s) => isVendorOwner(s.vendorName, s.vendorId, user));

  const totalSuppliedUnits = vendorProducts.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = vendorProducts.filter((p) => p.status === 'Low Stock').length;
  const pendingRequestsCount = vendorRequests.filter((r) => r.status === 'PENDING').length;
  const totalSalesRevenue = vendorSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalGrossEarnings = vendorRequests.reduce((sum, r) => sum + r.totalCost, 0);
  const settledAmount = vendorRequests
    .filter((r) => r.settlementStatus === 'SETTLED')
    .reduce((sum, r) => sum + r.totalCost, 0);
  const pendingDisbursement = totalGrossEarnings - settledAmount;

  return (
    <VendorLayout
      title="Vendor Dashboard"
      subtitle={`Welcome back, ${vendorName} — Manage your supplied catalog, active purchase requests, warehouse inventory, and settlements`}
      actions={
        <Link
          to="/vendor/products"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Package className="w-4 h-4" />
          <span>My Products & Inventory</span>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* KPI Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            title="My Products"
            value={vendorProducts.length}
            subtitle={`${vendorProducts.filter((p) => p.status === 'In Stock').length} Active listings`}
            icon={Package}
            iconBgColor="bg-blue-50"
            iconColor="text-[#1552B3]"
          />
          <KpiCard
            title="My Stock"
            value={`${totalSuppliedUnits.toLocaleString()}`}
            subtitle="Warehouse units"
            icon={Boxes}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <KpiCard
            title="Low Stock"
            value={lowStockCount}
            subtitle="Requires attention"
            icon={Boxes}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            valueColor={lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
          <KpiCard
            title="Pending POs"
            value={pendingRequestsCount}
            subtitle="Awaiting action"
            icon={FileText}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            valueColor={pendingRequestsCount > 0 ? 'text-purple-600' : 'text-gray-900'}
          />
          <KpiCard
            title="Sales"
            value={`₹${totalSalesRevenue.toLocaleString()}`}
            subtitle={`${vendorSales.length} Transactions`}
            icon={Receipt}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
          />
          <KpiCard
            title="Pending Settlements"
            value={`₹${pendingDisbursement.toLocaleString()}`}
            subtitle={`₹${settledAmount.toLocaleString()} Settled`}
            icon={CreditCard}
            iconBgColor="bg-cyan-50"
            iconColor="text-cyan-700"
            valueColor="text-cyan-700"
          />
        </div>

        {/* Supplied Products Table & Active POs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Supplied Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Supplied Products Summary
                  </h3>
                  <p className="text-xs text-gray-500">
                    Active inventory lines supplied by {vendorName}
                  </p>
                </div>
                <Link
                  to="/vendor/products"
                  className="text-xs font-semibold text-[#1552B3] hover:underline inline-flex items-center space-x-1"
                >
                  <span>View All ({vendorProducts.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Retail Price</th>
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {vendorProducts.slice(0, 6).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">
                          {p.sku}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                          ₹{p.price.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-gray-800">
                          {p.stock}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Showing top {Math.min(6, vendorProducts.length)} of {vendorProducts.length} supplied items
              </span>
              <Link
                to="/vendor/products"
                className="text-xs font-semibold text-[#1552B3] hover:underline"
              >
                Manage Supply Catalog →
              </Link>
            </div>
          </div>

          {/* Quick POs & Supplier Links */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">
                  Active Purchase Orders
                </h3>
                <Link
                  to="/vendor/purchase-requests"
                  className="text-xs font-semibold text-[#1552B3] hover:underline"
                >
                  View All
                </Link>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Central warehouse replenishment requests
              </p>

              <div className="space-y-3">
                {vendorRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className={`p-3 rounded-lg border text-xs ${
                      req.status === 'PENDING'
                        ? 'border-amber-200 bg-amber-50/40'
                        : 'border-gray-200 bg-gray-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900 mb-1">
                      <span className="font-mono">{req.requestNumber}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="font-medium text-gray-800">
                      {req.productName} ({req.quantityRequested} units)
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
                      <span className="font-bold text-gray-900 font-mono">
                        ₹{req.totalCost.toLocaleString()}
                      </span>
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => updatePurchaseRequestStatus(req.id, 'ACCEPTED')}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors"
                        >
                          Accept PO
                        </button>
                      )}
                      {req.status === 'ACCEPTED' && (
                        <button
                          onClick={() => updatePurchaseRequestStatus(req.id, 'DISPATCHED')}
                          className="px-2 py-0.5 bg-[#1552B3] hover:bg-[#0f4091] text-white rounded text-[10px] font-bold transition-colors"
                        >
                          Dispatch
                        </button>
                      )}
                      {req.status === 'DISPATCHED' && (
                        <span className="text-[10px] text-blue-600 font-semibold">In Transit</span>
                      )}
                      {req.status === 'DELIVERED' && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <Link
                to="/walkthrough"
                className="w-full inline-flex items-center justify-center py-2 px-3 bg-[#EEF4FF] text-[#1552B3] rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                <span>Vendor Architecture & Flow</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorDashboard;
