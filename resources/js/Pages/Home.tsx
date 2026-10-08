import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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

const pageTitles: Record<CurrentView, string> = {
  aging: 'Aging',
  dashboard: 'Dashboard',
  'emv-database': 'EMV Database',
  'emv-payroll': 'Payroll',
  grantee: 'Grantee',
  overpayment: 'Overpayment',
  users: 'Users',
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

type HomeProps = {
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
  users?: UserListItem[];
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
  users = [],
}: HomeProps) {
  const { props } = usePage<SharedPageProps>();
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inquirySearchHhId, setInquirySearchHhId] = useState<string>('');

  const availableOffices = useMemo(() => {
    const list = Array.from(new Set(records.map((record) => record.office).filter(Boolean)));
    return list.length ? list : officeTabs;
  }, [records]);

  const [activeOffice, setActiveOffice] = useState<string>(() => {
    return initialRecords[0]?.office || officeTabs[0];
  });
  const [activeStatus, setActiveStatus] = useState('All');
  const [notice, setNotice] = useState('Ready');
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard');
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
        emvCount={emvTotalCount}
        granteeCount={granteeTotalCount}
        payrollCount={payrollTotalCount}
        incomingCount={records.length}
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
            dashboardMetrics={dashboardMetrics}
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
            granteeTotalCount={granteeTotalCount}
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
            emvTotalCount={emvTotalCount}
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
            payrollTotalCount={payrollTotalCount}
            payrollYears={payrollYears}
          />
        </div>

        <div className={currentView === 'manual' ? 'block' : 'hidden'}>
          <UserManualView notice={notice} onOpenIncoming={openEmvDatabase} />
        </div>

        <div className={currentView === 'users' ? 'block' : 'hidden'}>
          <UsersView users={users} />
        </div>

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



