import React, { useState } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  Save,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import VendorLayout from '../../components/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const VendorProfile: React.FC = () => {
  const { user } = useAuth();

  const [companyName, setCompanyName] = useState(user?.shopName || 'ABC Electronics');
  const [contactName, setContactName] = useState(user?.name || 'Rajesh Kumar');
  const [email, setEmail] = useState(user?.email || 'vendor@smartinventory.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState(
    'Plot 42, Electronics Manufacturing Complex, Phase II, Bengaluru, Karnataka 560100'
  );
  const [businessType, setBusinessType] = useState('Authorized Electronics Distributor');
  const [isSaved, setIsSaved] = useState(false);

  // Protected Fields (Read-Only)
  const vendorId = 'VEN-88201';
  const gstin = '29AABCA1234F1Z5';
  const accountStatus = 'Active';
  const bankName = 'HDFC Bank Ltd';
  const bankAccount = '•••• •••• •••• 8842';
  const ifscCode = 'HDFC0001923';
  const branchName = 'Bengaluru Industrial Finance Hub';
  const memberSince = 'March 2024';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <VendorLayout
      title="Vendor Profile & Business Details"
      subtitle="Manage your registered supplier credentials, contact information, warehouse dispatch address, and settlement settings"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 text-[#1552B3] flex items-center justify-center font-bold text-2xl ring-4 ring-blue-50 shrink-0">
              {companyName[0]?.toUpperCase() || 'V'}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-bold text-gray-900">{companyName}</h2>
                <StatusBadge status={accountStatus} />
                <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold border border-gray-200">
                  {vendorId}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start space-x-1.5">
                <span>{businessType}</span>
                <span>&bull;</span>
                <span>Partner since {memberSince}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-gray-600">
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{email}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{phone}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-bold">Verified Supplier SLA</p>
              <p className="text-[11px] text-emerald-700 font-normal">98.4% On-Time Warehouse Fulfillment</p>
            </div>
          </div>
        </div>

        {/* 2-Column Main Form & Credentials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Protected Business & Bank Credentials */}
          <div className="space-y-6">
            {/* Protected Verification Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>System Credentials</span>
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Protected (Read-only)</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">Vendor ID</span>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">{vendorId}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">GSTIN / Tax ID</span>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">{gstin}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">Portal Access Role</span>
                  <p className="font-semibold text-[#1552B3] mt-0.5">VENDOR (Verified Supplier)</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">Account Status</span>
                  <p className="font-semibold text-emerald-700 mt-0.5">Active & In Good Standing</p>
                </div>
              </div>
            </div>

            {/* Direct Bank Settlement Account */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  <span>Payout Bank Details</span>
                </h3>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Verified
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">Bank Name</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{bankName}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">Account Number</span>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">{bankAccount}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">IFSC Code</span>
                  <p className="font-mono font-semibold text-gray-900 mt-0.5">{ifscCode}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block font-medium">Branch</span>
                  <p className="text-gray-700 mt-0.5">{branchName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editable Vendor Information Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                  Business & Contact Details
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Update your contact person and notification coordinates for purchase orders and dispatch alerts
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Company / Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Primary Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Contact Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Business Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Business Classification / Supply Domain
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Registered Warehouse & Dispatch Address *
                </label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3]"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Used by logistics couriers for warehouse dispatch pick-ups
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                {isSaved ? (
                  <span className="text-emerald-600 font-semibold flex items-center space-x-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vendor profile updated successfully!</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">
                    Protected fields can only be modified via Admin compliance review
                  </span>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#1552B3] hover:bg-[#0f4091] text-white font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorProfile;
