import { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, CreditCard, Star, Shield } from 'lucide-react';

interface AnalyticsSummary {
  overview: { patients: number; doctors: number; appointments: number; records: number; waitlist: number };
  appointments: { total: number; completed: number; scheduled: number; cancelled: number };
  billing: { totalInvoices: number; paidCount: number; paidUsd: number; pendingCount: number; pendingUsd: number; xlmVolume: number };
  consent: { activeTokens: number };
  bySpecialization: { name: string; appointments: number }[];
  monthlyAppointments: { month: string; count: number }[];
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/analytics/summary', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (!data) return <div className="p-6 text-slate-400">Failed to load analytics.</div>;

  const completionRate = data.appointments.total > 0
    ? Math.round((data.appointments.completed / data.appointments.total) * 100)
    : 0;

  const collectionRate = data.billing.totalInvoices > 0
    ? Math.round((data.billing.paidCount / data.billing.totalInvoices) * 100)
    : 0;

  const maxMonthly = Math.max(...data.monthlyAppointments.map(m => m.count), 1);
  const maxSpec    = Math.max(...data.bySpecialization.map(s => s.appointments), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Impact Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Live metrics for grant reporting and traction evidence</p>
        </div>
        <div className="bg-green-900/30 border border-green-700 rounded-lg px-3 py-2 text-xs text-green-300 text-right">
          <p className="font-semibold">Grant-ready report</p>
          <p className="text-green-500">Real-time data</p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users size={18} className="text-blue-400" />}    label="Patients Served"   value={data.overview.patients}   color="blue"   />
        <KpiCard icon={<Calendar size={18} className="text-purple-400"/>} label="Appointments"      value={data.appointments.total}  color="purple" />
        <KpiCard icon={<CreditCard size={18} className="text-green-400"/>} label="Revenue (USD)"   value={`$${data.billing.paidUsd.toLocaleString()}`} color="green" />
        <KpiCard icon={<Star size={18} className="text-yellow-400" />}    label="XLM Volume"       value={`${Math.round(data.billing.xlmVolume).toLocaleString()} XLM`} color="yellow" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard label="Completion Rate"   value={`${completionRate}%`}   sub={`${data.appointments.completed} completed`} />
        <MiniCard label="Collection Rate"   value={`${collectionRate}%`}   sub={`${data.billing.paidCount} paid invoices`} />
        <MiniCard label="Medical Records"   value={data.overview.records}  sub="diagnoses logged" />
        <MiniCard label="Waitlist Signups"  value={data.overview.waitlist} sub="interested clinics" accent />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly appointments bar chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Appointments Over Time</h2>
            <TrendingUp size={16} className="text-slate-500" />
          </div>
          {data.monthlyAppointments.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">No data yet</p>
            : (
              <div className="flex items-end gap-2 h-36">
                {data.monthlyAppointments.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400 font-medium">{m.count}</span>
                    <div className="w-full bg-blue-500/80 rounded-t transition-all"
                      style={{ height: `${Math.max(4, (m.count / maxMonthly) * 120)}px` }} />
                    <span className="text-xs text-slate-600 rotate-0">{m.month.substring(5)}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Specialization breakdown */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-5">By Specialization</h2>
          <div className="space-y-3">
            {data.bySpecialization.map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">{s.name}</span>
                  <span className="text-slate-500">{s.appointments} appts</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${(s.appointments / maxSpec) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Billing breakdown + Stellar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Billing */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-5">Billing Breakdown</h2>
          <div className="space-y-4">
            <BillingRow label="Collected" amount={data.billing.paidUsd}    count={data.billing.paidCount}    color="text-green-400" bar="bg-green-500" pct={collectionRate} />
            <BillingRow label="Pending"   amount={data.billing.pendingUsd} count={data.billing.pendingCount} color="text-yellow-400" bar="bg-yellow-500" pct={100 - collectionRate} />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 text-sm">
              <Star size={14} className="text-yellow-400" />
              <span className="text-slate-400">Total XLM processed on Stellar testnet:</span>
              <span className="text-yellow-300 font-mono font-semibold ml-auto">{Math.round(data.billing.xlmVolume).toLocaleString()} XLM</span>
            </div>
          </div>
        </div>

        {/* Blockchain stats */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Star size={16} className="text-yellow-400" /> Stellar Integration
          </h2>
          <div className="space-y-4">
            <BlockchainStat label="Network" value="Stellar Testnet" icon="🌐" />
            <BlockchainStat label="XLM Payments Processed" value={`${data.billing.paidCount} transactions`} icon="💸" />
            <BlockchainStat label="XLM Volume" value={`${Math.round(data.billing.xlmVolume).toLocaleString()} XLM`} icon="⭐" />
            <BlockchainStat label="Active Consent Tokens" value={`${data.consent.activeTokens} tokens`} icon="🔐" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-700 flex items-center gap-2">
            <Shield size={14} className="text-blue-400" />
            <p className="text-xs text-slate-500">All consent grants are cryptographically verifiable on-chain</p>
          </div>
        </div>
      </div>

      {/* Grant pitch box */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl p-6">
        <h2 className="font-bold text-white text-lg mb-4">📋 Grant Reporting Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Patients registered', value: data.overview.patients },
            { label: 'Appointments managed', value: data.appointments.total },
            { label: 'Healthcare providers', value: data.overview.doctors },
            { label: 'Waitlist signups', value: data.overview.waitlist },
            { label: 'Revenue processed (USD)', value: `$${data.billing.paidUsd.toLocaleString()}` },
            { label: 'Blockchain payments (XLM)', value: Math.round(data.billing.xlmVolume).toLocaleString() },
            { label: 'Consent tokens issued', value: data.consent.activeTokens },
            { label: 'Medical records created', value: data.overview.records },
          ].map(item => (
            <div key={item.label} className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{item.label}</p>
              <p className="text-white font-bold text-lg mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const bg: Record<string, string> = { blue: 'bg-blue-900/20', purple: 'bg-purple-900/20', green: 'bg-green-900/20', yellow: 'bg-yellow-900/20' };
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <div className={`inline-flex p-2 rounded-lg ${bg[color]} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function MiniCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-blue-900/20 border-blue-700/50' : 'bg-slate-800 border-slate-700'}`}>
      <p className={`text-xl font-bold ${accent ? 'text-blue-300' : 'text-white'}`}>{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function BillingRow({ label, amount, count, color, bar, pct }: { label: string; amount: number; count: number; color: string; bar: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-slate-300">{label}</span>
        <span className={`font-semibold font-mono ${color}`}>${amount.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <p className="text-xs text-slate-500">{count} invoice{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

function BlockchainStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-700 rounded w-56" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-700 rounded-xl" />)}</div>
      <div className="grid grid-cols-2 gap-6">{[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-slate-700 rounded-xl" />)}</div>
    </div>
  );
}
