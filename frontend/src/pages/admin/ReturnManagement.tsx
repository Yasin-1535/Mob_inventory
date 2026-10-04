import React, { useState, useMemo } from 'react';
import {
  Undo2,
  Plus,
  CheckCircle2,
  Check,
  AlertTriangle,
  Package,
  X,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  RotateCcw,
  FileText,
  DollarSign,
  ShieldCheck,
  Building,
  History,
  MoreVertical,
  Smartphone,
  CreditCard,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  useStore,
  ReturnItem,
  ReturnReasonCategory,
  ReturnItemCondition,
  ReturnLifecycleStatus,
  ReturnSettlementType,
} from '../../context/StoreContext';
import AdminLayout from '../../components/AdminLayout';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  ActionButton,
  ActionMenu,
  IconButton,
  SearchBar,
  Select,
  FilterBar,
  EmptyState,
  Modal,
  FormField,
  FormSection,
  HistoryHierarchy,
  HistoryEventItem,
} from '../../components/ui';
import { ProductAutocompleteSelect } from '../../components/ProductAutocompleteSelect';


export const ReturnManagement: React.FC = () => {
  const {
    returns,
    sales,
    products,
    customers,
    vendors,
    addReturnRecord,
    getSaleReturnableInfo,
    createVendorReturn,
    receiveReturnRecord,
    inspectReturnRecord,
    restockReturnRecord,
    markDamagedReturnRecord,
    settleReturnRecord,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'VENDOR_SALES_RETURN' | 'SALES_RETURN' | 'PURCHASE_RETURN'>('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'duration'>('table');
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Modals state
  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [selectedDetailReturn, setSelectedDetailReturn] = useState<ReturnItem | null>(null);
  const [inspectingReturn, setInspectingReturn] = useState<ReturnItem | null>(null);
  const [settlingReturn, setSettlingReturn] = useState<ReturnItem | null>(null);

  // New Return Modal Wizard State
  const [modalReturnType, setModalReturnType] = useState<'VENDOR_SALES_RETURN' | 'PURCHASE_RETURN' | 'SALES_RETURN'>('VENDOR_SALES_RETURN');
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [returnQty, setReturnQty] = useState(1);
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [reasonCategory, setReasonCategory] = useState<ReturnReasonCategory>('DAMAGED_ITEM');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [initialCondition, setInitialCondition] = useState<ReturnItemCondition>('GOOD');
  const [returnNotes, setReturnNotes] = useState('');

  // Multi-item Return Selection State (Task 2A)
  const [selectedReturnRows, setSelectedReturnRows] = useState<
    Record<
      string,
      {
        selected: boolean;
        returnQty: number;
        reasonCategory: ReturnReasonCategory;
        otherReason: string;
        itemCondition: ReturnItemCondition;
        selectedImeis: string[];
      }
    >
  >({});

  // Inspection Modal State (multi-item aware)
  const [inspectCondition, setInspectCondition] = useState<ReturnItemCondition>('GOOD');
  const [inspectNotes, setInspectNotes] = useState('');
  const [itemInspections, setItemInspections] = useState<
    Record<string, { condition: ReturnItemCondition; notes: string }>
  >({});

  // Settlement Modal State
  const [settleType, setSettleType] = useState<ReturnSettlementType>('CREDIT_NOTE');
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleStatus, setSettleStatus] = useState<'PENDING' | 'SETTLED'>('SETTLED');
  const [settleNotes, setSettleNotes] = useState('');


  // Sales available for selected vendor
  const vendorSales = useMemo(() => {
    if (modalReturnType !== 'VENDOR_SALES_RETURN') return [];
    const ven = vendors.find((v) => v.id === selectedVendorId);
    return sales.filter(
      (s) =>
        s.vendorId === selectedVendorId ||
        (ven && s.vendorName && s.vendorName.toLowerCase() === ven.name.toLowerCase()) ||
        (ven && s.customerName && s.customerName.toLowerCase() === ven.name.toLowerCase())
    );
  }, [sales, selectedVendorId, vendors, modalReturnType]);

  // When vendorSales changes or modal opens, pick the first sale
  React.useEffect(() => {
    if (vendorSales.length > 0 && (!selectedSaleId || !vendorSales.find((s) => s.saleId === selectedSaleId))) {
      setSelectedSaleId(vendorSales[0].saleId);
    }
  }, [vendorSales, selectedSaleId]);

  // Info about the currently selected sale
  const currentSale = useMemo(() => {
    return sales.find((s) => s.saleId === selectedSaleId) || vendorSales[0];
  }, [sales, selectedSaleId, vendorSales]);

  // Returnable details for the chosen sale
  const saleReturnableInfo = useMemo(() => {
    if (!currentSale) return null;
    return getSaleReturnableInfo(currentSale.saleId);
  }, [currentSale, getSaleReturnableInfo]);

  // Keep selectedReturnRows in sync with items in saleReturnableInfo
  React.useEffect(() => {
    if (saleReturnableInfo && saleReturnableInfo.items) {
      setSelectedReturnRows((prev) => {
        const next: Record<
          string,
          {
            selected: boolean;
            returnQty: number;
            reasonCategory: ReturnReasonCategory;
            otherReason: string;
            itemCondition: ReturnItemCondition;
            selectedImeis: string[];
          }
        > = {};
        saleReturnableInfo.items.forEach((it) => {
          const existing = prev[it.sku];
          next[it.sku] = {
            selected: existing !== undefined ? existing.selected : it.returnableQuantity > 0 && saleReturnableInfo.items.length === 1,
            returnQty: existing ? Math.min(existing.returnQty, Math.max(1, it.returnableQuantity)) : (it.returnableQuantity > 0 ? 1 : 0),
            reasonCategory: existing ? existing.reasonCategory : 'BROKEN_ITEM',
            otherReason: existing ? existing.otherReason : '',
            itemCondition: existing ? existing.itemCondition : 'DAMAGED',
            selectedImeis: existing ? existing.selectedImeis.filter((im) => it.availableImeis.includes(im)) : [],
          };
        });
        return next;
      });
    }
  }, [saleReturnableInfo]);

  // Sync inspection modal state when inspectingReturn opens
  React.useEffect(() => {
    if (inspectingReturn) {
      setInspectCondition(inspectingReturn.itemCondition || 'GOOD');
      setInspectNotes(inspectingReturn.inspectionNotes || '');
      const insps: Record<string, { condition: ReturnItemCondition; notes: string }> = {};
      (inspectingReturn.items || []).forEach((it) => {
        insps[it.sku] = {
          condition: it.itemCondition || 'GOOD',
          notes: it.inspectionNotes || '',
        };
      });
      setItemInspections(insps);
    }
  }, [inspectingReturn]);

  const multiItemTotals = useMemo(() => {
    if (!saleReturnableInfo || !saleReturnableInfo.items) {
      return { totalQty: 0, totalAmount: 0, selectedCount: 0 };
    }
    let totalQty = 0;
    let totalAmount = 0;
    let selectedCount = 0;

    saleReturnableInfo.items.forEach((it) => {
      const row = selectedReturnRows[it.sku];
      if (row && row.selected) {
        selectedCount += 1;
        const q = Math.max(0, row.returnQty || 0);
        totalQty += q;
        totalAmount += q * it.unitPrice;
      }
    });

    return { totalQty, totalAmount, selectedCount };
  }, [saleReturnableInfo, selectedReturnRows]);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        r.returnNumber.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        (r.sourceReferenceNumber && r.sourceReferenceNumber.toLowerCase().includes(q));

      const matchesType = typeFilter === 'ALL' || r.returnType === typeFilter;
      const matchesVendor = vendorFilter === 'ALL' || r.partyName.toLowerCase() === vendorFilter.toLowerCase();
      const matchesCondition = conditionFilter === 'ALL' || r.itemCondition === conditionFilter;
      const matchesStatus = statusFilter === 'ALL' || r.status.toUpperCase() === statusFilter.toUpperCase();
      const matchesReason = reasonFilter === 'ALL' || r.reasonCategory === reasonFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesVendor &&
        matchesCondition &&
        matchesStatus &&
        matchesReason
      );
    });
  }, [
    returns,
    searchTerm,
    typeFilter,
    vendorFilter,
    conditionFilter,
    statusFilter,
    reasonFilter,
  ]);

  // Timeline events for HistoryHierarchy
  const timelineReturnEvents: HistoryEventItem[] = useMemo(() => {
    return filteredReturns.map((r) => ({
      id: r.id,
      date: r.createdAt || new Date().toISOString(),
      type: 'RETURN',
      title: `${r.productName} (${r.sku})`,
      subtitle: `Return #${r.returnNumber} • ${
        r.returnType === 'VENDOR_SALES_RETURN'
          ? 'Vendor Sales Return (Vendor → Us)'
          : r.returnType === 'SALES_RETURN'
          ? 'Customer RMA'
          : 'Purchase Return (Us → Supplier)'
      } • Condition: ${r.itemCondition}`,
      reference: r.returnNumber,
      quantityChange: r.returnType === 'PURCHASE_RETURN' ? -r.quantity : +r.quantity,
      amount: r.totalAmount,
      party: r.partyName,
      badgeStatus:
        r.status === 'RESTOCKED' || r.status === 'SETTLED'
          ? 'Delivered'
          : r.status === 'RECEIVED' || r.status === 'INSPECTED'
          ? 'In Stock'
          : 'Pending',
    }));
  }, [filteredReturns]);

  // KPIs
  const vendorSalesReturns = returns.filter((r) => r.returnType === 'VENDOR_SALES_RETURN');
  const purchaseReturns = returns.filter((r) => r.returnType === 'PURCHASE_RETURN');
  const retailReturns = returns.filter((r) => r.returnType === 'SALES_RETURN');
  const awaitingInspectionCount = returns.filter((r) => r.status === 'RECEIVED' || r.status === 'RETURN_REQUESTED').length;
  const totalReturnValue = returns.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  // Status mapping to badge style
  const mapBadgeStatus = (st: ReturnLifecycleStatus | string) => {
    const s = (st || '').toUpperCase();
    if (s === 'RESTOCKED' || s === 'COMPLETED' || s === 'SETTLED') return 'Delivered';
    if (s === 'APPROVED' || s === 'INSPECTED') return 'In Stock';
    if (s === 'RECEIVED') return 'Dispatched';
    if (s === 'RETURN_REQUESTED' || s === 'PENDING') return 'Pending';
    if (s === 'REJECTED' || s === 'DAMAGED') return 'Rejected';
    return 'Pending';
  };

  // Submit New Vendor Return
  const handleSubmitNewReturn = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalReturnType === 'VENDOR_SALES_RETURN') {
      if (!currentSale) {
        alert('No outbound sale found for this vendor. Please select or create a sale first.');
        return;
      }
      if (!saleReturnableInfo || saleReturnableInfo.totalReturnableQuantity <= 0) {
        alert('This sale has already been fully returned or has 0 returnable units.');
        return;
      }

      // Collect selected items from selectedReturnRows (Task 2A)
      const chosenItems: {
        productId: string;
        productName: string;
        sku: string;
        quantity: number;
        unitPrice: number;
        reason?: string;
        reasonCategory: ReturnReasonCategory;
        otherReason?: string;
        itemCondition: ReturnItemCondition;
        imeis?: string[];
      }[] = [];

      for (const it of saleReturnableInfo.items) {
        const row = selectedReturnRows[it.sku];
        if (row && row.selected) {
          if (!row.returnQty || row.returnQty <= 0) {
            alert(`Return quantity for "${it.productName}" must be at least 1.`);
            return;
          }
          if (row.returnQty > it.returnableQuantity) {
            alert(
              `Cannot return ${row.returnQty} units of "${it.productName}". Only ${it.returnableQuantity} units are currently returnable.`
            );
            return;
          }
          if (it.availableImeis && it.availableImeis.length > 0 && row.selectedImeis.length !== row.returnQty) {
            alert(
              `Please select exactly ${row.returnQty} IMEI(s) from sold units for "${it.productName}". Currently selected: ${row.selectedImeis.length}.`
            );
            return;
          }

          chosenItems.push({
            productId: it.productId || '',
            productName: it.productName,
            sku: it.sku,
            quantity: Number(row.returnQty),
            unitPrice: it.unitPrice, // Task 2C: Locked to original sale unit price
            reason: row.otherReason || row.reasonCategory || 'Vendor sales return',
            reasonCategory: row.reasonCategory,
            otherReason: row.otherReason,
            itemCondition: row.itemCondition,
            imeis: row.selectedImeis,
          });
        }
      }

      if (chosenItems.length === 0) {
        alert('Please select at least one product line to return.');
        return;
      }

      const vendorObj = vendors.find((v) => v.id === selectedVendorId);

      const res = createVendorReturn({
        vendorId: selectedVendorId,
        vendorName: vendorObj?.name || currentSale.vendorName || currentSale.customerName || 'Vendor',
        sourceSaleId: currentSale.saleId,
        sourceReferenceNumber: currentSale.saleId,
        items: chosenItems,
        notes: returnNotes,
      });

      if (res.success) {
        setIsNewReturnOpen(false);
        setReturnNotes('');
        setSelectedReturnRows({});
      } else {
        alert(`Error: ${res.message}`);
      }
    } else {
      // Legacy sales return or purchase return
      const prod = products.find((p) => p.sku === selectedProductId) || products[0];
      if (!prod) return;

      addReturnRecord({
        returnType: modalReturnType,
        sourceReferenceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        partyName: modalReturnType === 'PURCHASE_RETURN' ? (vendors[0]?.name || 'Supplier') : (customers[0]?.name || 'Customer'),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: Number(returnQty),
        unitPrice: prod.price,
        totalAmount: prod.price * Number(returnQty),
        reason: otherReasonText || reasonCategory,
        reasonCategory,
        itemCondition: initialCondition,
        settlementType: 'REFUND',
        status: 'RETURN_REQUESTED',
        notes: returnNotes,
      });

      setIsNewReturnOpen(false);
    }
  };

  // Handle Inspection Submit
  const handlePerformInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReturn) return;

    const inspectionsList =
      inspectingReturn.items && inspectingReturn.items.length > 0
        ? inspectingReturn.items.map((it) => ({
            sku: it.sku,
            condition: itemInspections[it.sku]?.condition || inspectCondition,
            notes: itemInspections[it.sku]?.notes || inspectNotes,
          }))
        : inspectCondition;

    const res = inspectReturnRecord(inspectingReturn.id, inspectionsList, inspectNotes);
    if (res.success) {
      setInspectingReturn(null);
      setInspectNotes('');
      setItemInspections({});
    } else {
      alert(`Inspection failed: ${res.message}`);
    }
  };

  // Handle Settlement Submit
  const handlePerformSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingReturn) return;
    const res = settleReturnRecord(settlingReturn.id, settleType, settleAmount, settleStatus, settleNotes);
    if (res.success) {
      setSettlingReturn(null);
      setSettleNotes('');
    } else {
      alert(`Settlement failed: ${res.message}`);
    }
  };

  return (
    <AdminLayout
      title="Returns & RMA Management"
      subtitle="Process Vendor Sales Returns (goods sold to vendor and sent back), Customer RMAs, and Supplier Purchase Debit Notes"
      actions={
        <div className="flex items-center space-x-2">
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => {
              setIsNewReturnOpen(true);
              setModalReturnType('VENDOR_SALES_RETURN');
            }}
          >
            Create Return
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Vendor Sales Returns"
            value={vendorSalesReturns.length}
            subtitle="Sold to Vendor → Returned to Admin"
            icon={RotateCcw}
            colorScheme="indigo"
          />
          <KpiCard
            title="Awaiting Inspection"
            value={awaitingInspectionCount}
            subtitle="Quarantine inspection stock"
            icon={Clock}
            colorScheme="amber"
          />
          <KpiCard
            title="Supplier Purchase Returns"
            value={purchaseReturns.length}
            subtitle="Admin purchased → Returned to vendor"
            icon={ArrowUpRight}
            colorScheme="purple"
          />
          <KpiCard
            title="Total Return Value"
            value={`₹${totalReturnValue.toLocaleString('en-IN')}`}
            subtitle="Original sale price locked"
            icon={DollarSign}
            colorScheme="emerald"
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              enableProductAutocomplete
              products={products}
              placeholder="Search return ID, vendor, sale ref, product, SKU..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            {/* Return Direction / Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3] font-medium"
            >
              <option value="ALL">All Return Types</option>
              <option value="VENDOR_SALES_RETURN">Vendor Sales Returns (B2B)</option>
              <option value="SALES_RETURN">Retail Customer Returns</option>
              <option value="PURCHASE_RETURN">Purchase Returns (Supplier)</option>
            </select>

            {/* Vendor Filter */}
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              <option value="ALL">All Parties / Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              <option value="ALL">All Statuses</option>
              <option value="RETURN_REQUESTED">Requested</option>
              <option value="RECEIVED">Received (Quarantine)</option>
              <option value="INSPECTED">Inspected</option>
              <option value="RESTOCKED">Restocked</option>
              <option value="DAMAGED">Damaged / Discarded</option>
              <option value="SETTLED">Settled</option>
            </select>

            {/* Reason Filter */}
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              <option value="ALL">All Reasons</option>
              <option value="BROKEN_ITEM">Broken Item</option>
              <option value="DAMAGED_ITEM">Damaged Item</option>
              <option value="DEFECTIVE_ITEM">Defective Item</option>
              <option value="WRONG_PRODUCT">Wrong Product</option>
              <option value="MISMATCHED_PRODUCT">Mismatched Product</option>
              <option value="WRONG_QUANTITY">Wrong Quantity</option>
              <option value="QUALITY_ISSUE">Quality Issue</option>
              <option value="PACKAGING_DAMAGE">Packaging Damage</option>
              <option value="OTHER">Other</option>
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

        {/* Returns Content Area */}
        {filteredReturns.length === 0 ? (
          <EmptyState
            icon={Undo2}
            title="No Return Records Found"
            description="No return records match your current filter settings."
            actionLabel="Create Vendor Return"
            onAction={() => {
              setIsNewReturnOpen(true);
              setModalReturnType('VENDOR_SALES_RETURN');
            }}
          />
        ) : viewMode === 'duration' ? (
          /* DURATION HIERARCHY */
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Returns & RMA Duration ({filteredReturns.length} records)
                </h3>
                <p className="text-[11px] text-gray-500">Organized by Year → Month → Date</p>
              </div>
            </div>
            <HistoryHierarchy
              events={timelineReturnEvents}
              emptyTitle="No return history found"
              emptySubtitle="Adjust your filters or record a new return."
            />
          </div>
        ) : (
          /* DENSE TABLE VIEW */
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Returns Log ({filteredReturns.length})
              </h2>
              <span className="text-[11px] text-gray-400">Restocked inventory reflects immediately</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Return ID & Date</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Party / Vendor</th>
                    <th className="py-3 px-4">Original Sale</th>
                    <th className="py-3 px-4">Product & SKU</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-center">Condition</th>
                    <th className="py-3 px-4 text-right">Return Value</th>
                    <th className="py-3 px-4 text-center">Lifecycle Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(showAllHistory ? filteredReturns : filteredReturns.slice(0, 8)).map((item) => {
                    const isVendorReturn = item.returnType === 'VENDOR_SALES_RETURN';
                    const isPurchaseReturn = item.returnType === 'PURCHASE_RETURN';
                    const isGood = item.itemCondition === 'GOOD';

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900 font-mono">{item.returnNumber}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{item.createdAt}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              isVendorReturn
                                ? 'bg-indigo-100 text-indigo-800'
                                : isPurchaseReturn
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isVendorReturn
                              ? 'Vendor Return'
                              : isPurchaseReturn
                              ? 'Purchase Return'
                              : 'Customer Return'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-800">{item.partyName}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                          {item.sourceSaleId || item.sourceReferenceNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{item.sku}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isGood
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.itemCondition}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          ₹{item.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={mapBadgeStatus(item.status)} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <ActionButton
                              variant="ghost"
                              size="xs"
                              icon={Eye}
                              onClick={() => setSelectedDetailReturn(item)}
                              tooltip="View Return Details"
                            >
                              Details
                            </ActionButton>

                            {item.status === 'RETURN_REQUESTED' && (
                              <ActionButton
                                variant="primary"
                                size="xs"
                                icon={Package}
                                onClick={() => receiveReturnRecord(item.id)}
                              >
                                Receive
                              </ActionButton>
                            )}

                            {item.status === 'RECEIVED' && (
                              <ActionButton
                                variant="primary"
                                size="xs"
                                icon={ShieldCheck}
                                onClick={() => {
                                  setInspectingReturn(item);
                                  setInspectCondition(item.itemCondition || 'GOOD');
                                }}
                              >
                                Inspect
                              </ActionButton>
                            )}

                            {item.status === 'INSPECTED' && (
                              <>
                                <ActionButton
                                  variant="success"
                                  size="xs"
                                  icon={Check}
                                  onClick={() => restockReturnRecord(item.id)}
                                >
                                  Restock
                                </ActionButton>
                                <ActionButton
                                  variant="danger"
                                  size="xs"
                                  icon={AlertTriangle}
                                  onClick={() => markDamagedReturnRecord(item.id)}
                                >
                                  Damaged
                                </ActionButton>
                              </>
                            )}

                            {(item.status === 'RESTOCKED' || item.status === 'DAMAGED') &&
                              item.settlementStatus !== 'SETTLED' && (
                                <ActionButton
                                  variant="outline"
                                  size="xs"
                                  icon={CreditCard}
                                  onClick={() => {
                                    setSettlingReturn(item);
                                    setSettleAmount(item.totalAmount);
                                    setSettleType(item.settlementType || 'CREDIT_NOTE');
                                  }}
                                >
                                  Settle
                                </ActionButton>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Short List Principle Footer */}
            {filteredReturns.length > 8 && (
              <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-xs px-4">
                <span className="text-gray-500">
                  {showAllHistory
                    ? `Showing all ${filteredReturns.length} returns`
                    : `Showing 8 of ${filteredReturns.length} recent returns`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="font-bold text-[#1552B3] hover:underline cursor-pointer"
                >
                  {showAllHistory ? 'Show Short List (8 items)' : `View All (${filteredReturns.length}) Returns`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: RETURN DETAIL DRAWER / MODAL (Task 16) */}
      {/* ============================================================ */}
      {selectedDetailReturn && (
        <Modal
          isOpen={Boolean(selectedDetailReturn)}
          onClose={() => setSelectedDetailReturn(null)}
          title="Return & RMA Voucher Overview"
          description={`Voucher #${selectedDetailReturn.returnNumber} • Logged on ${selectedDetailReturn.createdAt}`}
          size="lg"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* 1. Return Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Return Direction</span>
                <span className="font-bold text-gray-900">
                  {selectedDetailReturn.returnType === 'VENDOR_SALES_RETURN'
                    ? 'Vendor Sales Return (Vendor → Admin)'
                    : selectedDetailReturn.returnType === 'PURCHASE_RETURN'
                    ? 'Purchase Return (Admin → Vendor)'
                    : 'Customer Sales Return'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Returning Party</span>
                <span className="font-bold text-gray-900">{selectedDetailReturn.partyName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Original Outbound Sale</span>
                <span className="font-mono font-bold text-indigo-700">
                  {selectedDetailReturn.sourceSaleId || selectedDetailReturn.sourceReferenceNumber || 'Direct'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Lifecycle Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={mapBadgeStatus(selectedDetailReturn.status)} size="sm" />
                </div>
              </div>
            </div>

            {/* 2. Items & Pricing Section */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50/80 px-3 py-2 border-b border-gray-200 text-xs font-bold text-gray-700">
                Returned Products & Locked Transaction Pricing
              </div>
              <table className="w-full text-xs text-left">
                <thead className="border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="py-2 px-3">Product Name & SKU</th>
                    <th className="py-2 px-3">Reason & Condition</th>
                    <th className="py-2 px-3 text-center">Returned Qty</th>
                    <th className="py-2 px-3 text-right">Original Unit Price</th>
                    <th className="py-2 px-3 text-right">Line Return Value</th>
                    {selectedDetailReturn.status === 'INSPECTED' && (
                      <th className="py-2 px-3 text-center">Item Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedDetailReturn.items && selectedDetailReturn.items.length > 0 ? (
                    selectedDetailReturn.items.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-gray-900">{sub.productName}</p>
                          <p className="font-mono text-[10px] text-gray-400">{sub.sku}</p>
                          {sub.imeis && sub.imeis.length > 0 && (
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-gray-500 font-semibold">IMEI(s):</span>
                              {sub.imeis.map((im, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 bg-blue-50 text-blue-700 font-mono text-[10px] rounded border border-blue-200"
                                >
                                  {im}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-gray-800 text-[11px]">
                            {sub.reasonCategory || sub.reason || selectedDetailReturn.reasonCategory}
                          </p>
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              (sub.itemCondition || selectedDetailReturn.itemCondition) === 'GOOD'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.itemCondition || selectedDetailReturn.itemCondition}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-gray-900">
                          {sub.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                          ₹{sub.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-gray-900">
                          ₹{(sub.unitPrice * sub.quantity).toLocaleString('en-IN')}
                        </td>
                        {selectedDetailReturn.status === 'INSPECTED' && (
                          <td className="py-2.5 px-3 text-center">
                            {(sub.itemCondition || selectedDetailReturn.itemCondition) === 'GOOD' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  restockReturnRecord(selectedDetailReturn.id);
                                  setSelectedDetailReturn(null);
                                }}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded text-[10px] font-bold cursor-pointer"
                              >
                                ✓ Restock
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  markDamagedReturnRecord(selectedDetailReturn.id);
                                  setSelectedDetailReturn(null);
                                }}
                                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded text-[10px] font-bold cursor-pointer"
                              >
                                ✕ Mark Damaged
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900">{selectedDetailReturn.productName}</p>
                        <p className="font-mono text-[10px] text-gray-400">{selectedDetailReturn.sku}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-gray-800 text-[11px]">
                          {selectedDetailReturn.reasonCategory || selectedDetailReturn.reason}
                        </p>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            selectedDetailReturn.itemCondition === 'GOOD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {selectedDetailReturn.itemCondition}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-gray-900">
                        {selectedDetailReturn.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                        ₹{selectedDetailReturn.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-gray-900">
                        ₹{selectedDetailReturn.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50/50">
                  <tr>
                    <td colSpan={selectedDetailReturn.status === 'INSPECTED' ? 4 : 3} className="py-2.5 px-3 font-bold text-gray-800 text-right">
                      Total Return Amount:
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono text-indigo-700 text-sm">
                      ₹{selectedDetailReturn.totalAmount.toLocaleString('en-IN')}
                    </td>
                    {selectedDetailReturn.status === 'INSPECTED' && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 3. Return Reason & Condition Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-gray-200 rounded-xl bg-white text-xs space-y-1">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Structured Return Reason</span>
                <p className="font-bold text-gray-800">{selectedDetailReturn.reasonCategory || selectedDetailReturn.reason}</p>
                {selectedDetailReturn.notes && (
                  <p className="text-[11px] text-gray-500 italic mt-1">Notes: {selectedDetailReturn.notes}</p>
                )}
              </div>
              <div className="p-3 border border-gray-200 rounded-xl bg-white text-xs space-y-1">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Inspection Condition</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                    selectedDetailReturn.itemCondition === 'GOOD'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedDetailReturn.itemCondition}
                </span>
                {selectedDetailReturn.inspectionNotes && (
                  <p className="text-[11px] text-gray-600 mt-1">
                    Inspector Notes: {selectedDetailReturn.inspectionNotes}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Settlement Details */}
            <div className="p-3.5 border border-indigo-100 rounded-xl bg-indigo-50/40 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider block">
                    Settlement Method
                  </span>
                  <span className="font-bold text-gray-900 text-sm">{selectedDetailReturn.settlementType}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider block">
                    Settlement Status
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      selectedDetailReturn.settlementStatus === 'SETTLED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedDetailReturn.settlementStatus || 'PENDING'}
                  </span>
                </div>
              </div>
              {selectedDetailReturn.settlementNotes && (
                <p className="text-[11px] text-gray-600 mt-2 pt-2 border-t border-indigo-100">
                  Notes: {selectedDetailReturn.settlementNotes}
                </p>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedDetailReturn.status === 'RETURN_REQUESTED' && (
                  <ActionButton
                    variant="primary"
                    icon={Package}
                    onClick={() => {
                      receiveReturnRecord(selectedDetailReturn.id);
                      setSelectedDetailReturn(null);
                    }}
                  >
                    Receive Stock
                  </ActionButton>
                )}
                {selectedDetailReturn.status === 'RECEIVED' && (
                  <ActionButton
                    variant="primary"
                    icon={ShieldCheck}
                    onClick={() => {
                      setInspectingReturn(selectedDetailReturn);
                      setSelectedDetailReturn(null);
                    }}
                  >
                    Perform Inspection
                  </ActionButton>
                )}
                {selectedDetailReturn.status === 'INSPECTED' && (
                  <>
                    <ActionButton
                      variant="success"
                      icon={Check}
                      onClick={() => {
                        restockReturnRecord(selectedDetailReturn.id);
                        setSelectedDetailReturn(null);
                      }}
                    >
                      Restock Good Units
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      icon={AlertTriangle}
                      onClick={() => {
                        markDamagedReturnRecord(selectedDetailReturn.id);
                        setSelectedDetailReturn(null);
                      }}
                    >
                      Mark Damaged Units
                    </ActionButton>
                  </>
                )}
              </div>

              <ActionButton variant="outline" onClick={() => setSelectedDetailReturn(null)}>
                Close
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: NEW RETURN WIZARD (Tasks 3, 4, 5, 9, 10, 11, 12) */}
      {/* ============================================================ */}
      <Modal
        isOpen={isNewReturnOpen}
        onClose={() => setIsNewReturnOpen(false)}
        title="Create Return Record"
        description="Process a Vendor Sales Return (sold to vendor and returned), Customer RMA, or Supplier Return"
        size="lg"
      >
        <form onSubmit={handleSubmitNewReturn} className="space-y-4 max-h-[82vh] overflow-y-auto pr-1">
          {/* Direction Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setModalReturnType('VENDOR_SALES_RETURN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                modalReturnType === 'VENDOR_SALES_RETURN'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>Vendor Sales Return</span>
              <span className="text-[10px] font-normal text-gray-500 mt-0.5">Vendor → Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setModalReturnType('SALES_RETURN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                modalReturnType === 'SALES_RETURN'
                  ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>Customer Return</span>
              <span className="text-[10px] font-normal text-gray-500 mt-0.5">Client → Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setModalReturnType('PURCHASE_RETURN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                modalReturnType === 'PURCHASE_RETURN'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>Purchase Return</span>
              <span className="text-[10px] font-normal text-gray-500 mt-0.5">Admin → Vendor</span>
            </button>
          </div>

          {/* VENDOR SALES RETURN FORM SPECIFICS */}
          {modalReturnType === 'VENDOR_SALES_RETURN' ? (
            <div className="space-y-3">
              {/* Step 1: Select Vendor */}
              <FormField
                label="Step 1: Select Returning Vendor (Buyer)"
                required
                helperText="Vendor who purchased goods from us and is now returning them"
              >
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.company || 'Vendor'}) — Phone: {v.phone || 'N/A'}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Step 2: Select Outbound Sale */}
              <FormField
                label="Step 2: Select Original Outbound Sale / Order"
                required
                helperText={
                  vendorSales.length === 0
                    ? 'No sales recorded for this vendor. Create a sale first.'
                    : `Found ${vendorSales.length} outbound sale record(s) for this vendor`
                }
              >
                {vendorSales.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    No sales found for this vendor. Please make a sale to this vendor first or choose another vendor.
                  </div>
                ) : (
                  <select
                    value={selectedSaleId}
                    onChange={(e) => {
                      setSelectedSaleId(e.target.value);
                      setSelectedImeis([]);
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-indigo-600"
                  >
                    {vendorSales.map((s) => (
                      <option key={s.id} value={s.saleId}>
                        {s.saleId} — {s.productName} ({s.quantity} sold @ ₹{s.unitPrice.toLocaleString('en-IN')}) • Date: {s.date}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              {/* Step 3: Multi-Product Return Selection from Original Sale (Tasks 2A, 2B, 2C, 3E) */}
              {currentSale && saleReturnableInfo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-gray-900">
                        Step 3: Select Products to Return from Sale #{currentSale.saleId}
                      </label>
                      <span className="text-[11px] text-gray-500">
                        Only products from this sale can be returned. Pricing is strictly locked to original transaction value.
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {saleReturnableInfo.items.length} Product Line(s)
                    </span>
                  </div>

                  {saleReturnableInfo.items.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                      No product items found in this sale.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {saleReturnableInfo.items.map((it) => {
                        const row = selectedReturnRows[it.sku] || {
                          selected: false,
                          returnQty: it.returnableQuantity > 0 ? 1 : 0,
                          reasonCategory: 'BROKEN_ITEM' as ReturnReasonCategory,
                          otherReason: '',
                          itemCondition: 'DAMAGED' as ReturnItemCondition,
                          selectedImeis: [],
                        };
                        const isOverReturn = row.returnQty > it.returnableQuantity;
                        const isZeroReturn = row.returnQty <= 0;
                        const isFullyReturned = it.returnableQuantity <= 0;

                        return (
                          <div
                            key={it.sku}
                            className={`p-3.5 rounded-xl border transition-all ${
                              row.selected
                                ? 'bg-white border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                                : 'bg-gray-50/70 border-gray-200 opacity-90'
                            }`}
                          >
                            {/* Product Header & Selection Checkbox */}
                            <div className="flex items-start justify-between gap-2">
                              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={row.selected}
                                  disabled={isFullyReturned}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedReturnRows((prev) => ({
                                      ...prev,
                                      [it.sku]: {
                                        ...row,
                                        selected: checked,
                                        returnQty:
                                          checked && row.returnQty <= 0
                                            ? Math.min(1, it.returnableQuantity)
                                            : row.returnQty,
                                      },
                                    }));
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40 cursor-pointer"
                                />
                                <div>
                                  <h5 className="text-xs font-bold text-gray-900">{it.productName}</h5>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                      SKU: {it.sku}
                                    </span>
                                    <span className="text-[10px] text-indigo-700 font-semibold font-mono">
                                      Sale Price: ₹{it.unitPrice.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              </label>

                              {isFullyReturned ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600">
                                  Fully Returned
                                </span>
                              ) : (
                                <span className="text-right">
                                  <span className="text-[10px] text-gray-400 block uppercase font-semibold">
                                    Max Returnable
                                  </span>
                                  <span className="font-mono font-bold text-indigo-700 text-xs">
                                    {it.returnableQuantity} unit(s)
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Stock Breakdown (Task 3E: Sold, Previously Returned, Pending/Reserved, Remaining Returnable) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-gray-200/70 text-center text-[11px]">
                              <div className="bg-gray-100/70 p-1.5 rounded-lg">
                                <span className="text-gray-500 block text-[10px]">Sold</span>
                                <span className="font-bold font-mono text-gray-900">{it.soldQuantity}</span>
                              </div>
                              <div className="bg-amber-50/70 p-1.5 rounded-lg border border-amber-100">
                                <span className="text-amber-700 block text-[10px]">Previously Returned</span>
                                <span className="font-bold font-mono text-amber-800">
                                  {it.alreadyReturnedQuantity}
                                </span>
                              </div>
                              <div className="bg-blue-50/70 p-1.5 rounded-lg border border-blue-100">
                                <span className="text-blue-700 block text-[10px]">Pending/Reserved</span>
                                <span className="font-bold font-mono text-blue-800">{it.pendingQuantity}</span>
                              </div>
                              <div className="bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100">
                                <span className="text-indigo-700 block text-[10px]">Remaining Returnable</span>
                                <span className="font-bold font-mono text-indigo-900">{it.returnableQuantity}</span>
                              </div>
                            </div>

                            {/* Line item inputs when selected */}
                            {row.selected && (
                              <div className="mt-3 pt-3 border-t border-indigo-100 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  {/* Return Qty with Validation Feedback */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                      Return Qty (Max: {it.returnableQuantity})
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={it.returnableQuantity}
                                      value={row.returnQty}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setSelectedReturnRows((prev) => ({
                                          ...prev,
                                          [it.sku]: { ...row, returnQty: val },
                                        }));
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none ${
                                        isOverReturn || isZeroReturn
                                          ? 'bg-rose-50 border-2 border-rose-400 text-rose-900 focus:border-rose-600'
                                          : 'bg-white border border-gray-300 text-gray-900 focus:border-indigo-600'
                                      }`}
                                      required
                                    />
                                    {/* Task 3E Error Warning */}
                                    {isOverReturn && (
                                      <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        Only {it.returnableQuantity} units are currently returnable.
                                      </p>
                                    )}
                                    {isZeroReturn && (
                                      <p className="mt-1 text-[11px] font-bold text-rose-600">
                                        Return quantity must be at least 1.
                                      </p>
                                    )}
                                  </div>

                                  {/* Reason Category */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                      Return Reason
                                    </label>
                                    <select
                                      value={row.reasonCategory}
                                      onChange={(e) => {
                                        const cat = e.target.value as ReturnReasonCategory;
                                        setSelectedReturnRows((prev) => ({
                                          ...prev,
                                          [it.sku]: { ...row, reasonCategory: cat },
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
                                    >
                                      <option value="BROKEN_ITEM">Broken Item</option>
                                      <option value="DAMAGED_ITEM">Damaged Item</option>
                                      <option value="DEFECTIVE_ITEM">Defective Item</option>
                                      <option value="WRONG_PRODUCT">Wrong Product</option>
                                      <option value="MISMATCHED_PRODUCT">Mismatched Product</option>
                                      <option value="WRONG_QUANTITY">Wrong Quantity</option>
                                      <option value="MISSING_PARTS">Missing Parts</option>
                                      <option value="QUALITY_ISSUE">Quality Issue</option>
                                      <option value="PACKAGING_DAMAGE">Packaging Damage</option>
                                      <option value="OTHER">Other Reason</option>
                                    </select>
                                  </div>

                                  {/* Initial Condition */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                      Reported Condition
                                    </label>
                                    <select
                                      value={row.itemCondition}
                                      onChange={(e) => {
                                        const cond = e.target.value as ReturnItemCondition;
                                        setSelectedReturnRows((prev) => ({
                                          ...prev,
                                          [it.sku]: { ...row, itemCondition: cond },
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-semibold"
                                    >
                                      <option value="GOOD">GOOD (Resellable)</option>
                                      <option value="DAMAGED">DAMAGED (Physical)</option>
                                      <option value="DEFECTIVE">DEFECTIVE (Fault)</option>
                                      <option value="MISMATCHED">MISMATCHED (Spec)</option>
                                      <option value="UNSELLABLE">UNSELLABLE (Scrap)</option>
                                    </select>
                                  </div>
                                </div>

                                {row.reasonCategory === 'OTHER' && (
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Specify reason for this item..."
                                      value={row.otherReason}
                                      onChange={(e) => {
                                        const text = e.target.value;
                                        setSelectedReturnRows((prev) => ({
                                          ...prev,
                                          [it.sku]: { ...row, otherReason: text },
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
                                      required
                                    />
                                  </div>
                                )}

                                {/* Serialized IMEI Picker (Task 3C) */}
                                {it.availableImeis && it.availableImeis.length > 0 && (
                                  <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5 text-blue-700" />
                                        Select Sold IMEI(s) to Return ({row.selectedImeis.length}/{row.returnQty} selected)
                                      </span>
                                      {row.selectedImeis.length !== row.returnQty && (
                                        <span className="text-[10px] text-rose-600 font-bold">
                                          Select {Math.abs(row.returnQty - row.selectedImeis.length)} more
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                                       {it.availableImeis.map((imei: string) => {
                                        const isImeiSelected = row.selectedImeis.includes(imei);
                                        return (
                                          <label
                                            key={imei}
                                            className={`flex items-center space-x-2 px-2 py-1 rounded border text-[11px] cursor-pointer transition-all ${
                                              isImeiSelected
                                                ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isImeiSelected}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  if (row.selectedImeis.length < row.returnQty) {
                                                    setSelectedReturnRows((prev) => ({
                                                      ...prev,
                                                      [it.sku]: {
                                                        ...row,
                                                        selectedImeis: [...row.selectedImeis, imei],
                                                      },
                                                    }));
                                                  } else {
                                                    alert(
                                                      `You have already selected ${row.returnQty} IMEI(s) for ${it.productName}.`
                                                    );
                                                  }
                                                } else {
                                                  setSelectedReturnRows((prev) => ({
                                                    ...prev,
                                                    [it.sku]: {
                                                      ...row,
                                                      selectedImeis: row.selectedImeis.filter((im) => im !== imei),
                                                    },
                                                  }));
                                                }
                                              }}
                                              className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="font-mono">{imei}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Line Item Value Subtotal */}
                                <div className="flex justify-between items-center text-[11px] pt-1 text-gray-500 font-medium">
                                  <span>
                                    Line Return Value ({row.returnQty || 0} × ₹{it.unitPrice.toLocaleString('en-IN')}):
                                  </span>
                                  <span className="font-mono font-bold text-gray-900">
                                    ₹{((row.returnQty || 0) * it.unitPrice).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Grand Return Value Summary Bar (Task 2C) */}
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-800 block">
                        Total Selected Items
                      </span>
                      <span className="font-bold text-gray-900">
                        {multiItemTotals.selectedCount} product line(s) • {multiItemTotals.totalQty} total unit(s)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 block">
                        Total Return Credit
                      </span>
                      <span className="font-mono font-black text-indigo-900 text-sm">
                        ₹{multiItemTotals.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Step 4: General Return Notes */}
                  <FormField label="Additional Return Notes / Receiving Memo">
                    <textarea
                      rows={2}
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      placeholder="e.g. Batch return from ABC Electronics; includes damaged units and wrong shipment..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </FormField>

                  {/* Quarantine Stock Guarantee Notice (Task 4) */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Quarantine Stock Guarantee:</span>
                      Returned items enter <strong>RETURN_REQUESTED</strong> status. They will NOT enter live sellable inventory until physically received and inspected by Admin.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STANDARD / LEGACY RETURN FORM */
            <div className="space-y-3">
              <FormField label="Product Item" required>
                <ProductAutocompleteSelect
                  value={selectedProductId}
                  products={products}
                  onChange={(prod) => {
                    if (prod) {
                      setSelectedProductId(prod.sku);
                    }
                  }}
                  placeholder="Search product to return by name, brand, or SKU..."
                  showStock
                  showPrice
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Quantity" required>
                  <input
                    type="number"
                    min="1"
                    value={returnQty}
                    onChange={(e) => setReturnQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                    required
                  />
                </FormField>
                <FormField label="Condition">
                  <select
                    value={initialCondition}
                    onChange={(e) => setInitialCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="GOOD">Good / Resellable</option>
                    <option value="DAMAGED">Damaged / Defective</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Reason Description" required>
                <input
                  type="text"
                  value={otherReasonText}
                  onChange={(e) => setOtherReasonText(e.target.value)}
                  placeholder="Enter reason for return"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  required
                />
              </FormField>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
            <ActionButton variant="outline" type="button" onClick={() => setIsNewReturnOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" type="submit">
              Submit Return Request
            </ActionButton>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: INSPECTION MODAL (Task 6, 7 & 8) */}
      {/* ============================================================ */}
      {inspectingReturn && (
        <Modal
          isOpen={Boolean(inspectingReturn)}
          onClose={() => setInspectingReturn(null)}
          title="Physical Return Inspection"
          description={`Inspect returned goods for Return #${inspectingReturn.returnNumber}`}
          size="lg"
        >
          <form onSubmit={handlePerformInspection} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Party / Vendor:</span>
                <span className="font-bold text-gray-900">{inspectingReturn.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Units to Inspect:</span>
                <span className="font-mono font-bold text-gray-900">{inspectingReturn.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Outbound Sale Reference:</span>
                <span className="font-mono font-semibold text-indigo-700">
                  {inspectingReturn.sourceSaleId || inspectingReturn.sourceReferenceNumber || 'Direct'}
                </span>
              </div>
            </div>

            {inspectingReturn.items && inspectingReturn.items.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>Item-by-Item Physical Inspection</span>
                  <span className="text-[10px] text-gray-500">{inspectingReturn.items.length} item(s)</span>
                </div>
                {inspectingReturn.items.map((it) => {
                  const curInsp = itemInspections[it.sku] || {
                    condition: it.itemCondition || 'GOOD',
                    notes: it.inspectionNotes || '',
                  };
                  return (
                    <div key={it.sku} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold text-gray-900">{it.productName}</h5>
                          <p className="font-mono text-[10px] text-gray-400">SKU: {it.sku}</p>
                          {it.imeis && it.imeis.length > 0 && (
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-gray-500 font-semibold">IMEI(s):</span>
                              {it.imeis.map((im, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] rounded border border-blue-200"
                                >
                                  {im}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-gray-900">{it.quantity} unit(s)</span>
                          <p className="text-[10px] text-gray-500">{it.reasonCategory || it.reason}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">
                            Assigned Condition
                          </label>
                          <select
                            value={curInsp.condition}
                            onChange={(e) => {
                              const val = e.target.value as ReturnItemCondition;
                              setItemInspections((prev) => ({
                                ...prev,
                                [it.sku]: { ...curInsp, condition: val },
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600"
                          >
                            <option value="GOOD">GOOD — Eligible for Restock</option>
                            <option value="DAMAGED">DAMAGED — Move to Damaged Stock</option>
                            <option value="DEFECTIVE">DEFECTIVE — Functional failure</option>
                            <option value="MISMATCHED">MISMATCHED — Spec issue</option>
                            <option value="UNSELLABLE">UNSELLABLE — Scrap/Discard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">
                            Technician Diagnosis Notes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Screen scratch, seal intact..."
                            value={curInsp.notes}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItemInspections((prev) => ({
                                ...prev,
                                [it.sku]: { ...curInsp, notes: val },
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <FormField label="Assign Inspected Physical Condition" required>
                  <select
                    value={inspectCondition}
                    onChange={(e) => setInspectCondition(e.target.value as ReturnItemCondition)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="GOOD">GOOD — Eligible for Restocking into Live Available Stock</option>
                    <option value="DAMAGED">DAMAGED — Move to Damaged Stock Quarantine</option>
                    <option value="DEFECTIVE">DEFECTIVE — Functional failure / quarantine</option>
                    <option value="MISMATCHED">MISMATCHED — Incorrect model / packaging issue</option>
                    <option value="UNSELLABLE">UNSELLABLE — Move to Discard / Scrap Stock</option>
                  </select>
                </FormField>

                <FormField label="Inspection Notes & Technician Diagnosis">
                  <textarea
                    rows={3}
                    value={inspectNotes}
                    onChange={(e) => setInspectNotes(e.target.value)}
                    placeholder="Detail the physical check, serial number match, packaging integrity, or defects observed..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </FormField>
              </>
            )}

            {inspectingReturn.items && inspectingReturn.items.length > 0 && (
              <FormField label="General Return Inspection Summary Notes">
                <textarea
                  rows={2}
                  value={inspectNotes}
                  onChange={(e) => setInspectNotes(e.target.value)}
                  placeholder="Overall remarks about this return inspection..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </FormField>
            )}

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
              <ActionButton variant="outline" type="button" onClick={() => setInspectingReturn(null)}>
                Cancel
              </ActionButton>
              <ActionButton variant="primary" type="submit">
                Confirm Inspection Result
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: SETTLEMENT MODAL (Task 13) */}
      {/* ============================================================ */}
      {settlingReturn && (
        <Modal
          isOpen={Boolean(settlingReturn)}
          onClose={() => setSettlingReturn(null)}
          title="Return Financial Settlement"
          description={`Issue business settlement voucher for Return #${settlingReturn.returnNumber}`}
          size="md"
        >
          <form onSubmit={handlePerformSettlement} className="space-y-4">
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Party / Vendor:</span>
                <span className="font-bold text-gray-900">{settlingReturn.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Return Value:</span>
                <span className="font-mono font-black text-indigo-700 text-sm">
                  ₹{settlingReturn.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <FormField label="Settlement Method" required>
              <select
                value={settleType}
                onChange={(e) => setSettleType(e.target.value as ReturnSettlementType)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-600 font-semibold"
              >
                <option value="CREDIT_NOTE">Credit Note (Credit balance applied to vendor account)</option>
                <option value="REFUND">Refund Voucher (Cash / Bank settlement)</option>
                <option value="ACCOUNT_ADJUSTMENT">Account Adjustment (Offset against pending invoices)</option>
                <option value="EXCHANGE">Exchange Unit (Replacement product voucher)</option>
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Settlement Amount (₹)" required>
                <input
                  type="number"
                  min="0"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold"
                  required
                />
              </FormField>

              <FormField label="Settlement Status">
                <select
                  value={settleStatus}
                  onChange={(e) => setSettleStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="SETTLED">Settled / Closed</option>
                  <option value="PENDING">Pending Settlement</option>
                </select>
              </FormField>
            </div>

            <FormField label="Settlement Notes / Reference Voucher #">
              <input
                type="text"
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                placeholder="e.g. Credit Note CN-2026-081 issued"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
              />
            </FormField>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
              <ActionButton variant="outline" type="button" onClick={() => setSettlingReturn(null)}>
                Cancel
              </ActionButton>
              <ActionButton variant="primary" type="submit">
                Complete Settlement
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default ReturnManagement;
