import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  ShoppingCart,
  Bell,
  User,
  LogOut,
  BookOpen,
  ShoppingBag,
  ListFilter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

interface CustomerLayoutProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  searchQuery,
  onSearchChange,
}) => {
  const { user, logout } = useAuth();
  const { cartCount } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Shop Home', path: '/customer/home', icon: ShoppingBag },
    { label: 'Categories', path: '/customer/categories', icon: ListFilter },
    { label: 'My Orders', path: '/customer/orders', icon: Package },
    { label: 'Account Profile', path: '/customer/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/customer/home" className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-[#EEF4FF] rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-[#1552B3]" strokeWidth={2} />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm tracking-tight block">
                  SMART STORE
                </span>
                <span className="text-[10px] text-gray-500 font-medium block">
                  Customer Portal
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'text-[#1552B3] bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search bar & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {onSearchChange !== undefined && (
              <div className="relative hidden sm:block w-48 lg:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1552B3] transition-colors"
                />
              </div>
            )}

            {/* Cart Button */}
            <Link
              to="/customer/cart"
              className="relative p-2 text-gray-600 hover:text-[#1552B3] hover:bg-blue-50 rounded-lg transition-colors flex items-center"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1552B3] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Walkthrough Architecture Link */}
            <Link
              to="/walkthrough"
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-medium text-[#1552B3] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guide</span>
            </Link>

            {/* User Dropdown / Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[#1552B3]">
                {user?.name ? user.name[0].toUpperCase() : 'C'}
              </div>
              <span className="text-xs font-medium text-gray-700 hidden sm:inline-block max-w-28 truncate">
                {user?.name || 'Customer'}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex border-t border-gray-100 px-4 py-2 bg-gray-50 overflow-x-auto space-x-2">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-white shadow-xs text-[#1552B3] font-semibold'
                    : 'text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Smart Inventory & E-Commerce Platform. All rights reserved.</span>
          <div className="flex items-center space-x-4">
            <Link to="/walkthrough" className="hover:text-blue-600">System Architecture</Link>
            <span>•</span>
            <Link to="/customer/profile" className="hover:text-blue-600">Customer Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default CustomerLayout;
