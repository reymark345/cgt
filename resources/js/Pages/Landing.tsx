import { Head, Link } from '@inertiajs/react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FileText,
  Layers3,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { Button } from '@/Components/ui/button';

const featureCards = [
  {
    icon: Database,
    title: 'EMV Database',
    copy: 'Centralized beneficiary and incoming record details for quick validation and lookup.',
    meta: ['Column filters', 'Office tabs', 'Import ready'],
  },
  {
    icon: FileSpreadsheet,
    title: 'EMV Payroll',
    copy: 'Organized payroll references for monitoring payment status and reconciliation work.',
    meta: ['Payroll records', 'Status review', 'Export support'],
  },
  {
    icon: UsersRound,
    title: 'Grantee Records',
    copy: 'Profile-centered grantee information connected to location, set, and registration data.',
    meta: ['Household data', 'Registration', 'Demographics'],
  },
  {
    icon: ClipboardCheck,
    title: 'Incoming Inventory',
    copy: 'Track procurement, supplier, delivery, and verification records from intake to review.',
    meta: ['Receiving logs', 'Validation', 'Audit trail'],
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    copy: 'Live operational counts, amount summaries, status totals, and office-level monitoring.',
    meta: ['Office counts', 'Status totals', 'Amount summary'],
  },
  {
    icon: LockKeyhole,
    title: 'Controlled Access',
    copy: 'A simple sign-in path keeps system tools and sensitive records behind the login screen.',
    meta: ['Secure entry', 'Role-ready', 'Session flow'],
  },
];

const workflowSteps = [
  { code: '01', label: 'Receive', detail: 'Incoming record is logged by office and reference number.' },
  { code: '02', label: 'Validate', detail: 'Fields, status, supplier, and beneficiary details are reviewed.' },
  { code: '03', label: 'Monitor', detail: 'Dashboards surface counts, totals, and records needing attention.' },
  { code: '04', label: 'Report', detail: 'Filtered records can be exported for documentation and follow-up.' },
];

const stats = [
  { value: '12+', label: 'Operational Modules' },
  { value: '100%', label: 'Record Coverage' },
  { value: 'GRANTS', label: 'Tracking Aligned' },
  { value: '24/7', label: 'Portal Access' },
];

const processSteps = [
  { code: 'INT', label: 'Intake', icon: ClipboardCheck },
  { code: 'EMV', label: 'Database', icon: Database },
  { code: 'PAY', label: 'Checking', icon: FileSpreadsheet },
  { code: 'VAL', label: 'Validate', icon: ShieldCheck },
  { code: 'RPT', label: 'Report', icon: FileText },
  { code: 'DASH', label: 'Dashboard', icon: BarChart3 },
];

