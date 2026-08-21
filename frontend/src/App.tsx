import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import WalkthroughPage from './pages/WalkthroughPage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import VendorManagement from './pages/admin/VendorManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import OrderManagement from './pages/admin/OrderManagement';
import SalesManagement from './pages/admin/SalesManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';

// Vendor Pages
import VendorDashboard from './pages/VendorDashboard';
import SuppliedProducts from './pages/vendor/SuppliedProducts';
import VendorInventory from './pages/vendor/VendorInventory';
import PurchaseRequests from './pages/vendor/PurchaseRequests';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorSales from './pages/vendor/VendorSales';
import PaymentsSettlements from './pages/vendor/PaymentsSettlements';
import VendorReports from './pages/vendor/VendorReports';
import VendorProfile from './pages/vendor/VendorProfile';

// Customer Pages
import CustomerHome from './pages/CustomerHome';
import CategoriesPage from './pages/customer/CategoriesPage';
import CartPage from './pages/customer/CartPage';
import OrderHistory from './pages/customer/OrderHistory';
import ProfilePage from './pages/customer/ProfilePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/walkthrough" element={<WalkthroughPage />} />

            {/* Admin Workspace */}
            <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/products/mobiles" element={<ProductManagement />} />
              <Route path="/admin/products/mobiles/smartphones" element={<ProductManagement />} />
              <Route path="/admin/products/mobiles/keypad-phones" element={<ProductManagement />} />
              <Route path="/admin/products/mobiles/secondhand" element={<ProductManagement />} />
              <Route path="/admin/products/mobiles/secondhand-mobiles" element={<ProductManagement />} />
              <Route path="/admin/products/mobiles/smartphones/:brandId" element={<ProductManagement />} />
              <Route path="/admin/products/mobiles/keypad-phones/:brandId" element={<ProductManagement />} />
              <Route path="/admin/products/accessories" element={<ProductManagement />} />
              <Route path="/admin/products/accessories/:subcategoryId" element={<ProductManagement />} />
              <Route path="/admin/sales" element={<SalesManagement />} />
              <Route path="/admin/inventory" element={<InventoryManagement />} />
              <Route path="/admin/vendors" element={<VendorManagement />} />
              <Route path="/admin/customers" element={<CustomerManagement />} />
              <Route path="/admin/orders" element={<OrderManagement />} />
              <Route path="/admin/reports" element={<ReportsAnalytics />} />
            </Route>

            {/* Vendor Workspace */}
            <Route element={<ProtectedRoute allowedRole="VENDOR" />}>
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/products" element={<SuppliedProducts />} />
              <Route path="/vendor/inventory" element={<VendorInventory />} />
              <Route path="/vendor/purchase-requests" element={<PurchaseRequests />} />
              <Route path="/vendor/orders" element={<VendorOrders />} />
              <Route path="/vendor/sales" element={<VendorSales />} />
              <Route path="/vendor/payments" element={<PaymentsSettlements />} />
              <Route path="/vendor/reports" element={<VendorReports />} />
              <Route path="/vendor/profile" element={<VendorProfile />} />
            </Route>

            {/* Customer Workspace */}
            <Route element={<ProtectedRoute allowedRole="CUSTOMER" />}>
              <Route path="/customer/home" element={<CustomerHome />} />
              <Route path="/customer/categories" element={<CategoriesPage />} />
              <Route path="/customer/cart" element={<CartPage />} />
              <Route path="/customer/orders" element={<OrderHistory />} />
              <Route path="/customer/profile" element={<ProfilePage />} />
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
