import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChefHat, Coffee, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_ACCOUNTS, useAuth } from '../store/auth';
import { Button, FormField, Input } from '../components/ui/primitives';
import { landingPathFor } from '../components/layout/nav';
import { LOGO_SRC, LOGO_SRC_DARK, LOGO_ALT, HERO_IMAGE } from '../lib/brand';
import type { Role } from '../types';

const ROLE_CARDS: { role: Role; label: string; icon: typeof Coffee; blurb: string }[] = [
  { role: 'ADMIN', label: 'Admin', icon: ShieldCheck, blurb: 'Full access & settings' },
  { role: 'MANAGER', label: 'Manager', icon: Sparkles, blurb: 'Operations & reports' },
  { role: 'CASHIER', label: 'Cashier', icon: ShoppingBag, blurb: 'POS & customers' },
  { role: 'KITCHEN', label: 'Kitchen', icon: ChefHat, blurb: 'Kitchen display' },
];

export function LoginPage() {
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const loginAs = useAuth((s) => s.loginAs);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  if (user) return <Navigate to={landingPathFor(user.role)} replace />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 4) next.password = 'Password must be at least 4 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const result = login(email, password);
    if (!result.ok) {
      toast.error(result.error ?? 'Unable to sign in');
      return;
    }
    toast.success('Welcome back to ODFE');
    navigate(landingPathFor(useAuth.getState().user?.role));
  };

  const quick = (role: Role) => {
    loginAs(role);
    toast.success(`Signed in as ${role.toLowerCase()}`);
    navigate(landingPathFor(role));
  };

  const fillDemo = (index: number) => {
    const account = DEMO_ACCOUNTS[index];
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[45%_55%]">
      <motion.div
        className="relative hidden flex-col justify-between overflow-hidden bg-espresso p-10 text-white lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso via-espresso/80 to-espresso/45" />
        <div className="pointer-events-none absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-caramel/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-64 w-64 rounded-full bg-sage/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <img src={LOGO_SRC} alt={LOGO_ALT} className="h-11 w-11 rounded-lg object-contain" />
          <span className="leading-tight">
            <span className="block text-xl font-bold tracking-[0.08em]">ODFE</span>
            <span className="block text-[9px] uppercase tracking-[0.18em] text-white/55">cafe operations</span>
          </span>
        </div>
        <div className="relative max-w-md">
          <p className="eyebrow text-white/50">Your cafe, in rhythm</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05]">
            Make every <em className="not-italic text-honey">moment</em> count.
          </h1>
          <p className="mt-5 text-white/70">A calmer, warmer way to run your floor, bar and kitchen — from first order to last report.</p>
        </div>
        <p className="relative text-xs text-white/40">Designed for the places people love to return to.</p>
      </motion.div>

      <div className="flex items-center justify-center p-5 sm:p-10">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={LOGO_SRC_DARK} alt={LOGO_ALT} className="h-10 w-10 rounded-lg object-contain" />
            <span className="text-xl font-bold tracking-[0.08em] text-espresso">ODFE</span>
          </div>

          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold">Sign in to your workspace</h2>
          <p className="mt-2 text-sm text-muted">Use a demo account below — this build runs in demo mode with sample data.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <FormField label="Email" htmlFor="email" error={errors.email} required>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@odfe.cafe" aria-invalid={!!errors.email} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password} required>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" aria-invalid={!!errors.password} />
            </FormField>
            <Button type="submit" full size="lg" icon={<ArrowRight size={17} />}>Sign in</Button>
          </form>

          <div className="mt-7">
            <p className="eyebrow mb-2">One-tap demo roles</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_CARDS.map((rc) => {
                const Icon = rc.icon;
                return (
                  <button key={rc.role} onClick={() => quick(rc.role)} className="card flex items-center gap-3 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-caramel"><Icon size={17} /></span>
                    <span>
                      <span className="block text-sm font-semibold text-roast">{rc.label}</span>
                      <span className="block text-[11px] text-muted">{rc.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-line bg-white/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Demo credentials (tap to fill)</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((a, i) => (
                <button key={a.email} onClick={() => fillDemo(i)} className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-medium text-roast hover:bg-[#e9ddd1]">
                  {a.email.split('@')[0]} · {a.password}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
