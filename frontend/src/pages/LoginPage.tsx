import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Store,
  ShoppingCart,
  Check,
  User,
  Lock,
  Eye,
  EyeOff,
  Package,
  Info,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, DEFAULT_USERS } from '../services/mockAuth';

interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleOption[] = [
  {
    role: 'ADMIN',
    title: 'ADMIN',
    subtitle: 'Shop Administrator',
    icon: Shield,
  },
  {
    role: 'VENDOR',
    title: 'VENDOR',
    subtitle: 'Product Supplier',
    icon: Store,
  },
  {
    role: 'CUSTOMER',
    title: 'CUSTOMER',
    subtitle: 'Shop Customer',
    icon: ShoppingCart,
  },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerCustomer, isAuthenticated, role: userRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [identifier, setIdentifier] = useState('admin@smartinventory.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Customer Self-Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // If already authenticated, redirect to appropriate home
  useEffect(() => {
    if (isAuthenticated && userRole) {
      if (userRole === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (userRole === 'VENDOR') navigate('/vendor/dashboard', { replace: true });
      else if (userRole === 'CUSTOMER') navigate('/customer/home', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  // When changing role, preload default demo credentials for ease of testing
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    const demo = DEFAULT_USERS.find((u) => u.role === role);
    if (demo) {
      setIdentifier(demo.email);
      setPassword(demo.password);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both email/mobile and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(identifier, password, selectedRole);
      // AuthProvider state update will trigger redirection via useEffect, but also navigate directly
      if (selectedRole === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (selectedRole === 'VENDOR') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        navigate('/customer/home', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regForm.name.trim() || !regForm.email.trim() || !regForm.password.trim()) {
      setRegError('Full name, email, and password are required.');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Password and confirm password do not match.');
      return;
    }

    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    setRegLoading(true);
    try {
      await registerCustomer({
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        password: regForm.password.trim(),
        phone: regForm.phone.trim(),
        address: regForm.address.trim(),
      });
      setIsRegisterOpen(false);
      navigate('/customer/home', { replace: true });
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const getRoleDisplayName = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'Admin';
      case 'VENDOR':
        return 'Vendor';
      case 'CUSTOMER':
        return 'Customer';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between items-center py-6 sm:py-10 px-4">
      {/* Dev helper & Walkthrough banner */}
      <div className="w-full max-w-[480px] mb-3 flex items-center justify-between text-xs px-1">
        <span className="inline-flex items-center text-gray-500 font-medium">
          <Info className="w-3.5 h-3.5 mr-1 text-blue-600" />
          <span>Demo mode active</span>
        </span>
        <Link
          to="/walkthrough"
          className="inline-flex items-center font-semibold text-[#1552B3] hover:underline"
        >
          <span>How it works</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[480px] bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] p-6 sm:p-8 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#EEF4FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Package className="w-8 h-8 text-[#1552B3]" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            SMART INVENTORY
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
            Manage your shop. Track your stock. Grow your business.
          </p>
        </div>

        {/* Divider: Select Login Type */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-3 text-xs font-semibold text-gray-900 tracking-wide">
            Select Login Type
          </span>
        </div>

        {/* 3 Role Cards Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
          {ROLES.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => handleRoleChange(item.role)}
                className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all duration-150 text-center min-h-[118px] focus:outline-none select-none ${
                  isSelected
                    ? 'border-2 border-[#1552B3] bg-[#F4F8FF]'
                    : 'border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                {/* Check badge when selected */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-[#1552B3] text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <Icon
                  className={`w-7 h-7 mb-2 transition-colors ${
                    isSelected ? 'text-[#1552B3]' : 'text-gray-600'
                  }`}
                />
                <span
                  className={`text-xs font-bold uppercase tracking-wider block ${
                    isSelected ? 'text-gray-900' : 'text-gray-800'
                  }`}
                >
                  {item.title}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5 leading-tight block">
                  {item.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider: Role Login */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-3 text-sm font-bold text-gray-900">
            {getRoleDisplayName(selectedRole)} Login
          </span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email or Mobile */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-semibold text-gray-900 mb-1.5"
            >
              Email or Mobile Number
            </label>
            <div className="relative rounded-lg border border-gray-200 bg-white focus-within:border-[#1552B3] focus-within:ring-1 focus-within:ring-[#1552B3] transition-all">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or mobile number"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent rounded-lg focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-gray-900 mb-1.5"
            >
              Password
            </label>
            <div className="relative rounded-lg border border-gray-200 bg-white focus-within:border-[#1552B3] focus-within:ring-1 focus-within:ring-[#1552B3] transition-all">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent rounded-lg focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#1552B3] focus:ring-[#1552B3] cursor-pointer"
              />
              <span className="text-gray-700 font-medium">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() =>
                alert(
                  'Password reset is available in the next release. For demo, credentials are pre-filled.'
                )
              }
              className="text-xs font-medium text-[#1552B3] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Primary Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs sm:text-sm font-bold tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-60 uppercase flex items-center justify-center space-x-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <span>LOGIN</span>
            )}
          </button>
        </form>

        {/* Divider: OR */}
        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-2 text-xs font-medium text-gray-400 uppercase">
            OR
          </span>
        </div>

        {/* Registration Section */}
        {selectedRole === 'CUSTOMER' && (
          <div className="text-center">
            <p className="text-xs text-gray-600">Don't have a customer account?</p>
            <button
              type="button"
              onClick={() => {
                setRegForm({
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                  address: '',
                });
                setRegError('');
                setIsRegisterOpen(true);
              }}
              className="text-xs font-bold text-[#1552B3] hover:underline mt-1 block w-full"
            >
              Create Account
            </button>
          </div>
        )}

        {selectedRole === 'VENDOR' && (
          <div className="text-center">
            <p className="text-xs text-gray-600">Want to become an authorized supplier?</p>
            <div className="mt-1 text-[11px] text-gray-500 font-medium bg-gray-50 p-2.5 rounded-lg border border-gray-200/70">
              Vendor accounts are created and managed by Administrator. Please contact{' '}
              <span className="text-[#1552B3] font-semibold">admin@smartinventory.com</span>.
            </div>
          </div>
        )}

        {selectedRole === 'ADMIN' && (
          <div className="text-center">
            <p className="text-[11px] text-gray-500 font-medium">
              🔒 Restricted shop administration & business management access
            </p>
          </div>
        )}
      </div>

      {/* Customer Self-Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1552B3] flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Create Customer Account
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Self-register to explore catalog, manage cart & orders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="mt-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Patel"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.patel@example.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, Postal Code"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="bg-blue-50/70 p-2.5 rounded-lg text-[11px] text-[#1552B3] font-medium">
                ℹ️ Automatically enrolled as <strong>CUSTOMER</strong> for product browsing, shopping cart, and order tracking.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-4 py-2 bg-[#1552B3] hover:bg-[#0f4091] text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-60 flex items-center space-x-1.5"
                >
                  {regLoading ? (
                    <span>Registering...</span>
                  ) : (
                    <span>Complete Registration</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 mt-6 select-none">
        © 2026 Smart Inventory. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;
