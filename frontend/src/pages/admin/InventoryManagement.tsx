import React, { useState } from 'react';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  History,
  CheckCircle2,
  X,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';

export const InventoryManagement: React.FC = () => {
  const { products, inventoryLogs, adjustStock } = useStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState('');

  const handleOpenAdjustModal = (product: any) => {
    setSelectedProduct(product);
    setAdjustType('IN');
    setAdjustQuantity('');
    setAdjustReason('');
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQuantity || !adjustReason) return;

    adjustStock(
      selectedProduct.id,
      adjustType,
      parseInt(adjustQuantity, 10),
      adjustReason
    );
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValuation = products.reduce(
    (sum, p) => sum + p.stock * p.price,
    0
  );
  const lowStockCount = products.filter((p) => p.status === 'Low Stock').length;
  const outOfStockCount = products.filter((p) => p.status === 'Out of Stock').length;

  return (
    <AdminLayout
      title="Inventory Levels & Warehouse Tracking"
      subtitle="Real-time stock ledger, safety thresholds, and inventory audit logs"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Total Physical Units</p>
            <p className="text-xl font-bold text-gray-900 mt-1 font-mono">{totalUnits}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Inventory Valuation</p>
            <p className="text-xl font-bold text-[#1552B3] mt-1">₹{totalValuation.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Low Stock Triggers</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Stockouts</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{outOfStockCount}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'inventory'
                ? 'bg-[#1552B3] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Warehouse Stock ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'logs'
                ? 'bg-[#1552B3] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail Logs ({inventoryLogs.length})</span>
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <>
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter stock by SKU or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="All">All Items</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Available Units</th>
                      <th className="py-3 px-4">Minimum Threshold</th>
                      <th className="py-3 px-4">Health Status</th>
                      <th className="py-3 px-4 text-right">Stock Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <span className="text-[10px] font-mono text-gray-400">
                            {p.sku} • {p.vendor}
                          </span>
                        </td>
                        <td className="py-3 px-4">{p.category}</td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          {p.stock} units
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">10 units</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.status === 'In Stock'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'Low Stock'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenAdjustModal(p)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-[#1552B3] hover:bg-[#1552B3] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Logs View */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Change Type</th>
                    <th className="py-3 px-4">Qty Delta</th>
                    <th className="py-3 px-4">Stock Before → After</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {inventoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {log.date}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{log.productName}</p>
                        <span className="text-[10px] font-mono text-gray-400">
                          {log.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            log.type === 'IN' || log.type === 'RETURN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.type === 'OUT' || log.type === 'DAMAGE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {log.type === 'IN' || log.type === 'RETURN'
                          ? `+${log.quantityChanged}`
                          : `-${log.quantityChanged}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {log.previousStock} → <strong className="text-gray-900">{log.newStock}</strong>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {log.reason}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{log.performedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Stock Adjustment
                  </h2>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {selectedProduct.sku}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 pt-4">
              <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-500">Item:</span>
                  <p className="text-xs font-bold text-gray-900">
                    {selectedProduct.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-500">Current Stock:</span>
                  <p className="text-sm font-bold text-[#1552B3] font-mono">
                    {selectedProduct.stock} units
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Adjustment Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      adjustType === 'IN'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    + Stock In (Received)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      adjustType === 'OUT'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    - Stock Out (Dispatched)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DAMAGE')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      adjustType === 'DAMAGE'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    ⚠️ Damage / Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      adjustType === 'ADJUSTMENT'
                        ? 'bg-blue-50 border-blue-300 text-[#1552B3]'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    🔄 Set Exact Count
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity Units *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 20"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason / Reference Note *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supplier PO receipt #PO-10492 or audit correction"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Apply Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default InventoryManagement;
