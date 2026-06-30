import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Invoice } from '../lib/api';
import { CreditCard, Star, Filter } from 'lucide-react';

const statusBadge: Record<string, string> = {
  pending:  'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  paid:     'bg-green-900/60 text-green-300 border border-green-700',
  cancelled:'bg-red-900/60 text-red-300 border border-red-700',
  refunded: 'bg-slate-700 text-slate-300 border border-slate-600',
};

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInvoices().then(r => { setInvoices(r.invoices); setLoading(false); }).catch(console.error);
  }, []);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_usd, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount_usd, 0);
  const totalXlm     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount_xlm ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-slate-400 text-sm mt-1">⭐ Payments processed via Stellar XLM</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Collected" value={`$${totalPaid.toLocaleString()}`} sub={`${totalXlm.toLocaleString()} XLM`} color="text-green-400" />
        <SummaryCard label="Pending" value={`$${totalPending.toLocaleString()}`} sub={`${invoices.filter(i=>i.status==='pending').length} invoices`} color="text-yellow-400" />
        <SummaryCard label="Total Invoices" value={invoices.length} sub="all time" color="text-blue-400" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-500" />
        {(['all', 'pending', 'paid', 'cancelled'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Patient</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Description</th>
              <th className="px-5 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">USD</th>
              <th className="px-5 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">XLM</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading && [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td></tr>
            ))}
            {!loading && filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-750 transition-colors">
                <td className="px-5 py-4 text-white font-medium">{inv.first_name} {inv.last_name}</td>
                <td className="px-5 py-4 text-slate-400 max-w-xs truncate">{inv.description ?? '—'}</td>
                <td className="px-5 py-4 text-right text-white font-mono">${inv.amount_usd.toFixed(2)}</td>
                <td className="px-5 py-4 text-right">
                  <span className="flex items-center justify-end gap-1 text-yellow-400 font-mono">
                    <Star size={10} />{Number(inv.amount_xlm).toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[inv.status]}`}>{inv.status}</span>
                </td>
                <td className="px-5 py-4 text-slate-500 text-xs">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <CreditCard size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No invoices</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}
