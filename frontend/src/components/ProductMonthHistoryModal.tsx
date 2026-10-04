import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ShoppingBag,
  Receipt,
  Boxes,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { useStore, InventoryLogEntry, SaleRecord, PurchaseRequest } from '../context/StoreContext';
import MonthFilter from './MonthFilter';

export interface ProductMonthHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string; // If provided, shows history for this product; otherwise shows all products
}

interface UnifiedHistoryEvent {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantity: number;
  stockImpact: number; // positive or negative
  reference: string;
  notes?: string;
  vendorOrParty?: string;
}

export const ProductMonthHistoryModal: React.FC<ProductMonthHistoryModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const { products, inventoryLogs, sales, purchaseRequests } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>(productId || 'ALL');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Sync selected product if prop changes
  React.useEffect(() => {
    if (productId) {
      setSelectedProductId(productId);
    }
  }, [productId]);

  // Consolidate actual transaction records into unified timeline
  const allEvents = useMemo(() => {
    const events: UnifiedHistoryEvent[] = [];

    // 1. Inbound Purchases (DELIVERED / ACCEPTED)
    purchaseRequests.forEach((p) => {
      const prod = products.find((pr) => pr.sku === p.sku || pr.name === p.productName);
      events.push({
        id: `p-${p.id}`,
        date: p.requestDate || (p as any).createdAt || '2026-08-15 10:00',
        productId: prod?.id || p.sku,
        productName: p.productName,
        sku: p.sku,
        type: 'PURCHASE',
        quantity: p.quantityRequested,
        stockImpact: p.status === 'DELIVERED' ? +p.quantityRequested : 0,
        reference: p.requestNumber || 'PO-Direct',
        vendorOrParty: p.vendorName,
        notes: `Status: ${p.status} (${p.quantityRequested} units @ ₹${p.unitCost}/unit)`,
      });
    });

    // 2. Sales records
    sales.forEach((s) => {
      events.push({
        id: `s-${s.id}`,
        date: s.date || '2026-08-18 12:00',
        productId: s.productId,
        productName: s.productName,
        sku: s.sku,
        type: 'SALE',
        quantity: s.quantity,
        stockImpact: -s.quantity,
        reference: s.saleId || 'Sale',
        vendorOrParty: s.vendorName || 'Counter Sale',
        notes: `Sold ${s.quantity} unit(s) @ ₹${s.unitPrice} (${s.paymentMethod})`,
      });
    });

    // 3. Inventory Logs (Adjustments, Damages, Returns, Manual In/Out)
    inventoryLogs.forEach((log) => {
      let mappedType: UnifiedHistoryEvent['type'] = 'ADJUSTMENT';
      let impact = log.quantityChanged;

      if (log.type === 'IN') {
        mappedType = 'PURCHASE';
        impact = +log.quantityChanged;
      } else if (log.type === 'OUT') {
        mappedType = 'SALE';
        impact = -log.quantityChanged;
      } else if (log.type === 'DAMAGE' || (log.type as any) === 'RETURN_INSPECTED_DAMAGED') {
        mappedType = 'DAMAGE';
        impact = -log.quantityChanged;
      } else if (log.type === 'RETURN' || (log.type as any) === 'RETURN_INSPECTED_GOOD') {
        mappedType = 'RETURN';
        impact = +log.quantityChanged;
      } else if ((log.type as any) === 'VENDOR_RETURN_RECEIVED') {
        mappedType = 'RETURN';
        impact = 0; // Quarantine inspection stock
      } else {
        mappedType = 'ADJUSTMENT';
        impact = log.newStock - log.previousStock;
      }

      events.push({
        id: `log-${log.id}`,
        date: log.date || '2026-08-17 14:00',
        productId: log.productId,
        productName: log.productName,
        sku: log.sku,
        type: mappedType,
        quantity: Math.abs(log.quantityChanged),
        stockImpact: impact,
        reference: log.reference || log.reason || 'Audit Log',
        vendorOrParty: log.vendorName || log.performedBy,
        notes: log.notes ? log.notes : `Prev: ${log.previousStock} → New: ${log.newStock} (${log.performedBy})`,
      });
    });

    // Sort newest date first
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchaseRequests, sales, inventoryLogs, products]);

  // Filter events by product, month, year, search, and type
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // Product Filter
      if (selectedProductId !== 'ALL' && ev.productId !== selectedProductId && ev.sku !== selectedProductId) {
        return false;
      }

      // Type Filter
      if (selectedType !== 'ALL' && ev.type !== selectedType) {
        return false;
      }

      // Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          ev.productName.toLowerCase().includes(q) ||
          ev.sku.toLowerCase().includes(q) ||
          ev.reference.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Month/Year Filter
      if (selectedYear !== 'ALL' || selectedMonth !== 'ALL') {
        try {
          const d = new Date(ev.date);
          if (!isNaN(d.getTime())) {
            if (selectedYear !== 'ALL' && d.getFullYear() !== selectedYear) return false;
            if (selectedMonth !== 'ALL' && d.getMonth() !== selectedMonth) return false;
          }
        } catch {
          // ignore
        }
      }

      return true;
    });
  }, [allEvents, selectedProductId, selectedType, searchQuery, selectedYear, selectedMonth]);

  // Group events by Month (e.g., "September 2026", "August 2026")
  const groupedByMonth = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const map: Record<
      string,
      {
        monthLabel: string;
        year: number;
        monthIndex: number;
        events: UnifiedHistoryEvent[];
        totalPurchases: number;
        totalSales: number;
        totalDamages: number;
        netStockImpact: number;
      }
    > = {};

    filteredEvents.forEach((ev) => {
      let key = 'Other / Recent';
      let year = 2026;
      let monthIndex = 7;
      try {
        const d = new Date(ev.date);
        if (!isNaN(d.getTime())) {
          year = d.getFullYear();
          monthIndex = d.getMonth();
          key = `${monthNames[monthIndex]} ${year}`;
        }
      } catch {
        // fallback
      }

      if (!map[key]) {
        map[key] = {
          monthLabel: key,
          year,
          monthIndex,
          events: [],
          totalPurchases: 0,
          totalSales: 0,
          totalDamages: 0,
          netStockImpact: 0,
        };
      }

      map[key].events.push(ev);
      map[key].netStockImpact += ev.stockImpact;
      if (ev.type === 'PURCHASE') map[key].totalPurchases += ev.quantity;
      if (ev.type === 'SALE') map[key].totalSales += ev.quantity;
      if (ev.type === 'DAMAGE') map[key].totalDamages += ev.quantity;
    });

    return Object.values(map);
  }, [filteredEvents]);

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isMonthExpanded = (key: string) => {
    return expandedMonths[key] !== false; // default expanded
  };

  if (!isOpen) return null;

  const currentProductObj = products.find((p) => p.id === selectedProductId || p.sku === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-base font-bold text-gray-900 truncate">
                Product Month-Wise History
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {currentProductObj
                  ? `${currentProductObj.name} (${currentProductObj.sku})`
                  : 'Track purchases, sales, stock adjustments, damages, and returns over time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-200 bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Product Selector */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">All Products (Consolidated History)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stock: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Types</option>
                <option value="PURCHASE">Purchases / Inbound</option>
                <option value="SALE">Sales / Outbound</option>
                <option value="ADJUSTMENT">Stock Adjustments</option>
                <option value="DAMAGE">Damaged Units</option>
                <option value="RETURN">Returns</option>
              </select>
            </div>
          </div>

          {/* Month / Year Presets & Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-gray-100">
            <MonthFilter
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onChange={(y, m) => {
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
            />

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Month-Wise Timeline List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 bg-gray-50/50">
          {groupedByMonth.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No Activity Recorded in Selected Period</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No purchases, sales, or stock adjustments were found matching your criteria. Try adjusting the period or product filter.
              </p>
            </div>
          ) : (
            groupedByMonth.map((monthGroup) => {
              const expanded = isMonthExpanded(monthGroup.monthLabel);

              return (
                <div
                  key={monthGroup.monthLabel}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
                >
                  {/* Month Accordion Header */}
                  <div
                    onClick={() => toggleMonth(monthGroup.monthLabel)}
                    className="p-3.5 sm:p-4 bg-white hover:bg-gray-50/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 block leading-tight">
                          {monthGroup.monthLabel}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {monthGroup.events.length} transactions recorded
                        </span>
                      </div>
                    </div>

                    {/* Month Summary Pills */}
                    <div className="flex items-center space-x-2 text-[11px] flex-wrap gap-y-1">
                      {monthGroup.totalPurchases > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          +{monthGroup.totalPurchases} Inbound
                        </span>
                      )}
                      {monthGroup.totalSales > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          -{monthGroup.totalSales} Sold
                        </span>
                      )}
                      {monthGroup.totalDamages > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                          -{monthGroup.totalDamages} Damaged
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold border ${
                          monthGroup.netStockImpact >= 0
                            ? 'bg-gray-100 text-gray-800 border-gray-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        Net Stock: {monthGroup.netStockImpact > 0 ? '+' : ''}
                        {monthGroup.netStockImpact} units
                      </span>
                      <div className="text-gray-400 pl-1">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Month Transactions List */}
                  {expanded && (
                    <div className="divide-y divide-gray-100">
                      {monthGroup.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 sm:p-3.5 hover:bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            {/* Type Icon Badge */}
                            <div
                              className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                ev.type === 'PURCHASE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ev.type === 'SALE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : ev.type === 'DAMAGE'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {ev.type === 'PURCHASE' ? (
                                <ShoppingBag className="w-3.5 h-3.5" />
                              ) : ev.type === 'SALE' ? (
                                <Receipt className="w-3.5 h-3.5" />
                              ) : ev.type === 'DAMAGE' ? (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              ) : (
                                <Boxes className="w-3.5 h-3.5" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-gray-900">{ev.productName}</span>
                                <span className="text-[10px] text-gray-400 font-mono">({ev.sku})</span>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                <span className="font-medium text-gray-700">{ev.reference}</span>
                                {ev.vendorOrParty && ` • ${ev.vendorOrParty}`}
                              </p>
                              {ev.notes && <p className="text-[10px] text-gray-400 mt-0.5">{ev.notes}</p>}
                            </div>
                          </div>

                          {/* Impact & Date */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pl-10 sm:pl-0">
                            <span
                              className={`font-black text-sm ${
                                ev.stockImpact > 0
                                  ? 'text-emerald-600'
                                  : ev.stockImpact < 0
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {ev.stockImpact > 0 ? `+${ev.stockImpact}` : ev.stockImpact} units
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {ev.date?.slice(0, 16) || 'Date N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50/70 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductMonthHistoryModal;
