import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import StaffLayout from './components/StaffLayout';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import Presentation from './pages/Presentation';
import Manual from './pages/Manual';
import GuestView from './pages/GuestView';
import WifiSettings from './pages/WifiSettings';
import QRCodeGenerator from './pages/QRCodeGenerator';
import Copilot from './pages/Copilot';
import { AuthProvider, useAuth } from './context/AuthContext';

const RoleBasedRedirect = () => {
  const { role } = useAuth();
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/guest" replace />;
};

const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: string[], children: JSX.Element }) => {
  const { role } = useAuth();
  if (!allowedRoles.includes(role)) {
    return <RoleBasedRedirect />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Base Redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Guest Role Route */}
          <Route path="/guest" element={
            <ProtectedRoute allowedRoles={['guest', 'admin', 'staff']}>
              <GuestView />
            </ProtectedRoute>
          } />

          {/* Staff Role Routes */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Presentation />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="scan" element={<Scan />} />
            <Route path="qr-generator" element={<QRCodeGenerator />} />
          </Route>

          {/* Admin Role Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Presentation />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="scan" element={<Scan />} />
            <Route path="qr-generator" element={<QRCodeGenerator />} />
            <Route path="manual" element={<Manual />} />
            <Route path="wifi" element={<WifiSettings />} />
            <Route path="copilot" element={<Copilot />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
