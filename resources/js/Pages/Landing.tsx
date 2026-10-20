import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Database,
  FileSpreadsheet,
  FileText,
  Layers3,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

const featureCards = [
  {
    icon: Search,
    title: 'Beneficiary Inquiry',
    copy: 'Unified search across Household ID, Grantee Name, and Card Number to inspect EMV & Payroll history.',
    meta: ['HHID Lookup', 'EMV & Payroll History', 'Add to Request'],
  },
  {
    icon: CreditCard,
    title: 'Cash Card Requests',
    copy: 'End-to-end processing for Opening, Distribution, OTC Withdrawal, Replacement, Transfer, Force PIN, Locking & Lifting.',
    meta: ['8 Request Modules', 'Batch Export', 'Added-By Audit'],
  },
  {
    icon: Database,
    title: 'EMV & Payroll References',
    copy: 'Centralized Grantee List, EMV Database, and EMV Payroll records with fast Excel chunked imports.',
    meta: ['Grantee Roster', 'EMV Database', 'EMV Payroll'],
  },
  {
    icon: FileText,
    title: 'Notice & Incoming Tracking',
    copy: 'Manage LBP Notice of Crediting / Returning, Notice Templates, and Incoming Inventory logs by office.',
    meta: ['Notice Templates', 'Incoming Logs', 'Print & Export'],
  },
  {
    icon: Building2,
    title: 'Directory & Servicing Branches',
    copy: 'Maintain LBP Servicing Branches, covered municipalities, and Authorized User assignments across Caraga.',
    meta: ['LBP Branches', 'Covered Areas', 'Authorized Users'],
  },
  {
    icon: LockKeyhole,
    title: 'Caraga Connect SSO & RBAC',
    copy: 'Enterprise OAuth 2.0 single sign-on with Role-Based Access Control and Admin account approval workflow.',
    meta: ['Caraga Connect SSO', 'Role Permissions', 'Admin Approval'],
  },
];

const workflowSteps = [
  {
    code: '01',
    label: 'Import References',
    detail: 'Upload and sync Grantee Roster, EMV Database, and EMV Payroll masterlists.',
  },
  {
    code: '02',
    label: 'Beneficiary Inquiry',
    detail: 'Search Household ID or Card Number to verify status and queue for card transactions.',
  },
  {
    code: '03',
    label: 'Process Card Requests',
    detail: 'Manage Account Opening, Distribution, Replacement, OTC, Force PIN, Locking, and Lifting.',
  },
  {
    code: '04',
    label: 'Notice & LBP Tracking',
    detail: 'Generate notices, track LBP servicing branches, and monitor live dashboard analytics.',
  },
];

const stats = [
  { value: '8', label: 'Card Request Modules' },
  { value: '100%', label: 'EMV & Grantee Synced' },
  { value: 'SSO', label: 'Caraga Connect Auth' },
  { value: 'Region XIII', label: 'LBP Branch Coverage' },
];

