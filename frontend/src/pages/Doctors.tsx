import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Doctor } from '../lib/api';
import { Search, UserCheck, Phone, Star } from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDoctors().then(r => { setDoctors(r.doctors); setLoading(false); }).catch(console.error);
  }, []);

  const filtered = doctors.filter(d =>
    `${d.first_name} ${d.last_name} ${d.specialization}`.toLowerCase().includes(search.toLowerCase())
  );

  const specColor: Record<string, string> = {
    'Cardiology':       'bg-red-900/50 text-red-300',
    'General Practice': 'bg-blue-900/50 text-blue-300',
    'Paediatrics':      'bg-yellow-900/50 text-yellow-300',
    'Orthopaedics':     'bg-orange-900/50 text-orange-300',
    'Obstetrics':       'bg-pink-900/50 text-pink-300',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctors</h1>
          <p className="text-slate-400 text-sm mt-1">{doctors.length} medical staff</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search doctors..."
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-44 bg-slate-700 rounded-xl animate-pulse" />)}
      </div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(d => (
          <div key={d.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-500 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                {d.first_name[0]}{d.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">Dr. {d.first_name} {d.last_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${specColor[d.specialization] ?? 'bg-slate-700 text-slate-300'}`}>
                  {d.specialization}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {d.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone size={13} /> {d.phone}
                </div>
              )}
              {d.stellar_public_key && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Star size={12} className="text-yellow-400" />
                  <span className="font-mono truncate">{d.stellar_public_key.substring(0, 20)}…</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <UserCheck size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No doctors found</p>
        </div>
      )}
    </div>
  );
}
