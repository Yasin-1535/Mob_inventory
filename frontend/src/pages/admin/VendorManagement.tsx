import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  X,
  Send,
  Phone,
  Mail,
  UserPlus,
  Building,
  Key,
  Check,
  Eye,
  ShoppingBag,
  Package,
  Layers,
  RotateCcw,
  CreditCard,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Vendor } from '../../data/mockVendors';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  ActionButton,
  ActionMenu,
  HistoryHierarchy,
  HistoryEventItem,
  IconButton,
  SearchBar,
  Select,
  FilterBar,
  EmptyState,
  Modal,
  FormField,
  FormSection,
} from '../../components/ui';
import { ProductAutocompleteSelect } from '../../components/ProductAutocompleteSelect';


export const VendorManagement: React.FC = () => {
  const {
    vendors,
    products,
    purchaseRequests,
    sales,
    orders,
    payments = [],
    returns = [],
    createPurchaseRequest,
    updateVendorStatus,
    addVendor,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [successToast, setSuccessToast] = useState('');

  // Selected Vendor for Detail Modal
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<
    'overview' | 'products' | 'purchases' | 'orders' | 'returns' | 'payments' | 'notes'
  >('overview');

  // Add Vendor Modal State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    vendorType: 'Authorized Distributor',
    gstin: '',
    loginEmail: '',
    password: '',
    confirmPassword: '',
    status: 'Active' as 'Active' | 'Suspended',
  });
  const [vendorFormError, setVendorFormError] = useState('');

  // New Purchase Request Modal State
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedVendorForPO, setSelectedVendorForPO] = useState<string>('ABC Electronics');
  const [selectedProductSku, setSelectedProductSku] = useState<string>('');
  const [poQuantity, setPoQuantity] = useState('50');
  const [poUnitCost, setPoUnitCost] = useState('500');
  const [poExpectedDate, setPoExpectedDate] = useState('2026-08-25');
  const [poNotes, setPoNotes] = useState('');

  const handleOpenAddVendorModal = () => {
    setVendorForm({
      businessName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      vendorType: 'Authorized Distributor',
      gstin: '',
      loginEmail: '',
      password: '',
      confirmPassword: '',
      status: 'Active',
    });
    setVendorFormError('');
    setIsAddVendorOpen(true);
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVendorFormError('');

    if (
      !vendorForm.businessName.trim() ||
      !vendorForm.contactPerson.trim() ||
      !vendorForm.email.trim() ||
      !vendorForm.phone.trim() ||
      !vendorForm.loginEmail.trim() ||
      !vendorForm.password.trim()
    ) {
      setVendorFormError('Please fill in all required fields marked with *');
      return;
    }

    if (vendorForm.password !== vendorForm.confirmPassword) {
      setVendorFormError('Temporary password and confirm password do not match');
      return;
    }

    if (vendorForm.password.length < 6) {
      setVendorFormError('Password must be at least 6 characters');
      return;
    }

    try {
      const created = addVendor({
        businessName: vendorForm.businessName.trim(),
        contactPerson: vendorForm.contactPerson.trim(),
        email: vendorForm.email.trim(),
        phone: vendorForm.phone.trim(),
        address: vendorForm.address.trim(),
        vendorType: vendorForm.vendorType,
        gstin: vendorForm.gstin.trim(),
        loginEmail: vendorForm.loginEmail.trim(),
        password: vendorForm.password.trim(),
        status: vendorForm.status,
      });

      setIsAddVendorOpen(false);
      setSuccessToast(`Vendor "${created.name}" created and credentials provisioned!`);
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err: any) {
      setVendorFormError(err.message || 'Failed to create vendor account');
    }
  };

  const handleOpenPOModal = (vendorName?: string) => {
    if (vendorName) setSelectedVendorForPO(vendorName);
    setSelectedProductSku(products[0]?.sku || '');
    setPoQuantity('50');
    setPoUnitCost(products[0] ? (products[0].price * 0.6).toFixed(0) : '500');
    setPoExpectedDate('2026-08-25');
    setPoNotes('');
    setIsPOModalOpen(true);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.sku === selectedProductSku);
    if (!prod || !poQuantity || !poUnitCost) return;

    createPurchaseRequest({
      vendorName: selectedVendorForPO,
      productName: prod.name,
      sku: prod.sku,
      quantityRequested: parseInt(poQuantity, 10),
      unitCost: parseFloat(poUnitCost),
      totalCost: parseInt(poQuantity, 10) * parseFloat(poUnitCost),
      status: 'PENDING',
      expectedDelivery: poExpectedDate || '2026-08-25',
    });

    setIsPOModalOpen(false);
    setSuccessToast(`Purchase Order issued to "${selectedVendorForPO}" successfully!`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        v.name.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        (v.gstin && v.gstin.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchQuery, statusFilter]);

  // Helper for vendor stats
  const getVendorStats = (vendorName: string) => {
    const pos = purchaseRequests.filter((p) => p.vendorName === vendorName);
    const purchaseVal = pos.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const lastDate = pos[0]?.requestDate || pos[0]?.createdAt || '2026-08-15';
    const suppliedProds = products.filter((p) => p.supplier === vendorName);
    return { pos, purchaseVal, lastDate, suppliedProds };
  };

  // Helper for historical vendor events (Purchases, Payments, Returns)
  const getVendorHistoryEvents = (vendor: Vendor): HistoryEventItem[] => {
    const events: HistoryEventItem[] = [];
    const vNameLower = vendor.name.toLowerCase();

    // Sales TO Vendor (Admin sells to Vendor)
    sales
      .filter(
        (s) =>
          s.vendorId === vendor.id ||
          s.vendorName?.toLowerCase() === vNameLower ||
          s.customerName?.toLowerCase() === vNameLower
      )
      .forEach((s) => {
        events.push({
          id: `sale-${s.id}`,
          date: s.date || '2026-09-18',
          type: 'SALE',
          title: `Sale TO Vendor (${s.saleId})`,
          subtitle: `${s.productName} (${s.sku}) • ${s.quantity} units sold`,
          badgeText: s.paymentStatus || 'Completed',
          badgeStatus: 'Delivered',
          quantityChange: -s.quantity,
          amount: s.totalAmount,
          reference: s.saleId,
          party: vendor.name,
        });
      });

    // Purchases (PO requests from Supplier)
    purchaseRequests
      .filter((p) => p.vendorName?.toLowerCase() === vNameLower)
      .forEach((p) => {
        events.push({
          id: `po-${p.id}`,
          date: p.requestDate || (p as any).createdAt || '2026-08-17',
          type: 'PURCHASE',
          title: `Purchase Order ${p.requestNumber}`,
          subtitle: `${p.productName} • ${p.quantityRequested} units`,
          badgeText: p.status,
          badgeStatus: p.status,
          quantityChange: p.quantityRequested,
          amount: p.totalCost,
          reference: p.requestNumber,
          party: vendor.name,
        });
      });

    // Payments / Disbursements
    payments
      .filter(
        (pay) =>
          pay.partyName?.toLowerCase() === vNameLower ||
          (pay.partyType === 'SUPPLIER' && pay.partyName?.toLowerCase() === vNameLower)
      )
      .forEach((pay) => {
        events.push({
          id: `pay-${pay.id}`,
          date: pay.paymentDate || '2026-08-17',
          type: 'PAYMENT',
          title: `Payment ${pay.paymentNumber}`,
          subtitle: `${pay.paymentMethod} • ${pay.notes || 'Supplier settlement'}`,
          badgeText: pay.paymentType === 'DISBURSEMENT' ? 'Paid' : 'Received',
          badgeStatus: 'Delivered',
          amount: pay.amount,
          reference: pay.referenceNumber,
          party: vendor.name,
        });
      });

    // Returns (Vendor Sales Returns + Purchase Returns)
    returns
      .filter(
        (r) =>
          r.partyId === vendor.id ||
          r.partyName?.toLowerCase() === vNameLower ||
          (r as any).vendorName?.toLowerCase() === vNameLower ||
          (r as any).supplier?.toLowerCase() === vNameLower
      )
      .forEach((r) => {
        const isVendorReturn = r.returnType === 'VENDOR_SALES_RETURN';
        events.push({
          id: `ret-${r.id}`,
          date: r.createdAt || '2026-09-18',
          type: 'RETURN',
          title: isVendorReturn
            ? `Vendor Return FROM Vendor #${r.returnNumber}`
            : `Purchase Return TO Vendor #${r.returnNumber}`,
          subtitle: `${r.productName} • ${r.quantity} units (${r.reasonCategory || r.reason}) • Condition: ${r.itemCondition}`,
          badgeText: isVendorReturn ? `Vendor Return (${r.status})` : `Supplier Return (${r.status})`,
          badgeStatus: r.status === 'RESTOCKED' || r.status === 'SETTLED' ? 'Delivered' : 'Pending',
          quantityChange: isVendorReturn ? +r.quantity : -r.quantity,
          amount: isVendorReturn ? -r.totalAmount : r.totalAmount,
          reference: r.sourceSaleId || r.returnNumber,
          party: vendor.name,
        });

        // Settle event
        if (r.settlementStatus === 'SETTLED' && r.settlementType) {
          events.push({
            id: `settle-${r.id}`,
            date: r.settlementDate || r.createdAt || '2026-09-18',
            type: 'PAYMENT',
            title: `Settlement: ${r.settlementType} (${r.returnNumber})`,
            subtitle: `${r.settlementNotes || 'Return financial settlement recorded'}`,
            badgeText: 'Settled',
            badgeStatus: 'Delivered',
            amount: r.settlementAmount || r.totalAmount,
            reference: r.returnNumber,
            party: vendor.name,
          });
        }
      });

    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === 'Active').length;
  const totalStockSupplied = vendors.reduce((sum, v) => sum + (v.totalStockSupplied || 0), 0);
  const totalPendingPayments = vendors.reduce((sum, v) => sum + (v.pendingPayments || 0), 0);

  return (
    <AdminLayout
      title="Vendor Directory & Management"
      subtitle="Authorized suppliers, distributor accounts, procurement agreements, and payment settlements"
      actions={
        <div className="flex items-center space-x-2">
          <ActionButton
            variant="primary"
            icon={UserPlus}
            onClick={handleOpenAddVendorModal}
          >
            Add Vendor
          </ActionButton>
          <ActionButton
            variant="outline"
            icon={Plus}
            onClick={() => handleOpenPOModal()}
          >
            New PO
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Success Alert */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Registered Vendors"
            value={totalVendors}
            subtitle="Verified supplier network"
            icon={Building}
            colorScheme="blue"
          />
          <KpiCard
            title="Active Contracts"
            value={activeVendors}
            subtitle="Supplying active catalog items"
            icon={CheckCircle2}
            colorScheme="emerald"
          />
          <KpiCard
            title="Units Supplied (YTD)"
            value={totalStockSupplied}
            subtitle="Total units received in inventory"
            icon={Package}
            colorScheme="indigo"
          />
          <KpiCard
            title="Pending Settlements"
            value={`₹${totalPendingPayments.toLocaleString('en-IN')}`}
            subtitle="Accounts payable balance"
            icon={Clock}
            colorScheme="amber"
          />
        </div>

        {/* Search, Filter & View Toggle */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search vendor name, contact, GSTIN..."
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#1552B3]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Card View"
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

        {/* Vendors Content Area */}
        {filteredVendors.length === 0 ? (
          <EmptyState
            icon={Building}
            title="No Vendors Found"
            description="No supplier records match your search. You can add a new authorized vendor using the button above."
            actionLabel="Add New Vendor"
            onAction={handleOpenAddVendorModal}
          />
        ) : viewMode === 'cards' ? (
          /* VENDOR CARD GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVendors.map((vendor) => {
              const { purchaseVal, lastDate } = getVendorStats(vendor.name);
              const totalVal = purchaseVal || (vendor.totalStockSupplied || 0) * 450;
              const outstanding = vendor.pendingPayments || 0;
              const gstinDisplay = vendor.gstin || '27AAAAA0000A1Z5';

              return (
                <div
                  key={vendor.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name, Business & Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1552B3] flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                          {vendor.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{vendor.name}</h3>
                          <p className="text-[11px] text-gray-500 truncate">
                            {vendor.vendorType || 'Authorized Distributor'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge
                        status={
                          vendor.status === 'Active'
                            ? 'Delivered'
                            : vendor.status === 'Suspended'
                            ? 'Rejected'
                            : 'Pending'
                        }
                        size="sm"
                      />
                    </div>

                    {/* Contact details & GSTIN */}
                    <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Contact Person:</span>
                        <span className="font-semibold text-gray-800">{vendor.contactPerson}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Phone:</span>
                        <span className="font-mono text-gray-700">{vendor.phone}</span>
                      </div>
                      <div className="flex items-center justify-between truncate">
                        <span className="text-gray-400 text-[11px]">Email:</span>
                        <span className="text-gray-700 truncate max-w-[160px]">{vendor.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">GSTIN:</span>
                        <span className="font-mono text-xs font-semibold text-gray-800">{gstinDisplay}</span>
                      </div>
                    </div>

                    {/* Financial Metrics: Purchase Value, Outstanding, Last Tx */}
                    <div className="my-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Purchase Value:</span>
                        <span className="font-mono font-bold text-[#1552B3]">
                          ₹{totalVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Outstanding Due:</span>
                        <span className="font-mono font-bold text-amber-600">
                          ₹{outstanding.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-gray-200/60">
                        <span className="text-gray-400">Last Transaction:</span>
                        <span className="font-medium text-gray-600">{lastDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <ActionButton
                      variant="outline"
                      size="xs"
                      icon={Eye}
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setDetailActiveTab('overview');
                      }}
                    >
                      Profile
                    </ActionButton>

                    <div className="flex items-center gap-1.5">
                      <ActionButton
                        variant="primary"
                        size="xs"
                        icon={Send}
                        onClick={() => handleOpenPOModal(vendor.name)}
                      >
                        Send PO
                      </ActionButton>

                      <ActionMenu
                        size="xs"
                        actions={[
                          {
                            label: 'Vendor Profile',
                            icon: Eye,
                            onClick: () => {
                              setSelectedVendor(vendor);
                              setDetailActiveTab('overview');
                            },
                          },
                          {
                            label: 'View History & Ledger',
                            icon: Calendar,
                            onClick: () => {
                              setSelectedVendor(vendor);
                              setDetailActiveTab('payments');
                            },
                          },
                          {
                            label: 'Supplied Products',
                            icon: Package,
                            onClick: () => {
                              setSelectedVendor(vendor);
                              setDetailActiveTab('products');
                            },
                          },
                          {
                            label: vendor.status === 'Active' ? 'Suspend Supplier' : 'Activate Supplier',
                            icon: vendor.status === 'Active' ? X : Check,
                            variant: vendor.status === 'Active' ? 'danger' : 'default',
                            onClick: () => {
                              updateVendorStatus(vendor.id, vendor.status === 'Active' ? 'Suspended' : 'Active');
                              setSuccessToast(`Vendor status updated for ${vendor.name}`);
                            },
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DENSE TABLE VIEW */
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Supplier Directory ({filteredVendors.length})
              </h2>
              <span className="text-[11px] text-gray-400">Authorized partners & distribution contracts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Vendor & Business</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4 text-right">Purchase Value</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVendors.map((vendor) => {
                    const { purchaseVal } = getVendorStats(vendor.name);
                    const totalVal = purchaseVal || (vendor.totalStockSupplied || 0) * 450;
                    const outstanding = vendor.pendingPayments || 0;
                    const gstinDisplay = vendor.gstin || '27AAAAA0000A1Z5';

                    return (
                      <tr key={vendor.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{vendor.name}</p>
                          <p className="text-[11px] text-gray-500">{vendor.vendorType || 'Authorized Distributor'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800">{vendor.contactPerson}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{vendor.phone}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-gray-700">
                          {gstinDisplay}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#1552B3]">
                          ₹{totalVal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                          ₹{outstanding.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge
                            status={
                              vendor.status === 'Active'
                                ? 'Delivered'
                                : vendor.status === 'Suspended'
                                ? 'Rejected'
                                : 'Pending'
                            }
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <ActionButton
                              variant="outline"
                              size="xs"
                              icon={Eye}
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setDetailActiveTab('overview');
                              }}
                            >
                              Profile
                            </ActionButton>
                            <ActionButton
                              variant="primary"
                              size="xs"
                              icon={Send}
                              onClick={() => handleOpenPOModal(vendor.name)}
                            >
                              PO
                            </ActionButton>
                            <ActionMenu
                              size="xs"
                              actions={[
                                {
                                  label: 'View Ledger & History',
                                  icon: Calendar,
                                  onClick: () => {
                                    setSelectedVendor(vendor);
                                    setDetailActiveTab('payments');
                                  },
                                },
                                {
                                  label: 'Supplied Products',
                                  icon: Package,
                                  onClick: () => {
                                    setSelectedVendor(vendor);
                                    setDetailActiveTab('products');
                                  },
                                },
                                {
                                  label: vendor.status === 'Active' ? 'Suspend Supplier' : 'Activate Supplier',
                                  icon: vendor.status === 'Active' ? X : Check,
                                  variant: vendor.status === 'Active' ? 'danger' : 'default',
                                  onClick: () => {
                                    updateVendorStatus(vendor.id, vendor.status === 'Active' ? 'Suspended' : 'Active');
                                    setSuccessToast(`Vendor status updated for ${vendor.name}`);
                                  },
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
      </div>

      {/* 7-TAB VENDOR DETAIL MODAL / DRAWER */}
      {selectedVendor && (
        <Modal
          isOpen={Boolean(selectedVendor)}
          onClose={() => setSelectedVendor(null)}
          title={`${selectedVendor.name}`}
          description={`Authorized Supplier • ${selectedVendor.vendorType || 'Distributor'} • Status: ${selectedVendor.status}`}
          size="xl"
        >
          <div className="space-y-4">
            {/* 7 Tabs Bar */}
            <div className="flex items-center space-x-1 border-b border-gray-200 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'products', label: 'Products' },
                { id: 'purchases', label: 'Purchases' },
                { id: 'orders', label: 'Orders' },
                { id: 'returns', label: 'Returns' },
                { id: 'payments', label: 'Payments / History' },
                { id: 'notes', label: 'Notes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    detailActiveTab === tab.id
                      ? 'bg-[#1552B3] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {detailActiveTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Business Name</span>
                      <span className="font-bold text-gray-900 text-sm">{selectedVendor.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Primary Contact</span>
                      <span className="font-semibold text-gray-800">{selectedVendor.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Phone Number</span>
                      <span className="font-mono text-gray-800">{selectedVendor.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Official Email</span>
                      <span className="text-gray-800">{selectedVendor.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400 block text-[11px]">GSTIN / Tax ID</span>
                      <span className="font-mono font-bold text-gray-900">
                        {selectedVendor.gstin || '27AAAAA0000A1Z5'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Supplier Type</span>
                      <span className="font-medium text-gray-800">{selectedVendor.vendorType || 'Distributor'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Business Address</span>
                      <span className="text-gray-700">
                        {selectedVendor.address || 'Industrial Area, Phase II, Tech Park'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Contract Status</span>
                      <StatusBadge
                        status={
                          selectedVendor.status === 'Active'
                            ? 'Delivered'
                            : selectedVendor.status === 'Suspended'
                            ? 'Rejected'
                            : 'Pending'
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-gray-500 block text-[11px]">Products Supplied</span>
                    <span className="text-lg font-bold text-[#1552B3]">
                      {products.filter((p) => p.supplier === selectedVendor.name).length || selectedVendor.productsSupplied}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-gray-500 block text-[11px]">Completed Shipments</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {selectedVendor.completedOrders || 120}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                    <span className="text-gray-500 block text-[11px]">Outstanding Payables</span>
                    <span className="text-lg font-bold text-amber-700">
                      ₹{(selectedVendor.pendingPayments || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS */}
            {detailActiveTab === 'products' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">Supplied Product Catalog</span>
                  <span className="text-gray-400 font-mono">
                    {products.filter((p) => p.supplier === selectedVendor.name).length} items linked
                  </span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                      <tr>
                        <th className="p-2.5">Product Name</th>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5 text-right">In Stock</th>
                        <th className="p-2.5 text-right">Selling Price</th>
                        <th className="p-2.5 text-right">Est. Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px]">
                      {products
                        .filter((p) => p.supplier === selectedVendor.name || selectedVendor.name === 'ABC Electronics')
                        .slice(0, 8)
                        .map((prod) => (
                          <tr key={prod.id}>
                            <td className="p-2.5 font-semibold text-gray-900">{prod.name}</td>
                            <td className="p-2.5 font-mono text-gray-500">{prod.sku}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-gray-800">{prod.stock}</td>
                            <td className="p-2.5 text-right font-mono text-gray-800">₹{prod.price.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-[#1552B3]">
                              ₹{(prod.supplierCost || Math.round(prod.price * 0.7)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PURCHASES */}
            {detailActiveTab === 'purchases' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">Procurement Orders History</span>
                  <ActionButton
                    variant="outline"
                    size="xs"
                    icon={Plus}
                    onClick={() => handleOpenPOModal(selectedVendor.name)}
                  >
                    Issue New PO
                  </ActionButton>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                      <tr>
                        <th className="p-2.5">PO Number</th>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Total Cost</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px]">
                      {purchaseRequests
                        .filter((p) => p.vendorName === selectedVendor.name)
                        .map((po) => (
                          <tr key={po.id}>
                            <td className="p-2.5 font-mono font-bold text-gray-900">{po.requestNumber}</td>
                            <td className="p-2.5 text-gray-800">{po.productName}</td>
                            <td className="p-2.5 text-center font-mono">{po.quantityRequested}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                              ₹{po.totalCost.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-center">
                              <StatusBadge
                                status={
                                  po.status === 'DELIVERED'
                                    ? 'Delivered'
                                    : po.status === 'ACCEPTED'
                                    ? 'Dispatched'
                                    : 'Pending'
                                }
                                size="sm"
                              />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: ORDERS */}
            {detailActiveTab === 'orders' && (
              <div className="space-y-3 text-xs">
                <p className="text-gray-500">
                  Client retail orders fulfilled using inventory sourced through {selectedVendor.name}:
                </p>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                      <tr>
                        <th className="p-2.5">Order Ref</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Party</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px]">
                      {orders.slice(0, 5).map((ord) => (
                        <tr key={ord.id}>
                          <td className="p-2.5 font-mono font-bold text-gray-900">{ord.orderNumber}</td>
                          <td className="p-2.5 text-gray-500">{ord.date}</td>
                          <td className="p-2.5 text-gray-800">{ord.customerName}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                            ₹{ord.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-center">
                            <StatusBadge status={ord.status === 'Delivered' ? 'Delivered' : 'Pending'} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: RETURNS */}
            {detailActiveTab === 'returns' && (() => {
              const vendorReturns = returns.filter(
                (r) =>
                  r.partyId === selectedVendor.id ||
                  r.partyName?.toLowerCase() === selectedVendor.name.toLowerCase() ||
                  (r as any).vendorName?.toLowerCase() === selectedVendor.name.toLowerCase()
              );

              if (vendorReturns.length === 0) {
                return (
                  <div className="space-y-3 text-xs">
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                      <RotateCcw className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="font-bold text-gray-800">No Return Vouchers on File</p>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                        No vendor sales returns or supplier RMA records currently logged for {selectedVendor.name}.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-bold text-gray-800">
                      Returns Involving {selectedVendor.name} ({vendorReturns.length})
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Sales Returns & Purchase Returns
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {vendorReturns.map((ret) => {
                      const isVendorSalesReturn = ret.returnType === 'VENDOR_SALES_RETURN';
                      return (
                        <div
                          key={ret.id}
                          className="p-3.5 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-gray-900">{ret.returnNumber}</span>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  isVendorSalesReturn
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isVendorSalesReturn
                                  ? 'Vendor Sales Return (Vendor → Admin)'
                                  : 'Purchase Return (Admin → Vendor)'}
                              </span>
                            </div>
                            <span className="font-mono font-black text-gray-900">
                              ₹{ret.totalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-2 rounded-lg text-[11px]">
                            <div>
                              <span className="text-gray-400 block">Product:</span>
                              <span className="font-bold text-gray-800 truncate block">{ret.productName}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Quantity:</span>
                              <span className="font-bold text-gray-900 font-mono">{ret.quantity} units</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Condition:</span>
                              <span className="font-bold text-gray-800">{ret.itemCondition}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Lifecycle Status:</span>
                              <span className="font-bold text-indigo-700">{ret.status}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                            <span>
                              Reason: <strong className="text-gray-700">{ret.reasonCategory || ret.reason}</strong>
                            </span>
                            {ret.sourceSaleId && (
                              <span className="font-mono text-indigo-600">
                                Ref Sale: {ret.sourceSaleId}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* TAB 6: PAYMENTS / HISTORY */}
            {detailActiveTab === 'payments' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-gray-400 block text-[11px]">Total Purchases (YTD)</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹
                      {(
                        getVendorStats(selectedVendor.name).purchaseVal ||
                        (selectedVendor.totalStockSupplied || 0) * 450
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-amber-700 block text-[11px]">Current Outstanding Due</span>
                    <span className="text-lg font-bold text-amber-900">
                      ₹{(selectedVendor.pendingPayments || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-1">Settlement Terms</h4>
                  <p className="text-gray-600 text-[11px]">
                    Standard Net-30 day payment schedule. Dispatched batches are reconciled against delivery notes before invoice clearance.
                  </p>
                </div>

                {/* Historical Ledger */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#1552B3]" />
                      <span>Vendor Transaction & Activity History</span>
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {getVendorHistoryEvents(selectedVendor).length} events
                    </span>
                  </div>

                  <HistoryHierarchy
                    events={getVendorHistoryEvents(selectedVendor)}
                    maxItems={8}
                  />
                </div>
              </div>
            )}

            {/* TAB 7: NOTES */}
            {detailActiveTab === 'notes' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <h4 className="font-bold text-gray-900">Vendor Notes & SLAs</h4>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    Authorized hardware partner. Average shipment turnaround time: 3-5 business days. Direct RMA replacement guaranteed for in-transit transit damages.
                  </p>
                  <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-400 font-mono">
                    Last reviewed by Admin: 2026-08-10
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <ActionButton
                variant="outline"
                onClick={() => setSelectedVendor(null)}
              >
                Close
              </ActionButton>
              <ActionButton
                variant="primary"
                icon={Send}
                onClick={() => {
                  setSelectedVendor(null);
                  handleOpenPOModal(selectedVendor.name);
                }}
              >
                Issue Purchase Order
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}

      {/* New Purchase Order Modal */}
      <Modal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        title="Issue Purchase Order (PO)"
        description="Select product item and specify order volume to restock inventory."
        size="md"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <FormField label="Target Vendor" required>
            <select
              value={selectedVendorForPO}
              onChange={(e) => setSelectedVendorForPO(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.contactPerson})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Select Product Item" required>
            <ProductAutocompleteSelect
              value={selectedProductSku}
              products={products}
              onChange={(prod) => {
                if (prod) {
                  setSelectedProductSku(prod.sku);
                  setPoUnitCost((prod.price * 0.6).toFixed(0));
                }
              }}
              placeholder="Search product by name, brand, or SKU..."
              showStock
              showPrice
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Order Quantity" required>
              <input
                type="number"
                required
                min="1"
                placeholder="50"
                value={poQuantity}
                onChange={(e) => setPoQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3] font-mono"
              />
            </FormField>

            <FormField label="Agreed Unit Cost (₹)" required>
              <input
                type="number"
                required
                min="1"
                placeholder="450"
                value={poUnitCost}
                onChange={(e) => setPoUnitCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3] font-mono"
              />
            </FormField>
          </div>

          <FormField label="Expected Delivery Date">
            <input
              type="date"
              value={poExpectedDate}
              onChange={(e) => setPoExpectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
            />
          </FormField>

          {/* Total Calculation Note */}
          <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Total Purchase Commitment:</span>
            <span className="font-bold text-[#1552B3] font-mono text-sm">
              ₹
              {(
                (parseInt(poQuantity || '0', 10) || 0) * (parseFloat(poUnitCost || '0') || 0)
              ).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            <ActionButton
              variant="outline"
              type="button"
              onClick={() => setIsPOModalOpen(false)}
            >
              Cancel
            </ActionButton>
            <ActionButton variant="primary" type="submit">
              Submit Purchase Order
            </ActionButton>
          </div>
        </form>
      </Modal>

      {/* Add Vendor & Provision Account Modal */}
      <Modal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        title="Add New Supplier / Vendor"
        description="Create vendor business profile and provision vendor user login account."
        size="lg"
      >
        <form onSubmit={handleAddVendorSubmit} className="space-y-4">
          {vendorFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {vendorFormError}
            </div>
          )}

          <FormSection
            title="Business Information"
            description="Company profile and regulatory tax identity"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Business / Company Name" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Mobile World"
                  value={vendorForm.businessName}
                  onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                />
              </FormField>

              <FormField label="Contact Person" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Patel"
                  value={vendorForm.contactPerson}
                  onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                />
              </FormField>

              <FormField label="Official Contact Email" required>
                <input
                  type="email"
                  required
                  placeholder="contact@apexmobiles.com"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                />
              </FormField>

              <FormField label="Phone Number" required>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                />
              </FormField>

              <FormField label="Vendor Type">
                <select
                  value={vendorForm.vendorType}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                >
                  <option value="Authorized Distributor">Authorized Distributor</option>
                  <option value="Direct Manufacturer">Direct Manufacturer</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Retail Supplier">Retail Supplier</option>
                </select>
              </FormField>

              <FormField label="GSTIN / Tax ID">
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  value={vendorForm.gstin}
                  onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3] font-mono"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Business Address">
                  <input
                    type="text"
                    placeholder="e.g. 104 Electronic City, Sector 5, Bengaluru"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                  />
                </FormField>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Authentication & Login Credentials"
            description="Credentials used by vendor to access supplier portal"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <FormField label="Vendor Login Email / Username" required>
                  <input
                    type="email"
                    required
                    placeholder="vendor.login@company.com"
                    value={vendorForm.loginEmail}
                    onChange={(e) => setVendorForm({ ...vendorForm, loginEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                  />
                </FormField>
              </div>

              <FormField label="Temporary Password" required>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={vendorForm.password}
                  onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                />
              </FormField>

              <FormField label="Confirm Password" required>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repeat password"
                  value={vendorForm.confirmPassword}
                  onChange={(e) => setVendorForm({ ...vendorForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Initial Account Status">
                  <select
                    value={vendorForm.status}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        status: e.target.value as 'Active' | 'Suspended',
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1552B3]"
                  >
                    <option value="Active">ACTIVE (Provisioned for immediate access)</option>
                    <option value="Suspended">SUSPENDED (Access locked)</option>
                  </select>
                </FormField>
              </div>
            </div>
          </FormSection>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            <ActionButton
              variant="outline"
              type="button"
              onClick={() => setIsAddVendorOpen(false)}
            >
              Cancel
            </ActionButton>
            <ActionButton variant="primary" type="submit">
              Create Vendor & Provision Account
            </ActionButton>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default VendorManagement;
