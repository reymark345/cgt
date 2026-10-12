import { FormEvent, ReactNode, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  ClipboardCheck,
  Globe2,
  ShieldCheck,
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
        'overflow-hidden rounded-md border bg-card shadow-sm transition-colors',
        isOpen ? 'border-primary/40' : 'border-border hover:border-primary/30',
      )}
    >
      <button
        aria-expanded={isOpen}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
          isOpen ? 'border-b border-primary/20 bg-primary/5' : 'hover:bg-muted/50',
        )}
        onClick={onToggle}
        type="button"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-5">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      router.visit('/dashboard');
    }, 300);
  }

  return (
    <>
      <Head title="Login" />

      <main className="min-h-screen bg-[#f5f9ff] bg-[radial-gradient(circle_at_1px_1px,hsl(213_30%_86%/.75)_1px,transparent_0)] bg-[length:22px_22px] px-4 py-10 text-foreground sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center">
          <div className="grid w-full max-w-[860px] overflow-hidden rounded-lg border bg-card shadow-lg lg:grid-cols-[0.95fr_1.05fr]">
            <section className="px-8 py-9 sm:px-10">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-blue-500">GRANTS</div>
                  <h1 className="mt-1 text-xl font-extrabold leading-7">
                    Grants Registry And
                    <br />
                    Navigation Tracking System
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">DSWD Grants Registry And Navigation Tracking System</p>
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-xl font-extrabold">Welcome back</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Sign in with Caraga Connect SSO for enterprise access, or use an alternative method below.
                </p>
              </div>

              {flash?.error ? (
                <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {flash.error}
                </div>
              ) : null}

              {flash?.message ? (
                <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {flash.message}
                </div>
              ) : null}

              <Button
                className="mt-7 h-12 w-full rounded-lg bg-primary shadow-md shadow-primary/25 hover:bg-primary/90"
                onClick={() => {
                  window.location.href = '/login-sso';
                }}
                type="button"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="flex flex-col text-center leading-tight">
                  <span className="text-sm font-extrabold">Continue with SSO</span>
                  <span className="text-[11px] font-semibold text-white/85">Recommended - DSWD Caraga Connect</span>
                </span>
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>Alternative sign-in</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-3">
                <SignInPanel
                  icon={<Globe2 className="h-4 w-4" />}
                  isOpen={isExternalOpen}
                  onToggle={() => setIsExternalOpen((current) => !current)}
                  subtitle="Username and password for external users"
                  title="External"
                >
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="external-password" className="text-xs font-bold">
                          Password
                        </Label>
                        <button className="text-[11px] font-semibold text-destructive" type="button">
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

                    <Button className="h-11 w-full bg-primary font-bold hover:bg-primary/90" disabled={isSubmitting} type="submit">
                      {isSubmitting ? 'Signing in' : 'Sign in'}
                    </Button>
                  </form>
                </SignInPanel>

                <SignInPanel
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  isOpen={isPortalOpen}
                  onToggle={() => setIsPortalOpen((current) => !current)}
                  subtitle="Use when SSO is unavailable"
                  title="MyPortal / LDAP"
                >
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex items-start gap-3 rounded-md border bg-background p-3 text-xs text-muted-foreground">
                      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>Sign in with your MyPortal directory credentials</span>
                    </div>

                    <div className="space-y-2">
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

                    <div className="space-y-2">
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

                    <Button className="h-11 w-full font-bold" disabled={isSubmitting} type="submit">
                      {isSubmitting ? 'Signing in' : 'Sign in with MyPortal'}
                    </Button>
                  </form>
                </SignInPanel>
              </div>
            </section>

            <section className="relative hidden min-h-[620px] overflow-hidden bg-[#d9e6e4] text-slate-900 lg:block">
              <div className="absolute inset-0 bg-[linear-gradient(145deg,hsl(184_33%_90%),hsl(346_27%_87%)),radial-gradient(circle_at_72%_16%,hsl(169_79%_46%/.28),transparent_30%)]" />
              <div className="absolute inset-x-8 bottom-10 h-24 rounded-[50%] bg-slate-900/10 blur-sm" />

              <div className="relative flex h-full min-h-[620px] flex-col justify-between px-10 py-9">
                <div className="inline-flex w-fit items-center gap-2 rounded-md border border-white/70 bg-white/55 px-4 py-2 text-xs font-extrabold text-primary shadow-sm backdrop-blur">
                  <ShieldCheck className="h-4 w-4" />
                  GRANTS secure workspace
                </div>

                <div className="relative mx-auto h-[390px] w-full max-w-[390px]">
                  <div className="absolute left-5 top-12 h-14 w-14 rounded-full bg-[#ffb0a6] shadow-sm" />
                  <div className="absolute left-5 top-7 h-9 w-16 rounded-t-full bg-slate-700" />
                  <div className="absolute left-[58px] top-[64px] h-2 w-2 rounded-full bg-slate-700" />
                  <div className="absolute left-16 top-[78px] h-5 w-8 rounded-br-full border-b-2 border-[#dc6e67]" />
                  <div className="absolute left-[34px] top-[112px] h-32 w-16 rounded-t-3xl bg-[#13c8ad]" />
                  <div className="absolute left-4 top-[132px] h-28 w-9 -rotate-12 rounded-full bg-slate-700" />
                  <div className="absolute left-[78px] top-[128px] h-24 w-8 rotate-[-28deg] rounded-full bg-[#ffb0a6]" />
                  <div className="absolute left-[103px] top-[130px] h-9 w-5 rotate-[-36deg] rounded-full bg-[#ffb0a6]" />
                  <div className="absolute left-[28px] top-[142px] h-16 w-12 -rotate-6 rounded-md bg-slate-800 shadow-md" />
                  <div className="absolute left-[36px] top-[244px] h-[95px] w-7 rounded-full bg-slate-700" />
                  <div className="absolute left-[78px] top-[236px] h-[102px] w-7 rounded-full bg-slate-600" />
                  <div className="absolute left-[22px] bottom-8 h-5 w-16 rounded-full bg-slate-900" />
                  <div className="absolute left-[72px] bottom-6 h-5 w-[72px] rounded-full bg-slate-900" />
                  <div className="absolute left-4 bottom-5 h-10 w-28 rounded-[50%] bg-slate-900/10" />

                  <div className="absolute right-8 top-2 rotate-[-32deg] rounded-md bg-[#12d3bc] p-3 text-white shadow-lg">
                    <ClipboardCheck className="h-8 w-8" />
                    <div className="mt-2 space-y-1">
                      <span className="block h-1.5 w-12 rounded-full bg-white/85" />
                      <span className="block h-1.5 w-9 rounded-full bg-white/65" />
                      <span className="block h-1.5 w-11 rounded-full bg-white/65" />
                    </div>
                  </div>

                  <div className="absolute bottom-12 right-1 h-5 w-64 -skew-x-12 rounded bg-slate-700" />
                  <div className="absolute bottom-5 right-4 h-14 w-60 -skew-x-12 rounded bg-[#9bd7d0]" />
                  <div className="absolute bottom-3 right-9 h-9 w-9 rounded-full bg-slate-800" />
                  <div className="absolute bottom-3 right-48 h-9 w-9 rounded-full bg-slate-800" />
                  <div className="absolute bottom-5 right-[58px] h-5 w-5 rounded-full bg-slate-500" />
                  <div className="absolute bottom-5 right-[214px] h-5 w-5 rounded-full bg-slate-500" />

                  <div className="absolute bottom-[86px] right-12 h-24 w-44 -skew-y-6 rounded-md bg-[#04b99f] shadow-xl">
                    <span className="absolute left-5 top-5 h-3 w-20 rounded bg-white/75" />
                    <span className="absolute left-5 top-11 h-8 w-16 rounded bg-white/92" />
                    <span className="absolute right-5 top-12 h-10 w-1 bg-slate-900/25" />
                    <span className="absolute right-9 top-12 h-10 w-1 bg-slate-900/25" />
                    <span className="absolute right-[52px] top-12 h-10 w-1 bg-slate-900/25" />
                  </div>

                  <div className="absolute bottom-[150px] right-20 h-[104px] w-[200px] -skew-y-6 rounded-md bg-[#15c7b1] shadow-xl">
                    <span className="absolute left-5 top-5 h-3 w-24 rounded bg-white/75" />
                    <span className="absolute left-5 top-11 h-8 w-[72px] rounded bg-white/92" />
                    <span className="absolute right-5 top-14 h-10 w-1 bg-slate-900/25" />
                    <span className="absolute right-9 top-14 h-10 w-1 bg-slate-900/25" />
                    <span className="absolute right-[52px] top-14 h-10 w-1 bg-slate-900/25" />
                  </div>

                  <div className="absolute bottom-[78px] right-40 h-[104px] w-[136px] -skew-y-6 rounded-md bg-[#008f7f] shadow-xl">
                    <span className="absolute left-4 top-5 h-3 w-14 rounded bg-white/75" />
                    <span className="absolute left-4 top-11 h-8 w-14 rounded bg-white/92" />
                    <span className="absolute right-4 top-14 h-10 w-1 bg-slate-900/25" />
                    <span className="absolute right-8 top-14 h-10 w-1 bg-slate-900/25" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-extrabold text-slate-950">Grants, records, accounts, and notices</h2>
                  <p className="mx-auto mt-3 max-w-[320px] text-sm font-semibold leading-6 text-slate-600">
                    Track beneficiary records, EMV cash cards, validation updates, and related transactions in one secure
                    workspace.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a className="font-semibold text-foreground underline underline-offset-2" href="#">
              Terms of Service
            </a>{' '}
            and{' '}
            <a className="font-semibold text-foreground underline underline-offset-2" href="#">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
