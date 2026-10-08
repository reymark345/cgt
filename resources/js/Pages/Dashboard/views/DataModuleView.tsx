import {
  Archive,
  ArrowRightLeft,
  ArrowUpDown,
  Banknote,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  GitCompare,
  GitFork,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  Truck,
  Unlock,
  Upload,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { CurrentView } from '../types';

type OpeningRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name_of_new_grantee: string | null;
  name_of_old_grantee: string | null;
  card_number_of_old: string | null;
  status_of_old_grantee: string | null;
  status: string | null;
  remarks: string | null;
  created_at: string | null;
};

type DataModuleConfig = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge: string;
  accentColor: string;
  columns: string[];
};

const moduleConfigs: Record<string, DataModuleConfig> = {
  opening: {
    title: 'Opening',
    subtitle: 'Manage and monitor account opening records, depository batch files, and bank endorsement status.',
    icon: FolderOpen,
    badge: 'Account Services',
    accentColor: 'text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Name of New Grantee',
      'Name of Old Grantee',
      'Card Number of Old',
      'Status of Old Grantee',
    ],
  },
  distribution: {
    title: 'Distribution',
    subtitle: 'Oversee payout distribution batch series, logistics schedules, releasing events, and field issuance logs.',
    icon: Truck,
    badge: 'Logistics',
    accentColor: 'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/20',
    columns: ['Distribution Batch', 'Cluster / Area', 'Target Beneficiaries', 'Scheduled Date', 'Focal Person', 'Cards Released', 'Progress'],
  },
  'otc-withdrawal': {
    title: 'OTC Withdrawal',
    subtitle: 'Manage and track Over-The-Counter payout schedules, offsite authorization batches, and acknowledgment receipts.',
    icon: Banknote,
    badge: 'Disbursement',
    accentColor: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    columns: ['Payout Batch', 'Municipality', 'Household ID', 'Grantee Name', 'Disbursement Amount', 'Servicing Branch', 'Payout Status'],
  },
  replacement: {
    title: 'Replacement',
    subtitle: 'Track and manage card replacement batch series, re-issuance records, and cardholder exchange logs.',
    icon: RefreshCw,
    badge: 'Card Management',
    accentColor: 'text-purple-600 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-500/20',
    columns: ['Series No.', 'Household ID', 'Grantee Name', 'Old Account', 'New Account', 'Reason for Replacement', 'Series Status'],
  },
  'transfer-of-fund': {
    title: 'Transfer of Fund',
    subtitle: 'Track fund transfer batches, depository crediting orders, transmittal numbers, and settlement reconciliation.',
    icon: ArrowRightLeft,
    badge: 'Fund Transfers',
    accentColor: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20',
    columns: ['TOF Batch No.', 'Funding Source', 'Total Accounts', 'Total Amount', 'Endorsement Date', 'Settlement Reference', 'TOF Status'],
  },
  'force-pin': {
    title: 'Force PIN',
    subtitle: 'Process and monitor EMV card PIN resets, forced authorization requests, and branch security validations.',
    icon: KeyRound,
    badge: 'Security & PIN',
    accentColor: 'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
    columns: ['Request ID', 'Household ID', 'Cardholder Name', 'Account Number', 'Branch Assigned', 'Date Requested', 'PIN Status'],
  },
  locking: {
    title: 'Locking',
    subtitle: 'Manage card locking requests, restriction flags, lost/stolen reports, and frozen transaction batches.',
    icon: Lock,
    badge: 'Security',
    accentColor: 'text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/20',
    columns: ['Reference No.', 'Household ID', 'Cardholder Name', 'Account Number', 'Lock Reason', 'Date Locked', 'Lock Status'],
  },
  lifting: {
    title: 'Lifting',
    subtitle: 'Process card restriction liftings, unfreeze requests, compliance validations, and clearance tracking.',
    icon: Unlock,
    badge: 'Resolution',
    accentColor: 'text-teal-600 bg-teal-500/10 dark:text-teal-400 dark:bg-teal-500/20',
    columns: ['Clearance No.', 'Household ID', 'Grantee Name', 'Account Number', 'Lift Reason', 'Authorized By', 'Lifting Status'],
  },
  matching: {
    title: 'Matching',
    subtitle: 'Cross-match cash cards, grantee household identification, and Land Bank depository database records.',
    icon: GitCompare,
    badge: 'Validation',
    accentColor: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    columns: ['Match ID', 'Household ID', 'Masterlist Name', 'Bank Name Match', 'LBP Account', 'Confidence', 'Match Status'],
  },
  lock: {
    title: 'Lock',
    subtitle: 'Manage card locking requests, restriction flags, lost/stolen reports, and frozen transaction batches.',
    icon: Lock,
    badge: 'Security',
    accentColor: 'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
    columns: ['Reference No.', 'Household ID', 'Cardholder Name', 'Account Number', 'Lock Reason', 'Date Locked', 'Lock Status'],
  },
  'replacement-series': {
    title: 'Replacement Series',
    subtitle: 'Track and manage card replacement batch series, re-issuance records, and cardholder exchange logs.',
    icon: RefreshCw,
    badge: 'Card Management',
    accentColor: 'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/20',
    columns: ['Series No.', 'Household ID', 'Grantee Name', 'Old Account', 'New Account', 'Reason for Replacement', 'Series Status'],
  },
  otc: {
    title: 'OTC (Over-The-Counter)',
    subtitle: 'Manage and track Over-The-Counter payout schedules, offsite authorization batches, and acknowledgment receipts.',
    icon: Banknote,
    badge: 'Disbursement',
    accentColor: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    columns: ['Payout Batch', 'Municipality', 'Household ID', 'Grantee Name', 'Disbursement Amount', 'Servicing Branch', 'Payout Status'],
  },
  tof: {
    title: 'TOF (Transfer of Funds)',
    subtitle: 'Track fund transfer batches, depository crediting orders, transmittal numbers, and settlement reconciliation.',
    icon: FileText,
    badge: 'Fund Transfers',
    accentColor: 'text-purple-600 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-500/20',
    columns: ['TOF Batch No.', 'Funding Source', 'Total Accounts', 'Total Amount', 'Endorsement Date', 'Settlement Reference', 'TOF Status'],
  },
  'tof-branch': {
    title: 'TOF Branch',
    subtitle: 'Manage servicing branch assignments, fund distribution routing, and branch confirmation receipts.',
    icon: GitFork,
    badge: 'Branch Logistics',
    accentColor: 'text-teal-600 bg-teal-500/10 dark:text-teal-400 dark:bg-teal-500/20',
    columns: ['Routing ID', 'Branch Name', 'Branch Code', 'Assigned Households', 'Total Allocation', 'Transmittal Date', 'Branch Status'],
  },
  'perforation-series': {
    title: 'Perforation Series',
    subtitle: 'Maintain records of decommissioned and perforated cards, destruction series logs, and audit trail proofs.',
    icon: Scissors,
    badge: 'Decommissioning',
    accentColor: 'text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/20',
    columns: ['Perforation No.', 'Card Serial No.', 'Account Number', 'Grantee Name', 'Perforated Date', 'Disposal Officer', 'Disposal Status'],
  },
  closure: {
    title: 'Closure',
    subtitle: 'Process account closures, settlement terminations, inactive card retirement, and archived registries.',
    icon: Archive,
    badge: 'Account Lifecycle',
    accentColor: 'text-slate-600 bg-slate-500/10 dark:text-slate-400 dark:bg-slate-500/20',
    columns: ['Closure Case ID', 'Household ID', 'Grantee Name', 'Account Number', 'Terminal Balance', 'Closure Reason', 'Closure Status'],
  },
  deactivation: {
    title: 'Deactivation',
    subtitle: 'Manage card deactivations, beneficiary status invalidation reports, and inactive account registries.',
    icon: UserX,
    badge: 'Status Control',
    accentColor: 'text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20',
    columns: ['Deactivation ID', 'Household ID', 'Grantee Name', 'Account Number', 'Deactivation Date', 'Authority Order', 'Deactivation Status'],
  },
  'distribution-series': {
    title: 'Distribution Series',
    subtitle: 'Oversee payout distribution batch series, logistics schedules, releasing events, and field issuance logs.',
    icon: Truck,
    badge: 'Logistics',
    accentColor: 'text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
    columns: ['Distribution Batch', 'Cluster / Area', 'Target Beneficiaries', 'Scheduled Date', 'Focal Person', 'Cards Released', 'Progress'],
  },
};

