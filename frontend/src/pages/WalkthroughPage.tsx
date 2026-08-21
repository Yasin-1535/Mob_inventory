import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Shield,
  Store,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Clock,
  Check,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export const WalkthroughPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/login" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#EEF4FF] rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-[#1552B3]" strokeWidth={2} />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm tracking-tight block">
                SMART INVENTORY
              </span>
              <span className="text-[10px] text-gray-500 font-medium block">
                Platform Architecture & Guide
              </span>
            </div>
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <span>Back to Login</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full space-y-10">
        {/* Title Section */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1552B3] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Phase 1 & Phase 2 Blueprint
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-3 tracking-tight">
            How Smart Inventory Works
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            One unified platform to manage your shop, inventory, vendors, and customers.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* STEP 1 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#1552B3] font-bold text-xs flex items-center justify-center">
                01
              </span>
              <h2 className="text-base font-bold text-gray-900">
                STEP 1 — LOGIN & ROLE SELECTION
              </h2>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Users authenticate into their dedicated workspace based on their selected role:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Shield className="w-5 h-5 text-[#1552B3] mx-auto mb-1" />
                <span className="font-bold text-gray-900 block">Admin</span>
                <span className="text-[10px] text-gray-500">Shop Admin</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Store className="w-5 h-5 text-gray-700 mx-auto mb-1" />
                <span className="font-bold text-gray-900 block">Vendor</span>
                <span className="text-[10px] text-gray-500">Supplier</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <ShoppingCart className="w-5 h-5 text-gray-700 mx-auto mb-1" />
                <span className="font-bold text-gray-900 block">Customer</span>
                <span className="text-[10px] text-gray-500">Shopper</span>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#1552B3] font-bold text-xs flex items-center justify-center">
                02
              </span>
              <h2 className="text-base font-bold text-gray-900">
                STEP 2 — ADMIN CAPABILITIES
              </h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Full control over shop operations and warehouse performance:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-gray-800">Product Management</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-gray-800">Inventory Tracking</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-gray-800">Vendor Management</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-gray-800">Customer Management</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-gray-800">Purchase Requests</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-gray-800">Sales & Reports</span>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#1552B3] font-bold text-xs flex items-center justify-center">
                03
              </span>
              <h2 className="text-base font-bold text-gray-900">
                STEP 3 — VENDOR PORTAL
              </h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Streamlined product supply and stock replenishment pipeline:
            </p>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>View supplied products & catalog prices</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>Monitor real-time warehouse stock levels</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>Receive & fulfill automated Purchase Requests</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>Track completed orders & pending payment payouts</span>
              </li>
            </ul>
          </div>

          {/* STEP 4 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#1552B3] font-bold text-xs flex items-center justify-center">
                04
              </span>
              <h2 className="text-base font-bold text-gray-900">
                STEP 4 — CUSTOMER EXPERIENCE
              </h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Frictionless product browsing, checkout, and tracking:
            </p>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>Browse categorized catalog & live stock availability</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>Search instant suggestions across models & SKUs</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>Manage shopping cart items with instant price updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#1552B3] rounded-full"></div>
                <span>Track order fulfillment status from processing to delivery</span>
              </li>
            </ul>
          </div>

          {/* STEP 5 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#1552B3] font-bold text-xs flex items-center justify-center">
                05
              </span>
              <h2 className="text-base font-bold text-gray-900">
                STEP 5 — INVENTORY STATES
              </h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Automated status indicators based on real stock thresholds:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-green-200 bg-green-50/60 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-700" />
                  <span className="font-bold text-green-900">In Stock</span>
                </div>
                <span className="text-green-700 text-[11px]">Stock &gt; Threshold level</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 text-xs">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-900">Low Stock</span>
                </div>
                <span className="text-amber-700 text-[11px]">Stock &lt; Threshold limit</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-red-200 bg-red-50/60 text-xs">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-700" />
                  <span className="font-bold text-red-900">Out of Stock</span>
                </div>
                <span className="text-red-700 text-[11px]">Stock = 0 units</span>
              </div>
            </div>
          </div>

          {/* STEP 6 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#1552B3] font-bold text-xs flex items-center justify-center">
                06
              </span>
              <h2 className="text-base font-bold text-gray-900">
                STEP 6 — ORDER LIFECYCLE
              </h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Standard 5-stage fulfillment flow for every transaction:
            </p>
            <div className="flex flex-col space-y-2 text-xs">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-bold text-[#1552B3]">1. Order Placed</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-600">Customer checkout recorded</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-bold text-[#1552B3]">2. Confirmed</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-600">Payment verified & items locked</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-bold text-[#1552B3]">3. Processing</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-600">Warehouse pack & quality check</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-bold text-[#1552B3]">4. Shipped</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-600">Dispatched via logistics partner</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-bold text-green-700">5. Delivered</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-600">Handed over to customer</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA to Return to Login */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-xs">
          <h3 className="text-lg font-bold text-gray-900">
            Ready to test the Smart Inventory portal?
          </h3>
          <p className="text-xs text-gray-500 mt-1 mb-5">
            Log in using demo credentials for Admin, Vendor, or Customer.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-bold tracking-wider rounded-lg transition-colors shadow-sm uppercase"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        © 2026 Smart Inventory. All rights reserved.
      </footer>
    </div>
  );
};
export default WalkthroughPage;
