import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute';

// Module Pages
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { SubscriptionPlans } from './pages/SubscriptionPlans';
import { Subscriptions } from './pages/Subscriptions';
import { Quotations } from './pages/Quotations';
import { Invoices } from './pages/Invoices';
import { Discounts } from './pages/Discounts';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { CustomerPortal } from './pages/CustomerPortal';

// Authentication Pages
import { Login, Signup, ForgotPassword, ResetPassword, VerifyEmail } from './pages/AuthPages';

export function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes (Redirects already logged in users) */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Application Routes */}
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Admin & Staff accessible dashboard */}
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Admin & Staff: Customers */}
            <Route path="customers" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                <Customers />
              </ProtectedRoute>
            } />

            {/* Admin & Staff: Products */}
            <Route path="products" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                <Products />
              </ProtectedRoute>
            } />

            {/* Admin & Staff: Subscription Plans */}
            <Route path="plans" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                <SubscriptionPlans />
              </ProtectedRoute>
            } />

            {/* Admin & Staff: Quotations */}
            <Route path="quotations" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                <Quotations />
              </ProtectedRoute>
            } />

            {/* Subscriptions: Admin, Staff, and Customer (scoped) */}
            <Route path="subscriptions" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Customer']}>
                <Subscriptions />
              </ProtectedRoute>
            } />

            {/* Invoices: Admin, Staff, and Customer (scoped) */}
            <Route path="invoices" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Customer']}>
                <Invoices />
              </ProtectedRoute>
            } />

            {/* Discounts: Admin & Staff only */}
            <Route path="discounts" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                <Discounts />
              </ProtectedRoute>
            } />

            {/* Payments: Admin, Staff, and Customer (scoped) */}
            <Route path="payments" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Customer']}>
                <Payments />
              </ProtectedRoute>
            } />

            {/* Reports: Admin & Staff only */}
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Settings: Accessible by all roles */}
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Customer']}>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Customer Portal: Dedicated personal dashboard for Customers */}
            <Route path="customer-portal" element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerPortal />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
