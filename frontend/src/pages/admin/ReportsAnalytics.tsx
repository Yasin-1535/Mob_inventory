import React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Boxes,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';

export const ReportsAnalytics: React.FC = () => {
  const { products, orders, customers, vendors } = useStore();

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValuation = products.reduce((sum, p) => sum + p.stock * p.price, 0);

  // Group products by category
  const categorySummary: { [cat: string]: { count: number; stock: number; value: number } } = {};
  products.forEach((p) => {
    if (!categorySummary[p.category]) {
      categorySummary[p.category] = { count: 0, stock: 0, value: 0 };
    }
    categorySummary[p.category].count += 1;
    categorySummary[p.category].stock += p.stock;
    categorySummary[p.category].value += p.stock * p.price;
  });

  const categories = Object.keys(categorySummary);
  const maxVal = Math.max(...categories.map((c) => categorySummary[c].value), 1);

  const handleExportCSV = () => {
    const csvRows = [
      ['Product Name', 'SKU', 'Category', 'Price', 'Stock', 'Valuation', 'Status'],
      ...products.map((p) => [
        `"${p.name}"`,
        p.sku,
        p.category,
        p.price,
        p.stock,
        p.stock * p.price,
        p.status,
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'smart_inventory_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout
      title="Analytics & Executive Business Reports"
      subtitle="Comprehensive overview of inventory turnover, category performance, and gross margins"
      actions={
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Export CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Total Sales Volume</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₹{totalRevenue.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
              ↑ 18.4% vs last month
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Inventory Asset Value</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₹{totalValuation.toLocaleString()}
            </p>
            <span className="text-[11px] text-gray-500 mt-1 inline-block">
              {totalUnits} physical items in warehouse
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Order Velocity</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{orders.length} orders</p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
              100% fulfillment rate
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Active Partners</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {vendors.length} Vendors • {customers.length} Customers
            </p>
            <span className="text-[11px] text-gray-500 mt-1 inline-block">
              Multi-tenant ecosystem
            </span>
          </div>
        </div>

        {/* Charts & Categorical Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Distribution Bars */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Inventory Valuation by Department
                </h3>
                <p className="text-xs text-gray-500">
                  Total capital tied up across product classifications
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4 pt-2">
              {categories.map((cat) => {
                const item = categorySummary[cat];
                const percentage = Math.round((item.value / maxVal) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-800">{cat}</span>
                      <span className="text-gray-900 font-bold font-mono">
                        ₹{item.value.toLocaleString()}{' '}
                        <span className="text-gray-400 font-normal">
                          ({item.stock} units)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1552B3] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stock Health Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Stock Health Breakdown
              </h3>
              <p className="text-xs text-gray-500">
                Replenishment status of product catalog
              </p>

              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">Optimal In Stock</span>
                  </div>
                  <span className="font-bold">
                    {products.filter((p) => p.status === 'In Stock').length} SKUs
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">Low Stock Threshold</span>
                  </div>
                  <span className="font-bold">
                    {products.filter((p) => p.status === 'Low Stock').length} SKUs
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <Boxes className="w-4 h-4 text-rose-600" />
                    <span className="font-semibold">Depleted (Out of Stock)</span>
                  </div>
                  <span className="font-bold">
                    {products.filter((p) => p.status === 'Out of Stock').length} SKUs
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600">
              <p className="font-semibold text-gray-900">💡 Inventory Turnover Tip</p>
              <p className="mt-1 text-[11px]">
                Reorder point alerts trigger automatically when physical stock reaches under 10 units.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
export default ReportsAnalytics;
