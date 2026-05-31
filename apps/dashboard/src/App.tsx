import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleProtectedRoute, PublicOnlyRoute } from './routes/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Customers } from './pages/Customers';
import { Categories } from './pages/Categories';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { PaymentMethods } from './pages/PaymentMethods';
import { UserManagement } from './pages/UserManagement';
import { Invoice } from './pages/Invoice';
import { Settings } from './pages/Settings';
import { Receivables } from './pages/Receivables';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { Scanner } from './pages/worker/Scanner';

import { AlertProvider } from './contexts/AlertContext';

function App() {
  return (
    <AlertProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/invoice/:invoiceNumber" element={<Invoice />} />

          {/* Protected routes — redirect to /login if not authenticated */}
          <Route element={<ProtectedRoute />}>
            {/* All authenticated users */}
            {/* Admin & Super Admin only */}
            <Route path="/dashboard" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Dashboard /></RoleProtectedRoute>} />
            <Route path="/orders" element={<Orders />} />

            {/* Admin & Super Admin only */}
            <Route path="/customers" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Customers /></RoleProtectedRoute>} />
            <Route path="/categories" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Categories /></RoleProtectedRoute>} />
            <Route path="/expenses" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Expenses /></RoleProtectedRoute>} />
            <Route path="/payment-methods" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><PaymentMethods /></RoleProtectedRoute>} />
            <Route path="/receivables" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Receivables /></RoleProtectedRoute>} />
            <Route path="/reports" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Reports /></RoleProtectedRoute>} />
            <Route path="/settings" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Settings /></RoleProtectedRoute>} />

            {/* Super Admin only */}
            <Route path="/user-management" element={<RoleProtectedRoute roles={['super_admin']}><UserManagement /></RoleProtectedRoute>} />

            {/* Worker only routes */}
            <Route path="/worker/dashboard" element={<RoleProtectedRoute roles={['worker', 'admin', 'super_admin']}><WorkerDashboard /></RoleProtectedRoute>} />
            <Route path="/worker/scanner" element={<RoleProtectedRoute roles={['worker', 'admin', 'super_admin']}><Scanner /></RoleProtectedRoute>} />
          </Route>

          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AlertProvider>
  );
}

export default App;
