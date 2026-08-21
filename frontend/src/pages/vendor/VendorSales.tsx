import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import VendorLayout from '../../components/VendorLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useStore, SaleRecord } from '../../context/StoreContext';
import { isVendorOwner } from '../../utils/vendorUtils';

export const VendorSales: React.FC = () => {
  const { user } = useAuth();
  const { sales } = useStore();

  const vendorName = user?.shopName || user?.name || 'ABC Electronics';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);

  // Filter sales scoped to this vendor
  const vendorSales = useMemo(() => {
    return sales.filter((s) => isVendorOwner(s.vendorName, s.vendorId, user));
  }, [sales, user]);

  const filteredSales = useMemo(() => {
    return vendorSales.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        (s.saleId && s.saleId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.productName && s.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.sku && s.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.brand && s.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPayment = selectedPayment === 'All' || s.paymentMethod === selectedPayment;

      return matchesSearch && matchesPayment;
    });
  }, [vendorSales, searchQuery, selectedPayment]);

  const totalSalesCount = vendorSales.length;
  const totalRevenue = vendorSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalUnitsSold = vendorSales.reduce((sum, s) => sum + s.quantity, 0);
  const avgOrderValue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  return (
    <VendorLayout
      title="Sales History & Counter Transactions"
      subtitle={`Retail sales and inventory deductions recorded for products supplied by ${vendorName}`}
      actions={
        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Sales Log</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Sales Transactions"
            value={totalSalesCount}
            subtitle="Completed retail sales"
            icon={Receipt}
            iconBgColor="bg-blue-50"
            iconColor="text-[#1552B3]"
          />
          <KpiCard
            title="Gross Revenue Generated"
            value={`₹${totalRevenue.toLocaleString()}`}
            subtitle="Lifetime retail turnover"
            icon={TrendingUp}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
          />
          <KpiCard
            title="Units Disbursed"
            value={totalUnitsSold}
            subtitle="Physical units sold"
            icon={Package}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <KpiCard
            title="Avg Transaction Value"
            value={`₹${avgOrderValue.toLocaleString()}`}
            subtitle="Average basket size"
            icon={DollarSign}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search your sales by sale ID, product, or SKU..."
          />

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Payment:</span>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Sales Records Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Sale ID / Date</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Brand & Category</th>
                  <th className="py-3 px-4">Qty Sold</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-gray-400">
                      No sales records found for your supplied products.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 font-mono">{sale.saleId}</p>
                        <span className="text-[10px] text-gray-400">{sale.date}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{sale.productName}</p>
                        <span className="text-[10px] font-mono text-gray-400">{sale.sku}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          {sale.brand && sale.brand !== 'N/A' && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1552B3] text-[10px] font-semibold">
                              {sale.brand}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                            {sale.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {sale.quantity}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        ₹{sale.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 font-mono">
                        ₹{sale.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-700">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={sale.saleStatus} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setReceiptSale(sale)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#1552B3] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>View</span>
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

      {/* Sale Receipt Modal */}
      {receiptSale && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Sale Receipt</h3>
              <p className="text-xs font-mono text-gray-500">{receiptSale.saleId}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Product:</span>
                <span className="font-semibold text-gray-900 text-right">{receiptSale.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Brand / SKU:</span>
                <span className="font-medium text-gray-800">{receiptSale.brand} • {receiptSale.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Vendor:</span>
                <span className="font-semibold text-[#1552B3] text-right">{vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Quantity Sold:</span>
                <span className="font-bold text-gray-900">{receiptSale.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Unit Price:</span>
                <span className="font-mono text-gray-800">₹{receiptSale.unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-sm text-gray-900">
                <span>Total Paid:</span>
                <span className="text-emerald-600 font-mono">₹{receiptSale.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Payment Method:</span>
                <span className="font-medium text-gray-800">{receiptSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Remaining Stock:</span>
                <span className="font-mono font-semibold text-gray-800">{receiptSale.remainingStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Date & Time:</span>
                <span className="text-gray-700">{receiptSale.date}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setReceiptSale(null)}
                className="w-full py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default VendorSales;
