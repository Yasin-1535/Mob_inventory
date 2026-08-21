import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  BarChart3,
  User,
  LogOut,
  Bell,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface VendorLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
    { label: 'My Products', path: '/vendor/products', icon: Package },
    { label: 'My Inventory', path: '/vendor/inventory', icon: Boxes },
    { label: 'Purchase Requests', path: '/vendor/purchase-requests', icon: FileText },
    { label: 'Sales History', path: '/vendor/sales', icon: Receipt },
    { label: 'Orders', path: '/vendor/orders', icon: ShoppingCart },
    { label: 'Payments & Settlements', path: '/vendor/payments', icon: CreditCard },
    { label: 'Reports', path: '/vendor/reports', icon: BarChart3 },
    { label: 'Profile', path: '/vendor/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans antialiased">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Fixed Vendor Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-screen overflow-y-auto transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#EEF4FF] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-[#1552B3]" strokeWidth={2} />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm tracking-tight block">
                  SMART INVENTORY
                </span>
                <span className="text-[10px] text-gray-500 font-medium block">
                  Vendor Workspace
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg md:hidden"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/vendor/dashboard'
                  ? location.pathname === '/vendor/dashboard'
                  : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EEF4FF] text-[#1552B3] border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Bottom Actions (Pinned to Bottom) */}
        <div className="p-4 border-t border-gray-200 space-y-2 bg-white shrink-0 mt-auto">
          <Link
            to="/walkthrough"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#1552B3] shrink-0" />
            <span className="truncate">Architecture & Guide</span>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[#1552B3] shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'V'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {user?.shopName || user?.name || 'ABC Electronics'}
                </p>
                <p className="text-[10px] text-gray-500 truncate">Verified Supplier</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell - Offset by 64 (16rem / 256px) on Desktop */}
      <div className="md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Sticky Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg md:hidden shrink-0"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="truncate">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-gray-500 font-medium truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {actions}
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1552B3] rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Main Body Content with min-w-0 to contain tables */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default VendorLayout;
