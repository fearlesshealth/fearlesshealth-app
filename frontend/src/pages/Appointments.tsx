import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Appointment } from '../lib/api';
import { Calendar, Filter } from 'lucide-react';

const statusBadge: Record<string, string> = {
  scheduled: 'bg-blue-900/60 text-blue-300 border border-blue-700',
  completed:  'bg-green-900/60 text-green-300 border border-green-700',
  cancelled:  'bg-red-900/60 text-red-300 border border-red-700',
  no_show:    'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
};

export default function Appointments() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAppointments().then(r => { setAppts(r.appointments); setLoading(false); }).catch(console.error);
  }, []);

  const filtered = filter === 'all' ? appts : appts.filter(a => a.status === filter);

  const counts = {
    all: appts.length,
    scheduled: appts.filter(a => a.status === 'scheduled').length,
    completed:  appts.filter(a => a.status === 'completed').length,
    cancelled:  appts.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Appointments</h1>
        <p className="text-slate-400 text-sm mt-1">{appts.length} total appointments</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-500" />
        {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">{counts[s as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading && [...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-700 rounded-xl animate-pulse" />)}
        {!loading && filtered.map(a => (
          <div key={a.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-500 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold text-white">{a.patient_first} {a.patient_last}</p>
                <p className="text-sm text-slate-400">Dr. {a.doctor_first} {a.doctor_last} · <span className="text-slate-500">{a.specialization}</span></p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusBadge[a.status]}`}>
                {a.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(a.appointment_date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {a.reason && <p className="mt-2 text-sm text-slate-400 border-t border-slate-700 pt-2">📋 {a.reason}</p>}
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Calendar size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No {filter} appointments</p>
        </div>
      )}
    </div>
  );
}
