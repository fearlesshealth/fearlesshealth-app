import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Demo from './pages/Demo';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Records from './pages/Records';
import Billing from './pages/Billing';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/demo"    element={<Demo />} />

          {/* Protected app */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index           element={<Dashboard />} />
            <Route path="analytics"    element={<Analytics />} />
            <Route path="doctors"      element={<Doctors />} />
            <Route path="patients"     element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="records"      element={<Records />} />
            <Route path="billing"      element={<Billing />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
