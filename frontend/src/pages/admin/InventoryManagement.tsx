import React, { useState, useMemo } from 'react';
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
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Eye,
  Calendar,
  Truck,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Check,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore, Product } from '../../context/StoreContext';
import ProductMonthHistoryModal from '../../components/ProductMonthHistoryModal';
import { ProductAutocompleteSelect } from '../../components/ProductAutocompleteSelect';
import {
  StatusBadge,
  ActionButton,
  ActionMenu,
  IconButton,
  SearchBar,
  Select,
  FilterBar,
  EmptyState,
  Modal,
  Tabs,
  FormField,
  FormSection,
} from '../../components/ui';

export const InventoryManagement: React.FC = () => {
  const { products, inventoryLogs, sales, purchaseRequests, adjustStock } = useStore();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'stock-desc' | 'stock-asc' | 'name' | 'value-desc'>('stock-desc');

  // Stock Adjustment Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState('');

  // Stock Details Slide-Over / Modal State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  // Month History Modal State
  const [historyModalProductId, setHistoryModalProductId] = useState<string | null>(null);

  // Extract actual available months from real inventory logs, sales, and POs (Task 8)
  const availableMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; year: number; month: number }>();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const recordDate = (dateStr?: string) => {
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = d.getMonth();
          const key = `${y}-${m}`;
          if (!map.has(key)) {
            map.set(key, { key, label: `${monthNames[m]} ${y}`, year: y, month: m });
          }
        }
      } catch {}
    };

    inventoryLogs.forEach((l) => recordDate(l.date));
    sales.forEach((s) => recordDate(s.date));
    purchaseRequests.forEach((p) => recordDate(p.requestDate || (p as any).createdAt));

    // Ensure recent active months exist
    if (!map.has('2026-8'))
      map.set('2026-8', { key: '2026-8', label: 'September 2026', year: 2026, month: 8 });
    if (!map.has('2026-7'))
      map.set('2026-7', { key: '2026-7', label: 'August 2026', year: 2026, month: 7 });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [inventoryLogs, sales, purchaseRequests]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Brands list
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Helper to determine last movement
  const getLastMovement = (productId: string, sku: string) => {
    const log = inventoryLogs.find((l) => l.productId === productId);
    if (log) return `${log.movementType} (${log.date ? log.date.slice(0, 10) : 'Recent'})`;
    const sale = sales.find((s) => s.productId === productId || s.sku === sku);
    if (sale) return `Sale (${sale.date ? sale.date.slice(0, 10) : 'Recent'})`;
    const po = purchaseRequests.find((p) => p.sku === sku);
    if (po)
      return `Purchase (${(po.requestDate || (po as any).createdAt || '').slice(0, 10) || 'Recent'})`;
    return 'In Warehouse';
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        const matchesBrand = brandFilter === 'All' || p.brand === brandFilter;

        let derivedStatus = 'In Stock';
        if (p.stock === 0) derivedStatus = 'Out of Stock';
        else if (p.stock <= (p.minStockAlert || 5)) derivedStatus = 'Low Stock';

        const matchesStatus =
          statusFilter === 'All' ||
          p.status === statusFilter ||
          derivedStatus === statusFilter;

        return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a.stock * (a.supplierCost || a.price * 0.7);
        const bVal = b.stock * (b.supplierCost || b.price * 0.7);

        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'value-desc') return bVal - aVal;
        return 0;
      });
  }, [products, searchQuery, categoryFilter, brandFilter, statusFilter, sortBy]);

  // Inventory Totals
  const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalValuation = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.supplierCost || (p as any).cost || p.price * 0.75),
    0
  );
  const lowStockCount = products.filter(
    (p) => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStockAlert || 5)
  ).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;

  // Compact Short History for selected month (Tasks 9, 21: Short list principle)
  const compactMonthHistory = useMemo(() => {
    if (selectedMonthKey === 'ALL') return [];
    const selectedMonthObj = availableMonths.find((m) => m.key === selectedMonthKey);
    if (!selectedMonthObj) return [];

    const events: {
      id: string;
      date: string;
      dateFormatted: string;
      productName: string;
      sku: string;
      movementType: string;
      quantity: number;
      isPositive: boolean;
      reference: string;
    }[] = [];

    inventoryLogs.forEach((l) => {
      try {
        const d = new Date(l.date);
        if (d.getFullYear() === selectedMonthObj.year && d.getMonth() === selectedMonthObj.month) {
          events.push({
            id: `log-${l.id}`,
            date: l.date,
            dateFormatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            productName: l.productName,
            sku: l.sku,
            movementType:
              l.type === 'IN'
                ? 'Purchase Restock'
                : l.type === 'OUT'
                ? 'Stock Out'
                : l.type === 'DAMAGE'
                ? 'Damage'
                : 'Adjustment',
            quantity: Math.abs(l.quantityChanged),
            isPositive: l.quantityChanged > 0,
            reference: l.reason || 'Audit Log',
          });
        }
      } catch {}
    });

    sales.forEach((s) => {
      try {
        const d = new Date(s.date);
        if (d.getFullYear() === selectedMonthObj.year && d.getMonth() === selectedMonthObj.month) {
          events.push({
            id: `sale-${s.id}`,
            date: s.date,
            dateFormatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            productName: s.productName,
            sku: s.sku,
            movementType: 'Sale',
            quantity: s.quantity,
            isPositive: false,
            reference: s.saleId || 'Sale Order',
          });
        }
      } catch {}
    });

    purchaseRequests.forEach((p) => {
      try {
        const d = new Date(p.requestDate || (p as any).createdAt);
        if (d.getFullYear() === selectedMonthObj.year && d.getMonth() === selectedMonthObj.month) {
          events.push({
            id: `po-${p.id}`,
            date: p.requestDate || (p as any).createdAt,
            dateFormatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            productName: p.productName,
            sku: p.sku,
            movementType: 'Purchase',
            quantity: p.quantityRequested,
            isPositive: true,
            reference: p.requestNumber,
          });
        }
      } catch {}
    });

    return events
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [selectedMonthKey, availableMonths, inventoryLogs, sales, purchaseRequests]);

  const selectedMonthLabel = availableMonths.find((m) => m.key === selectedMonthKey)?.label;

  // Handle Adjustment Submit
  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustQuantity || !adjustReason) return;

    adjustStock(
      adjustingProduct.id,
      adjustType,
      parseInt(adjustQuantity, 10),
      adjustReason
    );
    setAdjustingProduct(null);
  };

  const getProductRowActionItems = (p: Product) => [
    {
      label: 'Full Stock Details',
      icon: Eye,
      onClick: () => setSelectedDetailProduct(p),
    },
    {
      label: 'Adjust Physical Stock',
      icon: RefreshCw,
      onClick: () => {
        setAdjustingProduct(p);
        setAdjustType('IN');
        setAdjustQuantity('');
        setAdjustReason('');
      },
    },
    {
      label: 'Month-Wise Audit History',
      icon: History,
      onClick: () => setHistoryModalProductId(p.id),
    },
    {
      label: 'Quarantine Damaged Units',
      icon: AlertTriangle,
      variant: 'danger' as const,
      onClick: () => {
        setAdjustingProduct(p);
        setAdjustType('DAMAGE');
        setAdjustQuantity('1');
        setAdjustReason('Physical defect or handling damage quarantine');
      },
    },
  ];

  return (
    <AdminLayout
      title="Inventory & Stock Management"
      subtitle="Track live stock across warehouse locations, monitor thresholds, audit stock movement, and record adjustments"
      actions={
        <div className="flex items-center space-x-2">
          <ActionButton
            variant="outline"
            icon={History}
            onClick={() => setHistoryModalProductId('ALL')}
          >
            Consolidated History
          </ActionButton>
          <ActionButton
            variant="primary"
            icon={RefreshCw}
            onClick={() => {
              if (products.length > 0) {
                setAdjustingProduct(products[0]);
                setAdjustType('IN');
                setAdjustQuantity('');
                setAdjustReason('');
              }
            }}
          >
            Adjust Stock
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Total Physical Units</span>
            <p className="text-xl font-bold text-gray-900 mt-1 font-mono">{totalUnits}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Inventory Valuation</span>
            <p className="text-xl font-bold text-[#1552B3] mt-1 font-mono">
              ₹{totalValuation.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Low Stock Alerts</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Depleted / Out of Stock</span>
            <p className="text-xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
          </div>
        </div>

        {/* Multi-Warehouse Heatmap */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Warehouse Locations Breakdown
            </h3>
            <span className="text-[11px] text-gray-400">Total capacity: 3,000 units</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-900 block">Warehouse Alpha (Main)</span>
              <span className="text-sm font-black text-[#1552B3] font-mono">
                {Math.round(totalUnits * 0.8)} units
              </span>
              <span className="text-[10px] text-blue-600 block mt-0.5">80% of current inventory</span>
            </div>
            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <span className="text-xs font-bold text-indigo-900 block">Warehouse Beta (Overflow)</span>
              <span className="text-sm font-black text-indigo-700 font-mono">
                {Math.round(totalUnits * 0.15)} units
              </span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">15% of current inventory</span>
            </div>
            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
              <span className="text-xs font-bold text-purple-900 block">Store Front (Retail Display)</span>
              <span className="text-sm font-black text-purple-700 font-mono">
                {Math.max(0, totalUnits - Math.round(totalUnits * 0.8) - Math.round(totalUnits * 0.15))} units
              </span>
              <span className="text-[10px] text-purple-600 block mt-0.5">5% showroom stock</span>
            </div>
          </div>
        </div>

        {/* Catalog Navigation & Layout Toggle (Task 7: Removed 'Month-Wise Stock Ledger' tab) */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-[#1552B3]" />
              <span>Stock Catalog ({filteredProducts.length} items)</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-gray-500 font-medium">Layout:</span>
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
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
            </div>
          </div>
        </div>

        {/* Filter and Search Bar with Month Selector directly after Search (Task 8) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 1. Search Field with Real-Time Predictive Autocomplete */}
          <div className="relative flex-1 min-w-[220px]">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              enableProductAutocomplete
              products={products}
              placeholder="Search products by name, SKU, or brand..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            {/* 2. Month Selector directly AFTER Search Bar (Task 8) */}
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="px-3 py-2 text-xs bg-blue-50/60 border border-blue-200 rounded-lg font-semibold text-[#1552B3] focus:outline-none focus:border-[#1552B3]"
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* 3. Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            {/* 4. Brand */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Brands' : b}
                </option>
              ))}
            </select>

            {/* 5. Stock Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              <option value="All">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock Alert</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Damaged">Damaged</option>
            </select>

            {/* 6. Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              <option value="stock-desc">Highest Stock</option>
              <option value="stock-asc">Lowest Stock</option>
              <option value="value-desc">Highest Value</option>
              <option value="name">Product Name</option>
            </select>
          </div>
        </div>

        {/* SHORT COMPACT HISTORICAL LIST WHEN MONTH IS SELECTED (Task 9 & 21: Short list principle) */}
        {selectedMonthKey !== 'ALL' && (
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#1552B3]" />
                <h3 className="text-xs font-bold text-gray-900 tracking-wide">
                  {selectedMonthLabel} Historical Ledger (Recent Activity)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalProductId('ALL')}
                className="text-xs font-bold text-[#1552B3] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {compactMonthHistory.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                No recorded stock movements in {selectedMonthLabel}.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3">
                {compactMonthHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-700 font-mono text-[11px]">
                          {item.dateFormatted}
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="font-semibold text-gray-900">{item.movementType}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 truncate max-w-[150px]">
                        {item.productName}
                      </p>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        item.isPositive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.isPositive ? `+${item.quantity}` : `-${item.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No Products Matched Criteria"
            description="Try clearing your search query or adjusting your category, brand, and status filters."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedMonthKey('ALL');
              setCategoryFilter('All');
              setBrandFilter('All');
              setStatusFilter('All');
            }}
          />
        ) : viewMode === 'cards' ? (
          /* CARD-BASED INVENTORY GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const isOut = p.stock === 0;
              const isLow = p.stock > 0 && p.stock <= (p.minStockAlert || 5);
              const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
              const unitCost = p.supplierCost || (p as any).cost || Math.round(p.price * 0.75);
              const itemValuation = p.stock * unitCost;
              const availableStock = Math.max(0, p.stock - ((p as any).reservedStock || 0));
              const lastMovement = getLastMovement(p.id, p.sku);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    {/* Card Header: Brand & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider truncate">
                        {p.brand || p.category}
                      </span>
                      <StatusBadge status={statusLabel as any} size="sm" />
                    </div>

                    {/* Product Title & SKU */}
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.sku}</p>

                    {/* Stock Metric Callout: Current, Available, Min */}
                    <div className="my-3 p-3 bg-gray-50/90 rounded-lg border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-500 font-medium block">Current Stock</span>
                          <span
                            className={`text-xl font-black font-mono ${
                              isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'
                            }`}
                          >
                            {p.stock} <span className="text-xs font-normal text-gray-500">units</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 font-medium block">Available</span>
                          <span className="text-sm font-bold text-emerald-700 font-mono">
                            {availableStock} units
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 text-[11px] text-gray-500">
                        <span>Min Safety Threshold:</span>
                        <span className="font-semibold text-gray-700 font-mono">{p.minStockAlert || 5} units</span>
                      </div>

                      {((p.inspectionStock || 0) > 0 || (p.damagedStock || 0) > 0) && (
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[10px]">
                          <span className="text-amber-700 font-semibold">
                            Quarantine / Inspection: <strong>{p.inspectionStock || 0}</strong>
                          </span>
                          <span className="text-rose-700 font-semibold">
                            Damaged: <strong>{p.damagedStock || 0}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Valuation, Last Movement, and Vendor */}
                    <div className="space-y-1.5 text-xs pt-1 border-t border-gray-100 text-gray-600">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-[11px]">Stock Value:</span>
                        <span className="font-bold text-[#1552B3]">₹{itemValuation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-[11px]">Last Movement:</span>
                        <span className="font-medium text-gray-700 truncate max-w-[140px]" title={lastMovement}>
                          {lastMovement}
                        </span>
                      </div>
                      <div className="flex justify-between truncate">
                        <span className="text-gray-400 text-[11px]">Vendor:</span>
                        <span className="text-gray-700 truncate font-medium max-w-[140px]">
                          {p.supplier || 'Direct Manufacturer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STANDARDIZED CARD ACTION BUTTONS: [ Details ] [ Adjust ] [ History ] [ ⋮ ] (Task 25) */}
                  <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-1.5 shrink-0">
                    <ActionButton
                      variant="ghost"
                      size="xs"
                      icon={Eye}
                      onClick={() => setSelectedDetailProduct(p)}
                      title="View Stock Details"
                    >
                      <span>Details</span>
                    </ActionButton>

                    <ActionButton
                      variant="outline"
                      size="xs"
                      icon={RefreshCw}
                      onClick={() => {
                        setAdjustingProduct(p);
                        setAdjustType('IN');
                        setAdjustQuantity('');
                        setAdjustReason('');
                      }}
                      title="Adjust Stock"
                    >
                      <span>Adjust</span>
                    </ActionButton>

                    <ActionButton
                      variant="ghost"
                      size="xs"
                      icon={History}
                      onClick={() => setHistoryModalProductId(p.id)}
                      title="Month-wise History"
                    >
                      <span>History</span>
                    </ActionButton>

                    <ActionMenu
                      size="xs"
                      items={getProductRowActionItems(p)}
                      triggerAriaLabel={`More options for ${p.name}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DENSE TABULAR VIEW WITH STANDARDIZED ACTIONS */
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Product Name & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Min Threshold</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Valuation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const isOut = p.stock === 0;
                    const isLow = p.stock > 0 && p.stock <= (p.minStockAlert || 5);
                    const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
                    const unitCost = p.supplierCost || (p as any).cost || Math.round(p.price * 0.75);

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{p.category}</td>
                        <td
                          className={`py-3 px-4 text-right font-black font-mono text-sm ${
                            isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'
                          }`}
                        >
                          <p>{p.stock}</p>
                          {((p.inspectionStock || 0) > 0 || (p.damagedStock || 0) > 0) && (
                            <p className="text-[9px] font-semibold text-amber-700 font-mono">
                              Q:{p.inspectionStock || 0} D:{p.damagedStock || 0}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-500">
                          {p.minStockAlert || 5}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-700">
                          ₹{unitCost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          ₹{p.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#1552B3]">
                          ₹{(p.stock * unitCost).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={statusLabel as any} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <ActionButton
                              variant="ghost"
                              size="xs"
                              icon={Eye}
                              onClick={() => setSelectedDetailProduct(p)}
                              title="Details"
                            >
                              <span className="hidden sm:inline">Details</span>
                            </ActionButton>
                            <ActionButton
                              variant="outline"
                              size="xs"
                              icon={RefreshCw}
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjustType('IN');
                                setAdjustQuantity('');
                                setAdjustReason('');
                              }}
                              title="Adjust"
                            >
                              <span className="hidden sm:inline">Adjust</span>
                            </ActionButton>
                            <ActionButton
                              variant="ghost"
                              size="xs"
                              icon={History}
                              onClick={() => setHistoryModalProductId(p.id)}
                              title="History"
                            >
                              <span className="hidden xl:inline">History</span>
                            </ActionButton>
                            <ActionMenu
                              size="xs"
                              items={getProductRowActionItems(p)}
                              triggerAriaLabel={`Actions for ${p.name}`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <Modal
          isOpen={Boolean(adjustingProduct)}
          onClose={() => setAdjustingProduct(null)}
          title={`Adjust Inventory — ${adjustingProduct.name}`}
          description={`SKU: ${adjustingProduct.sku} • Current warehouse stock: ${adjustingProduct.stock} units`}
          size="md"
        >
          <form onSubmit={handleConfirmAdjustment} className="space-y-4">
            <FormField label="Product Item" required>
              <ProductAutocompleteSelect
                value={adjustingProduct.sku}
                products={products}
                onChange={(prod) => {
                  if (prod) {
                    setAdjustingProduct(prod);
                  }
                }}
                placeholder="Search product to adjust by name, model, brand, or SKU..."
                showStock
                showPrice
              />
            </FormField>

            <FormField label="Adjustment Type" required>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'IN', label: '+ Stock In (Receipt)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { type: 'OUT', label: '- Stock Out (Usage)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { type: 'DAMAGE', label: '✕ Damage Quarantine', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                  { type: 'ADJUSTMENT', label: '↔ Audit Discrepancy', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                ].map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setAdjustType(t.type as any)}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                      adjustType === t.type ? `${t.color} ring-2 ring-blue-500/20` : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Quantity Units" required>
              <input
                type="number"
                min="1"
                required
                placeholder="Enter units to adjust..."
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3] font-mono font-bold"
              />
            </FormField>

            <FormField label="Audit Reason & Notes" required>
              <input
                type="text"
                required
                placeholder="e.g. Shipment verification, damage write-off, count correction"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
              />
            </FormField>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
              <ActionButton
                variant="outline"
                type="button"
                onClick={() => setAdjustingProduct(null)}
              >
                Cancel
              </ActionButton>
              <ActionButton variant="primary" type="submit">
                Confirm Stock Adjustment
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock Details Slide-Over / Modal */}
      {selectedDetailProduct && (
        <Modal
          isOpen={Boolean(selectedDetailProduct)}
          onClose={() => setSelectedDetailProduct(null)}
          title={selectedDetailProduct.name}
          description={`SKU: ${selectedDetailProduct.sku} • Category: ${selectedDetailProduct.category}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-[11px]">Current Stock</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                  {selectedDetailProduct.stock} units
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-[11px]">Cost Price</span>
                <span className="text-lg font-bold font-mono text-gray-800">
                  ₹{(selectedDetailProduct.supplierCost || Math.round(selectedDetailProduct.price * 0.7)).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-[11px]">Selling Price</span>
                <span className="text-lg font-bold font-mono text-gray-900">
                  ₹{selectedDetailProduct.price.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-blue-600 block text-[11px]">Total Valuation</span>
                <span className="text-lg font-bold font-mono text-[#1552B3]">
                  ₹{(selectedDetailProduct.stock * (selectedDetailProduct.supplierCost || Math.round(selectedDetailProduct.price * 0.7))).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Supplier / Vendor:</span>
                <span className="font-semibold text-gray-900">{selectedDetailProduct.supplier || 'Direct Manufacturer'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Safety Threshold:</span>
                <span className="font-mono text-gray-800">{selectedDetailProduct.minStockAlert || 5} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Movement:</span>
                <span className="font-medium text-gray-800">{getLastMovement(selectedDetailProduct.id, selectedDetailProduct.sku)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <ActionButton
                variant="outline"
                icon={History}
                onClick={() => {
                  const pid = selectedDetailProduct.id;
                  setSelectedDetailProduct(null);
                  setHistoryModalProductId(pid);
                }}
              >
                View Month-Wise History
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={() => setSelectedDetailProduct(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Product Month-Wise History Modal */}
      {historyModalProductId && (
        <ProductMonthHistoryModal
          isOpen={Boolean(historyModalProductId)}
          onClose={() => setHistoryModalProductId(null)}
          productId={historyModalProductId === 'ALL' ? undefined : historyModalProductId}
        />
      )}
    </AdminLayout>
  );
};

export default InventoryManagement;
