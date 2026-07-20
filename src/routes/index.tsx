import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Units from '../pages/Units';
import Inspections from '../pages/Inspections';
import Training from '../pages/Training';
import Reports from '../pages/Reports';
import Documentation from '../pages/Documentation';
import Users from '../pages/Users';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes inside Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/unidades" element={<Units />} />
        <Route path="/vistorias" element={<Inspections />} />
        <Route path="/treinamentos" element={<Training />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/documentacao" element={<Documentation />} />
        
        {/* Admin only */}
        <Route path="/usuarios" element={<AdminRoute><Users /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
