import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartNoAxesCombined, CheckCircle2, CircleHelp, FileText, PackageCheck, UserCog, X, XCircle } from 'lucide-react';

import { AppShell } from './Dashboard/components/AppShell';
import { initialRecords, officeTabs, statusTabs } from './Dashboard/data';
import type { CurrentView, DashboardMetrics, EmvDatabaseRecord, GranteeRecord, PayrollRecord, RecordItem } from './Dashboard/types';
import { formatAmount } from './Dashboard/utils';
import { DashboardView } from './Dashboard/views/DashboardView';
import { UserManualView } from './Dashboard/views/UserManualView';
import { UsersView, type UserListItem } from './Dashboard/views/UsersView';
import { EmvDatabaseView } from './References/EmvDatabaseView';
import { EmvPayrollView } from './References/EmvPayrollView';
import { GranteeView } from './References/GranteeView';
import { InquiryView } from './References/InquiryView';
import { DataModuleView } from './Dashboard/views/DataModuleView';
import { AuditTrailView } from './Dashboard/views/AuditTrailView';

const pageTitles: Record<CurrentView, string> = {
  aging: 'Aging',
  dashboard: 'Dashboard',
  'emv-database': 'EMV Database',
  'emv-payroll': 'Payroll',
  grantee: 'Grantee',
  overpayment: 'Overpayment',
  users: 'Users',
  'audit-trail': 'Audit Trails',
  manual: 'User Manual',
  Inquiry: 'Inquiry',
  inquiry: 'Inquiry',
  open: 'Data',
  data: 'Data',
  opening: 'Opening',
  distribution: 'Distribution',
  'otc-withdrawal': 'OTC Withdrawal',
  replacement: 'Replacement',
  'transfer-of-fund': 'Transfer of Fund',
  'force-pin': 'Force PIN',
  locking: 'Locking',
  lifting: 'Lifting',
};

const headTitles: Record<CurrentView, string> = {
  aging: 'Aging',
  dashboard: 'Dashboard',
  'emv-database': 'EMV Database',
  'emv-payroll': 'Payroll',
  grantee: 'Grantee',
  overpayment: 'Overpayment',
  users: 'Users',
  'audit-trail': 'Audit Trails',
  manual: 'User Manual',
  Inquiry: 'Inquiry',
  inquiry: 'Inquiry',
  open: 'Data',
  data: 'Data',
  opening: 'Opening',
  distribution: 'Distribution',
  'otc-withdrawal': 'OTC Withdrawal',
  replacement: 'Replacement',
  'transfer-of-fund': 'Transfer of Fund',
  'force-pin': 'Force PIN',
  locking: 'Locking',
  lifting: 'Lifting',
};

const VIEW_TO_PATH: Record<CurrentView, string> = {
  aging: '/aging',
  dashboard: '/dashboard',
  'emv-database': '/emv-database',
  'emv-payroll': '/payroll',
  grantee: '/grantee-list',
  overpayment: '/overpayment',
  users: '/users',
  'audit-trail': '/audit-trails',
  manual: '/user-manual',
  Inquiry: '/inquiry',
  inquiry: '/inquiry',
  open: '/data',
  data: '/data',
  opening: '/opening',
  distribution: '/distribution',
  'otc-withdrawal': '/otc-withdrawal',
  replacement: '/replacement',
  'transfer-of-fund': '/transfer-of-fund',
  'force-pin': '/force-pin',
  locking: '/locking',
  lifting: '/lifting',
};

const PATH_TO_VIEW: Record<string, CurrentView> = {
  '/dashboard': 'dashboard',
  '/inquiry': 'inquiry',
  '/grantee-list': 'grantee',
  '/grantee': 'grantee',
  '/emv-database': 'emv-database',
  '/payroll': 'emv-payroll',
  '/emv-payroll': 'emv-payroll',
  '/opening': 'opening',
  '/distribution': 'distribution',
  '/otc-withdrawal': 'otc-withdrawal',
  '/replacement': 'replacement',
  '/transfer-of-fund': 'transfer-of-fund',
  '/force-pin': 'force-pin',
  '/locking': 'locking',
  '/lifting': 'lifting',
  '/users': 'users',
  '/audit-trails': 'audit-trail',
  '/audit-trail': 'audit-trail',
  '/user-manual': 'manual',
  '/manual': 'manual',
  '/aging': 'aging',
  '/overpayment': 'overpayment',
  '/data': 'data',
};

