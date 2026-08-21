import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../services/mockAuth';

interface ProtectedRouteProps {
  allowedRole?: UserRole;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#1552B3] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Redirect to their respective authorized area
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'VENDOR') return <Navigate to="/vendor/dashboard" replace />;
    if (role === 'CUSTOMER') return <Navigate to="/customer/home" replace />;
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
