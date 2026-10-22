import { router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileUp,
  Filter,
  GraduationCap,
  HeartPulse,
  Info,
  Layers,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  User,
  UsersRound,
  Wheat,
  X,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';
import type { PayrollRecord, PayrollSortKey } from '../Dashboard/types';

export const payrollColumns: { key: PayrollSortKey; label: string; group: string }[] = [
  { key: 'period', label: 'PERIOD', group: 'Cycle & Program' },
  { key: 'year', label: 'YEAR', group: 'Cycle & Program' },
  { key: 'payroll_description', label: 'PAYROLL DESCRIPTION', group: 'Cycle & Program' },
  { key: 'region', label: 'REGION', group: 'Location' },
  { key: 'province', label: 'PROVINCE', group: 'Location' },
  { key: 'municipality', label: 'MUNICIPALITY', group: 'Location' },
  { key: 'barangay', label: 'BARANGAY', group: 'Location' },
  { key: 'address_psgc', label: 'ADDRESS PSGC', group: 'Location' },
  { key: 'last_name', label: 'LAST NAME', group: 'Beneficiary' },
  { key: 'first_name', label: 'FIRST NAME', group: 'Beneficiary' },
  { key: 'middle_name', label: 'MIDDLE NAME', group: 'Beneficiary' },
  { key: 'household_id', label: 'HOUSEHOLD ID', group: 'Beneficiary' },
  { key: 'payment_mode_classification', label: 'PAYMENT MODE CLASSIFICATION', group: 'Banking' },
  { key: 'mode_of_payment', label: 'MODE OF PAYMENT', group: 'Banking' },
  { key: 'account_number', label: 'ACCOUNT NUMBER', group: 'Banking' },
  { key: 'new_account_number', label: 'NEW ACCOUNT NUMBER', group: 'Banking' },
  { key: 'status', label: 'STATUS', group: 'Audit & Status' },
  { key: 'reason', label: 'REASON', group: 'Audit & Status' },
  { key: 'payroll_date', label: 'PAYROLL DATE', group: 'Cycle & Program' },
  { key: 'finance_approval', label: 'FINANCE APPROVAL', group: 'Cycle & Program' },
  { key: 'educ_dc_elem', label: 'EDUC DC ELEM', group: 'Grants & Education' },
  { key: 'educ_jr_hs', label: 'EDUC JR HS', group: 'Grants & Education' },
  { key: 'educ_sr_hs', label: 'EDUC SR HS', group: 'Grants & Education' },
  { key: 'educ_total_hs', label: 'EDUC TOTAL HS', group: 'Grants & Education' },
  { key: 'total_educ', label: 'TOTAL EDUC', group: 'Grants & Education' },
  { key: 'health', label: 'HEALTH', group: 'Health & Subsidy' },
  { key: 'rice_amount', label: 'RICE AMOUNT', group: 'Health & Subsidy' },
  { key: 'f1kd_amount', label: 'F1KD AMOUNT', group: 'Health & Subsidy' },
  { key: 'gross_amount', label: 'GROSS AMOUNT', group: 'Financial Totals' },
  { key: 'adjustment_amount', label: 'ADJUSTMENT AMOUNT', group: 'Financial Totals' },
  { key: 'net_amount', label: 'NET AMOUNT', group: 'Financial Totals' },
  { key: 'hh_set', label: 'HH SET', group: 'Cycle & Program' },
  { key: 'set_group', label: 'SET GROUP', group: 'Cycle & Program' },
];

const defaultVisibleColumns: PayrollSortKey[] = [
  'period',
  'year',
  'payroll_description',
  'household_id',
  'last_name',
  'first_name',
  'municipality',
  'barangay',
  'account_number',
  'new_account_number',
  'status',
  'gross_amount',
  'net_amount',
  'hh_set',
  'payroll_date',
];

const STORAGE_VISIBLE_COLUMNS_KEY = 'cgt_payroll_visible_columns';

function getInitialVisibleColumns(): PayrollSortKey[] {
  if (typeof window === 'undefined') {
    return defaultVisibleColumns;
  }
  try {
    const saved = localStorage.getItem(STORAGE_VISIBLE_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = new Set<string>(payrollColumns.map((col) => col.key));
        const filtered = parsed.filter((k): k is PayrollSortKey => typeof k === 'string' && validKeys.has(k));
        if (filtered.length > 0) {
          if (!filtered.includes('new_account_number')) {
            filtered.push('new_account_number');
          }
          if (!filtered.includes('status')) {
            filtered.push('status');
          }
          return filtered;
        }
      }
    }
  } catch (err) {
    console.error('Error loading Payroll visible columns from localStorage:', err);
  }
  return defaultVisibleColumns;
}

type PayrollViewProps = {
  payrollRecords?: PayrollRecord[];
  payrollTotalCount?: number;
  payrollGrossTotal?: number;
  payrollNetTotal?: number;
  payrollMunicipalities?: string[];
  payrollPeriods?: string[];
  payrollYears?: string[];
  payrollHhSets?: string[];
  onSetNotice?: (notice: string) => void;
};

type ImportProgressState = {
  active: boolean;
  importId: number | null;
  filename: string;
  fileSize: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  importedCount: number;
  updatedCount: number;
  percentage: number;
  errorMessage: string | null;
};

function formatPhpCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0));
  if (isNaN(num)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function InlineAccountNumberCell({
  record,
  onUpdateSuccess,
  onSetNotice,
}: {
  record: PayrollRecord;
  onUpdateSuccess: (recordId: string | number, newAccountNumber: string) => void;
  onSetNotice?: (notice: string) => void;
}) {
  const [value, setValue] = useState(record.new_account_number || '');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setValue(record.new_account_number || '');
  }, [record.new_account_number]);

  const saveAccountNumber = async (newVal: string) => {
    const trimmed = newVal.trim();
    if (trimmed === (record.new_account_number || '').trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

      const res = await fetch(`/payroll/${record.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        body: JSON.stringify({
          new_account_number: trimmed,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to update account number');
      }

      onUpdateSuccess(record.id, trimmed);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      onSetNotice?.(`Saved new account number "${trimmed}" for HHID ${record.household_id}`);
    } catch (err: any) {
      console.error(err);
      onSetNotice?.(`Error saving account number: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex items-center min-w-[190px]" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        className={cn(
          'w-full h-8 px-2.5 pr-7 text-xs font-mono rounded-lg border bg-background text-foreground transition-all shadow-2xs',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          justSaved
            ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-200'
            : 'border-border/80 hover:border-border'
        )}
        placeholder="Type new account #"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => saveAccountNumber(value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        disabled={isSaving}
      />
      <div className="absolute right-2 flex items-center pointer-events-none">
        {isSaving && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
        {!isSaving && justSaved && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
      </div>
    </div>
  );
}

export function EmvPayrollView({
  payrollRecords = [],
  payrollTotalCount = 0,
  payrollGrossTotal = 0,
  payrollNetTotal = 0,
  payrollMunicipalities = [],
  payrollPeriods = [],
  payrollYears = [],
  payrollHhSets = [],
  onSetNotice,
}: PayrollViewProps) {
  const { auth, inquiry_display_fields } = usePage<{
    auth?: { user?: { id?: number; role?: string | null; is_admin?: boolean } | null };
    inquiry_display_fields?: { table_fields?: Record<string, string[]> | null } | null;
  }>().props;
  const isAdmin = Boolean(
    auth?.user?.is_admin ||
      (typeof auth?.user?.role === 'string' && auth.user.role.trim().toLowerCase() === 'admin')
  );
  const [data, setData] = useState<PayrollRecord[]>(payrollRecords);
  const [dbTotal, setDbTotal] = useState<number>(payrollTotalCount);
  const [totalCount, setTotalCount] = useState<number>(payrollTotalCount);
  const [grossTotal, setGrossTotal] = useState<number>(payrollGrossTotal);
  const [netTotal, setNetTotal] = useState<number>(payrollNetTotal);

  const [search, setSearch] = useState('');
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('All');
  const [municipalityFilter, setMunicipalityFilter] = useState('All');
  const [hhSetFilter, setHhSetFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<PayrollSortKey[]>(() => {
    const serverSaved = inquiry_display_fields?.table_fields?.payroll_table;
    if (Array.isArray(serverSaved) && serverSaved.length > 0) {
      return serverSaved as PayrollSortKey[];
    }
    return getInitialVisibleColumns();
  });
  const [sortKey, setSortKey] = useState<PayrollSortKey>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [jumpPage, setJumpPage] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  // Edit Status & Reason Modal State
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [editStatus, setEditStatus] = useState<string>('Successful');
  const [editReason, setEditReason] = useState<string>('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');

  // Import Modal & Live Progress State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importState, setImportState] = useState<ImportProgressState>({
    active: false,
    importId: null,
    filename: '',
    fileSize: 0,
    status: 'idle',
    totalRows: 0,
    processedRows: 0,
    importedCount: 0,
    updatedCount: 0,
    percentage: 0,
    errorMessage: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  // Sync if payrollRecords or meta props update
  useEffect(() => {
    setData(payrollRecords);
    if (payrollTotalCount !== undefined) {
      setDbTotal(payrollTotalCount);
      setTotalCount(payrollTotalCount);
    }
    if (payrollGrossTotal !== undefined) {
      setGrossTotal(payrollGrossTotal);
    }
    if (payrollNetTotal !== undefined) {
      setNetTotal(payrollNetTotal);
    }
  }, [payrollRecords, payrollTotalCount, payrollGrossTotal, payrollNetTotal]);

  // Permanently sync visible column selections to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_VISIBLE_COLUMNS_KEY, JSON.stringify(visibleColumnKeys));
      }
    } catch (err) {
      console.error('Error saving visible columns to localStorage:', err);
    }
  }, [visibleColumnKeys]);

  // Derived filter options
  const municipalities = useMemo(() => {
    if (payrollMunicipalities && payrollMunicipalities.length > 0) {
      return payrollMunicipalities;
    }
    return Array.from(new Set(data.map((d) => d.municipality).filter(Boolean))).sort();
  }, [payrollMunicipalities, data]);

  const periods = useMemo(() => {
    if (payrollPeriods && payrollPeriods.length > 0) {
      return payrollPeriods;
    }
    return Array.from(new Set(data.map((d) => d.period).filter(Boolean))).sort();
  }, [payrollPeriods, data]);

  const years = useMemo(() => {
    if (payrollYears && payrollYears.length > 0) {
      return payrollYears;
    }
    return Array.from(new Set(data.map((d) => String(d.year)).filter(Boolean))).sort();
  }, [payrollYears, data]);

  const hhSets = useMemo(() => {
    if (payrollHhSets && payrollHhSets.length > 0) {
      return payrollHhSets;
    }
    return Array.from(new Set(data.map((d) => d.hh_set).filter(Boolean))).sort();
  }, [payrollHhSets, data]);

  // Dynamic server pagination and filtering (indexed, sub-15ms)
  const fetchServerRecords = async (params: {
    pageNumber: number;
    perPageCount: number;
    searchTerm: string;
    period: string;
    municipality: string;
    hhSet: string;
    year: string;
    status: string;
    sort: PayrollSortKey;
    direction: 'asc' | 'desc';
  }) => {
    setIsSearchingServer(true);
    try {
      const url = new URL('/payroll/search', window.location.origin);
      url.searchParams.set('page', String(params.pageNumber));
      url.searchParams.set('per_page', String(params.perPageCount));
      if (params.searchTerm.trim()) url.searchParams.set('q', params.searchTerm.trim());
      if (params.period && params.period !== 'All') url.searchParams.set('period', params.period);
      if (params.municipality && params.municipality !== 'All') url.searchParams.set('municipality', params.municipality);
      if (params.hhSet && params.hhSet !== 'All') url.searchParams.set('hh_set', params.hhSet);
      if (params.year && params.year !== 'All') url.searchParams.set('year', params.year);
      if (params.status && params.status !== 'All') url.searchParams.set('status', params.status);
      url.searchParams.set('sort_key', params.sort);
      url.searchParams.set('sort_direction', params.direction);

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setData(json.data);
        }
        if (typeof json.total === 'number') {
          setTotalCount(json.total);
        }
        if (typeof json.total_in_database === 'number') {
          setDbTotal(json.total_in_database);
          window.dispatchEvent(
            new CustomEvent('cgt:reference-counts-updated', {
              detail: { payroll: json.total_in_database },
            })
          );
        }
        if (typeof json.gross_total === 'number') {
          setGrossTotal(json.gross_total);
        }
        if (typeof json.net_total === 'number') {
          setNetTotal(json.net_total);
        }
      }
    } catch (err) {
      console.error('Failed to load payroll records from server', err);
    } finally {
      setIsSearchingServer(false);
    }
  };

  const fetchRecentRecords = () => {
    fetchServerRecords({
      pageNumber: 1,
      perPageCount: rowsPerPage,
      searchTerm: search,
      period: periodFilter,
      municipality: municipalityFilter,
      hhSet: hhSetFilter,
      year: yearFilter,
      status: statusFilter,
      sort: sortKey,
      direction: sortDirection,
    });
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (
        payrollRecords.length > 0 &&
        !search &&
        periodFilter === 'All' &&
        municipalityFilter === 'All' &&
        hhSetFilter === 'All' &&
        yearFilter === 'All' &&
        statusFilter === 'All' &&
        page === 1 &&
        sortKey === 'id'
      ) {
        return;
      }
    }

    const timer = setTimeout(() => {
      fetchServerRecords({
        pageNumber: page,
        perPageCount: rowsPerPage,
        searchTerm: search,
        period: periodFilter,
        municipality: municipalityFilter,
        hhSet: hhSetFilter,
        year: yearFilter,
        status: statusFilter,
        sort: sortKey,
        direction: sortDirection,
      });
    }, search ? 350 : 0);

    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, periodFilter, municipalityFilter, hhSetFilter, yearFilter, statusFilter, sortKey, sortDirection]);

  // Server-backed pagination calculation
  const totalRecords = totalCount;
  const pageCount = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedData = data;

  const handleSort = (key: PayrollSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const persistPayrollColumns = async (nextKeys: PayrollSortKey[]) => {
    setVisibleColumnKeys(nextKeys);
    if (!isAdmin) return;
    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
      await fetch('/inquiry/display-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        body: JSON.stringify({
          user_id: auth?.user?.id ?? null,
          table_fields: { payroll_table: nextKeys },
        }),
      });
    } catch {
      // ignore network error
    }
  };

  useEffect(() => {
    fetch('/inquiry/display-fields', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const saved = json?.display_fields?.table_fields?.payroll_table;
        if (Array.isArray(saved) && saved.length > 0) {
          setVisibleColumnKeys(saved as PayrollSortKey[]);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleColumn = (key: PayrollSortKey) => {
    if (!isAdmin) return;
    const next = visibleColumnKeys.includes(key)
      ? visibleColumnKeys.filter((k) => k !== key)
      : [...visibleColumnKeys, key];
    if (next.length === 0) return;
    persistPayrollColumns(next);
  };

  const handleSelectAllColumns = () => {
    if (!isAdmin) return;
    persistPayrollColumns(payrollColumns.map((col) => col.key));
  };

  const handleResetColumns = () => {
    if (!isAdmin) return;
    persistPayrollColumns(defaultVisibleColumns);
    try {
      localStorage.setItem(STORAGE_VISIBLE_COLUMNS_KEY, JSON.stringify(defaultVisibleColumns));
    } catch {
      // ignore
    }
    onSetNotice?.('Restored default visible columns (13/30)');
  };

  const handleSaveEditModal = async () => {
    if (!editingRecord) return;

    if (editStatus === 'Reject' && !editReason.trim()) {
      setReasonError('Reason / Remarks is required when the status is Reject.');
      return;
    }
    setReasonError(null);
    setIsSavingEdit(true);

    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

      const res = await fetch(`/payroll/${editingRecord.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        body: JSON.stringify({
          status: editStatus,
          reason: editReason,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.message || 'Failed to update record';
        if (editStatus === 'Reject' && (!editReason.trim() || errMsg.toLowerCase().includes('reason'))) {
          setReasonError(errMsg);
        }
        throw new Error(errMsg);
      }

      const resData = await res.json();
      const updated = resData.data;

      setData((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? { ...r, status: editStatus, reason: editReason, ...(updated ? updated : {}) }
            : r
        )
      );

      if (selectedRecord && selectedRecord.id === editingRecord.id) {
        setSelectedRecord((prev) =>
          prev ? { ...prev, status: editStatus, reason: editReason, ...(updated ? updated : {}) } : null
        );
      }

      onSetNotice?.(`Updated status to "${editStatus}" for HHID ${editingRecord.household_id}.`);
      setEditingRecord(null);
    } catch (err: any) {
      console.error(err);
      onSetNotice?.(`Error updating record: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // High-performance asynchronous import with queue and live batch runner
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    setShowImportModal(true);
    setImportState({
      active: true,
      importId: null,
      filename: file.name,
      fileSize: file.size,
      status: 'uploading',
      totalRows: 0,
      processedRows: 0,
      importedCount: 0,
      updatedCount: 0,
      percentage: 0,
      errorMessage: null,
    });

    onSetNotice?.(`Uploading ${file.name} to server queue...`);

    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
      const token = metaToken || xsrfToken;

      const formData = new FormData();
      formData.append('file', file);
      if (token) {
        formData.append('_token', token);
      }

      const res = await fetch('/payroll/import', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        body: formData,
      });

      let resData: any = {};
      try {
        resData = await res.json();
      } catch {
        resData = {};
      }

      if (!res.ok || resData.error || resData.errors) {
        const errorMsg =
          resData.error ||
          (resData.errors ? Object.values(resData.errors).flat().join(', ') : null) ||
          resData.message ||
          `Upload failed (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }

      const importId = resData.importId;
      setImportState((prev) => ({
        ...prev,
        importId,
        status: 'processing',
        totalRows: resData.totalRows || 0,
      }));

      onSetNotice?.(`Import queued (Job #${importId}). Processing Payroll records in background...`);

      startImportPollingAndPump(importId);
    } catch (err: any) {
      setImportState((prev) => ({
        ...prev,
        status: 'failed',
        errorMessage: err.message || 'Failed to upload spreadsheet to server.',
      }));
      onSetNotice?.(`Import error: ${err.message}`);
    }
  };

  const startImportPollingAndPump = (importId: number) => {
    let lastProcessed = 0;
    let unchangedCycles = 0;
    const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

    const step = async () => {
      try {
        const statusRes = await fetch(`/payroll/import/${importId}/status`, {
          headers: { Accept: 'application/json' },
        });

        if (!statusRes.ok) return;

        const statusData = await statusRes.json();

        setImportState((prev) => ({
          ...prev,
          status: statusData.status,
          totalRows: statusData.total_rows || prev.totalRows,
          processedRows: statusData.processed_rows || 0,
          importedCount: statusData.imported_count || 0,
          updatedCount: statusData.updated_count || 0,
          percentage: statusData.percentage || 0,
          errorMessage: statusData.error_message,
        }));

        if (statusData.status === 'completed') {
          onSetNotice?.(
            `Import complete! ${statusData.imported_count.toLocaleString()} added, ${statusData.updated_count.toLocaleString()} updated.`
          );
          fetchRecentRecords();
          window.dispatchEvent(new CustomEvent('cgt:refresh-module-counts'));
          fetch('/reference-counts')
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.references) {
                window.dispatchEvent(
                  new CustomEvent('cgt:reference-counts-updated', {
                    detail: res.references,
                  })
                );
              }
            })
            .catch(() => {});
          try {
            router.reload({ preserveScroll: true, preserveState: false });
          } catch {
            // ignore
          }
          return;
        }

        if (statusData.status === 'failed') {
          onSetNotice?.(`Import failed: ${statusData.error_message}`);
          return;
        }

        if (statusData.processed_rows === lastProcessed) {
          unchangedCycles++;
        } else {
          unchangedCycles = 0;
          lastProcessed = statusData.processed_rows;
        }

        // Fallback pump batch directly if worker is idle
        if (unchangedCycles >= 1 && statusData.status !== 'completed' && statusData.status !== 'failed') {
          const pumpRes = await fetch(`/payroll/import/${importId}/process-batch`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
              ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
            },
          });

          if (pumpRes.ok) {
            const pumpData = await pumpRes.json();
            setImportState((prev) => ({
              ...prev,
              status: pumpData.status,
              totalRows: pumpData.total_rows || prev.totalRows,
              processedRows: pumpData.processed_rows || 0,
              importedCount: pumpData.imported_count || 0,
              updatedCount: pumpData.updated_count || 0,
              percentage: pumpData.percentage || 0,
            }));

            if (pumpData.status === 'completed') {
              onSetNotice?.(
                `Import complete! ${pumpData.imported_count.toLocaleString()} added, ${pumpData.updated_count.toLocaleString()} updated.`
              );
              fetchRecentRecords();
              window.dispatchEvent(new CustomEvent('cgt:refresh-module-counts'));
              fetch('/reference-counts')
                .then((r) => r.json())
                .then((res) => {
                  if (res.success && res.references) {
                    window.dispatchEvent(
                      new CustomEvent('cgt:reference-counts-updated', {
                        detail: res.references,
                      })
                    );
                  }
                })
                .catch(() => {});
              try {
                router.reload({ preserveScroll: true, preserveState: false });
              } catch {
                // ignore
              }
              return;
            }

            setTimeout(step, 50);
            return;
          }
        }

        setTimeout(step, 600);
      } catch {
        setTimeout(step, 2000);
      }
    };

    setTimeout(step, 200);
  };

  const handleExportCsv = (allColumns = true) => {
    // If user requests full 30 columns without active filters, stream directly from server
    if (allColumns && dbTotal > 0 && !search.trim() && periodFilter === 'All' && municipalityFilter === 'All' && hhSetFilter === 'All' && yearFilter === 'All') {
      window.location.href = '/payroll/export';
      onSetNotice?.(`Streaming full Payroll export (${dbTotal.toLocaleString()} records) with all 30 columns...`);
      return;
    }

    const exportCols = allColumns ? payrollColumns : payrollColumns.filter((col) => visibleColumnKeys.includes(col.key));
    const headers = exportCols.map((c) => c.label).join(',');
    const exportData = data;
    const rows = exportData.map((record) =>
      exportCols
        .map((col) => {
          const val = record[col.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll_${allColumns ? 'all_columns_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onSetNotice?.(
      allColumns
        ? `Exported ${exportData.length} records with all columns`
        : `Exported ${exportData.length} records (${exportCols.length} columns)`
    );
  };

  const filteredColumnsForPicker = useMemo(() => {
    if (!columnSearch.trim()) {
      return payrollColumns;
    }
    const q = columnSearch.toLowerCase();
    return payrollColumns.filter(
      (c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [columnSearch]);

  const columnGroups = useMemo(() => {
    const groups: Record<string, typeof payrollColumns> = {};
    filteredColumnsForPicker.forEach((col) => {
      if (!groups[col.group]) groups[col.group] = [];
      groups[col.group].push(col);
    });
    return groups;
  }, [filteredColumnsForPicker]);

  return (
    <section className="mx-auto w-full max-w-[1850px] space-y-6">
      {/* Hidden file input for spreadsheet upload */}
      <input
        accept=".csv,.xlsx,.xls,.txt,.xml"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      {/* Top Banner & Control Deck */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs dark:border-border dark:bg-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">EMV Payroll Database</h1>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {payrollColumns.length} Reference Columns
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Official Caraga 4Ps Regular and Special Payroll Disbursal Records with complete Grant Breakdown and LandBank Card Accounts.
              </p>
            </div>
          </div>

          {/* Action Buttons: Import, Export, Column Chooser */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Import Button */}
            <Button
              className="gap-2 shadow-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              <span>Import to payroll</span>
            </Button>

            {/* Export Dropdown */}
            <div className="relative group">
              <Button
                className="gap-2 shadow-xs font-medium"
                onClick={() => handleExportCsv(true)}
                variant="outline"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV (30 Cols)</span>
              </Button>
            </div>

            {/* Visible Columns Selector (Admin Only) */}
            {isAdmin && (
            <div className="relative">
              <Button
                className="gap-2 shadow-xs font-medium"
                onClick={() => setShowColumnPicker((prev) => !prev)}
                variant="outline"
                title="Admin Only: Configure visible columns for all users"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>
                  Display Fields ({visibleColumnKeys.length}/{payrollColumns.length})
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showColumnPicker && 'rotate-180')} />
              </Button>

              {/* Column Chooser Popover */}
              {showColumnPicker && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border/80 bg-popover p-3 shadow-xl dark:border-border dark:bg-popover animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Display Fields
                    </span>
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setShowColumnPicker(false)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="my-2">
                    <Input
                      className="h-8 text-xs"
                      onChange={(e) => setColumnSearch(e.target.value)}
                      placeholder="Filter column names..."
                      value={columnSearch}
                    />
                  </div>

                  <div className="flex items-center justify-between py-1 text-[11px] text-muted-foreground">
                    <button
                      className="hover:text-primary font-semibold underline-offset-2 hover:underline"
                      onClick={handleSelectAllColumns}
                      type="button"
                    >
                      Select All (30)
                    </button>
                    <button
                      className="hover:text-primary font-semibold underline-offset-2 hover:underline"
                      onClick={handleResetColumns}
                      type="button"
                    >
                      Reset Default (13)
                    </button>
                  </div>

                  <div className="mt-2 max-h-72 overflow-y-auto space-y-3 pr-1 text-xs">
                    {Object.entries(columnGroups).map(([group, cols]) => (
                      <div key={group}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1">
                          {group}
                        </div>
                        <div className="space-y-1">
                          {cols.map((col) => {
                            const isChecked = visibleColumnKeys.includes(col.key);
                            return (
                              <label
                                key={col.key}
                                className={cn(
                                  'flex items-center gap-2 rounded-md px-2 py-1 text-xs cursor-pointer transition-colors',
                                  isChecked ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
                                )}
                              >
                                <input
                                  checked={isChecked}
                                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                  onChange={() => handleToggleColumn(col.key)}
                                  type="checkbox"
                                />
                                <span className="font-mono text-[11px]">{col.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/60 text-center">
                    <Button
                      className="w-full h-8 text-xs font-semibold"
                      onClick={() => setShowColumnPicker(false)}
                      size="sm"
                    >
                      Apply Columns
                    </Button>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Quick Summary Metric Pills */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Payroll Rows</div>
              <div className="text-lg font-extrabold text-foreground">
                {Math.max(dbTotal, totalCount).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Net Disbursed</div>
              <div className="text-lg font-extrabold text-foreground">
                {formatPhpCurrency(netTotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <Layers className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Gross Grants</div>
              <div className="text-lg font-extrabold text-foreground">
                {formatPhpCurrency(grossTotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Coverage Scope</div>
              <div className="text-lg font-extrabold text-foreground">
                {municipalities.length} Areas • {periods.length || 0} Periods
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs dark:border-border dark:bg-card overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3.5 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between bg-card">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              {isSearchingServer ? (
                <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                className="h-9 pl-9 text-xs"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search Household ID, Card Number, Name, Town..."
                value={search}
              />
              {search && (
                <button
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch('')}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Period Filter Dropdown */}
            {periods.length > 0 && (
              <select
                className="h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none"
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setPage(1);
                }}
                value={periodFilter}
              >
                <option value="All">All Periods</option>
                {periods.map((p) => (
                  <option key={p} value={p}>
                    Period: {p}
                  </option>
                ))}
              </select>
            )}

            {/* Municipality Filter Dropdown */}
            {municipalities.length > 0 && (
              <select
                className="h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none"
                onChange={(e) => {
                  setMunicipalityFilter(e.target.value);
                  setPage(1);
                }}
                value={municipalityFilter}
              >
                <option value="All">All Municipalities</option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            {/* HH Set Filter Dropdown */}
            {hhSets.length > 0 && (
              <select
                className="h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none"
                onChange={(e) => {
                  setHhSetFilter(e.target.value);
                  setPage(1);
                }}
                value={hhSetFilter}
              >
                <option value="All">All HH Sets</option>
                {hhSets.map((s) => (
                  <option key={s} value={s}>
                    Set {s}
                  </option>
                ))}
              </select>
            )}

            {/* Year Filter Dropdown */}
            {years.length > 0 && (
              <select
                className="h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none"
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setPage(1);
                }}
                value={yearFilter}
              >
                <option value="All">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Year: {y}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter Dropdown */}
            <select
              className="h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              value={statusFilter}
            >
              <option value="All">All Statuses</option>
              <option value="Successful">Successful</option>
              <option value="Reject">Reject</option>
            </select>

            {/* Reset Filters Button */}
            {(search || periodFilter !== 'All' || municipalityFilter !== 'All' || hhSetFilter !== 'All' || yearFilter !== 'All' || statusFilter !== 'All') && (
              <Button
                className="h-9 gap-1.5 text-xs font-semibold"
                onClick={() => {
                  setSearch('');
                  setPeriodFilter('All');
                  setMunicipalityFilter('All');
                  setHhSetFilter('All');
                  setYearFilter('All');
                  setStatusFilter('All');
                  setPage(1);
                }}
                size="sm"
                variant="ghost"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Displaying <span className="font-semibold text-foreground">{paginatedData.length}</span> rows
          </div>
        </div>

        {/* Responsive Table Scroll Container */}
        <div className="max-h-[calc(100vh-210px)] overflow-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-xs border-b border-border/70 text-[11px] font-bold uppercase tracking-wider text-muted-foreground shadow-2xs">
              <tr>
                <th className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-xs px-4 py-3 text-center w-12 shadow-[inset_0_-1px_0_0_var(--border)]">#</th>
                <th className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-xs px-4 py-3 text-center w-20 shadow-[inset_0_-1px_0_0_var(--border)]">Action</th>

                {payrollColumns
                  .filter((col) => visibleColumnKeys.includes(col.key))
                  .map((col) => {
                    const isSorted = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-xs px-4 py-3 cursor-pointer select-none hover:bg-secondary/80 transition-colors shadow-[inset_0_-1px_0_0_var(--border)]"
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                          )}
                        </div>
                      </th>
                    );
                  })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {paginatedData.map((record, idx) => (
                <tr
                  key={record.id || `${record.household_id}-${idx}`}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  <td className="px-4 py-3 text-center text-muted-foreground font-mono text-[11px]">
                    {startIndex + idx + 1}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        onClick={() => setSelectedRecord(record)}
                        title="Inspect record details"
                        type="button"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          setEditingRecord(record);
                          setEditStatus(record.status || 'Successful');
                          setEditReason(record.reason || '');
                          setReasonError(null);
                        }}
                        title="Edit Status & Reason"
                        type="button"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                  {payrollColumns
                    .filter((col) => visibleColumnKeys.includes(col.key))
                    .map((col) => {
                      const value = record[col.key];

                      if (col.key === 'new_account_number') {
                        return (
                          <td key={col.key} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <InlineAccountNumberCell
                              record={record}
                              onUpdateSuccess={(id, newVal) => {
                                setData((prev) =>
                                  prev.map((r) => (r.id === id ? { ...r, new_account_number: newVal } : r))
                                );
                              }}
                              onSetNotice={onSetNotice}
                            />
                          </td>
                        );
                      }

                      if (col.key === 'status') {
                        const isSuccessful = String(value || '').toLowerCase() === 'successful';
                        const isReject = String(value || '').toLowerCase() === 'reject';

                        if (!value) {
                          return (
                            <td key={col.key} className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-muted/60 text-muted-foreground">
                                —
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border',
                                isSuccessful
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                  : isReject
                                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                                  : 'bg-primary/10 text-primary border-primary/20'
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full shrink-0',
                                  isSuccessful ? 'bg-emerald-500' : isReject ? 'bg-rose-500' : 'bg-primary'
                                )}
                              />
                              {value}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'reason') {
                        return (
                          <td key={col.key} className="px-4 py-3 max-w-[220px] truncate text-muted-foreground" title={String(value || '')}>
                            {value ? String(value) : '—'}
                          </td>
                        );
                      }

                      if (col.key === 'period') {
                        return (
                          <td key={col.key} className="px-4 py-3">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-cyan-300">
                              {value || '—'}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'household_id' || col.key === 'account_number') {
                        return (
                          <td key={col.key} className="px-4 py-3 font-mono font-bold text-foreground">
                            {value || '—'}
                          </td>
                        );
                      }

                      if (col.key === 'last_name') {
                        return (
                          <td key={col.key} className="px-4 py-3 font-semibold text-foreground">
                            {value || '—'}
                          </td>
                        );
                      }

                      if (
                        col.key === 'net_amount' ||
                        col.key === 'gross_amount' ||
                        col.key === 'adjustment_amount' ||
                        col.key === 'total_educ' ||
                        col.key === 'health' ||
                        col.key === 'rice_amount' ||
                        col.key === 'f1kd_amount' ||
                        col.key === 'educ_dc_elem' ||
                        col.key === 'educ_jr_hs' ||
                        col.key === 'educ_sr_hs' ||
                        col.key === 'educ_total_hs'
                      ) {
                        const num = typeof value === 'number' ? value : parseFloat(String(value || 0));
                        return (
                          <td key={col.key} className="px-4 py-3 font-mono font-semibold">
                            <span
                              className={cn(
                                col.key === 'net_amount'
                                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'text-foreground'
                              )}
                            >
                              {num > 0 ? formatPhpCurrency(num) : '₱0.00'}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'hh_set') {
                        return (
                          <td key={col.key} className="px-4 py-3">
                            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              Set {value || '—'}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} className="px-4 py-3 text-muted-foreground">
                          {value !== undefined && value !== null && String(value).trim() !== '' ? String(value) : '—'}
                        </td>
                      );
                    })}
                </tr>
              ))}

              {!paginatedData.length && (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-muted-foreground"
                    colSpan={visibleColumnKeys.length + 2}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Coins className="h-8 w-8 text-muted-foreground/40" />
                      <span className="font-semibold text-sm">No payroll records found in database</span>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search filters or click{' '}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          "Import to payroll"
                        </span>{' '}
                        to upload spreadsheet data.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination Controls */}
        <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-card text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing <strong className="text-foreground">{totalRecords ? startIndex + 1 : 0}</strong> to{' '}
              <strong className="text-foreground">{Math.min(startIndex + data.length, totalRecords).toLocaleString()}</strong> of{' '}
              <strong className="text-foreground">{totalRecords.toLocaleString()}</strong> payroll records
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
              <span>Rows per page:</span>
              <select
                className="h-7 rounded border border-border/70 bg-card px-1.5 text-xs text-foreground focus:outline-none"
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                value={rowsPerPage}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              size="sm"
              variant="outline"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 font-medium text-foreground">
              Page {safePage} of {pageCount}
            </span>

            <Button
              className="h-8 w-8 p-0"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              size="sm"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              disabled={page >= pageCount}
              onClick={() => setPage(pageCount)}
              size="sm"
              variant="outline"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>

            {/* Jump to Page */}
            <div className="flex items-center gap-1 pl-2 border-l border-border/60">
              <Input
                className="h-8 w-14 text-center text-xs"
                max={pageCount}
                min={1}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = parseInt(jumpPage, 10);
                    if (!isNaN(target) && target >= 1 && target <= pageCount) {
                      setPage(target);
                      setJumpPage('');
                    }
                  }
                }}
                placeholder="Page"
                type="number"
                value={jumpPage}
              />
              <Button
                className="h-8 px-2 text-xs"
                disabled={!jumpPage}
                onClick={() => {
                  const target = parseInt(jumpPage, 10);
                  if (!isNaN(target) && target >= 1 && target <= pageCount) {
                    setPage(target);
                    setJumpPage('');
                  }
                }}
                size="sm"
                variant="outline"
              >
                Go
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl dark:border-border dark:bg-card">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedRecord.last_name}, {selectedRecord.first_name} {selectedRecord.middle_name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                    <span>HHID: {selectedRecord.household_id}</span>
                    <span>•</span>
                    <span>Card: {selectedRecord.account_number}</span>
                    <span>•</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                      {selectedRecord.period} ({selectedRecord.year})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Net Grant Amount</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatPhpCurrency(selectedRecord.net_amount)}
                  </div>
                </div>

                <button
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => setSelectedRecord(null)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content Sections */}
            <div className="mt-6 space-y-6">
              {/* Section 1: Cycle & Program Details */}
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Cycle & Program Details
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Period:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.period || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Year:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.year || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payroll Description:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.payroll_description || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payroll Date:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.payroll_date || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Finance Approval:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.finance_approval || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Household Set:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.hh_set || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Set Group:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.set_group || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Location & Beneficiary */}
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location & Address
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Region:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.region || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Province:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.province || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Municipality:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.municipality || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Barangay:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.barangay || '—'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Address PSGC:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.address_psgc || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Payment, Banking & Verification Status */}
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment, Banking & Verification Status
                  </div>
                  <button
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    onClick={() => {
                      setEditingRecord(selectedRecord);
                      setEditStatus(selectedRecord.status || 'Successful');
                      setEditReason(selectedRecord.reason || '');
                      setReasonError(null);
                    }}
                    type="button"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Status & Reason
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Original Account Number:</span>
                    <p className="font-mono font-bold text-foreground mt-0.5">{selectedRecord.account_number || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">New Account Number:</span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedRecord.new_account_number || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-0.5">
                      {selectedRecord.status ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                            String(selectedRecord.status).toLowerCase() === 'successful'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                              : String(selectedRecord.status).toLowerCase() === 'reject'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0',
                              String(selectedRecord.status).toLowerCase() === 'successful'
                                ? 'bg-emerald-500'
                                : String(selectedRecord.status).toLowerCase() === 'reject'
                                ? 'bg-rose-500'
                                : 'bg-primary'
                            )}
                          />
                          {selectedRecord.status}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-semibold">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Mode Classification:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.payment_mode_classification || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode of Payment:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRecord.mode_of_payment || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reason / Remarks:</span>
                    <p className="font-medium text-foreground mt-0.5">{selectedRecord.reason || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Breakdown of Grants & Financial Totals */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Grant Breakdown & Disbursement Summary
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                      Educ DC Elem
                    </div>
                    <div className="mt-1 font-mono font-bold text-foreground">
                      {formatPhpCurrency(selectedRecord.educ_dc_elem)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                      Educ Jr HS
                    </div>
                    <div className="mt-1 font-mono font-bold text-foreground">
                      {formatPhpCurrency(selectedRecord.educ_jr_hs)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                      Educ Sr HS
                    </div>
                    <div className="mt-1 font-mono font-bold text-foreground">
                      {formatPhpCurrency(selectedRecord.educ_sr_hs)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                      Total Educ HS
                    </div>
                    <div className="mt-1 font-mono font-bold text-foreground">
                      {formatPhpCurrency(selectedRecord.educ_total_hs)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3">
                    <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-semibold text-[11px]">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Total Education Grant
                    </div>
                    <div className="mt-1 font-mono font-black text-sky-800 dark:text-sky-200">
                      {formatPhpCurrency(selectedRecord.total_educ)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                      Health Subsidy
                    </div>
                    <div className="mt-1 font-mono font-bold text-foreground">
                      {formatPhpCurrency(selectedRecord.health)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <Wheat className="h-3.5 w-3.5 text-amber-500" />
                      Rice Subsidy
                    </div>
                    <div className="mt-1 font-mono font-bold text-foreground">
                      {formatPhpCurrency(selectedRecord.rice_amount)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      F1KD Grant
                    </div>
                    <div className="mt-1 font-mono font-bold text-foreground">
                      {formatPhpCurrency(selectedRecord.f1kd_amount)}
                    </div>
                  </div>
                </div>

                {/* Final Net Calculation Box */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/80 bg-secondary/40 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Gross Amount
                    </div>
                    <div className="mt-1 text-base font-extrabold text-foreground">
                      {formatPhpCurrency(selectedRecord.gross_amount)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-secondary/40 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Adjustment Amount
                    </div>
                    <div className="mt-1 text-base font-extrabold text-muted-foreground">
                      {formatPhpCurrency(selectedRecord.adjustment_amount)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 dark:bg-emerald-500/20">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Net Disbursed Amount
                    </div>
                    <div className="mt-1 text-xl font-black text-emerald-800 dark:text-emerald-200">
                      {formatPhpCurrency(selectedRecord.net_amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-[11px] text-muted-foreground">
                Database Record #{selectedRecord.id} • DSWD Caraga Regional Portal
              </span>
              <Button onClick={() => setSelectedRecord(null)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status & Reason Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl dark:border-border dark:bg-card space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Update Status & Reason</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingRecord.first_name} {editingRecord.last_name} • HHID: <span className="font-mono font-semibold">{editingRecord.household_id}</span>
                  </p>
                </div>
              </div>
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                onClick={() => setEditingRecord(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Account Info Summary Card */}
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Original Account #</span>
                <span className="font-mono font-semibold text-foreground mt-0.5 block truncate" title={editingRecord.account_number || '—'}>
                  {editingRecord.account_number || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">New Account #</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate" title={editingRecord.new_account_number || 'None'}>
                  {editingRecord.new_account_number || 'None'}
                </span>
              </div>
            </div>

            {/* Form Controls */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  value={editStatus}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setEditStatus(nextStatus);
                    if (nextStatus !== 'Reject') {
                      setReasonError(null);
                    }
                  }}
                >
                  <option value="Successful">Successful</option>
                  <option value="Reject">Reject</option>
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">Select whether the transaction was Successful or Rejected.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                    Reason / Remarks {editStatus === 'Reject' ? <span className="text-rose-500">*</span> : <span className="text-muted-foreground font-normal lowercase tracking-normal text-[11px]">(optional)</span>}
                  </label>
                  {editStatus === 'Reject' && (
                    <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
                      Required for Reject
                    </span>
                  )}
                </div>
                <textarea
                  className={cn(
                    "w-full rounded-xl border bg-background p-3 text-xs text-foreground shadow-2xs transition-colors resize-y min-h-[95px] focus:outline-none focus:ring-2",
                    reasonError
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-border/80 focus:border-primary focus:ring-primary/20"
                  )}
                  placeholder={
                    editStatus === 'Reject'
                      ? 'Please specify the exact reason or remarks for rejection (required)...'
                      : 'Enter details, reason for rejection, or notes...'
                  }
                  rows={4}
                  value={editReason}
                  onChange={(e) => {
                    setEditReason(e.target.value);
                    if (reasonError && e.target.value.trim()) {
                      setReasonError(null);
                    }
                  }}
                />
                {reasonError ? (
                  <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{reasonError}</span>
                  </p>
                ) : editStatus === 'Reject' ? (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    A clear explanation is required to document why this transaction was rejected.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
              <Button disabled={isSavingEdit} onClick={() => setEditingRecord(null)} size="sm" variant="outline">
                Cancel
              </Button>
              <Button disabled={isSavingEdit} onClick={handleSaveEditModal} size="sm" className="gap-1.5">
                {isSavingEdit ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Live Progress Modal */}
      {showImportModal && importState.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl dark:border-border dark:bg-card space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    importState.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : importState.status === 'failed'
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-primary/15 text-primary'
                  )}
                >
                  {importState.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : importState.status === 'failed' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    {importState.status === 'uploading' && 'Uploading Spreadsheet...'}
                    {importState.status === 'processing' && 'Processing Import Queue...'}
                    {importState.status === 'completed' && 'Import Complete!'}
                    {importState.status === 'failed' && 'Import Failed'}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate max-w-sm" title={importState.filename}>
                    {importState.filename || 'payroll_spreadsheet'} • {(importState.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                onClick={() => setShowImportModal(false)}
                title="Minimize modal"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Message Alert */}
            {importState.status === 'failed' && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error during import</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    {importState.errorMessage || 'An unexpected error occurred while parsing the spreadsheet.'}
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar & Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {importState.status === 'uploading' && 'Transferring file to storage...'}
                  {importState.status === 'processing' && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Streaming & writing records to database...
                    </span>
                  )}
                  {importState.status === 'completed' && 'All records synchronized!'}
                  {importState.status === 'failed' && 'Process halted'}
                </span>
                <span className="font-mono font-extrabold text-sm text-primary">
                  {importState.status === 'completed' ? '100%' : `${importState.percentage}%`}
                </span>
              </div>

              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/80">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    importState.status === 'completed'
                      ? 'bg-emerald-500'
                      : importState.status === 'failed'
                      ? 'bg-destructive'
                      : 'bg-primary'
                  )}
                  style={{
                    width: importState.status === 'completed' ? '100%' : `${Math.max(5, Math.min(100, importState.percentage))}%`,
                  }}
                />
              </div>
            </div>

            {/* Live Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Estimated Total</span>
                <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                  {importState.totalRows > 0 ? importState.totalRows.toLocaleString() : 'Estimating...'}
                </span>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Processed</span>
                <span className="text-sm font-extrabold text-primary mt-0.5 block">
                  {importState.processedRows.toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">New Inserted</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-300 mt-0.5 block">
                  +{importState.importedCount.toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3">
                <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-400 block">HH_ID Updated</span>
                <span className="text-sm font-extrabold text-sky-600 dark:text-sky-300 mt-0.5 block">
                  ↻{importState.updatedCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Performance Explainer */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <span>
                <strong>Zero-Lag Streaming Engine:</strong> Large files (like 330k rows) are parsed via an <code className="font-mono text-[10px] text-foreground">XMLReader</code> stream in 1,000-row chunks. RAM stays flat under 15MB with zero PC freezing. If the record already exists for the period, it is updated; otherwise, a new record is created.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[11px] font-mono text-muted-foreground">
                Job #{importState.importId || 'init'} • Table: payroll
              </span>

              <div className="flex items-center gap-2">
                {importState.status === 'processing' && (
                  <Button
                    onClick={() => setShowImportModal(false)}
                    size="sm"
                    variant="outline"
                  >
                    Minimize & Continue Working
                  </Button>
                )}
                <Button
                  onClick={() => setShowImportModal(false)}
                  size="sm"
                  variant={importState.status === 'completed' ? 'default' : 'secondary'}
                >
                  {importState.status === 'completed' ? 'Done' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Floating Pill when modal is closed but import is running */}
      {!showImportModal && importState.active && (
        <div
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border border-border/80 bg-card/95 backdrop-blur-md px-4 py-2.5 shadow-2xl hover:border-primary/60 cursor-pointer transition-all animate-in slide-in-from-bottom-4"
          onClick={() => setShowImportModal(true)}
          title="Click to expand import details"
        >
          {importState.status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : importState.status === 'failed' ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}

          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              {importState.status === 'completed'
                ? 'Import Completed'
                : importState.status === 'failed'
                ? 'Import Failed'
                : `Importing (${importState.percentage}%)`}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {importState.processedRows.toLocaleString()} / {importState.totalRows > 0 ? importState.totalRows.toLocaleString() : '...'} rows
            </span>
          </div>

          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            View
          </span>
        </div>
      )}
    </section>
  );
}