function resolveViewFromPath(pathname: string, fallback: CurrentView = 'dashboard'): CurrentView {
  const clean = ('/' + pathname.replace(/^\/+|\/+$/g, '')).toLowerCase();
  return PATH_TO_VIEW[clean] ?? fallback;
}

type HomeProps = {
  initialView?: CurrentView;
  dashboardMetrics?: DashboardMetrics;
  emvRecords?: EmvDatabaseRecord[];
  emvTotalCount?: number;
  emvClaimedCount?: number;
  emvMunicipalities?: string[];
  emvCctTypes?: string[];
  emvBranches?: string[];
  grantees?: GranteeRecord[];
  granteeTotalCount?: number;
  granteeActiveCount?: number;
  granteeMunicipalities?: string[];
  granteeHhSets?: string[];
  granteePaymentModesCount?: number;
  payrollRecords?: PayrollRecord[];
  payrollTotalCount?: number;
  payrollGrossTotal?: number;
  payrollNetTotal?: number;
  payrollMunicipalities?: string[];
  payrollPeriods?: string[];
  payrollYears?: string[];
  payrollHhSets?: string[];
  moduleCounts?: Record<string, number>;
  users?: UserListItem[];
  auditTrailCount?: number;
};

type SharedPageProps = {
  flash?: {
    message?: string | null;
    error?: string | null;
  };
};

type Toast = {
  message: string;
  type: 'success' | 'error';
};

