import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
  Check,
  ChevronDown,
  Eye,
  FileText,
  History,
} from 'lucide-react';
import { useStore, PurchaseRequest } from '../../context/StoreContext';
import AdminLayout from '../../components/AdminLayout';
import {
  KpiCard,
  StatusBadge,
  ActionButton,
  ActionMenu,
  SearchBar,
  EmptyState,
  Modal,
  FormField,
  FormSection,
  HistoryHierarchy,
  HistoryEventItem,
} from '../../components/ui';
import { ProductAutocompleteSelect } from '../../components/ProductAutocompleteSelect';


export const PurchaseManagement: React.FC = () => {
  const { purchaseRequests, addPurchaseOrder, receivePurchaseShipment, vendors, products } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'duration'>('table');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDetailPurchase, setSelectedDetailPurchase] = useState<PurchaseRequest | null>(null);

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState(vendors[0]?.name || 'ABC Electronics');
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(products[0]?.supplierCost || Math.round(products[0]?.price * 0.7) || 500);
  const [purchaseStatus, setPurchaseStatus] = useState<'PENDING' | 'ACCEPTED' | 'DELIVERED'>('ACCEPTED');
  const [notes, setNotes] = useState('');

  const filteredPurchases = purchaseRequests.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.productName.toLowerCase().includes(q) ||
      p.vendorName.toLowerCase().includes(q) ||
      p.requestNumber.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesVendor = vendorFilter === 'ALL' || p.vendorName === vendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  const durationHistoryEvents: HistoryEventItem[] = useMemo(() => {
    return filteredPurchases.map((p) => ({
      id: p.id,
      date: p.createdAt || p.requestDate || new Date().toISOString(),
      type: 'PURCHASE',
      title: `${p.productName} (${p.sku})`,
      subtitle: `Vendor: ${p.vendorName} • Unit Cost: ₹${p.unitCost.toLocaleString('en-IN')}`,
      reference: p.requestNumber,
      quantityChange: p.quantityRequested,
      amount: p.totalCost,
      party: p.vendorName,
      badgeStatus: p.status === 'DELIVERED' ? 'Delivered' : p.status === 'ACCEPTED' ? 'Dispatched' : 'Pending',
    }));
  }, [filteredPurchases]);

  const totalProcured = purchaseRequests.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const pendingOrdersCount = purchaseRequests.filter((p) => p.status === 'PENDING' || p.status === 'ACCEPTED').length;
  const receivedCount = purchaseRequests.filter((p) => p.status === 'DELIVERED').length;

  const handleProductSelect = (sku: string) => {
    setSelectedSku(sku);
    const prod = products.find((p) => p.sku === sku);
    if (prod) {
      setUnitCost(prod.supplierCost || Math.round(prod.price * 0.7));
    }
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.sku === selectedSku);
    if (!prod) return;

    addPurchaseOrder({
      vendorName: selectedSupplier,
      productName: prod.name,
      sku: prod.sku,
      quantityRequested: Number(quantity),
      unitCost: Number(unitCost),
      status: purchaseStatus,
      notes,
    });

    setIsNewModalOpen(false);
    setNotes('');
  };

  const getStatusStepIndex = (status: string) => {
    if (status === 'PENDING') return 1;
    if (status === 'ACCEPTED') return 2;
    if (status === 'DELIVERED') return 3;
    return 1;
  };

  return (
    <AdminLayout
      title="Purchase Orders & Procurement"
      subtitle="Track purchase requisitions, inbound vendor shipments, stock receiving, and unit procurement costs"
      actions={
        <ActionButton
          variant="primary"
          icon={Plus}
          onClick={() => setIsNewModalOpen(true)}
        >
          New Purchase Order
        </ActionButton>
      }
    >
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Total Procurement Value"
          value={`₹${totalProcured.toLocaleString('en-IN')}`}
          subtitle={`${purchaseRequests.length} purchase orders recorded`}
          icon={ShoppingBag}
          colorScheme="blue"
        />
        <KpiCard
          title="In Transit / Pending"
          value={pendingOrdersCount}
          subtitle="Awaiting inbound stock receipt"
          icon={Clock}
          colorScheme="amber"
        />
        <KpiCard
          title="Received & Stocked"
          value={receivedCount}
          subtitle="Inventory auto-credited to warehouse"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            enableProductAutocomplete
            products={products}
            placeholder="Search PO #, supplier, SKU, or product..."
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
          >
            <option value="ALL">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="ACCEPTED">Dispatched / In Transit</option>
            <option value="DELIVERED">Delivered & Stocked</option>
          </select>

          {/* Duration View Toggle */}
          <div className="col-span-2 sm:col-span-1 flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'duration' ? 'table' : 'duration'))}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer w-full sm:w-auto ${
                viewMode === 'duration' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Duration"
            >
              <History className="w-3.5 h-3.5" />
              <span>Duration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filteredPurchases.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Purchase Orders Found"
          description="Try clearing your search query or create a new purchase order for supplier restocking."
          actionLabel="Create Purchase Order"
          onAction={() => setIsNewModalOpen(true)}
        />
      ) : viewMode === 'duration' ? (
        /* DURATION HIERARCHY */
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Procurement Duration & History ({filteredPurchases.length} records)
              </h3>
              <p className="text-[11px] text-gray-500">Organized by Year → Month → Date</p>
            </div>
          </div>
          <HistoryHierarchy
            events={durationHistoryEvents}
            emptyTitle="No purchase history for selected filter"
            emptySubtitle="Adjust your filters or record a new purchase order."
          />
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Purchase Orders ({filteredPurchases.length})
            </h2>
            <span className="text-[11px] text-gray-400">Stock updates instantly on receiving</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">PO # & Date</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Product & SKU</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map((purchase) => {
                  const isReceived = purchase.status === 'DELIVERED';
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 font-mono">{purchase.requestNumber}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{purchase.createdAt || purchase.requestDate}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{purchase.vendorName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 line-clamp-1">{purchase.productName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{purchase.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900 font-mono">
                        {purchase.quantityRequested}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">
                        ₹{purchase.unitCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 text-sm">
                        ₹{purchase.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          status={
                            isReceived
                              ? 'Delivered'
                              : purchase.status === 'ACCEPTED'
                              ? 'Dispatched'
                              : 'Pending'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <ActionButton
                            variant="ghost"
                            size="xs"
                            icon={Eye}
                            onClick={() => setSelectedDetailPurchase(purchase)}
                            tooltip="View Purchase Details"
                          >
                            View
                          </ActionButton>
                          <ActionMenu
                            align="right"
                            menuWidth="w-52"
                            trigger={({ isOpen, toggle }) => (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggle();
                                }}
                                aria-expanded={isOpen}
                                aria-haspopup="true"
                                title={isReceived ? 'Received Order Options' : 'Receive Order Options'}
                                className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none shrink-0 px-2 py-1 text-[11px] gap-1 h-7 ${
                                  isReceived
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-500/30'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500/40 border border-transparent'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>{isReceived ? 'Received' : 'Receive'}</span>
                                <ChevronDown
                                  className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                            items={[
                              {
                                label: isReceived ? 'Already Received' : 'Mark Received',
                                icon: CheckCircle2,
                                disabled: isReceived,
                                disabledTooltip: 'This purchase order has already been received and stocked',
                                variant: 'success',
                                onClick: () => {
                                  if (!isReceived) {
                                    receivePurchaseShipment(purchase.id);
                                  }
                                },
                              },
                              {
                                label: 'View Receiving Details',
                                icon: FileText,
                                onClick: () => setSelectedDetailPurchase(purchase),
                              },
                            ]}
                          />
                          <ActionMenu
                            items={[
                              {
                                label: 'View Details',
                                icon: Eye,
                                onClick: () => setSelectedDetailPurchase(purchase),
                              },
                              {
                                label: 'PO Slip Details',
                                icon: FileText,
                                onClick: () => setSelectedDetailPurchase(purchase),
                              },
                            ]}
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

      {/* New Purchase Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Purchase Order"
        description="Place a restocking order with an authorized supplier to replenish inventory."
        size="md"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <FormSection
            title="Vendor & Product"
            description="Select supplying vendor and target product SKU"
          >
            <div className="space-y-3">
              <FormField label="Supplier / Vendor" required>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.contactPerson})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Product to Procure" required>
                <ProductAutocompleteSelect
                  value={selectedSku}
                  products={products}
                  onChange={(prod) => {
                    if (prod) {
                      handleProductSelect(prod.sku);
                    }
                  }}
                  placeholder="Search product to procure by name, brand, or SKU..."
                  showStock
                  showPrice
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="Cost & Inbound Quantity"
            description="Specify order volume and negotiated unit cost"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Quantity (Units)" required>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none font-mono"
                  required
                />
              </FormField>

              <FormField label="Unit Purchase Cost (₹)" required>
                <input
                  type="number"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none font-mono"
                  required
                />
              </FormField>
            </div>

            <div className="mt-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Total Purchase Commitment:</span>
              <span className="text-base font-black text-[#1552B3] font-mono">
                ₹{(quantity * unitCost).toLocaleString('en-IN')}
              </span>
            </div>
          </FormSection>

          <FormSection
            title="Order State & Logistics"
            description="Initial receiving status and shipment reference"
          >
            <div className="space-y-3">
              <FormField label="Order Status">
                <select
                  value={purchaseStatus}
                  onChange={(e) => setPurchaseStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                >
                  <option value="ACCEPTED">Dispatched / In Transit (Pending Delivery)</option>
                  <option value="DELIVERED">Delivered (Immediately Add to Warehouse Stock)</option>
                  <option value="PENDING">Draft / Awaiting Supplier Confirmation</option>
                </select>
              </FormField>

              <FormField label="Notes / Tracking # (Optional)">
                <input
                  type="text"
                  placeholder="e.g. AWB Tracking #, batch number, or dock arrival remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#1552B3] focus:outline-none"
                />
              </FormField>
            </div>
          </FormSection>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
            <ActionButton
              variant="outline"
              type="button"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </ActionButton>
            <ActionButton variant="primary" type="submit">
              Save Purchase Order
            </ActionButton>
          </div>
        </form>
      </Modal>

      {/* Purchase Detail Modal */}
      {selectedDetailPurchase && (
        <Modal
          isOpen={Boolean(selectedDetailPurchase)}
          onClose={() => setSelectedDetailPurchase(null)}
          title="Purchase Order Details"
          description={`PO #${selectedDetailPurchase.requestNumber} • Placed ${selectedDetailPurchase.createdAt || selectedDetailPurchase.requestDate}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Step visualization */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-gray-600">Procurement Lifecycle</span>
                <StatusBadge
                  status={
                    selectedDetailPurchase.status === 'DELIVERED'
                      ? 'Delivered'
                      : selectedDetailPurchase.status === 'ACCEPTED'
                      ? 'Dispatched'
                      : 'Pending'
                  }
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-gray-500 pt-2">
                <div className="p-2 rounded-lg bg-white border border-gray-200">
                  <span className="block text-indigo-600 font-bold">1. Order Placed</span>
                  <span className="text-gray-400">Created</span>
                </div>
                <div className={`p-2 rounded-lg border ${
                  getStatusStepIndex(selectedDetailPurchase.status) >= 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-gray-200 text-gray-400'
                }`}>
                  <span className="block font-bold">2. Dispatched</span>
                  <span className="text-[9px]">Vendor Confirmed</span>
                </div>
                <div className={`p-2 rounded-lg border ${
                  selectedDetailPurchase.status === 'DELIVERED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-200 text-gray-400'
                }`}>
                  <span className="block font-bold">3. Received</span>
                  <span className="text-[9px]">In Stock</span>
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Vendor:</span>
                <span className="font-semibold text-gray-900">{selectedDetailPurchase.vendorName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Product:</span>
                <span className="font-bold text-gray-900 text-right">{selectedDetailPurchase.productName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">SKU Code:</span>
                <span className="font-mono text-gray-700">{selectedDetailPurchase.sku}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Quantity Requested:</span>
                <span className="font-mono font-bold text-gray-900">{selectedDetailPurchase.quantityRequested} units</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-500">Unit Cost:</span>
                <span className="font-mono text-gray-800">₹{selectedDetailPurchase.unitCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm text-gray-900">
                <span>Total Cost:</span>
                <span className="text-[#1552B3] font-mono">₹{selectedDetailPurchase.totalCost.toLocaleString('en-IN')}</span>
              </div>
              {selectedDetailPurchase.notes && (
                <div className="pt-2 border-t border-gray-100 text-gray-500">
                  <span className="font-semibold block text-gray-700">Remarks:</span>
                  <span className="italic">{selectedDetailPurchase.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2">
              {selectedDetailPurchase.status !== 'DELIVERED' ? (
                <ActionButton
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => {
                    receivePurchaseShipment(selectedDetailPurchase.id);
                    setSelectedDetailPurchase(null);
                  }}
                >
                  Confirm Stock Receipt
                </ActionButton>
              ) : (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Shipment received & inventory updated
                </span>
              )}
              <ActionButton
                variant="outline"
                onClick={() => setSelectedDetailPurchase(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default PurchaseManagement;
