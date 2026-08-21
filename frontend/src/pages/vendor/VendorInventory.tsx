import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  History,
  AlertTriangle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import VendorLayout from '../../components/VendorLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../data/mockProducts';
import { isVendorOwner } from '../../utils/vendorUtils';

export const VendorInventory: React.FC = () => {
  const { user } = useAuth();
  const { products, inventoryLogs, adjustStock } = useStore();

  const vendorName = user?.shopName || user?.name || 'ABC Electronics';

  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState('');

  // Scoped Products for this vendor
  const vendorProducts = useMemo(() => {
    return products.filter((p) => isVendorOwner(p.vendor, undefined, user));
  }, [products, user]);

  const vendorProductIds = useMemo(() => {
    return new Set(vendorProducts.map((p) => p.id));
  }, [vendorProducts]);

  // Scoped Inventory Logs
  const vendorLogs = useMemo(() => {
    return inventoryLogs.filter(
      (log) =>
        vendorProductIds.has(log.productId) ||
        isVendorOwner(log.vendorName, log.vendorId, user)
    );
  }, [inventoryLogs, vendorProductIds, user]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return vendorProducts.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vendorProducts, searchQuery, statusFilter]);

  // KPIs
  const totalUnits = vendorProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalValuation = vendorProducts.reduce((sum, p) => sum + p.stock * p.price, 0);
  const lowStockCount = vendorProducts.filter((p) => p.status === 'Low Stock').length;
  const outOfStockCount = vendorProducts.filter((p) => p.status === 'Out of Stock').length;

  const handleOpenAdjustModal = (product: Product) => {
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

  return (
    <VendorLayout
      title="My Inventory & Warehouse Holdings"
      subtitle={`Live warehouse stock balances and audit logs for items supplied by ${vendorName}`}
    >
      <div className="space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Physical Units"
            value={totalUnits}
            subtitle="Units held in central warehouse"
            icon={Boxes}
            iconBgColor="bg-blue-50"
            iconColor="text-[#1552B3]"
          />
          <KpiCard
            title="Inventory Valuation"
            value={`₹${totalValuation.toLocaleString()}`}
            subtitle="Based on listed unit prices"
            icon={Boxes}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
          />
          <KpiCard
            title="Low Stock Triggers"
            value={lowStockCount}
            subtitle="Items near reorder threshold"
            icon={AlertTriangle}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            valueColor={lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
          <KpiCard
            title="Stockouts"
            value={outOfStockCount}
            subtitle="Items requiring replenishment"
            icon={AlertTriangle}
            iconBgColor="bg-rose-50"
            iconColor="text-rose-600"
            valueColor={outOfStockCount > 0 ? 'text-rose-600' : 'text-gray-900'}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'inventory'
                ? 'bg-[#1552B3] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Warehouse Holdings ({vendorProducts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'logs'
                ? 'bg-[#1552B3] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail Logs ({vendorLogs.length})</span>
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <>
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Filter your inventory by SKU or product name..."
              />

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
                      <th className="py-3 px-4">Product / SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Low Alert Threshold</th>
                      <th className="py-3 px-4">Unit Price</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-gray-400">
                          No inventory items found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            <span className="text-[10px] font-mono text-gray-400">{p.sku}</span>
                          </td>
                          <td className="py-3 px-4">{p.category}</td>
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">
                            {p.stock} units
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-500">
                            {p.lowStockThreshold || p.minStockAlert || 10} units
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                            ₹{p.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenAdjustModal(p)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1552B3] text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Audit Logs Table */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4">Change</th>
                    <th className="py-3 px-4">Stock Ledger</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4 text-right">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {vendorLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400">
                        No inventory audit logs found for your supplied items.
                      </td>
                    </tr>
                  ) : (
                    vendorLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500">{log.date}</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{log.productName}</p>
                          <span className="text-[10px] font-mono text-gray-400">{log.sku}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === 'IN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.type === 'OUT'
                                ? 'bg-blue-50 text-[#1552B3] border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {log.type === 'IN' ? (
                              <ArrowDownRight className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                            )}
                            {log.type}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 font-mono font-bold ${
                            log.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {log.type === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {log.previousStock} → <span className="font-bold text-gray-900">{log.newStock}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{log.reason}</td>
                        <td className="py-3 px-4 text-right text-gray-500 text-[11px]">{log.performedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Adjust Supply Stock</h2>
                  <p className="text-[10px] text-gray-500">{selectedProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <div>
                  <span className="text-gray-500">Current Warehouse Stock:</span>
                  <p className="font-bold text-gray-900 text-sm font-mono mt-0.5">
                    {selectedProduct.stock} units
                  </p>
                </div>
                <StatusBadge status={selectedProduct.status} />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Adjustment Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['IN', 'OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjustType(type)}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                        adjustType === type
                          ? 'bg-[#1552B3] text-white border-[#1552B3] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'IN'
                        ? 'Stock In'
                        : type === 'OUT'
                        ? 'Stock Out'
                        : type === 'DAMAGE'
                        ? 'Damage'
                        : type === 'RETURN'
                        ? 'Return'
                        : 'Adjust'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Quantity ({adjustType === 'IN' ? '+' : '-'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 10"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Audit Reason / Note <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batch supplier shipment, damaged return, audit count"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default VendorInventory;