export default function Landing() {
  return (
    <>
      <Head title="GRANTS Portal" />

      <main className="min-h-screen bg-slate-50 text-slate-950">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link className="flex items-center gap-3" href="/">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                <PackageCheck className="h-7 w-7" />
              </div>
              <div>
                <div className="text-lg font-extrabold leading-5 tracking-normal text-slate-900">GRANTS</div>
                <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                  Grants Registry And Navigation Tracking System
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
              <a className="transition hover:text-primary" href="#features">Features</a>
              <a className="transition hover:text-primary" href="#modules">Modules</a>
              <a className="transition hover:text-primary" href="#workflow">Workflow</a>
              <a className="transition hover:text-primary" href="#teams">Teams</a>
            </nav>

            <Button asChild className="shadow-md" size="lg">
              <Link href="/login">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="relative overflow-hidden bg-slate-950 text-white">
          <video
            aria-hidden="true"
            autoPlay
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            loop
            muted
            playsInline
            preload="auto"
            src="/videos/landing_page_vid.mp4"
          />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:32px_32px]" />

          <div className="relative mx-auto grid min-h-[640px] max-w-7xl origin-center items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[680px] lg:grid-cols-[0.93fr_1.07fr] lg:px-8 lg:scale-[0.92] xl:scale-[0.9]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                DSWD GRANTS Records Monitoring Platform
              </div>

              <h1 className="mt-7 text-4xl font-bold leading-[1.15] tracking-normal text-white sm:text-5xl lg:text-[3.35rem]">
                Grants Registry And Navigation Tracking System
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-blue-50/86">
                GRANTS (Grants Registry And Navigation Tracking System) for incoming inventory, EMV database
                monitoring, payroll references, grantee records, and operational reporting.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 px-5 text-sm shadow-lg" size="lg">
                  <Link href="/login">
                    Sign In to Access
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild className="h-11 border-white/35 bg-white/8 px-5 text-sm text-white hover:bg-white/15" size="lg" variant="outline">
                  <a href="#features">Explore Features</a>
                </Button>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-blue-50/72">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> EMV Records Ready</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Controlled Access</span>
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-violet-200" /> Real-time Workflow</span>
              </div>
            </div>

            <div className="relative lg:scale-95">
              <div className="absolute -right-3 top-2 z-10 rounded-md bg-slate-950/88 px-4 py-2 text-xs font-bold text-cyan-200 shadow-xl animate-audit-badge">
                Audit logged
              </div>
              <div className="landing-process-card rounded-md border border-white/18 bg-slate-950/45 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-normal text-cyan-200">
                      <span className="h-2 w-2 rounded-full bg-cyan-300 animate-live-dot" />
                      Live Record
                    </div>
                    <div className="mt-3 font-mono text-xl font-bold text-white">GRANTS-2026-00047</div>
                    <div className="mt-1 text-sm font-semibold text-blue-100/68">Incoming Inventory - Caraga Office</div>
                  </div>
                  <div className="animate-processing-pill rounded-md border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                    Processing
                  </div>
                </div>

                <div className="relative mt-8">
                  <div className="grid grid-cols-3 gap-5 sm:grid-cols-6">
                    {processSteps.map((step) => (
                      <div className="animate-process-step relative flex flex-col items-center gap-3" key={step.code}>
                        <div
                          className="process-icon-tile relative z-10 flex h-14 w-14 items-center justify-center rounded-md border border-white/12 bg-white/10 text-blue-100 shadow-lg transition"
                          title={step.code}
                        >
                          <step.icon className="h-5 w-5" />
                        </div>
                        <div className="text-center text-xs font-bold text-blue-100/80">
                          {step.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="animate-status-strip mt-8 rounded-md border border-white/8 bg-slate-950/52 p-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-pink-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Record GRANTS-2026-00047 tagged for validation
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Incoming', '128'],
                    ['Verified', '96'],
                    ['Pending', '32'],
                  ].map(([label, value]) => (
                    <div className="animate-stat-tile rounded-md border border-white/10 bg-white/8 p-4" key={label}>
                      <div className="text-xs font-extrabold uppercase text-blue-100/55">{label}</div>
                      <div className="mt-2 text-2xl font-extrabold text-cyan-100">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div className="rounded-md border border-slate-200 bg-white p-6 shadow-lg" key={stat.label}>
                <div className="text-3xl font-extrabold text-slate-950">{stat.value}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="features">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-extrabold uppercase tracking-normal text-primary">GRANTS Capabilities</div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-normal text-slate-950 sm:text-4xl">Built for Your Current Process</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The landing page reflects the system already in place: dashboard monitoring, reference records, Excel imports,
              office filters, and controlled access.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3" id="modules">
            {featureCards.map((feature) => (
              <article className="rounded-md border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md" key={feature.title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-slate-950">{feature.title}</h3>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{feature.copy}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {feature.meta.map((item) => (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600" key={item}>{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20" id="workflow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-normal text-primary">System Workflow</div>
                <h2 className="mt-3 text-3xl font-extrabold tracking-normal text-slate-950 sm:text-4xl">From Intake to Dashboard</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
              A clean path for offices to record, review, monitor, and report on GRANTS data without leaving the portal.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {workflowSteps.map((step) => (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-6" key={step.code}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">
                        {step.code}
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-950">{step.label}</h3>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="teams">
          <div className="rounded-md bg-slate-950 p-8 text-white shadow-xl sm:p-10 lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-200">
                <Layers3 className="h-4 w-4" />
                DSWD GRANTS Portal
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-normal">Ready to continue to the secure workspace?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Sign in to open the existing login page and continue to the GRANTS dashboard, references, and record tools.
              </p>
            </div>
            <Button asChild className="mt-8 h-12 bg-white px-6 text-slate-950 hover:bg-slate-100 lg:mt-0" size="lg">
              <Link href="/login">
                Sign In to Access
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