export default function Home({
  initialView = 'dashboard',
  dashboardMetrics,
  emvRecords = [],
  emvTotalCount = 0,
  emvClaimedCount = 0,
  emvMunicipalities = [],
  emvCctTypes = [],
  emvBranches = [],
  grantees = [],
  granteeTotalCount = 0,
  granteeActiveCount = 0,
  granteeMunicipalities = [],
  granteeHhSets = [],
  granteePaymentModesCount = 0,
  payrollRecords = [],
  payrollTotalCount = 0,
  payrollGrossTotal = 0,
  payrollNetTotal = 0,
  payrollMunicipalities = [],
  payrollPeriods = [],
  payrollYears = [],
  payrollHhSets = [],
  moduleCounts,
  users = [],
  auditTrailCount = 0,
}: HomeProps) {
  const { props } = usePage<SharedPageProps>();
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inquirySearchHhId, setInquirySearchHhId] = useState<string>('');

  const [liveModuleCounts, setLiveModuleCounts] = useState<Record<string, number>>(() => {
    return moduleCounts || dashboardMetrics?.moduleCounts || {};
  });

  const [liveEmvCount, setLiveEmvCount] = useState<number>(emvTotalCount ?? 0);
  const [liveGranteeCount, setLiveGranteeCount] = useState<number>(granteeTotalCount ?? 0);
  const [livePayrollCount, setLivePayrollCount] = useState<number>(payrollTotalCount ?? 0);
  const [liveAuditTrailCount, setLiveAuditTrailCount] = useState<number>(auditTrailCount ?? 0);

  useEffect(() => {
    if (typeof emvTotalCount === 'number') {
      setLiveEmvCount(emvTotalCount);
    }
  }, [emvTotalCount]);

  useEffect(() => {
    if (typeof granteeTotalCount === 'number') {
      setLiveGranteeCount(granteeTotalCount);
    }
  }, [granteeTotalCount]);

  useEffect(() => {
    if (typeof payrollTotalCount === 'number') {
      setLivePayrollCount(payrollTotalCount);
    }
  }, [payrollTotalCount]);

  useEffect(() => {
    if (typeof auditTrailCount === 'number') {
      setLiveAuditTrailCount(auditTrailCount);
    }
  }, [auditTrailCount]);

  useEffect(() => {
    if (moduleCounts) {
      setLiveModuleCounts(moduleCounts);
    } else if (dashboardMetrics?.moduleCounts) {
      setLiveModuleCounts(dashboardMetrics.moduleCounts);
    }
  }, [moduleCounts, dashboardMetrics?.moduleCounts]);

  const refreshModuleCounts = useCallback(async () => {
    try {
      const res = await fetch('/module-counts', {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.counts) {
            setLiveModuleCounts(data.counts);
          }
          if (data.references) {
            if (typeof data.references.emv === 'number') {
              setLiveEmvCount(data.references.emv);
            }
            if (typeof data.references.grantee === 'number') {
              setLiveGranteeCount(data.references.grantee);
            }
            if (typeof data.references.payroll === 'number') {
              setLivePayrollCount(data.references.payroll);
            }
            if (typeof data.references.audit_trail === 'number') {
              setLiveAuditTrailCount(data.references.audit_trail);
            }
          }
        }
      }
    } catch {
      // Background count fetch - ignore network error
    }
  }, []);

  useEffect(() => {
    const handleModuleCountsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ counts?: Record<string, number> }>;
      if (customEvent.detail?.counts) {
        setLiveModuleCounts(customEvent.detail.counts);
      } else {
        refreshModuleCounts();
      }
    };

    const handleReferenceCountsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{
        emv?: number;
        grantee?: number;
        payroll?: number;
      }>;
      if (customEvent.detail) {
        if (typeof customEvent.detail.emv === 'number') {
          setLiveEmvCount(customEvent.detail.emv);
        }
        if (typeof customEvent.detail.grantee === 'number') {
          setLiveGranteeCount(customEvent.detail.grantee);
        }
        if (typeof customEvent.detail.payroll === 'number') {
          setLivePayrollCount(customEvent.detail.payroll);
        }
      }
      refreshModuleCounts();
    };

    const handleRefresh = () => {
      refreshModuleCounts();
    };

    window.addEventListener('cgt:module-counts-updated', handleModuleCountsUpdated);
    window.addEventListener('cgt:reference-counts-updated', handleReferenceCountsUpdated);
    window.addEventListener('cgt:refresh-module-counts', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    const interval = window.setInterval(refreshModuleCounts, 20000);

    return () => {
      window.removeEventListener('cgt:module-counts-updated', handleModuleCountsUpdated);
      window.removeEventListener('cgt:reference-counts-updated', handleReferenceCountsUpdated);
      window.removeEventListener('cgt:refresh-module-counts', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.clearInterval(interval);
    };
  }, [refreshModuleCounts]);

  const availableOffices = useMemo(() => {
    const list = Array.from(new Set(records.map((record) => record.office).filter(Boolean)));
    return list.length ? list : officeTabs;
  }, [records]);

  const [activeOffice, setActiveOffice] = useState<string>(() => {
    return initialRecords[0]?.office || officeTabs[0];
  });
  const [activeStatus, setActiveStatus] = useState('All');
  const [notice, setNotice] = useState('Ready');
  const [currentView, setCurrentView] = useState<CurrentView>(() => {
    if (typeof window !== 'undefined') {
      return resolveViewFromPath(window.location.pathname, initialView);
    }
    return initialView;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const canonicalPath = VIEW_TO_PATH[currentView] ?? '/dashboard';
    if (window.location.pathname.toLowerCase() !== canonicalPath.toLowerCase()) {
      window.history.replaceState({ view: currentView }, '', canonicalPath);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setCurrentView(event.state.view as CurrentView);
      } else {
        setCurrentView(resolveViewFromPath(window.location.pathname, 'dashboard'));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  const [importingGrantee, setImportingGrantee] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);


  useEffect(() => {
    if (props.flash?.message) {
      setNotice(props.flash.message);
      setToast({ message: props.flash.message, type: 'success' });
    } else if (props.flash?.error) {
      setNotice(props.flash.error);
      setToast({ message: props.flash.error, type: 'error' });
    }
  }, [props.flash?.message, props.flash?.error]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 4500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const officeCounts = useMemo(
    () => Object.fromEntries(availableOffices.map((office) => [office, records.filter((record) => record.office === office).length])),
    [availableOffices, records],
  );

  const statusCounts = useMemo(
    () => Object.fromEntries(statusTabs.map((status) => [
      status,
      status === 'All' ? records.length : records.filter((record) => record.status === status).length,
    ])),
    [records],
  );

  const totalAmount = useMemo(
    () => records.reduce((total, record) => total + record.amount, 0),
    [records],
  );

  const dashboardStats = [
    { label: 'Total Incoming', value: records.length.toString(), detail: 'All receiving records', icon: PackageCheck },
    { label: 'Verified', value: String(statusCounts.Verified ?? 0), detail: 'Completed validation', icon: FileText },
    { label: 'Pending Review', value: String((statusCounts.Pending ?? 0) + (statusCounts['For Review'] ?? 0)), detail: 'Needs attention', icon: CircleHelp },
    { label: 'Total Amount', value: formatAmount(totalAmount), detail: 'Recorded value', icon: ChartNoAxesCombined },
  ];

  function openView(view: CurrentView) {
    setCurrentView(view);
    setSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const targetPath = VIEW_TO_PATH[view] ?? `/${String(view).toLowerCase()}`;
      if (window.location.pathname.toLowerCase() !== targetPath.toLowerCase()) {
        window.history.pushState({ view }, '', targetPath);
      }
    }
    refreshModuleCounts();
    const notices: Record<CurrentView, string> = {
      aging: 'Aging opened',
      dashboard: 'Dashboard opened',
      'emv-database': 'EMV Database opened',
      'emv-payroll': 'EMV Payroll opened',
      grantee: 'Grantee opened',
      overpayment: 'Overpayment opened',
      users: 'Users opened',
      manual: 'User manual opened',
      Inquiry: 'Inquiry opened',
      inquiry: 'Inquiry opened',
      open: 'Data opened',
      data: 'Data opened',
      opening: 'Opening opened',
      distribution: 'Distribution opened',
      'otc-withdrawal': 'OTC Withdrawal opened',
      replacement: 'Replacement opened',
      'transfer-of-fund': 'Transfer of Fund opened',
      'force-pin': 'Force PIN opened',
      locking: 'Locking opened',
      lifting: 'Lifting opened',
    };
    setNotice(notices[view] ?? `${view} opened`);
  }

  function importGranteeExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    router.post('/grantees/import', formData, {
      forceFormData: true,
      preserveScroll: true,
      onStart: () => {
        setImportingGrantee(true);
        setNotice(`Importing grantees from ${file.name}`);
      },
      onError: (errors) => {
        const message = Object.values(errors)[0] ?? 'Grantee import failed. Please check the file headers and format.';
        setNotice(message);
        setToast({ message, type: 'error' });
      },
      onFinish: () => setImportingGrantee(false),
    });
  }

  const openEmvDatabase = () => openView('emv-database');

  return (
    <>
      <Head title={headTitles[currentView]} />

      <AppShell
        currentView={currentView}
        darkMode={darkMode}
        emvCount={liveEmvCount}
        granteeCount={liveGranteeCount}
        payrollCount={livePayrollCount}
        incomingCount={records.length}
        moduleCounts={liveModuleCounts}
        usersCount={users.length}
        auditTrailCount={liveAuditTrailCount}
        sidebarOpen={sidebarOpen}
        title={pageTitles[currentView]}
        onOpenView={openView}
        onSetNotice={setNotice}
        onSetSidebarOpen={setSidebarOpen}
        onToggleDarkMode={() => {
          setDarkMode((current) => !current);
          setNotice(darkMode ? 'Light mode enabled' : 'Dark mode enabled');
        }}
      >
        <div className={currentView === 'dashboard' ? 'block' : 'hidden'}>
          <DashboardView
            dashboardMetrics={
              dashboardMetrics
                ? {
                    ...dashboardMetrics,
                    moduleCounts: liveModuleCounts,
                    payroll: {
                      ...dashboardMetrics.payroll,
                      total: livePayrollCount,
                      gross: livePayrollCount === 0 ? 0 : dashboardMetrics.payroll.gross,
                      net: livePayrollCount === 0 ? 0 : dashboardMetrics.payroll.net,
                      withholdings: livePayrollCount === 0 ? 0 : dashboardMetrics.payroll.withholdings,
                    },
                    grantee: {
                      ...dashboardMetrics.grantee,
                      total: liveGranteeCount,
                    },
                    emv: {
                      ...dashboardMetrics.emv,
                      total: liveEmvCount,
                    },
                    requests: {
                      ...dashboardMetrics.requests,
                      total: Object.values(liveModuleCounts).reduce((acc, curr) => acc + (curr || 0), 0),
                      pending: Object.values(liveModuleCounts).reduce((acc, curr) => acc + (curr || 0), 0),
                    },
                  }
                : undefined
            }
            emvRecords={emvRecords}
            dashboardStats={dashboardStats}
            notice={notice}
            officeCounts={officeCounts}
            records={records}
            statusCounts={statusCounts}
            onOpenEmvDatabase={openEmvDatabase}
            onOpenGrantee={() => openView('grantee')}
            onOpenPayroll={() => openView('emv-payroll')}
            onOpenInquiry={(hhId?: string) => {
              if (hhId) {
                setInquirySearchHhId(hhId);
              }
              openView('inquiry');
            }}
            onOpenDataModule={(mod: string) => {
              openView(mod as CurrentView);
            }}
            onOfficeSelect={(office) => {
              setActiveOffice(office);
              openEmvDatabase();
            }}
            onRecentSelect={(reference) => {
              const target = records.find((r) => r.reference === reference);
              if (target) {
                setActiveOffice(target.office);
                setActiveStatus('All');
              }
              openEmvDatabase();
            }}
            onStatusSelect={(status) => {
              setActiveStatus(status);
              openEmvDatabase();
            }}
          />
        </div>

        <div className={currentView === 'grantee' ? 'block' : 'hidden'}>
          <GranteeView
            granteeActiveCount={granteeActiveCount}
            granteeHhSets={granteeHhSets}
            granteeMunicipalities={granteeMunicipalities}
            granteePaymentModesCount={granteePaymentModesCount}
            grantees={grantees}
            granteeTotalCount={liveGranteeCount}
            isImporting={importingGrantee}
            onImportExcel={importGranteeExcel}
            onSetNotice={setNotice}
          />
        </div>

        <div className={currentView === 'emv-database' ? 'block' : 'hidden'}>
          <EmvDatabaseView
            emvBranches={emvBranches}
            emvCctTypes={emvCctTypes}
            emvClaimedCount={emvClaimedCount}
            emvMunicipalities={emvMunicipalities}
            emvRecords={emvRecords}
            emvTotalCount={liveEmvCount}
            onSetNotice={setNotice}
          />
        </div>

        <div className={currentView === 'emv-payroll' ? 'block' : 'hidden'}>
          <EmvPayrollView
            onSetNotice={setNotice}
            payrollGrossTotal={payrollGrossTotal}
            payrollHhSets={payrollHhSets}
            payrollMunicipalities={payrollMunicipalities}
            payrollNetTotal={payrollNetTotal}
            payrollPeriods={payrollPeriods}
            payrollRecords={payrollRecords}
            payrollTotalCount={livePayrollCount}
            payrollYears={payrollYears}
          />
        </div>

        <div className={currentView === 'manual' ? 'block' : 'hidden'}>
          <UserManualView notice={notice} onOpenIncoming={openEmvDatabase} />
        </div>

        <div className={currentView === 'users' ? 'block' : 'hidden'}>
          <UsersView users={users} />
        </div>

        {currentView === 'audit-trail' && (
          <AuditTrailView onCountChange={setLiveAuditTrailCount} />
        )}

        {(currentView === 'Inquiry' || currentView === 'inquiry') && (
          <InquiryView initialQuery={inquirySearchHhId} onSetNotice={setNotice} />
        )}

        {(currentView === 'open' || currentView === 'data') && (
          <section className="mx-auto w-full max-w-7xl space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs dark:border-border dark:bg-card">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-300">
                  <UserCog className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Data Management</h1>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Overview of data imports, exports, and master records repository.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {[
          'opening',
          'distribution',
          'otc-withdrawal',
          'replacement',
          'transfer-of-fund',
          'force-pin',
          'locking',
          'lifting',
        ].includes(currentView) && (
          <DataModuleView view={currentView} />
        )}
      </AppShell>

      {toast ? (
        <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
          <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4 text-card-foreground shadow-lg dark:border-border dark:bg-card">
            <div className={toast.type === 'success' ? 'text-emerald-600' : 'text-destructive'}>
              {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{toast.type === 'success' ? 'Import successful' : 'Import failed'}</div>
              <div className="mt-1 text-sm text-muted-foreground">{toast.message}</div>
            </div>
            <button
              className="rounded p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              onClick={() => setToast(null)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}



