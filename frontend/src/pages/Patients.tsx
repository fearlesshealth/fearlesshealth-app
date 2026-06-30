import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Patient } from '../lib/api';
import { Search, Users, Droplets, Phone } from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPatients().then(r => { setPatients(r.patients); setLoading(false); }).catch(console.error);
  }, []);

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const bloodColor: Record<string, string> = {
    'O+': 'bg-red-900/50 text-red-300', 'O-': 'bg-red-900/70 text-red-200',
    'A+': 'bg-blue-900/50 text-blue-300', 'A-': 'bg-blue-900/70 text-blue-200',
    'B+': 'bg-green-900/50 text-green-300', 'B-': 'bg-green-900/70 text-green-200',
    'AB+': 'bg-purple-900/50 text-purple-300', 'AB-': 'bg-purple-900/70 text-purple-200',
  };

  function age(dob: string) {
    return new Date().getFullYear() - new Date(dob).getFullYear();
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Patients</h1>
        <p className="text-slate-400 text-sm mt-1">{patients.length} registered patients</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search patients..."
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr className="text-left">
              <th className="px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Patient</th>
              <th className="px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Age / Gender</th>
              <th className="px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Blood Type</th>
              <th className="px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</th>
              <th className="px-5 py-3.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading && [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td></tr>
            ))}
            {!loading && filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <span className="font-medium text-white">{p.first_name} {p.last_name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {p.date_of_birth ? `${age(p.date_of_birth)} yrs` : '—'} · {p.gender ?? '—'}
                </td>
                <td className="px-5 py-4">
                  {p.blood_type ? (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${bloodColor[p.blood_type] ?? 'bg-slate-700 text-slate-300'}`}>
                      <Droplets size={10} /> {p.blood_type}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {p.phone ? <span className="flex items-center gap-1"><Phone size={12} />{p.phone}</span> : '—'}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Users size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No patients found</p>
          </div>
        )}
      </div>
    </div>
  );
}
