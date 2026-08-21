import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Receipt,
  DollarSign,
  TrendingUp,
  Package,
  Download,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore, SaleRecord } from '../../context/StoreContext';

export const SalesManagement: React.FC = () => {
  const { sales } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);

  // Available brands in sales history
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    sales.forEach((s) => {
      if (s.brand && s.brand !== 'N/A') brands.add(s.brand);
    });
    return ['All', ...Array.from(brands)];
  }, [sales]);

  // Available vendors in sales history
  const availableVendors = useMemo(() => {
    const vendorsSet = new Set<string>();
    sales.forEach((s) => {
      if (s.vendorName && s.vendorName !== 'N/A') vendorsSet.add(s.vendorName);
    });
    return ['All', ...Array.from(vendorsSet)];
  }, [sales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        (s.saleId && s.saleId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.productName && s.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.sku && s.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.brand && s.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.vendorName && s.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.soldBy && s.soldBy.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesBrand = selectedBrand === 'All' || (s.brand && s.brand.toLowerCase() === selectedBrand.toLowerCase());
      const matchesVendor =
        selectedVendor === 'All' ||
        (s.vendorName && s.vendorName.toLowerCase() === selectedVendor.toLowerCase());
      const matchesPayment = selectedPayment === 'All' || s.paymentMethod === selectedPayment;

      return matchesSearch && matchesBrand && matchesVendor && matchesPayment;
    });
  }, [sales, searchQuery, selectedBrand, selectedVendor, selectedPayment]);

  // KPIs
  const totalSalesCount = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalUnitsSold = sales.reduce((sum, s) => sum + s.quantity, 0);
  const avgOrderValue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  return (
    <AdminLayout
      title="Sales History & Retail Transactions"
      subtitle="Track completed product sales, retail revenue, stock deduction receipts, vendor source, and audit trail"
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{totalSalesCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-[#1552B3] rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">Units Sold</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">{totalUnitsSold}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-gray-500 font-medium">Avg Transaction Value</p>
              <p className="text-xl font-bold text-gray-900 mt-1">₹{avgOrderValue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by sale ID, product, vendor, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500">Brand:</span>
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500">Vendor:</span>
            </div>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {availableVendors.map((v) => (
                <option key={v} value={v}>
                  {v === 'All' ? 'All Vendors' : v}
                </option>
              ))}
            </select>

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
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-gray-400">
                      No sale records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-gray-900 font-mono">{sale.saleId}</p>
                          <span className="text-[10px] text-gray-400">{sale.date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{sale.productName}</p>
                          <span className="text-[10px] font-mono text-gray-400">{sale.sku}</span>
                        </div>
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
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800 text-xs">
                          {sale.vendorName || 'N/A'}
                        </span>
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {sale.saleStatus}
                        </span>
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
                <span className="text-gray-500">Product:</span>
                <span className="font-semibold text-gray-900 text-right">{receiptSale.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Brand / SKU:</span>
                <span className="font-medium text-gray-800">{receiptSale.brand} • {receiptSale.sku}</span>
              </div>
              {receiptSale.vendorName && receiptSale.vendorName !== 'N/A' && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Vendor:</span>
                  <span className="font-semibold text-[#1552B3] text-right">{receiptSale.vendorName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity Sold:</span>
                <span className="font-bold text-gray-900">{receiptSale.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unit Price:</span>
                <span className="font-mono text-gray-800">₹{receiptSale.unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-sm text-gray-900">
                <span>Total Paid:</span>
                <span className="text-emerald-600 font-mono">₹{receiptSale.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-medium text-gray-800">{receiptSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining Stock:</span>
                <span className="font-mono font-semibold text-gray-800">{receiptSale.remainingStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sold By:</span>
                <span className="font-medium text-gray-800">{receiptSale.soldBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Time:</span>
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
    </AdminLayout>
  );
};

export default SalesManagement;