type DataModuleViewProps = {
  view: CurrentView;
};

export function DataModuleView({ view }: DataModuleViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openingRecords, setOpeningRecords] = useState<OpeningRecord[]>([]);
  const [openingTotal, setOpeningTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const config = moduleConfigs[view] || {
    title: 'Data Module',
    subtitle: 'Manage and monitor data batches and transactions.',
    icon: FolderOpen,
    badge: 'Data Management',
    accentColor: 'text-primary bg-primary/10 dark:text-accent-foreground dark:bg-primary/20',
    columns: ['ID', 'Reference', 'Household ID', 'Name', 'Date', 'Status'],
  };

  const Icon = config.icon;

  const fetchOpeningData = useCallback(async (page = 1, query = '') => {
    if (view !== 'opening') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/opening/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOpeningRecords(json.data || []);
          setOpeningTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load opening records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (view !== 'opening') return;
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, view]);

  useEffect(() => {
    if (view === 'opening') {
      fetchOpeningData(currentPage, debouncedSearch);
    }
  }, [view, currentPage, debouncedSearch, fetchOpeningData]);

  return (
    <section className="mx-auto w-full max-w-[1800px] space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs dark:border-border dark:bg-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.accentColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {config.badge}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-muted-foreground">Data Operations</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{config.title}</h1>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground leading-relaxed sm:text-sm">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            {view === 'opening' ? (
              <a
                href="/opening/export"
                download
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-secondary dark:border-border"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Data</span>
              </a>
            ) : (
              <>
                <button
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-secondary dark:border-border"
                  type="button"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Template</span>
                </button>
                <button
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                  type="button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import Data</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Records</div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {view === 'opening' ? openingTotal.toLocaleString() : '0'}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Current system entries</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Batches</div>
            <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {view === 'opening'
                ? openingRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed').length
                : '0'}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Processed & validated</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Action</div>
            <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
              {view === 'opening'
                ? openingRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending').length
                : '0'}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Awaiting review or dispatch</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Last Sync</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Up to date</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Caraga Regional Database</div>
          </div>
        </div>
      </div>

      {/* Main Table / Data Section */}
      <div className="rounded-xl border border-border bg-card shadow-xs dark:border-border dark:bg-card">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-input dark:bg-background"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${config.title} records...`}
              type="text"
              value={searchTerm}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground dark:border-border"
              type="button"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground dark:border-border"
              type="button"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort</span>
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground dark:border-border"
              onClick={() => {
                if (view === 'opening') {
                  fetchOpeningData(currentPage, debouncedSearch);
                }
              }}
              type="button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table Data Preview */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-border bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:bg-secondary/30">
              <tr>
                {config.columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view === 'opening' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={config.columns.length}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Opening records...</span>
                      </div>
                    </td>
                  </tr>
                ) : openingRecords.length > 0 ? (
                  openingRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="border-b border-border/50 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {item.item_no || idx + 1}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                        {item.address || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">
                        {item.household_id_number || '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.name_of_new_grantee || (
                          <span className="text-muted-foreground italic">None / Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.name_of_old_grantee || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {item.card_number_of_old || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            item.status_of_old_grantee?.toLowerCase().includes('active')
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {item.status_of_old_grantee || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={config.columns.length}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No account opening records found matching "${debouncedSearch}".`
                            : 'There are no account opening records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td className="px-4 py-16 text-center" colSpan={config.columns.length}>
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-foreground">
                        No {config.title} records found
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        There are no data records logged for {config.title} yet. Click Import Data above or upload an approved CSV/Excel batch file to populate this module.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Placeholder */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {view === 'opening' ? (
            <>
              <span>
                Showing {openingTotal === 0 ? 0 : (currentPage - 1) * 15 + 1} to{' '}
                {Math.min(currentPage * 15, openingTotal)} of {openingTotal} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  Previous
                </button>
                <span className="px-2 text-xs font-medium text-foreground">
                  Page {currentPage} of {Math.max(1, lastPage)}
                </span>
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={currentPage >= lastPage || loading}
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <span>Showing 0 of 0 entries</span>
              <div className="flex items-center gap-1">
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:opacity-50"
                  disabled
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:opacity-50"
                  disabled
                  type="button"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

