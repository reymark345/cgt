import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GitPullRequest,
  GraduationCap,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Unlock,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';
import type {
  CurrentView,
  DashboardMetrics,
  DashboardStat,
  EmvDatabaseRecord,
  RecordItem,
} from '../types';
import { formatAmount } from '../utils';

type DashboardViewProps = {
  dashboardMetrics?: DashboardMetrics;
  emvRecords?: EmvDatabaseRecord[];
  notice: string;
  onOpenEmvDatabase: () => void;
  onOpenGrantee?: () => void;
  onOpenPayroll?: () => void;
  onOpenInquiry?: (hhId?: string) => void;
  onOpenDataModule?: (mod: string) => void;
  // Backwards compatibility props
  dashboardStats?: DashboardStat[];
  officeCounts?: Record<string, number>;
  records?: RecordItem[];
  statusCounts?: Record<string, number>;
  onOfficeSelect?: (office: string) => void;
  onRecentSelect?: (reference: string) => void;
  onStatusSelect?: (status: string) => void;
};

const defaultMetrics: DashboardMetrics = {
  emv: {
    total: 266680,
    claimed: 242191,
    unclaimed: 24489,
    rcct: 248969,
    mcct: 17711,
    claimedPercentage: 90.8,
  },
  grantee: {
    total: 335890,
    active: 146201,
    graduated: 75858,
    other: 113831,
    activePercentage: 43.5,
  },
  payroll: {
    total: 127220,
    gross: 540489000,
    net: 540480900,
    withholdings: 8100,
    period: 'Period 4 (2026)',
  },
  requests: {
    total: 30,
    pending: 30,
  },
  moduleCounts: {
    opening: 23,
    distribution: 2,
    'otc-withdrawal': 1,
    replacement: 1,
    'transfer-of-fund': 0,
    'force-pin': 0,
    locking: 1,
    lifting: 1,
  },
  recentRequests: [],
  topMunicipalities: [
    { municipality: 'BUTUAN CITY (Capital)', count: 23467 },
    { municipality: 'SURIGAO CITY (Capital)', count: 11575 },
    { municipality: 'PROSPERIDAD (Capital)', count: 9603 },
    { municipality: 'CITY OF BAYUGAN', count: 9424 },
    { municipality: 'CITY OF BISLIG', count: 8392 },
    { municipality: 'ESPERANZA', count: 7897 },
    { municipality: 'LORETO', count: 6790 },
    { municipality: 'TRENTO', count: 6338 },
  ],
};

const dataModules = [
  {
    id: 'opening',
    name: 'Opening',
    desc: 'Account opening queue',
    icon: FolderOpen,
    color: 'text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-400',
  },
  {
    id: 'distribution',
    name: 'Distribution',
    desc: 'Card distribution series',
    icon: Truck,
    color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
  },
  {
    id: 'otc-withdrawal',
    name: 'OTC Withdrawal',
    desc: 'Over-the-counter payments',
    icon: Banknote,
    color: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
  },
  {
    id: 'replacement',
    name: 'Replacement',
    desc: 'Card replacement series',
    icon: RefreshCw,
    color: 'text-violet-600 bg-violet-500/10 border-violet-500/20 dark:text-violet-400',
  },
  {
    id: 'transfer-of-fund',
    name: 'Transfer of Fund',
    desc: 'Transfer of funds tracking',
    icon: ArrowRightLeft,
    color: 'text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400',
  },
  {
    id: 'force-pin',
    name: 'Force PIN',
    desc: 'Card PIN reset & auth',
    icon: KeyRound,
    color: 'text-orange-600 bg-orange-500/10 border-orange-500/20 dark:text-orange-400',
  },
  {
    id: 'locking',
    name: 'Locking',
    desc: 'Account lock requests',
    icon: Lock,
    color: 'text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-400',
  },
  {
    id: 'lifting',
    name: 'Lifting',
    desc: 'Account lock lifting',
    icon: Unlock,
    color: 'text-teal-600 bg-teal-500/10 border-teal-500/20 dark:text-teal-400',
  },
];

