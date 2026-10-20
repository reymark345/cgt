import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CreditCard,
  FileSpreadsheet,
  Globe2,
  KeyRound,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  WalletCards,
} from 'lucide-react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

type SignInPanelProps = {
  children: ReactNode;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  subtitle: string;
  title: string;
};

function SignInPanel({ children, icon, isOpen, onToggle, subtitle, title }: SignInPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card/80 shadow-sm transition-all duration-200',
        isOpen
          ? 'border-blue-500/40 ring-1 ring-blue-500/20 dark:border-sky-500/40 dark:bg-slate-900/90'
          : 'border-slate-200/80 hover:border-blue-400/40 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700',
      )}
    >
      <button
        aria-expanded={isOpen}
        className={cn(
          'flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors',
          isOpen
            ? 'border-b border-slate-200/70 bg-blue-50/50 dark:border-slate-800 dark:bg-sky-500/10'
            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50',
        )}
        onClick={onToggle}
        type="button"
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            isOpen
              ? 'bg-blue-600 text-white dark:bg-sky-500 dark:text-slate-950'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">{title}</span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
        )}
      </button>

      {isOpen ? <div className="space-y-4 p-4">{children}</div> : null}
    </div>
  );
}

export default function Login() {
  const { flash } = usePage<{ flash?: { error?: string; message?: string } }>().props;
  const [externalUsername, setExternalUsername] = useState('');
  const [externalPassword, setExternalPassword] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [isExternalOpen, setIsExternalOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_dark_mode', String(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      router.visit('/dashboard');
    }, 300);
  }

  return (
    <>
      <Head title="Sign In - GRANTS Portal" />

      <main className="relative min-h-screen overflow-hidden bg-[#f4f7fb] bg-[radial-gradient(circle_at_1px_1px,hsl(215_28%_84%/.7)_1px,transparent_0)] bg-[length:22px_22px] px-4 py-8 text-foreground transition-colors duration-300 dark:bg-[#070d19] dark:bg-[radial-gradient(circle_at_1px_1px,hsl(217_32%_20%/.55)_1px,transparent_0)] sm:px-6 lg:py-12">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl dark:bg-sky-500/10" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/10" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center">
          {/* Top Bar Controls */}
          <div className="mb-4 flex w-full max-w-[940px] items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>DSWD Field Office Caraga &bull; Pantawid Pamilya</span>
            </div>

            <button
              aria-label="Toggle dark mode"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/85 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-900/85 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setDarkMode((prev) => !prev)}
              type="button"
            >
              {darkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Main Split Container */}
          <div className="grid w-full max-w-[940px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/5 transition-colors dark:border-slate-800/90 dark:bg-[#0d1526] dark:shadow-black/60 lg:grid-cols-[1fr_1.08fr]">
            {/* Left Column: Authentication Form */}
            <section className="flex flex-col justify-between px-7 py-8 sm:px-10 sm:py-10">
              <div>
                {/* Brand Identity */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 dark:from-sky-500 dark:to-blue-600 dark:shadow-sky-500/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-sky-400">
                        GRANTS
                      </span>
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-sky-500/15 dark:text-sky-300">
                        CGT v2.0
                      </span>
                    </div>
                    <h1 className="mt-1 text-lg font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-xl">
                      Grants Registry &amp; Navigation Tracking System
                    </h1>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Cash Grants Transaction &amp; EMV Card Monitoring Portal
                    </p>
                  </div>
                </div>

                {/* Welcome Section */}
                <div className="mt-8">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Welcome back
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                    Sign in with your <strong className="font-semibold text-slate-700 dark:text-slate-200">Caraga Connect SSO</strong> account for enterprise access, or select an alternative method below.
                  </p>
                </div>

                {/* Flash Alerts */}
                {flash?.error ? (
                  <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-950/50 dark:text-red-300 sm:text-sm">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <span>{flash.error}</span>
                  </div>
                ) : null}

                {flash?.message ? (
                  <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300 sm:text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{flash.message}</span>
                  </div>
                ) : null}

                {/* Primary SSO Action */}
                <button
                  className="group relative mt-6 flex w-full items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 py-3.5 text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-600/35 active:scale-[0.99] dark:from-sky-500 dark:via-sky-500 dark:to-blue-600 dark:text-slate-950 dark:shadow-sky-500/20"
                  onClick={() => {
                    window.location.href = '/login-sso';
                  }}
                  type="button"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm dark:bg-slate-950/15">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-extrabold tracking-tight">Continue with SSO</div>
                      <div className="text-[11px] font-medium text-blue-100 dark:text-slate-900/80">
                        Recommended &bull; DSWD Caraga Connect
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span>Alternative sign-in</span>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Alternative Sign-in Accordions */}
                <div className="space-y-3">
                  <SignInPanel
                    icon={<Globe2 className="h-4 w-4" />}
                    isOpen={isExternalOpen}
                    onToggle={() => setIsExternalOpen((current) => !current)}
                    subtitle="Username and password for external users"
                    title="External Account"
                  >
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-1.5">
                        <Label htmlFor="external-username" className="text-xs font-bold">
                          Username
                        </Label>
                        <Input
                          id="external-username"
                          autoComplete="username"
                          onChange={(event) => setExternalUsername(event.target.value)}
                          placeholder="Enter username"
                          value={externalUsername}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="external-password" className="text-xs font-bold">
                            Password
                          </Label>
                          <button className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-sky-400" type="button">
                            Forgot password?
                          </button>
                        </div>
                        <Input
                          id="external-password"
                          autoComplete="current-password"
                          onChange={(event) => setExternalPassword(event.target.value)}
                          placeholder="Enter your password"
                          type="password"
                          value={externalPassword}
                        />
                      </div>

                      <Button className="h-10 w-full bg-blue-600 font-bold text-white hover:bg-blue-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400" disabled={isSubmitting} type="submit">
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                      </Button>
                    </form>
                  </SignInPanel>

                  <SignInPanel
                    icon={<BriefcaseBusiness className="h-4 w-4" />}
                    isOpen={isPortalOpen}
                    onToggle={() => setIsPortalOpen((current) => !current)}
                    subtitle="Use when Caraga Connect SSO is unavailable"
                    title="MyPortal / LDAP"
                  >
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>Sign in with your DSWD MyPortal directory credentials</span>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="portal-username" className="text-xs font-bold">
                          Username
                        </Label>
                        <Input
                          id="portal-username"
                          autoComplete="username"
                          onChange={(event) => setPortalUsername(event.target.value)}
                          placeholder="Domain username"
                          value={portalUsername}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="portal-password" className="text-xs font-bold">
                          Password
                        </Label>
                        <Input
                          id="portal-password"
                          autoComplete="current-password"
                          onChange={(event) => setPortalPassword(event.target.value)}
                          placeholder="Enter your password"
                          type="password"
                          value={portalPassword}
                        />
                      </div>

                      <Button className="h-10 w-full bg-blue-600 font-bold text-white hover:bg-blue-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400" disabled={isSubmitting} type="submit">
                        {isSubmitting ? 'Signing in...' : 'Sign in with MyPortal'}
                      </Button>
                    </form>
                  </SignInPanel>
                </div>
              </div>

              {/* Footer Security Note */}
              <div className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-400 dark:border-slate-800/80 dark:text-slate-500">
                <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <span>Protected by DSWD Caraga OAuth 2.0 &amp; Role-Based Access Control</span>
              </div>
            </section>

            {/* Right Column: Modern GRANTS Workspace & EMV Card Showcase (Light & Dark Mode Adaptive) */}
            <section className="relative hidden overflow-hidden border-l border-slate-200/80 bg-gradient-to-br from-[#e8f4f2] via-[#eef6ff] to-[#f5efff] text-slate-900 transition-colors duration-300 dark:border-slate-800/90 dark:from-slate-900 dark:via-[#0d1f38] dark:to-[#0a2e36] dark:text-white lg:flex lg:flex-col lg:justify-between">
              {/* Decorative Grid & Ambient Glows */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] bg-[length:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)]" />
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl dark:bg-teal-400/20" />
              <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-sky-500/20" />

              <div className="relative z-10 flex h-full flex-col justify-between p-9">
                {/* Top Workspace Badge + DSWD Caraga Official Logo (Outside Cash Card on Right Side) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-white/85 px-3.5 py-1.5 text-xs font-extrabold text-teal-800 shadow-sm backdrop-blur-md dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-300">
                    <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span>GRANTS Secure Workspace</span>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/95">
                    <img
                      alt="DSWD Field Office Caraga"
                      className="h-8 w-auto object-contain"
                      src="/images/dswd_caraga_logo.png"
                    />
                  </div>
                </div>

                {/* Center Interactive Visual: LBP EMV Cash Card + Live Modules */}
                <div className="my-8 space-y-4">
                  {/* Mock LBP / DSWD EMV Cash Card */}
                  <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-800 p-5 text-white shadow-xl shadow-teal-900/15 backdrop-blur-xl dark:border-white/15 dark:from-teal-500/90 dark:via-emerald-600/90 dark:to-cyan-800/90 dark:shadow-2xl dark:shadow-black/50">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/20 blur-2xl" />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-100">
                          DSWD 4Ps &bull; LANDBANK
                        </div>
                        <div className="mt-0.5 text-sm font-black tracking-tight text-white">
                          EMV Cash Card Registry
                        </div>
                      </div>
                      <WalletCards className="h-6 w-6 text-teal-100" />
                    </div>

                    {/* EMV Gold Chip & Contactless */}
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex h-8 w-11 items-center justify-center rounded-md border border-amber-200/60 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 shadow-inner">
                        <div className="h-4 w-7 rounded-sm border border-amber-700/40" />
                      </div>
                      <span className="rounded-full bg-black/25 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-100">
                        ACTIVE &bull; VALIDATED
                      </span>
                    </div>

                    {/* Card Number & HHID */}
                    <div className="mt-4 font-mono text-base font-bold tracking-[0.18em] text-white drop-shadow">
                      6031 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 8492
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[11px]">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-teal-100/85">
                          Household ID
                        </span>
                        <span className="font-mono font-bold text-white">037109007-0000-00000</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] uppercase tracking-wider text-teal-100/85">
                          LBP Servicing Branch
                        </span>
                        <span className="font-bold text-white">BUTUAN BRANCH</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Status Cards (Light & Dark Mode Adaptive) */}
                  <div className="mx-auto grid max-w-[360px] grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200/90 bg-white/85 p-3.5 shadow-sm backdrop-blur-md transition-colors dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-sky-300">
                        <CreditCard className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">Card Requests</span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                        Opening, Replacement, Force PIN, Locking &amp; Lifting
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200/90 bg-white/85 p-3.5 shadow-sm backdrop-blur-md transition-colors dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
                        <FileSpreadsheet className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">EMV &amp; Notice</span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                        Grantee Roster, EMV Database, &amp; Notice Templates
                      </p>
                    </div>
                  </div>

                  {/* Live Workflow Pill (Light & Dark Mode Adaptive) */}
                  <div className="mx-auto flex max-w-[360px] items-center justify-between rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-xs shadow-sm backdrop-blur-md transition-colors dark:border-white/10 dark:bg-slate-950/45 dark:shadow-none">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Beneficiary &amp; LBP Branch Tracking</span>
                    </div>
                    <span className="font-mono text-[10px] font-extrabold text-teal-600 dark:text-teal-300">SYNCED</span>
                  </div>
                </div>

                {/* Bottom Copy */}
                <div className="border-t border-slate-300/60 pt-5 dark:border-white/10">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Grants, records, accounts, and notices
                  </h2>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                    Track beneficiary records, EMV cash cards, validation updates, and related transactions in one unified workspace.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            By continuing, you agree to our{' '}
            <a className="font-semibold text-slate-700 underline underline-offset-2 dark:text-slate-200" href="#">
              Terms of Service
            </a>{' '}
            and{' '}
            <a className="font-semibold text-slate-700 underline underline-offset-2 dark:text-slate-200" href="#">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}


