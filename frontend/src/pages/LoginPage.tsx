import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Package,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState('admin@smartinventory.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated, redirect directly to Admin Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleQuickFill = () => {
    setIdentifier('admin@smartinventory.com');
    setPassword('Admin@123');
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(identifier, password, 'ADMIN');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans antialiased text-slate-900 p-4 sm:p-6 lg:p-8 relative">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#1552B3] flex items-center justify-center shadow-sm shadow-blue-500/20">
            <Package className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
              SMART INVENTORY
            </h1>
            <span className="text-xs text-slate-500 font-medium tracking-wide block">
              Business Management Portal
            </span>
          </div>
        </div>

        <Link
          to="/walkthrough"
          className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-xs transition-all flex items-center gap-1.5"
        >
          <span>Feature Walkthrough</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative">
          {/* Header Icon & Title */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#1552B3] shadow-xs">
              <Shield className="w-6 h-6" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Sign In</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Secure business operations, inventory, and sales control
            </p>
          </div>

          {/* Demo Quick Fill Helper */}
          <div className="mb-5 p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 min-w-0 truncate">
              <Info className="w-4 h-4 shrink-0 text-[#1552B3]" />
              <span className="truncate">
                Demo Admin: <strong className="text-slate-900 font-mono">admin@smartinventory.com</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[#1552B3] hover:text-blue-800 font-semibold text-xs ml-2 flex items-center gap-1 shrink-0 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:border-blue-300 shadow-xs transition-all"
            >
              <Sparkles className="w-3 h-3 text-[#1552B3]" />
              <span>Auto-Fill</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <span className="font-semibold shrink-0">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@smartinventory.com"
                  required
                  className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1552B3] focus:ring-3 focus:ring-blue-100 text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 pl-3.5 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1552B3] focus:ring-3 focus:ring-blue-100 text-sm font-medium transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1552B3] focus:ring-blue-200 cursor-pointer"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-slate-400 text-[11px]">Single Admin System</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#1552B3] hover:bg-[#0F3F8C] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note inside card */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
            Smart Inventory Admin Operations • All Business Controls Centralized
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        © {new Date().getFullYear()} Smart Inventory Business Platform • Single Admin Architecture
      </footer>
    </div>
  );
};

export default LoginPage;
