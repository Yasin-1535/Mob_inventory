import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  Building,
  ShieldCheck,
  Search,
} from 'lucide-react';
import VendorLayout from '../../components/VendorLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { isVendorOwner } from '../../utils/vendorUtils';

export const PaymentsSettlements: React.FC = () => {
  const { user } = useAuth();
  const { purchaseRequests } = useStore();

  const vendorName = user?.shopName || user?.name || 'ABC Electronics';
  const [searchQuery, setSearchQuery] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('All');

  const vendorRequests = useMemo(() => {
    return purchaseRequests.filter((r) => isVendorOwner(r.vendorName, undefined, user));
  }, [purchaseRequests, user]);

  const totalEarnings = vendorRequests.reduce((sum, r) => sum + r.totalCost, 0);
  const settledAmount = vendorRequests
    .filter((r) => r.settlementStatus === 'SETTLED')
    .reduce((sum, r) => sum + r.totalCost, 0);
  const pendingSettlement = totalEarnings - settledAmount;
  const totalSettledCount = vendorRequests.filter((r) => r.settlementStatus === 'SETTLED').length;

  const filteredRequests = useMemo(() => {
    return vendorRequests.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        settlementFilter === 'All' || r.settlementStatus === settlementFilter;
      return matchesSearch && matchesFilter;
    });
  }, [vendorRequests, searchQuery, settlementFilter]);

  return (
    <VendorLayout
      title="Payments & Financial Settlements"
      subtitle={`Track earnings, payment disbursement history, and bank account details for ${vendorName}`}
      actions={
        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Download Statement</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Gross Earnings"
            value={`₹${totalEarnings.toLocaleString()}`}
            subtitle={`${vendorRequests.length} Total commitments`}
            icon={DollarSign}
            iconBgColor="bg-blue-50"
            iconColor="text-[#1552B3]"
          />
          <KpiCard
            title="Paid & Settled"
            value={`₹${settledAmount.toLocaleString()}`}
            subtitle="Disbursed to bank"
            icon={CheckCircle2}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-600"
          />
          <KpiCard
            title="Pending Settlement"
            value={`₹${pendingSettlement.toLocaleString()}`}
            subtitle="Processing after receipt"
            icon={Clock}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            valueColor={pendingSettlement > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
          <KpiCard
            title="Settled POs"
            value={`${totalSettledCount} of ${vendorRequests.length}`}
            subtitle="Batches cleared"
            icon={CreditCard}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* Bank Account Info Card */}
        <div className="bg-gradient-to-r from-blue-900 to-[#1552B3] text-white p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-xs shrink-0">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">HDFC Bank Direct Settlement</h3>
                <span className="bg-emerald-500/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-blue-100 font-mono mt-1">
                Account: •••• •••• •••• 8842 &bull; IFSC: HDFC0001923 &bull; Beneficiary: {vendorName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs text-blue-100 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>256-Bit Encrypted Auto-Payout</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search settlements by PO reference # or item name..."
          />

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 font-medium">Disbursement:</span>
            <select
              value={settlementFilter}
              onChange={(e) => setSettlementFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Settlements</option>
              <option value="SETTLED">Settled / Paid</option>
              <option value="PENDING">Pending Payout</option>
            </select>
          </div>
        </div>

        {/* Settlement Ledger Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Purchase Order Settlement Ledger
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Payment terms: Net-15 upon delivery verification
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Supply Item</th>
                  <th className="py-3 px-4">Batch Qty</th>
                  <th className="py-3 px-4">Contract Amount</th>
                  <th className="py-3 px-4">PO Status</th>
                  <th className="py-3 px-4 text-right">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400">
                      No settlement records found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {req.requestNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{req.productName}</p>
                        <span className="text-[10px] font-mono text-gray-400">{req.sku}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">{req.quantityRequested} units</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        ₹{req.totalCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <StatusBadge status={req.settlementStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default PaymentsSettlements;
