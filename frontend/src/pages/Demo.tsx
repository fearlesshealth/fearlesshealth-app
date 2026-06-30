import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Demo() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) { navigate('/'); return; }
    // Auto-login with demo admin
    login('admin@hospital.local', 'admin123')
      .then(() => navigate('/'))
      .catch(() => navigate('/login'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold text-lg">Loading demo...</p>
        <p className="text-slate-400 text-sm mt-1">Setting up your demo environment</p>
      </div>
    </div>
  );
}
