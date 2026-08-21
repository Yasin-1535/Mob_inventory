import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  XCircle,
  Eye,
  X,
  AlertCircle,
  Package,
  Calendar,
  DollarSign,
} from 'lucide-react';
import VendorLayout from '../../components/VendorLayout';
import { KpiCard } from '../../components/ui/KpiCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useStore, PurchaseRequest } from '../../context/StoreContext';
import { isVendorOwner } from '../../utils/vendorUtils';

export const PurchaseRequests: React.FC = () => {
  const { user } = useAuth();
  const { purchaseRequests, updatePurchaseRequestStatus } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<string>('All');
  const [selectedReq, setSelectedReq] = useState<PurchaseRequest | null>(null);

  const vendorName = user?.shopName || user?.name || 'ABC Electronics';
  const vendorRequests = purchaseRequests.filter((r) => isVendorOwner(r.vendorName, undefined, user));

  const filteredRequests = vendorRequests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      (r.requestNumber && r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.productName && r.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.sku && r.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusTab === 'All' || r.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = vendorRequests.filter((r) => r.status === 'PENDING').length;
  const inTransitCount = vendorRequests.filter((r) => r.status === 'DISPATCHED' || r.status === 'ACCEPTED').length;
  const fulfilledCount = vendorRequests.filter((r) => r.status === 'DELIVERED').length;
  const totalVolume = vendorRequests.reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <VendorLayout
      title="Incoming Purchase Orders (POs)"
      subtitle="Orders issued by Central Admin for warehouse inventory replenishment"
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Action Required (Pending)"
            value={pendingCount}
            subtitle="Requires vendor acceptance"
            icon={Clock}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            valueColor={pendingCount > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
          <KpiCard
            title="In Production / Transit"
            value={inTransitCount}
            subtitle="Accepted or dispatched batches"
            icon={Truck}
            iconBgColor="bg-blue-50"
            iconColor="text-[#1552B3]"
          />
          <KpiCard
            title="Delivered & Settled"
            value={fulfilledCount}
            subtitle="Goods receipt confirmed"
            icon={CheckCircle2}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Total PO Volume"
            value={`₹${totalVolume.toLocaleString()}`}
            subtitle="Cumulative replenishment contract"
            icon={DollarSign}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </div>

        {/* Search & Status Tabs Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search PO reference # or product name..."
          />

          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
            {['All', 'PENDING', 'ACCEPTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusTab === tab
                    ? 'bg-[#1552B3] text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'All' ? 'All Orders' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-4">Item Requested</th>
                  <th className="py-3 px-4">Batch Qty</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Total Contract</th>
                  <th className="py-3 px-4">Delivery Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      No purchase orders found matching your filter criteria.
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
                        <span className="text-[10px] font-mono text-gray-400">
                          {req.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {req.quantityRequested} units
                      </td>
                      <td className="py-3 px-4 font-mono">₹{req.unitCost.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        ₹{req.totalCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {req.expectedDelivery}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => updatePurchaseRequestStatus(req.id, 'ACCEPTED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-2xs"
                              >
                                Accept PO
                              </button>
                              <button
                                onClick={() => updatePurchaseRequestStatus(req.id, 'CANCELLED')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === 'ACCEPTED' && (
                            <button
                              onClick={() => updatePurchaseRequestStatus(req.id, 'DISPATCHED')}
                              className="px-2.5 py-1 bg-[#1552B3] hover:bg-[#0f4091] text-white rounded-md text-[11px] font-semibold transition-colors shadow-2xs"
                            >
                              Mark Dispatched
                            </button>
                          )}
                          {req.status === 'DISPATCHED' && (
                            <button
                              onClick={() => updatePurchaseRequestStatus(req.id, 'DELIVERED')}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-2xs"
                            >
                              Confirm Delivery
                            </button>
                          )}
                          {req.status === 'DELIVERED' && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center pr-1">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Settled
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View PO Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PO Details Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Purchase Order Details</h3>
                <p className="text-[11px] font-mono text-gray-500">{selectedReq.requestNumber}</p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-gray-700">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 font-medium">Product Requested:</span>
                  <p className="font-bold text-gray-900 text-sm">{selectedReq.productName}</p>
                  <span className="font-mono text-gray-500 text-[11px]">{selectedReq.sku}</span>
                </div>
                <StatusBadge status={selectedReq.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">Requested Units</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {selectedReq.quantityRequested} units
                  </span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 block">Unit Cost Rate</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    ₹{selectedReq.unitCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <span className="font-semibold text-blue-900">Total Purchase Value:</span>
                <span className="text-base font-mono font-bold text-[#1552B3]">
                  ₹{selectedReq.totalCost.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected Delivery:</span>
                  <span className="font-mono font-semibold text-gray-900">{selectedReq.expectedDelivery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Created Date:</span>
                  <span className="font-mono text-gray-700">{selectedReq.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Settlement Status:</span>
                  <StatusBadge status={selectedReq.settlementStatus} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              {selectedReq.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      updatePurchaseRequestStatus(selectedReq.id, 'ACCEPTED');
                      setSelectedReq(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Accept PO
                  </button>
                  <button
                    onClick={() => {
                      updatePurchaseRequestStatus(selectedReq.id, 'CANCELLED');
                      setSelectedReq(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Reject PO
                  </button>
                </>
              )}
              {selectedReq.status === 'ACCEPTED' && (
                <button
                  onClick={() => {
                    updatePurchaseRequestStatus(selectedReq.id, 'DISPATCHED');
                    setSelectedReq(null);
                  }}
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Mark Dispatched
                </button>
              )}
              {selectedReq.status === 'DISPATCHED' && (
                <button
                  onClick={() => {
                    updatePurchaseRequestStatus(selectedReq.id, 'DELIVERED');
                    setSelectedReq(null);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Confirm Delivery
                </button>
              )}
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default PurchaseRequests;

