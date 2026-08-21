import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  Users,
  ShoppingCart,
  BarChart3,
  BookOpen,
  LogOut,
  Bell,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockAdminStats } from '../data/mockDashboard';
import { mockActivities } from '../data/mockActivities';
import { mockInventory } from '../data/mockInventory';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="h-16 border-b border-gray-200 px-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#EEF4FF] rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-[#1552B3]" strokeWidth={2} />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm tracking-tight block">
                SMART INVENTORY
              </span>
              <span className="text-[10px] text-gray-500 font-medium block">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              to="/admin/dashboard"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold bg-[#EEF4FF] text-[#1552B3] border border-blue-100"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Products</span>
            </Link>
            <Link
              to="/admin/inventory"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Boxes className="w-4 h-4" />
              <span>Inventory</span>
            </Link>
            <Link
              to="/admin/vendors"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Vendors</span>
            </Link>
            <Link
              to="/admin/customers"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Orders</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </Link>

            <div className="pt-3 border-t border-gray-200 mt-3">
              <Link
                to="/walkthrough"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50/60 hover:bg-blue-100 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Walkthrough</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="truncate">
              <p className="text-xs font-bold text-gray-900 truncate">
                {user?.name || 'System Administrator'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {user?.email || 'admin@smartinventory.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <h2 className="text-base font-bold text-gray-900">Admin Dashboard</h2>
            <span className="hidden sm:inline-flex items-center text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3 mr-1" />
              Demo Mode — Data shown is mock data
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products, orders..."
                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#1552B3] w-56"
              />
            </div>
            <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 bg-blue-600 rounded-full absolute top-1.5 right-1.5"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 space-y-6 max-w-7xl">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Total Products</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mockAdminStats.totalProducts}
              </p>
              <span className="text-[10px] text-green-600 font-medium">● 4 Categories</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Total Stock</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mockAdminStats.totalStock.toLocaleString()}
              </p>
              <span className="text-[10px] text-blue-600 font-medium">● Units in warehouse</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Low Stock</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {mockAdminStats.lowStock}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">● Requires attention</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Out of Stock</span>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {mockAdminStats.outOfStock}
              </p>
              <span className="text-[10px] text-red-600 font-medium">● Urgent restock</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Total Vendors</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mockAdminStats.totalVendors}
              </p>
              <span className="text-[10px] text-gray-500 font-medium">● Active suppliers</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Total Customers</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mockAdminStats.totalCustomers.toLocaleString()}
              </p>
              <span className="text-[10px] text-green-600 font-medium">● Registered buyers</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Today's Sales</span>
              <p className="text-2xl font-bold text-[#1552B3] mt-1">
                ₹{mockAdminStats.todaysSales.toLocaleString()}
              </p>
              <span className="text-[10px] text-green-600 font-medium">+14.2% from yesterday</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Pending Orders</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mockAdminStats.pendingOrders}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">● In processing queue</span>
            </div>
          </div>

          {/* 2-Column Content: Inventory Preview & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Preview Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Inventory Stock Preview
                  </h3>
                  <p className="text-xs text-gray-500">
                    Real-time stock status across high-priority items
                  </p>
                </div>
                <Link
                  to="/admin/inventory"
                  className="text-xs font-semibold text-[#1552B3] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-medium text-gray-900">
                          {item.productName}
                        </td>
                        <td className="py-3 px-3 text-gray-500">{item.sku}</td>
                        <td className="py-3 px-3 font-semibold text-gray-800">
                          {item.stock}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === 'In Stock'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Recent Activity
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Latest system events and operations
                </p>

                <ul className="space-y-3.5">
                  {mockActivities.map((act) => (
                    <li key={act.id} className="flex items-start space-x-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#1552B3] mt-1.5 shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{act.message}</p>
                        <span className="text-[10px] text-gray-400">
                          {act.timestamp}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <Link
                  to="/walkthrough"
                  className="w-full inline-flex items-center justify-center py-2 px-3 bg-[#EEF4FF] text-[#1552B3] rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  <span>Explore Smart Inventory Guide</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default AdminDashboard;