export function DashboardView({
  dashboardMetrics,
  emvRecords = [],
  notice,
  onOpenEmvDatabase,
  onOpenGrantee,
  onOpenPayroll,
  onOpenInquiry,
  onOpenDataModule,
}: DashboardViewProps) {
  const [quickHhId, setQuickHhId] = useState('');

  // Merge supplied metrics with defaults for safety
  const metrics: DashboardMetrics = useMemo(() => {
    if (!dashboardMetrics) return defaultMetrics;
    return {
      emv: { ...defaultMetrics.emv, ...dashboardMetrics.emv },
      grantee: { ...defaultMetrics.grantee, ...dashboardMetrics.grantee },
      payroll: { ...defaultMetrics.payroll, ...dashboardMetrics.payroll },
      requests: { ...defaultMetrics.requests, ...dashboardMetrics.requests },
      moduleCounts: dashboardMetrics.moduleCounts || defaultMetrics.moduleCounts,
      recentRequests: dashboardMetrics.recentRequests || defaultMetrics.recentRequests,
      topMunicipalities:
        dashboardMetrics.topMunicipalities?.length > 0
          ? dashboardMetrics.topMunicipalities
          : defaultMetrics.topMunicipalities,
    };
  }, [dashboardMetrics]);

  // Greeting based on local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-PH', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Top municipality highest count for relative bar scaling
  const maxMunicipalityCount = useMemo(() => {
    return Math.max(...metrics.topMunicipalities.map((m) => m.count), 1);
  }, [metrics.topMunicipalities]);

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickHhId.trim() && onOpenInquiry) {
      onOpenInquiry(quickHhId.trim());
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {/* Hero Welcome & Quick Search Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm dark:border-border dark:bg-card">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-primary dark:text-cyan-300">
                  <Sparkles className="h-3 w-3" />
                  DSWD GRANTS Caraga Region XIII
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {todayFormatted}
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {greeting}, CGT Records Officer
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Live convergence tracking across{' '}
                <strong className="text-foreground">{metrics.grantee.total.toLocaleString()} Grantees</strong>,{' '}
                <strong className="text-foreground">{metrics.emv.total.toLocaleString()} EMV Cards</strong> ({metrics.emv.total === 0 ? 0 : metrics.emv.claimedPercentage}% Claimed), and{' '}
                <strong className="text-foreground">{metrics.payroll.total === 0 ? '₱0' : formatAmount(metrics.payroll.gross)}</strong> in Payroll Disbursements.
              </p>
            </div>

            {/* Direct Quick Jump Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                className="gap-2 shadow-xs font-semibold"
                onClick={() => onOpenInquiry?.()}
                size="sm"
              >
                <Search className="h-4 w-4" />
                Household Inquiry
              </Button>
              <Button
                className="gap-2 shadow-xs font-semibold"
                onClick={onOpenEmvDatabase}
                size="sm"
                variant="outline"
              >
                <CreditCard className="h-4 w-4 text-emerald-500" />
                EMV Database
              </Button>
              <Button
                className="gap-2 shadow-xs font-semibold"
                onClick={onOpenGrantee}
                size="sm"
                variant="outline"
              >
                <Users className="h-4 w-4 text-sky-500" />
                Grantee List
              </Button>
              <Button
                className="gap-2 shadow-xs font-semibold"
                onClick={onOpenPayroll}
                size="sm"
                variant="outline"
              >
                <Landmark className="h-4 w-4 text-violet-500" />
                Payroll
              </Button>
            </div>
          </div>

          {/* Quick HH_ID Cross-Check Input Bar */}
          <form
            onSubmit={handleQuickSearchSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border/80 bg-background/80 p-2 shadow-xs backdrop-blur-xs"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Quick Household Inquiry: Type HH_ID (e.g. HHID160202004-1516-00001)..."
                value={quickHhId}
                onChange={(e) => setQuickHhId(e.target.value)}
                className="pl-9 text-xs sm:text-sm border-0 focus-visible:ring-0 shadow-none bg-transparent"
              />
            </div>
            <Button
              type="submit"
              disabled={!quickHhId.trim()}
              className="gap-1.5 text-xs font-semibold shrink-0"
              size="sm"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Search & Consolidate
            </Button>
          </form>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Grantees */}
        <div
          className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-md cursor-pointer"
          onClick={onOpenGrantee}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grantee Masterlist</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-foreground">
              {metrics.grantee.total.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {metrics.grantee.total === 0 ? 0 : metrics.grantee.active.toLocaleString()} Active
              </span>
              <span>{metrics.grantee.total === 0 ? 0 : metrics.grantee.graduated.toLocaleString()} Graduated</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${metrics.grantee.total === 0 ? 0 : metrics.grantee.activePercentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{metrics.grantee.total === 0 ? 0 : metrics.grantee.activePercentage}% Active Rate</span>
              <span className="font-semibold text-sky-600 dark:text-sky-400 group-hover:underline flex items-center gap-0.5">
                View Grantees <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: EMV Cards */}
        <div
          className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md cursor-pointer"
          onClick={onOpenEmvDatabase}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">EMV Database</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-foreground">
              {metrics.emv.total.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {metrics.emv.total === 0 ? 0 : metrics.emv.claimed.toLocaleString()} Claimed
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {metrics.emv.total === 0 ? 0 : metrics.emv.unclaimed.toLocaleString()} Unclaimed
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${metrics.emv.total === 0 ? 0 : metrics.emv.claimedPercentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{metrics.emv.total === 0 ? 0 : metrics.emv.claimedPercentage}% Claimed Rate</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                Open Database <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Payroll Disbursed */}
        <div
          className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-md cursor-pointer"
          onClick={onOpenPayroll}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payroll Disbursed</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-foreground truncate">
              {metrics.payroll.total === 0 ? '₱0' : formatAmount(metrics.payroll.gross)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{metrics.payroll.total.toLocaleString()} Beneficiaries</span>
              <span className="font-semibold text-violet-600 dark:text-violet-400">
                {metrics.payroll.total === 0 ? 'No active records' : metrics.payroll.period}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: metrics.payroll.total === 0 ? '0%' : '99.9%' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Net: {metrics.payroll.total === 0 ? '₱0' : formatAmount(metrics.payroll.net)}</span>
              <span className="font-semibold text-violet-600 dark:text-violet-400 group-hover:underline flex items-center gap-0.5">
                Open Payroll <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Service Requests */}
        <div
          className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md cursor-pointer"
          onClick={() => onOpenInquiry?.()}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Service Requests</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <GitPullRequest className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-foreground">
              {metrics.requests.total.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {metrics.requests.pending} Pending Review
              </span>
              <span>8 Action Modules</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: metrics.requests.total > 0 ? '100%' : '10%' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Automate & Operations</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:underline flex items-center gap-0.5">
                Open Inquiry <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Analytical Breakdown (Left) & Geographic Coverage (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Program & Financial Distribution (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* CCT Program Type & Grantee Status Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs dark:border-border dark:bg-card">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Program & Beneficiary Distribution
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Breakdown by CCT classification and grantee status</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary dark:text-cyan-300">
                Live Data
              </span>
            </div>

            <div className="mt-5 space-y-6">
              {/* CCT Type: RCCT vs MCCT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">CCT Classification (EMV Database)</span>
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400">
                      RCCT: {metrics.emv.rcct.toLocaleString()} ({metrics.emv.total > 0 ? Math.round((metrics.emv.rcct / metrics.emv.total) * 100) : 0}%)
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      MCCT: {metrics.emv.mcct.toLocaleString()} ({metrics.emv.total > 0 ? Math.round((metrics.emv.mcct / metrics.emv.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary flex">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: `${metrics.emv.total > 0 ? (metrics.emv.rcct / metrics.emv.total) * 100 : 93}%`,
                    }}
                    title={`RCCT: ${metrics.emv.rcct.toLocaleString()}`}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${metrics.emv.total > 0 ? (metrics.emv.mcct / metrics.emv.total) * 100 : 7}%`,
                    }}
                    title={`MCCT: ${metrics.emv.mcct.toLocaleString()}`}
                  />
                </div>
              </div>

              {/* Grantee Status Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Grantee Client Status</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Active: {metrics.grantee.active.toLocaleString()} ({metrics.grantee.activePercentage}%)
                    </span>
                    <span className="text-sky-600 dark:text-sky-400">
                      Graduated: {metrics.grantee.graduated.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      Other: {metrics.grantee.other.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${metrics.grantee.total > 0 ? (metrics.grantee.active / metrics.grantee.total) * 100 : 43}%`,
                    }}
                    title={`Active: ${metrics.grantee.active.toLocaleString()}`}
                  />
                  <div
                    className="h-full bg-sky-500 transition-all duration-500"
                    style={{
                      width: `${metrics.grantee.total > 0 ? (metrics.grantee.graduated / metrics.grantee.total) * 100 : 23}%`,
                    }}
                    title={`Graduated: ${metrics.grantee.graduated.toLocaleString()}`}
                  />
                  <div
                    className="h-full bg-slate-400/70 transition-all duration-500"
                    style={{
                      width: `${metrics.grantee.total > 0 ? (metrics.grantee.other / metrics.grantee.total) * 100 : 34}%`,
                    }}
                    title={`Other: ${metrics.grantee.other.toLocaleString()}`}
                  />
                </div>
              </div>

              {/* Financial Summary Box */}
              <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-violet-500" />
                    Payroll Financial Summary
                  </span>
                  <span className="rounded bg-violet-500/10 px-2 py-0.5 text-violet-700 dark:text-violet-300 font-bold">
                    {metrics.payroll.period}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-card p-3 border border-border/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gross Amount</span>
                    <div className="mt-1 text-sm font-black text-foreground truncate">
                      {formatAmount(metrics.payroll.gross)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-card p-3 border border-border/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Disbursed</span>
                    <div className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">
                      {formatAmount(metrics.payroll.net)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-card p-3 border border-border/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Withholdings</span>
                    <div className="mt-1 text-sm font-black text-amber-600 dark:text-amber-400 truncate">
                      {formatAmount(metrics.payroll.withholdings)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top Municipalities Geographic Coverage (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-border/80 bg-card p-5 shadow-xs dark:border-border dark:bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Top Municipalities
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ranked by EMV beneficiary volume</p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                Region XIII
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {metrics.topMunicipalities.slice(0, 8).map((item, idx) => {
                const pct = Math.round((item.count / maxMunicipalityCount) * 100);

                return (
                  <button
                    key={item.municipality}
                    className="group block w-full rounded-lg p-2 text-left transition-colors hover:bg-secondary/60"
                    onClick={onOpenEmvDatabase}
                    type="button"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[170px] sm:max-w-[220px]">
                          {item.municipality}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-muted-foreground group-hover:text-foreground shrink-0">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary/80 transition-all duration-500 group-hover:bg-primary"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-border/60 pt-3 text-right">
            <Button
              className="text-xs text-primary font-semibold gap-1 hover:underline"
              onClick={onOpenEmvDatabase}
              size="sm"
              variant="ghost"
            >
              Explore All Municipalities in Database
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Real EMV Database Sample Records Table */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs dark:border-border dark:bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              EMV Beneficiary Records
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live sample records from the 266,680 EMV inventory repository
            </p>
          </div>
          <Button
            className="gap-1.5 text-xs font-semibold shrink-0"
            onClick={onOpenEmvDatabase}
            size="sm"
            variant="outline"
          >
            Open Full Database ({metrics.emv.total.toLocaleString()} rows)
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto custom-scrollbar-table">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                <th className="py-2.5 px-3 font-semibold">Beneficiary Name</th>
                <th className="py-2.5 px-3 font-semibold">Household ID (HH_ID)</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">LBP Account</th>
                <th className="py-2.5 px-3 font-semibold">CCT Type</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {emvRecords.slice(0, 6).map((rec) => {
                const isClaimed = rec.distribution_status?.toLowerCase().includes('claimed') && !rec.distribution_status?.toLowerCase().includes('unclaimed');
                const fullName = `${rec.first_name || ''} ${rec.mid_name || ''} ${rec.last_name || ''}`.trim() || 'N/A';

                return (
                  <tr key={rec.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-foreground whitespace-nowrap">
                      {fullName}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-primary whitespace-nowrap">
                      {rec.hh_id || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                      {rec.municipality || 'N/A'} • <span className="text-foreground/80">{rec.barangay || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground whitespace-nowrap">
                      {rec.lbp_account || 'N/A'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        {rec.cct_type || 'RCCT'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                          isClaimed
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', isClaimed ? 'bg-emerald-500' : 'bg-amber-500')} />
                        {rec.distribution_status || (isClaimed ? 'Claimed' : 'Unclaimed')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary"
                        onClick={() => onOpenInquiry?.(rec.hh_id)}
                      >
                        Inquire
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!emvRecords.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    No EMV database records loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Access: Service Request Modules Grid */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs dark:border-border dark:bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Data & Service Request Modules
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct access navigation to the 8 standard grievance and operational modules
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{dataModules.length} Modules Active</span>
        </div>

        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          {dataModules.map((mod) => {
            const count = metrics.moduleCounts?.[mod.id] ?? 0;
            const IconComponent = mod.icon;

            return (
              <button
                key={mod.id}
                onClick={() => onOpenDataModule?.(mod.id)}
                type="button"
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-secondary/30 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary/60 hover:shadow-xs dark:bg-secondary/20"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={cn('rounded-lg p-2 border transition-colors', mod.color)}>
                      <IconComponent className="h-4 w-4" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      {count > 0 ? (
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-cyan-300">
                          {count} {count === 1 ? 'record' : 'records'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 font-medium">0 records</span>
                      )}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {mod.name}
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                  {mod.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Service Requests & Endorsements Activity Feed */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs dark:border-border dark:bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              Recent Service Requests & Endorsements
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live operational requests logged through Household Inquiry & Grievance modules ({metrics.requests.total} total recorded)
            </p>
          </div>
          <Button
            className="gap-1.5 text-xs font-semibold shrink-0"
            onClick={() => onOpenInquiry?.()}
            size="sm"
            variant="outline"
          >
            Manage in Inquiry
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto custom-scrollbar-table">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                <th className="py-2.5 px-3 font-semibold">Beneficiary Name</th>
                <th className="py-2.5 px-3 font-semibold">Household ID</th>
                <th className="py-2.5 px-3 font-semibold">Request Type</th>
                <th className="py-2.5 px-3 font-semibold">Requested By</th>
                <th className="py-2.5 px-3 font-semibold">Date Logged</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {metrics.recentRequests && metrics.recentRequests.length > 0 ? (
                metrics.recentRequests.slice(0, 8).map((req) => (
                  <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-foreground whitespace-nowrap">
                      {req.beneficiary_name || 'N/A'}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-primary whitespace-nowrap">
                      {req.hh_id}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        {req.request_label || req.request_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                      {req.created_by || 'System Officer'}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {req.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary"
                        onClick={() => onOpenInquiry?.(req.hh_id)}
                      >
                        Inquire
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                    No recent service requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
