import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Construction } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PlaceholderPageProps {
  title: string;
  roleType?: 'admin' | 'vendor' | 'customer';
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  roleType = 'admin',
}) => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'VENDOR') return '/vendor/dashboard';
    if (role === 'CUSTOMER') return '/customer/home';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#EEF4FF] rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-[#1552B3]" strokeWidth={2} />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">
            SMART INVENTORY
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-[#1552B3] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Construction className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500 mt-2">
            This module is planned for Phase 2 implementation.
          </p>
          <div className="mt-6">
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center px-4 py-2 bg-[#1552B3] text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Back to Workspace</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        © 2026 Smart Inventory. All rights reserved.
      </footer>
    </div>
  );
};
export default PlaceholderPage;
