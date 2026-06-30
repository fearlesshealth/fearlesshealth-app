import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@hospital.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-3xl mb-4">🏥</div>
          <h1 className="text-2xl font-bold text-white">FearlessHealth</h1>
          <p className="text-slate-400 text-sm mt-1">Hospital Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in</h2>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {/* Quick login hints */}
          <div className="mt-6 border-t border-slate-700 pt-5 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Demo accounts</p>
            {[
              { label: 'Admin', email: 'admin@hospital.local', pw: 'admin123' },
              { label: 'Doctor', email: 'sarah.mensah@hospital.local', pw: 'doctor123' },
              { label: 'Patient', email: 'kwame.acheampong@mail.com', pw: 'patient123' },
            ].map(acc => (
              <button
                key={acc.label}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pw); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 transition-colors group"
              >
                <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-300">{acc.label}</span>
                <span className="text-xs text-slate-500 ml-2">{acc.email}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
