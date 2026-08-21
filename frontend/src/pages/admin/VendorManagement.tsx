import React, { useState } from 'react';
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
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Vendor } from '../../data/mockVendors';

export const VendorManagement: React.FC = () => {
  const { vendors, products, createPurchaseRequest, updateVendorStatus, addVendor } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [successToast, setSuccessToast] = useState('');

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
  const [poQuantity, setPoQuantity] = useState('');
  const [poUnitCost, setPoUnitCost] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
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

    if (!vendorForm.businessName.trim() || !vendorForm.contactPerson.trim() || !vendorForm.email.trim() || !vendorForm.phone.trim() || !vendorForm.loginEmail.trim() || !vendorForm.password.trim()) {
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
      setSuccessToast(`Vendor "${created.name}" created and login credentials provisioned successfully!`);
      setTimeout(() => setSuccessToast(''), 6000);
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
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === 'Active').length;
  const totalStockSupplied = vendors.reduce(
    (sum, v) => sum + v.totalStockSupplied,
    0
  );
  const totalPendingPayments = vendors.reduce(
    (sum, v) => sum + v.pendingPayments,
    0
  );

  return (
    <AdminLayout
      title="Vendor & Supplier Management"
      subtitle="Authorized suppliers, performance metrics, purchase orders, and payment settlements"
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenAddVendorModal()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Vendor</span>
          </button>
          <button
            onClick={() => handleOpenPOModal()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-gray-500" />
            <span>New Purchase Order</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Success Alert */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Registered Suppliers</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{totalVendors}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Active Contracts</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{activeVendors}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Units Supplied (YTD)</p>
            <p className="text-xl font-bold text-[#1552B3] mt-1 font-mono">{totalStockSupplied}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Pending Settlements</p>
            <p className="text-xl font-bold text-amber-600 mt-1">₹{totalPendingPayments.toLocaleString()}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor name, contact person, or email..."
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
              <option value="All">All Suppliers</option>
              <option value="Active">Active</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#1552B3] flex items-center justify-center font-bold text-sm">
                      {vendor.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{vendor.name}</h3>
                      <p className="text-[11px] text-gray-500">{vendor.contactPerson}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      vendor.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : vendor.status === 'Pending Approval'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {vendor.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{vendor.phone}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 bg-gray-50 p-2.5 rounded-xl text-center">
                  <div>
                    <p className="text-[10px] text-gray-500">Products</p>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">
                      {vendor.productsSupplied}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Completed</p>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5">
                      {vendor.completedOrders}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Pending Pay</p>
                    <p className="text-xs font-bold text-amber-600 mt-0.5">
                      ₹{vendor.pendingPayments.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <select
                  value={vendor.status}
                  onChange={(e) =>
                    updateVendorStatus(
                      vendor.id,
                      e.target.value as Vendor['status']
                    )
                  }
                  className="text-[11px] bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Pending Approval">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>

                <button
                  onClick={() => handleOpenPOModal(vendor.name)}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-[#1552B3] text-[#1552B3] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Send PO</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  Issue Purchase Order (PO)
                </h2>
              </div>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Vendor *
                </label>
                <select
                  value={selectedVendorForPO}
                  onChange={(e) => setSelectedVendorForPO(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Product Item *
                </label>
                <select
                  value={selectedProductSku}
                  onChange={(e) => setSelectedProductSku(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.name} ({p.sku}) — Retail: ₹{p.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Order Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Agreed Unit Cost (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="450"
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={poExpectedDate}
                  onChange={(e) => setPoExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Total Calculation Note */}
              <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="text-gray-600">Total Purchase Commitment:</span>
                <span className="font-bold text-[#1552B3]">
                  ₹
                  {(
                    (parseInt(poQuantity || '0', 10) || 0) *
                    (parseFloat(poUnitCost || '0') || 0)
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Submit Purchase Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vendor & Provision Account Modal */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Add New Supplier / Vendor
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Create vendor business profile and provision vendor user login account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddVendorOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {vendorFormError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                {vendorFormError}
              </div>
            )}

            <form onSubmit={handleAddVendorSubmit} className="space-y-4 pt-4">
              {/* Section 1: Business Details */}
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 text-[#1552B3]">
                  1. Business Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Business / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Mobile World"
                      value={vendorForm.businessName}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, businessName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
                      value={vendorForm.contactPerson}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, contactPerson: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Official Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contact@apexmobiles.com"
                      value={vendorForm.email}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={vendorForm.phone}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Vendor Type
                    </label>
                    <select
                      value={vendorForm.vendorType}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, vendorType: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Authorized Distributor">Authorized Distributor</option>
                      <option value="Direct Manufacturer">Direct Manufacturer</option>
                      <option value="Wholesaler">Wholesaler</option>
                      <option value="Retail Supplier">Retail Supplier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      value={vendorForm.gstin}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, gstin: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Business Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 104 Electronic City, Sector 5, Bengaluru"
                      value={vendorForm.address}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, address: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: User Authentication Account */}
              <div className="pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 text-[#1552B3] flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>2. Authentication & Login Credentials</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Vendor Login Email / Username *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="vendor.login@company.com"
                      value={vendorForm.loginEmail}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, loginEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter temporary password"
                      value={vendorForm.password}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, password: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm Temporary Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Confirm temporary password"
                      value={vendorForm.confirmPassword}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, confirmPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Initial Account Status
                    </label>
                    <select
                      value={vendorForm.status}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          status: e.target.value as 'Active' | 'Suspended',
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Active">ACTIVE (Can log in & manage supplied products)</option>
                      <option value="Suspended">SUSPENDED (Access locked)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Vendor & Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default VendorManagement;
