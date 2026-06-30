import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard, Users, UserCheck, Calendar,
  FileText, CreditCard, LogOut, Star, BarChart2
} from 'lucide-react';

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics',    icon: BarChart2,        label: 'Analytics' },
  { to: '/patients',     icon: Users,            label: 'Patients' },
  { to: '/doctors',      icon: UserCheck,        label: 'Doctors' },
  { to: '/appointments', icon: Calendar,         label: 'Appointments' },
  { to: '/records',      icon: FileText,         label: 'Records' },
  { to: '/billing',      icon: CreditCard,       label: 'Billing' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const roleColor: Record<string, string> = {
    admin:   'bg-purple-900 text-purple-300',
    doctor:  'bg-blue-900 text-blue-300',
    nurse:   'bg-teal-900 text-teal-300',
    patient: 'bg-green-900 text-green-300',
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <p className="font-bold text-white leading-tight">FearlessHealth</p>
              <p className="text-xs text-slate-400">Hospital System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Stellar badge */}
        <div className="mx-3 mb-3 px-3 py-2 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <Star size={12} className="text-yellow-400" />
            <span className="text-xs text-slate-400">Stellar testnet</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user?.email}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor[user?.role ?? 'admin']}`}>
                {user?.role}
              </span>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