const processSteps = [
  {
    code: 'REF',
    label: 'References',
    sublabel: 'EMV & Grantee Sync',
    icon: Database,
    recordId: 'HHID-037109007-0000',
    context: 'Grantee & EMV Database • Butuan City',
    badge: 'Synced',
    statusMessage: 'Grantee & EMV Cash Card masterlist verified in database',
    metrics: [
      { label: 'Grantees', value: '142,850' },
      { label: 'EMV Cards', value: '138,420' },
      { label: 'LBP Branches', value: '14' },
    ],
  },
  {
    code: 'INQ',
    label: 'Inquiry',
    sublabel: 'HHID & Card Lookup',
    icon: Search,
    recordId: '6031-XXXX-XXXX-8492',
    context: 'Beneficiary Inquiry • Active EMV Card',
    badge: 'Verified',
    statusMessage: 'Beneficiary verified and queued via Add to Request',
    metrics: [
      { label: 'Lookups Today', value: '384' },
      { label: 'Matched EMV', value: '379' },
      { label: 'Queued', value: '48' },
    ],
  },
  {
    code: 'REQ',
    label: 'Requests',
    sublabel: '8 Card Transactions',
    icon: CreditCard,
    recordId: 'REQ-OPEN-2026-0194',
    context: 'Card Request • Replacement / Force PIN / OTC',
    badge: 'Queued',
    statusMessage: 'Tagged under Card Request with Added-By staff audit',
    metrics: [
      { label: 'Opening / Dist.', value: '164' },
      { label: 'Replace / PIN', value: '89' },
      { label: 'Lock / Lift', value: '36' },
    ],
  },
  {
    code: 'LBP',
    label: 'LBP Branch',
    sublabel: 'Servicing & Routing',
    icon: Building2,
    recordId: 'LBP-BXU-2026-0047',
    context: 'LANDBANK Servicing Branch • Butuan Branch',
    badge: 'Endorsed',
    statusMessage: 'Assigned to LBP Butuan Branch & Authorized Officer',
    metrics: [
      { label: 'Endorsed', value: '245' },
      { label: 'Released', value: '212' },
      { label: 'In Transit', value: '33' },
    ],
  },
  {
    code: 'NTC',
    label: 'Notices',
    sublabel: 'Dispatch & Logs',
    icon: FileText,
    recordId: 'NTC-CARAGA-0082',
    context: 'Notice of Crediting & Incoming Inventory',
    badge: 'Dispatched',
    statusMessage: 'Official Notice generated and logged for field office',
    metrics: [
      { label: 'Notices Sent', value: '128' },
      { label: 'Validated', value: '116' },
      { label: 'Pending', value: '12' },
    ],
  },
  {
    code: 'DASH',
    label: 'Analytics',
    sublabel: 'Live Monitoring',
    icon: BarChart3,
    recordId: 'GRANTS-2026-LIVE',
    context: 'Regional Executive Summary • Caraga FO',
    badge: 'Live Sync',
    statusMessage: 'Real-time regional KPIs & province breakdown updated',
    metrics: [
      { label: 'Total Processed', value: '1,420' },
      { label: 'Completed', value: '1,348' },
      { label: 'For Action', value: '72' },
    ],
  },
];

