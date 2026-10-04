import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Receipt,
  CreditCard,
  PlusCircle,
  Truck,
  ArrowRight,
  Boxes,
  Percent,
  BarChart2,
  PieChart,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useStore } from '../context/StoreContext';
import MonthFilter from '../components/MonthFilter';
import {
  PageHeader,
  SectionHeader,
  KpiCard,
  StatusBadge,
  ActionButton,
  HistoryHierarchy,
  HistoryEventItem,
} from '../components/ui';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    products = [],
    sales = [],
    purchaseRequests = [],
    expenses = [],
    payments = [],
    vendors = [],
    orders = [],
    inventoryLogs = [],
    returns = [],
  } = useStore();

  const [activityTab, setActivityTab] = useState<'feed' | 'split'>('feed');

  // Month & Year Filter State
  const now = new Date();
  const [filterYear, setFilterYear] = useState<number | 'ALL'>('ALL');
  const [filterMonth, setFilterMonth] = useState<number | 'ALL'>('ALL');

  // Helper date checker
  const isInSelectedPeriod = (dateStr?: string) => {
    if (!dateStr || (filterYear === 'ALL' && filterMonth === 'ALL')) return true;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const yearMatch = filterYear === 'ALL' || d.getFullYear() === filterYear;
      const monthMatch = filterMonth === 'ALL' || d.getMonth() === filterMonth;
      return yearMatch && monthMatch;
    } catch {
      return true;
    }
  };

  // Filtered dataset for dynamic period inspection
  const periodSales = useMemo(
    () => sales.filter((s) => isInSelectedPeriod(s.date)),
    [sales, filterYear, filterMonth]
  );
  const periodPurchases = useMemo(
    () =>
      purchaseRequests.filter((p) =>
        isInSelectedPeriod(p.requestDate || (p as any).createdAt)
      ),
    [purchaseRequests, filterYear, filterMonth]
  );
  const periodExpenses = useMemo(
    () => expenses.filter((e) => isInSelectedPeriod(e.date)),
    [expenses, filterYear, filterMonth]
  );

  // Financial totals
  const totalSalesAmount = useMemo(
    () =>
      periodSales.reduce(
        (sum, s) => sum + (s.totalAmount ?? (s as any).total ?? 0),
        0
      ),
    [periodSales]
  );

  const totalPurchasesAmount = useMemo(
    () =>
      periodPurchases.reduce(
        (sum, p) => sum + (p.totalCost ?? (p as any).total ?? 0),
        0
      ),
    [periodPurchases]
  );

  const totalExpensesAmount = useMemo(
    () => periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [periodExpenses]
  );

  // Today's metrics
  const todayDatePrefix = now.toISOString().split('T')[0];
  const todaysSales = useMemo(() => {
    return sales
      .filter((s) => s.date && s.date.startsWith(todayDatePrefix))
      .reduce((sum, s) => sum + (s.totalAmount ?? (s as any).total ?? 0), 0);
  }, [sales, todayDatePrefix]);

  const todaysPurchases = useMemo(() => {
    return purchaseRequests
      .filter((p) => {
        const d = p.requestDate || (p as any).createdAt;
        return d && d.startsWith(todayDatePrefix);
      })
      .reduce((sum, p) => sum + (p.totalCost ?? (p as any).total ?? 0), 0);
  }, [purchaseRequests, todayDatePrefix]);

  // Receivables & Payables
  const customerReceivables = useMemo(() => {
    return sales
      .filter((s) => s.paymentStatus === 'PENDING' || s.paymentStatus === 'PARTIAL')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales]);

  const supplierPayables = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.pendingPayments || 0), 0);
  }, [vendors]);

  // Total Inventory Valuation
  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.stock || 0), 0),
    [products]
  );

  const inventoryValuation = useMemo(() => {
    return products.reduce((sum, p) => {
      const cost =
        p.supplierCost || (p as any).cost || (p.price ? p.price * 0.75 : 0);
      return sum + (p.stock || 0) * cost;
    }, 0);
  }, [products]);

  // Net Profit Estimation
  const netPosition = useMemo(() => {
    return totalSalesAmount - totalPurchasesAmount - totalExpensesAmount;
  }, [totalSalesAmount, totalPurchasesAmount, totalExpensesAmount]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= (p.minStockAlert || 5));
  }, [products]);

  // Recent Sales & Purchases (last 5)
  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 5);
  }, [sales]);

  const recentPurchases = useMemo(() => {
    return [...purchaseRequests]
      .sort(
        (a, b) =>
          new Date(b.requestDate || (b as any).createdAt || 0).getTime() -
          new Date(a.requestDate || (a as any).createdAt || 0).getTime()
      )
      .slice(0, 5);
  }, [purchaseRequests]);

  // Unified recent activity events with Date/Month grouping (Task 20)
  const dashboardActivityEvents = useMemo<HistoryEventItem[]>(() => {
    const events: HistoryEventItem[] = [];

    // Sales (last 10)
    sales.slice(0, 10).forEach((s) => {
      events.push({
        id: `sale-${s.id}`,
        date: s.date,
        type: 'SALE',
        title: `Sale: ${s.productName}`,
        subtitle: `${s.saleId} • ${s.quantity} unit(s) • ${s.paymentMethod}`,
        badgeText: s.paymentStatus || 'PAID',
        badgeStatus: 'Delivered',
        quantityChange: -s.quantity,
        amount: s.totalAmount ?? (s as any).total ?? 0,
        party: s.customerName || 'Walk-in Customer',
        reference: s.saleId,
      });
    });

    // Purchases (last 10)
    purchaseRequests.slice(0, 10).forEach((p) => {
      events.push({
        id: `po-${p.id}`,
        date: p.requestDate || (p as any).createdAt || '2026-08-17',
        type: 'PURCHASE',
        title: `Purchase: ${p.productName}`,
        subtitle: `${p.vendorName} • ${p.quantityRequested} units @ ₹${p.unitCost}`,
        badgeText: p.status,
        badgeStatus: p.status,
        quantityChange: p.quantityRequested,
        amount: p.totalCost,
        party: p.vendorName,
        reference: p.requestNumber,
      });
    });

    // Stock adjustments / Inventory logs
    inventoryLogs.slice(0, 10).forEach((log) => {
      events.push({
        id: `log-${log.id}`,
        date: log.timestamp || log.date,
        type:
          log.movementType === 'INWARD'
            ? 'PURCHASE'
            : log.movementType === 'DAMAGE'
            ? 'DAMAGE'
            : 'ADJUSTMENT',
        title: `Stock ${log.movementType}: ${log.productName}`,
        subtitle: `${log.reason || 'Inventory adjustment'} • ${log.reference}`,
        badgeText: log.movementType,
        badgeStatus: log.movementType === 'DAMAGE' ? 'Damaged' : 'In Stock',
        quantityChange: log.quantityChanged,
        stockBefore: log.stockBefore,
        stockAfter: log.stockAfter,
        reference: log.reference,
      });
    });

    // Returns
    returns.slice(0, 5).forEach((r) => {
      const isVendorReturn = r.returnType === 'VENDOR_SALES_RETURN';
      events.push({
        id: `ret-${r.id}`,
        date: r.createdAt || '2026-09-18',
        type: 'RETURN',
        title: isVendorReturn ? `Vendor Return: ${r.partyName}` : `Return: ${r.productName}`,
        subtitle: `${r.quantity} × ${r.productName} • ₹${r.totalAmount.toLocaleString('en-IN')} • ${r.reasonCategory || r.reason}`,
        badgeText:
          r.status === 'RECEIVED'
            ? 'Awaiting Inspection'
            : r.status === 'RETURN_REQUESTED'
            ? 'Requested'
            : r.status === 'RESTOCKED'
            ? 'Restocked'
            : r.status,
        badgeStatus:
          r.status === 'RESTOCKED' || r.status === 'SETTLED'
            ? 'Delivered'
            : r.status === 'RECEIVED'
            ? 'Pending'
            : 'In Stock',
        quantityChange: isVendorReturn ? +r.quantity : -r.quantity,
        amount: r.totalAmount,
        party: r.partyName,
        reference: r.sourceSaleId || r.returnNumber,
      });
    });

    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales, purchaseRequests, inventoryLogs, returns]);

  // Month-wise trends calculation
  const monthlyTrends = useMemo(() => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const map: Record<string, { label: string; sales: number; purchases: number; expenses: number; profit: number }> = {};

    // Last 4 months
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = {
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        sales: 0,
        purchases: 0,
        expenses: 0,
        profit: 0,
      };
    }

    sales.forEach((s) => {
      try {
        const d = new Date(s.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (map[key]) {
          map[key].sales += s.totalAmount ?? (s as any).total ?? 0;
        }
      } catch {}
    });

    purchaseRequests.forEach((p) => {
      try {
        const d = new Date(p.requestDate || (p as any).createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (map[key]) {
          map[key].purchases += p.totalCost ?? (p as any).total ?? 0;
        }
      } catch {}
    });

    expenses.forEach((e) => {
      try {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (map[key]) {
          map[key].expenses += e.amount || 0;
        }
      } catch {}
    });

    Object.values(map).forEach((m) => {
      m.profit = m.sales - m.purchases - m.expenses;
    });

    return Object.values(map);
  }, [sales, purchaseRequests, expenses, now]);

  const maxTrendVal = useMemo(() => {
    let max = 1;
    monthlyTrends.forEach((t) => {
      if (t.sales > max) max = t.sales;
      if (t.purchases > max) max = t.purchases;
      if (t.expenses > max) max = t.expenses;
    });
    return max;
  }, [monthlyTrends]);

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Operational performance, inventory valuation, and warehouse logistics"
      actions={
        <div className="flex items-center gap-2">
          <ActionButton
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/admin/sales')}
          >
            New Sale
          </ActionButton>
          <ActionButton
            variant="outline"
            size="sm"
            icon={ShoppingBag}
            onClick={() => navigate('/admin/purchases')}
          >
            New Purchase
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. Page Header & Timeframe Filter */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
              Performance Timeframe
            </span>
            <p className="text-[11px] text-slate-500 font-medium">
              Inspect financial totals and operational volume by active business month
            </p>
          </div>
          <MonthFilter
            selectedYear={filterYear}
            selectedMonth={filterMonth}
            onChange={(y, m) => {
              setFilterYear(y);
              setFilterMonth(m);
            }}
          />
        </div>

        {/* 2. Primary KPI Row (Desktop 4-col, Tablet 2-col, Mobile 1-col) */}
        <div>
          <SectionHeader title="Financial Performance" subtitle="Net business revenue & expenditure" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Revenue"
              value={`₹${totalSalesAmount.toLocaleString('en-IN')}`}
              subtitle={`Today: ₹${todaysSales.toLocaleString('en-IN')} (${periodSales.length} sales)`}
              icon={TrendingUp}
              iconBgColor="bg-blue-50"
              iconColor="text-[#1552B3]"
              valueColor="text-slate-900"
              onClick={() => navigate('/admin/sales')}
            />

            <KpiCard
              title="Total Purchases"
              value={`₹${totalPurchasesAmount.toLocaleString('en-IN')}`}
              subtitle={`Today: ₹${todaysPurchases.toLocaleString('en-IN')} (${periodPurchases.length} orders)`}
              icon={ShoppingBag}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
              valueColor="text-slate-900"
              onClick={() => navigate('/admin/purchases')}
            />

            <KpiCard
              title="Operating Expenses"
              value={`₹${totalExpensesAmount.toLocaleString('en-IN')}`}
              subtitle={`${periodExpenses.length} expense items recorded`}
              icon={Receipt}
              iconBgColor="bg-rose-50"
              iconColor="text-rose-600"
              valueColor="text-rose-700"
              onClick={() => navigate('/admin/expenses')}
            />

            <KpiCard
              title="Net Position"
              value={`${netPosition < 0 ? '-' : ''}₹${Math.abs(netPosition).toLocaleString('en-IN')}`}
              subtitle="Sales − Cost − Operating Expenses"
              icon={Percent}
              iconBgColor={netPosition >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}
              iconColor={netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}
              valueColor={netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}
            />
          </div>
        </div>

        {/* 3. Secondary KPI Row */}
        <div>
          <SectionHeader title="Operational Capital" subtitle="Warehouse stock & party accounts" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Stock Valuation"
              value={`₹${Math.round(inventoryValuation).toLocaleString('en-IN')}`}
              subtitle={`${totalStockUnits} units across ${products.length} products`}
              icon={Boxes}
              iconBgColor="bg-blue-50"
              iconColor="text-[#1552B3]"
              valueColor="text-[#1552B3]"
              onClick={() => navigate('/admin/inventory')}
            />

            <KpiCard
              title="Customer Receivables"
              value={`₹${customerReceivables.toLocaleString('en-IN')}`}
              subtitle="Uncollected customer payments"
              icon={CreditCard}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-600"
              valueColor="text-amber-700"
              onClick={() => navigate('/admin/payments')}
            />

            <KpiCard
              title="Vendor Payables"
              value={`₹${supplierPayables.toLocaleString('en-IN')}`}
              subtitle="Pending vendor settlements"
              icon={Truck}
              iconBgColor="bg-rose-50"
              iconColor="text-rose-600"
              valueColor="text-rose-700"
              onClick={() => navigate('/admin/vendors')}
            />

            <KpiCard
              title="Low Stock Items"
              value={lowStockProducts.length}
              subtitle={lowStockProducts.length > 0 ? 'Requires immediate restock' : 'All levels healthy'}
              icon={AlertTriangle}
              iconBgColor={lowStockProducts.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'}
              iconColor={lowStockProducts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}
              valueColor={lowStockProducts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}
              onClick={() => navigate('/admin/inventory')}
            />
          </div>
        </div>

        {/* Two-Column Dashboard Layout: Main Content (Left) & Quick Business Operations Side Panel (Right) */}
        <div className="flex flex-col xl:flex-row items-start gap-6">
          {/* Left Column: Main Dashboard Content */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {/* 4. Charts / Trends */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-[#1552B3]" />
                <span>Month-Wise Business Trends</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Comparative historical performance across recent months
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1552B3]"></span>
                <span className="text-slate-600">Sales</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Purchases</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="text-slate-600">Expenses</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {monthlyTrends.map((trend) => (
              <div
                key={trend.label}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{trend.label}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      trend.profit >= 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    Net: ₹{Math.round(trend.profit).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Sales</span>
                      <span className="font-bold text-slate-900">
                        ₹{trend.sales.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1552B3] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (trend.sales / maxTrendVal) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Purchases</span>
                      <span className="font-bold text-slate-900">
                        ₹{trend.purchases.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (trend.purchases / maxTrendVal) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Expenses</span>
                      <span className="font-bold text-slate-900">
                        ₹{trend.expenses.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (trend.expenses / maxTrendVal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Recent Activity (Task 20: Date/Month Grouping & Short List Principle) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#1552B3]" />
                <span>Recent Business Activity</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Chronological transaction feed organized by Month and Date
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActivityTab('feed')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activityTab === 'feed'
                      ? 'bg-white text-[#1552B3] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Timeline Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityTab('split')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activityTab === 'split'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Sales vs Purchases</span>
                </button>
              </div>

              <Link
                to="/admin/reports"
                className="text-xs font-semibold text-[#1552B3] hover:underline flex items-center gap-1 pl-2 border-l border-slate-200"
              >
                <span>View All Activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {activityTab === 'feed' ? (
            /* Unified Month/Date Hierarchy Feed (Task 20 & 21: Max 6-8 records) */
            <HistoryHierarchy
              events={dashboardActivityEvents}
              maxItems={6}
              onViewAll={() => navigate('/admin/reports')}
            />
          ) : (
            /* Split Cards View (5 Sales, 5 Purchases - Short List Principle) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
              {/* Recent Sales */}
              <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Recent Sales (5)</h4>
                    </div>
                    <Link
                      to="/admin/sales"
                      className="text-[11px] font-semibold text-[#1552B3] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  {recentSales.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No recent sales found.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200/60">
                      {recentSales.map((s) => (
                        <div key={s.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{s.productName}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {s.saleId} • {s.quantity} unit(s) • {s.date}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-slate-900">
                              ₹{(s.totalAmount ?? (s as any).total ?? 0).toLocaleString('en-IN')}
                            </p>
                            <StatusBadge status={s.paymentStatus || 'PAID'} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Purchases */}
              <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Inbound Procurement (5)</h4>
                    </div>
                    <Link
                      to="/admin/purchases"
                      className="text-[11px] font-semibold text-[#1552B3] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  {recentPurchases.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No procurement records found.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200/60">
                      {recentPurchases.map((p) => (
                        <div key={p.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{p.productName}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {p.vendorName} • {p.quantityRequested} units
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-slate-900">
                              ₹{p.totalCost.toLocaleString('en-IN')}
                            </p>
                            <StatusBadge status={p.status} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

            {/* 6. Low Stock / Important Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                        Low Stock Alert ({lowStockProducts.length} items below minimum safety threshold)
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {lowStockProducts
                          .slice(0, 3)
                          .map((p) => `${p.name} (${p.stock} left)`)
                          .join(', ')}
                        {lowStockProducts.length > 3 ? ` and ${lowStockProducts.length - 3} more` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ActionButton
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/inventory')}
                    >
                      Adjust Stock
                    </ActionButton>
                    <ActionButton
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/admin/purchases')}
                    >
                      Reorder from Vendor
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Quick Business Operations Panel */}
          <div className="w-full xl:w-80 shrink-0">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 xl:sticky xl:top-6">
              <SectionHeader
                title="Quick Business Operations"
                subtitle="Fast-path triggers for counter workflows"
              />
              <div className="flex flex-col gap-2.5">
                {/* 1. New Sale */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/sales')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/70 text-[#1552B3] transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <PlusCircle className="w-4 h-4 text-[#1552B3] group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">New Sale</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 2. New Purchase */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/purchases')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 text-emerald-700 transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingBag className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">New Purchase</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 3. Add Product */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/70 text-indigo-700 transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">Add Product</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 4. Stock Adjust */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/inventory')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70 text-amber-800 transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <Boxes className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">Stock Adjust</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 5. Record Expense */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/expenses')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/70 text-rose-700 transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">Record Expense</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 6. Record Payment */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/payments')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/70 text-purple-700 transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">Record Payment</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 7. Vendors */}
                <button
                  type="button"
                  onClick={() => navigate('/admin/vendors')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-50/70 hover:bg-orange-100/70 border border-orange-200/70 text-orange-800 transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <Truck className="w-4 h-4 text-orange-700 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">Vendors</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
