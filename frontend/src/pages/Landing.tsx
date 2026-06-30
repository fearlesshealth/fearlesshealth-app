import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [role, setRole] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleWaitlist(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, organisation: org, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosition(data.position);
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="font-bold text-lg">FearlessHealth</span>
          <span className="text-slate-500 text-sm ml-1">Hospital System</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')}
            className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
            Sign in
          </button>
          <button onClick={() => navigate('/demo')}
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium">
            Try Demo
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-700 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Built on Stellar blockchain · Testnet live
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
          Modern hospital management,<br />
          <span className="text-blue-400">powered by blockchain</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
          FearlessHealth digitises patient records, appointments, and billing for African clinics —
          with Stellar XLM payments and cryptographic patient consent.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={() => navigate('/demo')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">
            Try the Live Demo →
          </button>
          <a href="#waitlist"
            className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-3 rounded-xl text-lg transition-colors">
            Join Waitlist
          </a>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-800 bg-slate-800/40 py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '6+', label: 'Demo patients' },
            { value: '5', label: 'Specializations' },
            { value: 'XLM', label: 'Payment currency' },
            { value: '100%', label: 'Open source' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">Everything a clinic needs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '👤', title: 'Patient Records', desc: 'Secure digital records with full history, medications, diagnoses, and doctor notes.' },
            { icon: '📅', title: 'Appointments', desc: 'Smart scheduling with conflict detection. Patients book online, doctors manage their calendar.' },
            { icon: '⭐', title: 'Stellar Payments', desc: 'Invoices paid in XLM. Fast, low-fee cross-border payments — no bank account needed.' },
            { icon: '🔐', title: 'Patient Consent Tokens', desc: 'Cryptographic access control via Stellar assets. Patients grant and revoke doctor access on-chain.' },
            { icon: '📋', title: 'Medical Records', desc: 'Doctors create structured records tied to appointments. Role-based access ensures privacy.' },
            { icon: '📊', title: 'Analytics', desc: 'Real-time metrics on patients served, revenue collected, and system usage for grant reporting.' },
          ].map(f => (
            <div key={f.title} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-600/50 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-slate-800/40 border-y border-slate-800 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">The problem we're solving</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-red-400 font-semibold text-lg flex items-center gap-2">❌ Without FearlessHealth</h3>
              {[
                'Patient records stored in paper files — easily lost',
                'Billing via cash only — no audit trail',
                'No cross-doctor record sharing without physical referral',
                'Appointment scheduling by phone call',
                'No data for grant reporting or impact measurement',
              ].map(p => (
                <div key={p} className="flex items-start gap-3 text-slate-400 text-sm">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">•</span> {p}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-green-400 font-semibold text-lg flex items-center gap-2">✅ With FearlessHealth</h3>
              {[
                'Digital records, always accessible, never lost',
                'XLM payments — instant, traceable, low-fee',
                'Blockchain consent tokens for cross-clinic access',
                'Online scheduling with conflict detection',
                'Live analytics dashboard for funders and operators',
              ].map(p => (
                <div key={p} className="flex items-start gap-3 text-slate-400 text-sm">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">•</span> {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Get early access</h2>
          <p className="text-slate-400">Join clinics and healthcare operators already interested in FearlessHealth.</p>
        </div>

        {submitted ? (
          <div className="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-300 mb-2">You're on the list!</h3>
            <p className="text-slate-400">You're #{position} in line. We'll reach out when we're ready to onboard your clinic.</p>
            <button onClick={() => navigate('/demo')} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
              Explore the demo →
            </button>
          </div>
        ) : (
          <form onSubmit={handleWaitlist} className="bg-slate-800 rounded-2xl border border-slate-700 p-8 space-y-4">
            {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Organisation</label>
                <input value={org} onChange={e => setOrg(e.target.value)} placeholder="Clinic or hospital name"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@clinic.com" required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">I am a...</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select role</option>
                <option>Hospital Administrator</option>
                <option>Doctor</option>
                <option>Nurse</option>
                <option>Healthcare Investor</option>
                <option>Government Health Official</option>
                <option>Developer</option>
                <option>Other</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-lg">
              {loading ? 'Joining...' : 'Join the waitlist →'}
            </button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>FearlessHealth · Built on <span className="text-yellow-400">⭐ Stellar</span> · Open Source</p>
      </footer>
    </div>
  );
}
