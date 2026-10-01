import { useState } from 'react';
import { ArrowRight, Building2, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Button, Input } from '../components/ui';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const roles = [
  { value: 'INVESTOR', label: 'Investor', description: 'Build a portfolio from curated properties', icon: UserRound },
  { value: 'BROKER', label: 'Broker', description: 'List and manage investment opportunities', icon: Building2 },
  { value: 'ADMIN', label: 'Admin', description: 'Oversee listings, users, and approvals', icon: ShieldCheck }
];

export function Auth() {
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'signin');
  const [role, setRole] = useState('INVESTOR');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';
  const availableRoles = isSignup ? roles.filter((item) => item.value !== 'ADMIN') : roles;

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'signup' && role === 'ADMIN') setRole('INVESTOR');
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (isSignup && role === 'ADMIN') {
      setStatus({ type: 'error', message: 'Admin accounts are provisioned by the platform and cannot self-register.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSignup ? { ...form, role } : { email: form.email, password: form.password })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(formatApiError(data));

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      window.location.href = getLandingPath(data.user?.role || role);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to connect to the server.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-mist text-ink">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="relative hidden overflow-hidden px-10 py-10 lg:flex lg:flex-col lg:justify-between lg:px-16 xl:px-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,#d9f1e9_0,transparent_34%),linear-gradient(135deg,#f6f8f7_0%,#e9f3ef_100%)]" />
          <div className="relative flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white"><Building2 size={18} /></span>
            <span className="font-display text-lg font-bold tracking-tight">zameen<span className="text-forest">Daar</span><span className="text-slate-400">.com</span></span>
          </div>
          <div className="relative max-w-xl pb-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-forest shadow-sm">
              <Sparkles size={14} /> Fractional ownership, made clear
            </div>
            <h1 className="max-w-lg font-display text-5xl font-bold leading-[1.08] tracking-tight text-ink xl:text-6xl">Own a piece of what comes next.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">Access carefully vetted property opportunities, transparent terms, and a portfolio built for the long view.</p>
            <div className="mt-9 grid max-w-md gap-3 sm:grid-cols-3">
              {['Curated assets', 'Clear terms', 'Built to last'].map((item) => <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-forest"><Check size={13} /></span>{item}</div>)}
            </div>
          </div>
          <p className="relative text-xs font-semibold text-slate-400">A more considered way to invest in real assets.</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:bg-white lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white"><Building2 size={18} /></span>
              <span className="font-display text-lg font-bold tracking-tight">zameen<span className="text-forest">Daar</span><span className="text-slate-400">.com</span></span>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-forest">Welcome to zameenDaar.com</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-ink">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{isSignup ? 'Choose your role and start your journey in real estate.' : 'Sign in to continue to your real estate workspace.'}</p>
            </div>

            <div className="mb-6 flex gap-1 rounded-xl bg-mist p-1">
              <button type="button" onClick={() => switchMode('signin')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${!isSignup ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}>Sign in</button>
              <button type="button" onClick={() => switchMode('signup')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${isSignup ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}>Sign up</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">I am joining as</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {availableRoles.map(({ value, label, description, icon: Icon }) => (
                    <button type="button" key={value} onClick={() => setRole(value)} className={`flex min-h-[92px] flex-col items-start rounded-xl border p-3 text-left transition-colors ${role === value ? 'border-forest bg-emerald-50 text-forest ring-2 ring-emerald-100' : 'border-line bg-white text-slate-500 hover:border-forest/50'}`}>
                      <Icon size={18} />
                      <span className="mt-2 text-sm font-bold">{label}</span>
                      <span className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isSignup && <Field label="Full name"><Input required value={form.name} onChange={updateField('name')} placeholder="Your full name" autoComplete="name" /></Field>}
              {isSignup && <Field label="Phone number"><Input required minLength={7} maxLength={20} value={form.phone} onChange={updateField('phone')} placeholder="Your phone number" autoComplete="tel" /></Field>}
              <Field label="Email address"><Input required type="email" value={form.email} onChange={updateField('email')} placeholder="you@example.com" autoComplete="email" /></Field>
              <Field label="Password">
                <div className="relative">
                  <Input required type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField('password')} placeholder={isSignup ? '8+ chars, number and symbol' : 'Enter your password'} autoComplete={isSignup ? 'new-password' : 'current-password'} className="pr-11" minLength={isSignup ? 8 : undefined} pattern={isSignup ? '(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}' : undefined} title={isSignup ? 'Use at least 8 characters, including one number and one symbol.' : undefined} />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 hover:text-ink">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </Field>

              {status.message && <p role="alert" className={`rounded-xl px-3.5 py-3 text-sm font-semibold ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{status.message}</p>}
              <Button type="submit" disabled={submitting || (isSignup && role === 'ADMIN')} className="w-full py-3">
                {submitting ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
              </Button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400"><LockKeyhole size={14} /> Your account is protected with secure sign-in</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function getLandingPath(role) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'BROKER') return '/broker/dashboard';
  return '/dashboard';
}

function formatApiError(data) {
  const fieldErrors = data.errors ? Object.values(data.errors).flat().join(' ') : '';
  return [data.message, fieldErrors].filter(Boolean).join(': ') || 'Unable to complete this request.';
}
