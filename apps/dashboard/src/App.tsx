import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleProtectedRoute } from './routes/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Customers } from './pages/Customers';
import { Categories } from './pages/Categories';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { PaymentMethods } from './pages/PaymentMethods';
import { UserManagement } from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes — redirect to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          {/* All authenticated users */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />

          {/* Admin & Super Admin only */}
          <Route path="/categories" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Categories /></RoleProtectedRoute>} />
          <Route path="/expenses" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Expenses /></RoleProtectedRoute>} />
          <Route path="/payment-methods" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><PaymentMethods /></RoleProtectedRoute>} />
          <Route path="/reports" element={<RoleProtectedRoute roles={['admin', 'super_admin']}><Reports /></RoleProtectedRoute>} />

          {/* Super Admin only */}
          <Route path="/user-management" element={<RoleProtectedRoute roles={['super_admin']}><UserManagement /></RoleProtectedRoute>} />
        </Route>

        {/* Catch-all → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
