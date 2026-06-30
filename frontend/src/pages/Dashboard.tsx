import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Appointment } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Users, UserCheck, Calendar, CreditCard, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  doctors: number;
  patients: number;
  appointments: number;
  scheduled: number;
  invoicesPending: number;
  invoicesPaid: number;
  revenue: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAppts, setRecentAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [d, p, a, inv] = await Promise.all([
          api.getDoctors(),
          api.getPatients(),
          api.getAppointments(),
          api.getInvoices(),
        ]);
        setStats({
          doctors: d.doctors.length,
          patients: p.patients.length,
          appointments: a.appointments.length,
          scheduled: a.appointments.filter(x => x.status === 'scheduled').length,
          invoicesPending: inv.invoices.filter(x => x.status === 'pending').length,
          invoicesPaid: inv.invoices.filter(x => x.status === 'paid').length,
          revenue: inv.invoices.filter(x => x.status === 'paid').reduce((s, i) => s + i.amount_usd, 0),
        });
        setRecentAppts(a.appointments.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusBadge: Record<string, string> = {
    scheduled: 'bg-blue-900 text-blue-300',
    completed:  'bg-green-900 text-green-300',
    cancelled:  'bg-red-900 text-red-300',
    no_show:    'bg-yellow-900 text-yellow-300',
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back, <span className="text-white font-medium">{user?.email}</span></p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<UserCheck size={20} className="text-blue-400" />}  label="Doctors"          value={stats?.doctors ?? 0}          bg="bg-blue-900/20"   />
        <StatCard icon={<Users size={20} className="text-green-400" />}     label="Patients"         value={stats?.patients ?? 0}         bg="bg-green-900/20"  />
        <StatCard icon={<Calendar size={20} className="text-purple-400" />} label="Appointments"     value={stats?.appointments ?? 0}     bg="bg-purple-900/20" sub={`${stats?.scheduled} upcoming`} />
        <StatCard icon={<CreditCard size={20} className="text-yellow-400"/>} label="Revenue (USD)"  value={`$${stats?.revenue.toLocaleString()}`} bg="bg-yellow-900/20" sub={`${stats?.invoicesPending} pending`} />
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent appointments */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Appointments</h2>
            <Clock size={16} className="text-slate-500" />
          </div>
          <div className="divide-y divide-slate-700">
            {recentAppts.length === 0 && <p className="px-5 py-8 text-center text-slate-500 text-sm">No appointments</p>}
            {recentAppts.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {a.patient_first} {a.patient_last}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    Dr. {a.doctor_last} · {a.reason ?? 'No reason'}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[a.status]}`}>
                    {a.status}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(a.appointment_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing summary */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">Billing Overview</h2>
            <TrendingUp size={16} className="text-slate-500" />
          </div>
          <div className="p-5 space-y-4">
            <BillingBar label="Paid" count={stats?.invoicesPaid ?? 0} total={(stats?.invoicesPaid ?? 0) + (stats?.invoicesPending ?? 0)} color="bg-green-500" />
            <BillingBar label="Pending" count={stats?.invoicesPending ?? 0} total={(stats?.invoicesPaid ?? 0) + (stats?.invoicesPending ?? 0)} color="bg-yellow-500" />
            <div className="pt-3 border-t border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total revenue collected</span>
                <span className="font-bold text-green-400">${stats?.revenue.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">⭐ Payments via Stellar XLM on testnet</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, sub }: { icon: React.ReactNode; label: string; value: string | number; bg: string; sub?: string }) {
  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-800 p-4`}>
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function BillingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{count} invoices ({pct}%)</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-700 rounded w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-700 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-slate-700 rounded-xl" />
        <div className="h-64 bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}
