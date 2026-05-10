import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Customers } from './pages/Customers';
import { Categories } from './pages/Categories';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { PaymentMethods } from './pages/PaymentMethods';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes — redirect to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Catch-all → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
