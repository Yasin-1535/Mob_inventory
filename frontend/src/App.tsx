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
import PurchaseManagement from './pages/admin/PurchaseManagement';
import ReturnManagement from './pages/admin/ReturnManagement';
import ExpenseManagement from './pages/admin/ExpenseManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import InvoiceManagement from './pages/admin/InvoiceManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/walkthrough" element={<WalkthroughPage />} />

            {/* Single Admin Business Management System */}
            <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              
              {/* Product Catalog & Hierarchy */}
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
              
              {/* Sales, Purchasing & Returns (Vyapar Business Workflow) */}
              <Route path="/admin/sales" element={<SalesManagement />} />
              <Route path="/admin/purchases" element={<PurchaseManagement />} />
              <Route path="/admin/returns" element={<ReturnManagement />} />
              
              {/* Invoices, Expenses & Payments */}
              <Route path="/admin/invoices" element={<InvoiceManagement />} />
              <Route path="/admin/expenses" element={<ExpenseManagement />} />
              <Route path="/admin/payments" element={<PaymentManagement />} />

              {/* Inventory, Stock Ledger & Adjustments */}
              <Route path="/admin/inventory" element={<InventoryManagement />} />
              
              {/* Parties: Customers & Suppliers */}
              <Route path="/admin/customers" element={<CustomerManagement />} />
              <Route path="/admin/suppliers" element={<VendorManagement />} />
              <Route path="/admin/vendors" element={<VendorManagement />} />
              
              {/* Orders & Business Analytics */}
              <Route path="/admin/orders" element={<OrderManagement />} />
              <Route path="/admin/reports" element={<ReportsAnalytics />} />
            </Route>

            {/* Default System Redirect to Admin Dashboard or Login */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
