import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Patient, MedicalRecord } from '../lib/api';
import { FileText, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function Records() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.getPatients().then(r => setPatients(r.patients)).catch(console.error);
  }, []);

  async function selectPatient(p: Patient) {
    setSelectedPatient(p);
    setLoading(true);
    try {
      const r = await api.getRecords(p.id);
      setRecords(r.records);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Medical Records</h1>
        <p className="text-slate-400 text-sm mt-1">Select a patient to view their records</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
            {filteredPatients.map(p => (
              <button key={p.id} onClick={() => selectPatient(p)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${selectedPatient?.id === p.id ? 'bg-blue-900/30 border-l-2 border-blue-500' : ''}`}
              >
                <p className="font-medium text-white text-sm">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-slate-500">{p.blood_type ?? 'Unknown blood type'} · {p.gender ?? '—'}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedPatient && (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-800 rounded-xl border border-slate-700">
              <FileText size={40} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Select a patient to view records</p>
            </div>
          )}

          {selectedPatient && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
              </div>
              <div>
                <p className="font-semibold text-white">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                <p className="text-xs text-slate-400">{selectedPatient.blood_type} · {selectedPatient.gender}</p>
              </div>
              <span className="ml-auto text-sm text-slate-400">{records.length} record{records.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {loading && [...Array(2)].map((_, i) => <div key={i} className="h-24 bg-slate-700 rounded-xl animate-pulse" />)}

          {!loading && records.length === 0 && selectedPatient && (
            <div className="flex flex-col items-center justify-center h-40 bg-slate-800 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-sm">No medical records for this patient</p>
            </div>
          )}

          {!loading && records.map(r => (
            <div key={r.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full text-left px-5 py-4 flex items-start justify-between hover:bg-slate-750 transition-colors"
              >
                <div>
                  <p className="font-medium text-white">{r.diagnosis}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Dr. {r.doctor_first} {r.doctor_last} · {r.specialization}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                  {expanded === r.id ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
              </button>
              {expanded === r.id && (
                <div className="border-t border-slate-700 px-5 py-4 space-y-3">
                  {r.treatment && <Field label="Treatment" value={r.treatment} />}
                  {r.medications && <Field label="Medications" value={r.medications} />}
                  {r.notes && <Field label="Notes" value={r.notes} />}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-300">{value}</p>
    </div>
  );
}
