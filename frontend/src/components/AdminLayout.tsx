import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  BarChart3,
  Receipt,
  LogOut,
  Bell,
  BookOpen,
  Menu,
  X,
  CreditCard,
  DollarSign,
  Undo2,
  FileText,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('si_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('si_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Grouped navigation adhering strictly to: only VENDORS under Parties
  const navSections = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Transactions',
      items: [
        { label: 'Sales & POS', path: '/admin/sales', icon: Receipt },
        { label: 'Purchases', path: '/admin/purchases', icon: ShoppingBag },
        { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
        { label: 'Returns', path: '/admin/returns', icon: Undo2 },
      ],
    },
    {
      group: 'Catalog & Stock',
      items: [
        { label: 'Products', path: '/admin/products', icon: Package },
        { label: 'Inventory & Stock', path: '/admin/inventory', icon: Boxes },
      ],
    },
    {
      group: 'Parties & Finance',
      items: [
        { label: 'Vendors', path: '/admin/vendors', icon: Truck },
        { label: 'Invoices', path: '/admin/invoices', icon: FileText },
        { label: 'Payments', path: '/admin/payments', icon: CreditCard },
        { label: 'Expenses', path: '/admin/expenses', icon: DollarSign },
      ],
    },
    {
      group: 'Analytics',
      items: [
        { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
      ],
    },
  ];

  const mobileBottomTabs = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Sales', path: '/admin/sales', icon: Receipt },
    { label: 'Purchases', path: '/admin/purchases', icon: ShoppingBag },
    { label: 'Inventory', path: '/admin/inventory', icon: Boxes },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased pb-16 md:pb-0 overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between h-screen transition-all duration-200 ease-in-out md:translate-x-0 ${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          isMobileMenuOpen
            ? 'w-72 translate-x-0 shadow-2xl'
            : '-translate-x-full w-72'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                <Package className="w-5 h-5 text-[#1552B3]" strokeWidth={2.2} />
              </div>
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <div className="min-w-0">
                  <span className="font-extrabold text-slate-900 text-xs tracking-tight block leading-tight truncate">
                    SMART INVENTORY
                  </span>
                  <span className="text-[10px] text-[#1552B3] font-bold uppercase tracking-wider block truncate">
                    Business Portal
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links with Group Headers */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 no-scrollbar">
            {navSections.map((sec) => (
              <div key={sec.group} className="space-y-1">
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {sec.group}
                  </span>
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/admin/dashboard'
                      ? location.pathname === '/admin/dashboard'
                      : location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`) ||
                        (item.path === '/admin/vendors' &&
                          (location.pathname.startsWith('/admin/suppliers') ||
                            location.pathname.startsWith('/admin/customers')));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isSidebarCollapsed && !isMobileMenuOpen ? item.label : undefined}
                      className={`flex items-center ${
                        isSidebarCollapsed && !isMobileMenuOpen
                          ? 'justify-center px-2 py-2.5'
                          : 'space-x-3 px-3 py-2'
                      } rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-[#1552B3] border border-blue-100 shadow-2xs font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#1552B3]' : 'text-slate-400'
                        }`}
                      />
                      {(!isSidebarCollapsed || isMobileMenuOpen) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Info & Bottom Actions (Pinned to Bottom) */}
        <div className="p-3 border-t border-slate-200 space-y-2 bg-white shrink-0 mt-auto">
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <Link
              to="/walkthrough"
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[#1552B3] bg-blue-50/70 hover:bg-blue-100/70 rounded-xl transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#1552B3] shrink-0" />
              <span className="truncate">Architecture Guide</span>
            </Link>
          )}

          <div
            className={`flex items-center ${
              isSidebarCollapsed && !isMobileMenuOpen
                ? 'justify-center flex-col gap-2'
                : 'justify-between pt-1'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[#1552B3] shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    Admin Business Owner
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div
        className={`flex flex-col min-h-screen min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Sticky Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden shrink-0 cursor-pointer"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle sidebar collapse"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            <div className="truncate">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {actions}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <button
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1552B3] rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full min-w-0 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-center justify-around h-14 px-2 shadow-lg">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-[#1552B3]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-[#1552B3]' : 'text-slate-400'
                }`}
              />
              <span className="truncate mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <Menu className="w-5 h-5 text-slate-400" />
          <span className="truncate mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminLayout;