export default function Landing() {
  const [progressValue, setProgressValue] = useState(0); // 0 to 600 (100 per step)
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const tickMs = 50;
    const stepDurationMs = 5500; // 5.5 seconds per stage
    const increment = (tickMs / stepDurationMs) * 100;
    const maxProgress = processSteps.length * 100;

    const timer = window.setInterval(() => {
      setProgressValue((prev) => {
        const next = prev + increment;
        return next >= maxProgress ? 0 : next;
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const activeStepIndex = Math.min(Math.floor(progressValue / 100), processSteps.length - 1);
  const segmentProgress = progressValue % 100;
  const currentStage = processSteps[activeStepIndex];
  const totalSegments = processSteps.length - 1;
  const overallProgressPercent =
    activeStepIndex < totalSegments
      ? ((activeStepIndex + segmentProgress / 100) / totalSegments) * 100
      : 100;

  return (
    <>
      <Head title="GRANTS Portal" />

      <main className="min-h-screen bg-slate-50 text-slate-950">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link className="flex items-center gap-3" href="/">
              <img
                alt="GRANTS Logo"
                className="h-11 w-11 object-contain"
                src="/images/grants_logo_light.png"
              />
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
          <div className="absolute inset-0 bg-slate-950/50" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:32px_32px]" />

          <div className="relative mx-auto grid min-h-[640px] max-w-7xl origin-center items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:scale-[0.92] xl:scale-[0.9]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                DSWD Field Office Caraga &bull; GRANTS Platform
              </div>

              <h1 className="mt-7 text-4xl font-bold leading-[1.15] tracking-normal text-white sm:text-5xl lg:text-[3.35rem]">
                Grants Registry And Navigation Tracking System
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-blue-50/86">
                Unified Cash Grants Transaction portal for Beneficiary Inquiry, EMV Cash Card requests (Opening,
                Distribution, Replacement, OTC, Force PIN, Locking &amp; Lifting), LBP Branch routing, and Notice generation.
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
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> EMV &amp; Grantee Synced</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Caraga Connect SSO</span>
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-violet-200" /> End-to-End Card Requests</span>
              </div>
            </div>

            {/* Interactive Live GRANTS Pipeline Card */}
            <div
              className="relative lg:scale-95"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="absolute -right-3 -top-3 z-20 flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-slate-950/90 px-3.5 py-1.5 text-xs font-bold text-cyan-200 shadow-xl backdrop-blur">
                <WalletCards className="h-3.5 w-3.5 text-cyan-400" />
                <span>Stage {activeStepIndex + 1} of {processSteps.length} &bull; Audit Logged</span>
              </div>

              <div className="landing-process-card rounded-2xl border border-white/20 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
                {/* Top Live Header */}
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                      <span className="h-2 w-2 rounded-full bg-cyan-300 animate-live-dot" />
                      <span>LIVE WORKFLOW &bull; {currentStage.code}</span>
                    </div>
                    <div className="mt-2.5 font-mono text-xl font-bold tracking-tight text-white transition-all duration-700">
                      {currentStage.recordId}
                    </div>
                    <div className="mt-1 text-sm font-medium text-blue-100/75 transition-all duration-700">
                      {currentStage.context}
                    </div>
                  </div>
                  <div className="animate-processing-pill inline-flex items-center gap-2 self-start rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {currentStage.badge}
                  </div>
                </div>

                {/* Animated 6-Stage Pipeline Stepper */}
                <div className="relative mt-7">
                  {/* Continuous Progress Track Line (Desktop) */}
                  <div className="pointer-events-none absolute left-7 right-7 top-7 hidden h-1 rounded-full bg-white/10 sm:block">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_14px_rgba(34,211,238,0.75)] transition-[width] duration-150 ease-linear"
                      style={{
                        width: `${overallProgressPercent}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-y-5 gap-x-3 sm:grid-cols-6">
                    {processSteps.map((step, index) => {
                      const isActive = index === activeStepIndex;
                      const isCompleted = index < activeStepIndex;

                      return (
                        <button
                          className="group relative flex flex-col items-center gap-2.5 text-center focus:outline-none"
                          key={step.code}
                          onClick={() => {
                            setProgressValue(index * 100);
                          }}
                          type="button"
                        >
                          <div
                            className={cn(
                              'relative z-10 flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-700 ease-in-out',
                              isActive
                                ? 'scale-110 border-cyan-300 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_24px_rgba(34,211,238,0.55)] ring-4 ring-cyan-400/20'
                                : isCompleted
                                  ? 'border-cyan-400/40 bg-cyan-950/80 text-cyan-300 shadow-md'
                                  : 'border-white/12 bg-slate-900/85 text-slate-400 hover:border-white/25 hover:text-slate-200',
                            )}
                            title={`${step.label} - ${step.sublabel}`}
                          >
                            <step.icon className={cn('h-5 w-5 transition-transform duration-700 ease-in-out', isActive && 'scale-110')} />
                            {isCompleted && (
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 shadow">
                                ✓
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div
                              className={cn(
                                'text-xs font-extrabold transition-colors duration-700',
                                isActive ? 'text-cyan-300' : isCompleted ? 'text-white' : 'text-slate-400',
                              )}
                            >
                              {step.label}
                            </div>
                            <div className="hidden text-[10px] font-medium leading-tight text-slate-400/80 sm:block">
                              {step.sublabel}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Activity Status Strip */}
                <div className="animate-status-strip mt-7 rounded-xl border border-cyan-400/20 bg-slate-900/75 p-4 shadow-inner">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-cyan-50">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{currentStage.statusMessage}</span>
                    </div>
                    <span className="hidden rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-200 sm:inline-block">
                      STEP 0{activeStepIndex + 1}
                    </span>
                  </div>
                </div>

                {/* Dynamic Stage Metrics */}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {currentStage.metrics.map((metric) => (
                    <div
                      className="animate-stat-tile rounded-xl border border-white/10 bg-white/[0.07] p-4 transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.1]"
                      key={metric.label}
                    >
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100/60">
                        {metric.label}
                      </div>
                      <div className="mt-1.5 font-mono text-2xl font-extrabold text-cyan-100">
                        {metric.value}
                      </div>
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
              Designed around DSWD Field Office Caraga&apos;s Cash Grants workflow: Beneficiary Inquiry, 8 Card Request
              modules, EMV &amp; Payroll masterlists, LBP Branch routing, and Caraga Connect SSO.
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
                <h2 className="mt-3 text-3xl font-extrabold tracking-normal text-slate-950 sm:text-4xl">From Reference Sync to Card Requests</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  A streamlined path for Grants Staff and Administrators to look up beneficiaries, queue EMV card
                  requests, coordinate with LBP Servicing Branches, and generate official notices.
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
                Sign in with Caraga Connect SSO to access Beneficiary Inquiry, Card Request modules, EMV references, and live analytics.
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

