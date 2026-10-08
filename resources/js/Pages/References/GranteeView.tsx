import { router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
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
  CreditCard,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileUp,
  Filter,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '../Dashboard/utils';
import type { GranteeRecord, GranteeSortKey } from '../Dashboard/types';

export const granteeColumns: { key: GranteeSortKey; label: string; group: string }[] = [
  { key: 'region', label: 'REGION', group: 'Location' },
  { key: 'province', label: 'PROVINCE', group: 'Location' },
  { key: 'municipality', label: 'MUNICIPALITY', group: 'Location' },
  { key: 'barangay', label: 'BARANGAY', group: 'Location' },
  { key: 'purok', label: 'PUROK', group: 'Location' },
  { key: 'district', label: 'DISTRICT', group: 'Location' },
  { key: 'hh_id', label: 'hh_id', group: 'Identification' },
  { key: 'entry_id', label: 'ENTRY_ID', group: 'Identification' },
  { key: 'first_name', label: 'FIRST_NAME', group: 'Personal' },
  { key: 'middle_name', label: 'MIDDLE_NAME', group: 'Personal' },
  { key: 'last_name', label: 'LAST_NAME', group: 'Personal' },
  { key: 'ext_name', label: 'EXT_NAME', group: 'Personal' },
  { key: 'maiden_name', label: 'MAIDEN_NAME', group: 'Personal' },
  { key: 'contact_number', label: 'CONTACT_NUMBER', group: 'Personal' },
  { key: 'birthday', label: 'BIRTHDAY', group: 'Personal' },
  { key: 'hh_grantee', label: 'HH_GRANTEE', group: 'Personal' },
  { key: 'current_age', label: 'CURRENT_AGE', group: 'Personal' },
  { key: 'age', label: 'AGE', group: 'Personal' },
  { key: 'sex', label: 'SEX', group: 'Personal' },
  { key: 'old_client_status', label: 'OLD_CLIENT_STATUS', group: 'Status' },
  { key: 'client_status', label: 'CLIENT_STATUS', group: 'Status' },
  { key: 'date_tagged', label: 'DATE_TAGGED', group: 'Status' },
  { key: 'tagged_by', label: 'TAGGED_BY', group: 'Status' },
  { key: 'cs_category', label: 'CS_CATEGORY', group: 'Status' },
  { key: 'member_status', label: 'MEMBER_STATUS', group: 'Status' },
  { key: 'relation_to_hh', label: 'RELATION_TO_HH', group: 'Status' },
  { key: 'hh_set', label: 'HH_SET', group: 'Program' },
  { key: 'registration_status', label: 'REGISTRATION_STATUS', group: 'Program' },
  { key: 'ip_label', label: 'IP_LABEL', group: 'Program' },
  { key: 'ip_status', label: 'IP_STATUS', group: 'Program' },
  { key: 'payment_mode', label: 'PAYMENT_MODE', group: 'Banking' },
  { key: 'lbp_account', label: 'LBP_ACCOUNT', group: 'Banking' },
  { key: 'date_of_enumeration', label: 'DATE_OF_ENUMERATION', group: 'Program' },
  { key: 'date_registered', label: 'DATE_REGISTERED', group: 'Program' },
  { key: 'date_registered_v2', label: 'DATE_REGISTERED_V2', group: 'Program' },
  { key: 'family_id', label: 'FAMILY_ID', group: 'Family' },
  { key: 'rel_to_fam_head', label: 'REL_TO_FAM_HEAD', group: 'Family' },
  { key: 'selected_family', label: 'SELECTED_FAMILY', group: 'Family' },
  { key: 'final_l3_result', label: 'FINAL_L3_RESULT', group: 'Assessment' },
];

const defaultVisibleColumns: GranteeSortKey[] = [
  'hh_id',
  'entry_id',
  'last_name',
  'first_name',
  'municipality',
  'barangay',
  'client_status',
  'hh_set',
  'sex',
  'age',
  'payment_mode',
  'lbp_account',
];

const STORAGE_VISIBLE_COLUMNS_KEY = 'cgt_grantee_visible_columns';

function getInitialVisibleColumns(): GranteeSortKey[] {
  if (typeof window === 'undefined') {
    return defaultVisibleColumns;
  }
  try {
    const saved = localStorage.getItem(STORAGE_VISIBLE_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = new Set<string>(granteeColumns.map((col) => col.key));
        const filtered = parsed.filter((k): k is GranteeSortKey => typeof k === 'string' && validKeys.has(k));
        if (filtered.length > 0) {
          return filtered;
        }
      }
    }
  } catch (err) {
    console.error('Error loading visible columns from localStorage:', err);
  }
  return defaultVisibleColumns;
}

type GranteeViewProps = {
  grantees?: GranteeRecord[];
  granteeTotalCount?: number;
  granteeActiveCount?: number;
  granteeMunicipalities?: string[];
  granteeHhSets?: string[];
  granteePaymentModesCount?: number;
  onImportExcel?: (file: File) => void;
  onSetNotice?: (notice: string) => void;
  isImporting?: boolean;
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

export function GranteeView({
  grantees = [],
  granteeTotalCount = 0,
  granteeActiveCount = 0,
  granteeMunicipalities = [],
  granteeHhSets = [],
  granteePaymentModesCount = 0,
  onImportExcel,
  onSetNotice,
  isImporting = false,
}: GranteeViewProps) {
  const [data, setData] = useState<GranteeRecord[]>(grantees);
  const [dbTotal, setDbTotal] = useState<number>(granteeTotalCount);
  const [totalCount, setTotalCount] = useState<number>(granteeTotalCount);
  const [activeCount, setActiveCount] = useState<number>(granteeActiveCount);
  const [search, setSearch] = useState('');
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [setFilter, setSetFilter] = useState('All');
  const [municipalityFilter, setMunicipalityFilter] = useState('All');
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<GranteeSortKey[]>(getInitialVisibleColumns);
  const [sortKey, setSortKey] = useState<GranteeSortKey>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [jumpPage, setJumpPage] = useState('');
  const [selectedGrantee, setSelectedGrantee] = useState<GranteeRecord | null>(null);
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

  // Sync if grantees or meta props update
  useEffect(() => {
    if (grantees.length > 0) {
      setData(grantees);
    }
    if (granteeTotalCount > 0) {
      setDbTotal(granteeTotalCount);
      setTotalCount(granteeTotalCount);
    }
    if (granteeActiveCount > 0) {
      setActiveCount(granteeActiveCount);
    }
  }, [grantees, granteeTotalCount, granteeActiveCount]);

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

  // Derived filter options across full 335k database
  const municipalities = useMemo(() => {
    if (granteeMunicipalities && granteeMunicipalities.length > 0) {
      return granteeMunicipalities;
    }
    return Array.from(new Set(data.map((d) => d.municipality).filter(Boolean))).sort();
  }, [granteeMunicipalities, data]);

  const hhSets = useMemo(() => {
    if (granteeHhSets && granteeHhSets.length > 0) {
      return granteeHhSets;
    }
    return Array.from(new Set(data.map((d) => d.hh_set).filter(Boolean))).sort();
  }, [granteeHhSets, data]);

  // Dynamic server pagination and filtering (indexed, sub-15ms)
  const fetchServerGrantees = async (params: {
    pageNumber: number;
    perPageCount: number;
    searchTerm: string;
    status: string;
    municipality: string;
    hhSet: string;
    sort: GranteeSortKey;
    direction: 'asc' | 'desc';
  }) => {
    setIsSearchingServer(true);
    try {
      const url = new URL('/grantees/search', window.location.origin);
      url.searchParams.set('page', String(params.pageNumber));
      url.searchParams.set('per_page', String(params.perPageCount));
      if (params.searchTerm.trim()) url.searchParams.set('q', params.searchTerm.trim());
      if (params.status && params.status !== 'All') url.searchParams.set('status', params.status);
      if (params.municipality && params.municipality !== 'All') url.searchParams.set('municipality', params.municipality);
      if (params.hhSet && params.hhSet !== 'All') url.searchParams.set('hh_set', params.hhSet);
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
        }
      }
    } catch (err) {
      console.error('Failed to load grantees from server', err);
    } finally {
      setIsSearchingServer(false);
    }
  };

  const fetchRecentGrantees = () => {
    fetchServerGrantees({
      pageNumber: 1,
      perPageCount: rowsPerPage,
      searchTerm: search,
      status: statusFilter,
      municipality: municipalityFilter,
      hhSet: setFilter,
      sort: sortKey,
      direction: sortDirection,
    });
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (
        grantees.length > 0 &&
        !search &&
        statusFilter === 'All' &&
        municipalityFilter === 'All' &&
        setFilter === 'All' &&
        page === 1 &&
        sortKey === 'id'
      ) {
        return;
      }
    }

    const timer = setTimeout(() => {
      fetchServerGrantees({
        pageNumber: page,
        perPageCount: rowsPerPage,
        searchTerm: search,
        status: statusFilter,
        municipality: municipalityFilter,
        hhSet: setFilter,
        sort: sortKey,
        direction: sortDirection,
      });
    }, search ? 350 : 0);

    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter, municipalityFilter, setFilter, sortKey, sortDirection]);

  // Server-backed pagination calculation
  const totalRecords = totalCount;
  const pageCount = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedData = data;

  const handleSort = (key: GranteeSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleToggleColumn = (key: GranteeSortKey) => {
    setVisibleColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setVisibleColumnKeys(granteeColumns.map((col) => col.key));
  };

  const handleResetColumns = () => {
    setVisibleColumnKeys(defaultVisibleColumns);
    try {
      localStorage.setItem(STORAGE_VISIBLE_COLUMNS_KEY, JSON.stringify(defaultVisibleColumns));
    } catch {
      // ignore
    }
    onSetNotice?.('Restored default visible columns (12/39)');
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

      const res = await fetch('/grantees/import', {
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

      onSetNotice?.(`Import queued (Job #${importId}). Processing records in background...`);

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
        const statusRes = await fetch(`/grantees/import/${importId}/status`, {
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
          fetchRecentGrantees();
          try {
            router.reload({ preserveScroll: true, preserveState: true });
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

        // If after 1 cycle no queue worker is advancing the rows, pump batch directly
        if (unchangedCycles >= 1 && statusData.status !== 'completed' && statusData.status !== 'failed') {
          const pumpRes = await fetch(`/grantees/import/${importId}/process-batch`, {
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
              fetchRecentGrantees();
              try {
                router.reload({ preserveScroll: true, preserveState: true });
              } catch {
                // ignore
              }
              return;
            }

            // Immediately continue next pump after 50ms for smooth, ultra-fast streaming
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
    // If user requests full 39 columns without active client filters, stream directly from server
    if (allColumns && dbTotal > 0 && !search.trim() && statusFilter === 'All' && setFilter === 'All' && municipalityFilter === 'All') {
      window.location.href = '/grantees/export';
      onSetNotice?.(`Streaming full database export (${dbTotal.toLocaleString()} records) with all 39 columns...`);
      return;
    }

    const exportCols = allColumns ? granteeColumns : granteeColumns.filter((col) => visibleColumnKeys.includes(col.key));
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
    link.download = `grantee_list_${allColumns ? 'all_39_columns_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onSetNotice?.(
      allColumns
        ? `Exported ${exportData.length} records with all 39 columns (REGION to FINAL_L3_RESULT)`
        : `Exported ${exportData.length} records (${exportCols.length} columns)`
    );
  };

  const filteredColumnsForPicker = useMemo(() => {
    if (!columnSearch.trim()) {
      return granteeColumns;
    }
    const q = columnSearch.toLowerCase();
    return granteeColumns.filter(
      (c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [columnSearch]);

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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-300 shadow-2xs">
              <UsersRound className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Grantee Masterlist</h1>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary dark:text-cyan-300">
                  table: grantee_list
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  39 Reference Columns
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Centralized reference database for Pantawid beneficiaries and EMV accounts. Import Excel/CSV data directly into the <span className="font-mono text-foreground">grantee_list</span> database table.
              </p>
            </div>
          </div>

          {/* Action Buttons: Import, Export, Add */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              className="gap-2 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 font-semibold"
              disabled={isImporting}
              onClick={() => {
                if (importState.status === 'processing' || importState.status === 'uploading') {
                  setShowImportModal(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              type="button"
            >
              <FileUp className={cn('h-4 w-4', (isImporting || importState.status === 'uploading' || importState.status === 'processing') && 'animate-spin')} />
              <span>
                {importState.status === 'processing'
                  ? `Importing (${importState.percentage}%)`
                  : importState.status === 'uploading'
                  ? 'Uploading file...'
                  : isImporting
                  ? 'Importing...'
                  : 'Import to grantee_list'}
              </span>
            </Button>

            <Button
              className="gap-2 shadow-xs font-semibold hover:border-primary/50 text-foreground"
              onClick={() => handleExportCsv(true)}
              title="Export all 39 reference columns from REGION to FINAL_L3_RESULT to CSV"
              type="button"
              variant="outline"
            >
              <Download className="h-4 w-4 text-primary" />
              <span>Export CSV (All 39 Columns)</span>
            </Button>

            <div className="relative">
              <Button
                className="gap-2 shadow-xs"
                onClick={() => setShowColumnPicker((v) => !v)}
                type="button"
                variant="outline"
              >
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span>Columns</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  {visibleColumnKeys.length}/{granteeColumns.length}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>

              {/* Column Selection Dropdown */}
              {showColumnPicker && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-border dark:bg-card">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-bold text-foreground">Visible Columns ({visibleColumnKeys.length}/39)</span>
                    <button
                      className="text-[11px] font-semibold text-primary hover:underline"
                      onClick={handleResetColumns}
                      type="button"
                    >
                      Reset Defaults
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

                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <button
                      className="text-primary hover:underline font-medium"
                      onClick={handleSelectAllColumns}
                      type="button"
                    >
                      Select All (39)
                    </button>
                    <button
                      className="text-muted-foreground hover:underline"
                      onClick={() => setVisibleColumnKeys(['hh_id', 'entry_id', 'last_name', 'first_name'])}
                      type="button"
                    >
                      Minimal
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1 text-xs">
                    {filteredColumnsForPicker.map((col) => {
                      const checked = visibleColumnKeys.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-secondary/60 cursor-pointer text-xs"
                        >
                          <span className="font-mono text-xs">{col.label}</span>
                          <input
                            checked={checked}
                            className="rounded border-border text-primary focus:ring-primary"
                            onChange={() => handleToggleColumn(col.key)}
                            type="checkbox"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                    <button
                      className="text-[11px] font-semibold text-primary hover:underline"
                      onClick={() => {
                        handleExportCsv(false);
                        setShowColumnPicker(false);
                      }}
                      type="button"
                    >
                      Export Visible ({visibleColumnKeys.length})
                    </button>
                    <Button
                      className="h-7 text-xs"
                      onClick={() => setShowColumnPicker(false)}
                      size="sm"
                      variant="secondary"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Summary Metric Pills */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <UsersRound className="h-5 w-5 text-primary" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Beneficiaries</div>
              <div className="text-lg font-extrabold text-foreground">
                {Math.max(dbTotal, totalCount).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Active Status</div>
              <div className="text-lg font-extrabold text-foreground">{activeCount.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <CreditCard className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Payment Modes</div>
              <div className="text-lg font-extrabold text-foreground">
                {(granteePaymentModesCount || Array.from(new Set(data.map((d) => d.payment_mode).filter(Boolean))).length)} Types
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Municipalities</div>
              <div className="text-lg font-extrabold text-foreground">{municipalities.length} Areas</div>
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
                placeholder="Search by HH ID, Entry ID, Name, City, LBP..."
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

            {/* HH Set Filter */}
            {hhSets.length > 0 && (
              <select
                className="h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none"
                onChange={(e) => {
                  setSetFilter(e.target.value);
                  setPage(1);
                }}
                value={setFilter}
              >
                <option value="All">All HH Sets</option>
                {hhSets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status Quick Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1">Status:</span>
            {['All', 'Active', 'Inactive'].map((st) => (
              <button
                key={st}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                  statusFilter.toLowerCase() === st.toLowerCase()
                    ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                type="button"
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="border-b border-border/80 bg-secondary/40 text-muted-foreground uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3 text-center w-16">Profile</th>
                {granteeColumns
                  .filter((col) => visibleColumnKeys.includes(col.key))
                  .map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 cursor-pointer select-none transition-colors hover:text-foreground"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">{col.label}</span>
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className={cn("divide-y divide-border/60 transition-opacity duration-200", isSearchingServer && "opacity-50")}>
              {paginatedData.map((record, idx) => (
                <tr
                  key={record.id || idx}
                  className="transition-colors hover:bg-secondary/40 cursor-pointer"
                  onClick={() => setSelectedGrantee(record)}
                >
                  <td className="px-4 py-3 text-center font-mono text-[11px] text-muted-foreground">
                    {startIndex + idx + 1}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary transition hover:bg-primary hover:text-primary-foreground shadow-2xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGrantee(record);
                      }}
                      title="Inspect full 39-field profile"
                      type="button"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                  {granteeColumns
                    .filter((col) => visibleColumnKeys.includes(col.key))
                    .map((col) => {
                      const value = record[col.key];

                      // Custom styling for specific key fields
                      if (col.key === 'client_status' || col.key === 'old_client_status' || col.key === 'member_status') {
                        const valUpper = String(value || '').toUpperCase();
                        const isActive = valUpper.includes('ACTIVE') && !valUpper.includes('INACTIVE');
                        return (
                          <td key={col.key} className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap',
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full shrink-0',
                                  isActive ? 'bg-emerald-500' : 'bg-rose-500',
                                )}
                              />
                              {value || '—'}
                            </span>
                          </td>
                        );
                      }

                      if (col.key === 'hh_id' || col.key === 'entry_id') {
                        return (
                          <td key={col.key} className="px-4 py-3 font-mono font-bold text-foreground">
                            {value || '—'}
                          </td>
                        );
                      }

                      if (col.key === 'hh_set') {
                        return (
                          <td key={col.key} className="px-4 py-3">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-cyan-300">
                              {value || '—'}
                            </span>
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

                      if (['birthday', 'date_tagged', 'date_of_enumeration', 'date_registered', 'date_registered_v2'].includes(col.key)) {
                        return (
                          <td key={col.key} className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDisplayDate(value)}
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} className="px-4 py-3 text-muted-foreground">
                          {value || '—'}
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
                      <UsersRound className="h-8 w-8 text-muted-foreground/40" />
                      <span className="font-semibold text-sm">No grantee records found</span>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search filters or click <span className="font-semibold text-primary">"Import to grantee_list"</span> to upload spreadsheet data.
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
              <strong className="text-foreground">{totalRecords.toLocaleString()}</strong> grantees
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
              <span>Rows per page:</span>
              <select
                className="rounded border border-border bg-card px-2 py-0.5 text-xs text-foreground focus:outline-none"
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                value={rowsPerPage}
              >
                {[10, 25, 50, 100].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <Button
              className="h-8 w-8"
              disabled={safePage <= 1 || isSearchingServer}
              onClick={() => setPage(1)}
              size="icon"
              title="First page"
              variant="outline"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              className="h-8 w-8"
              disabled={safePage <= 1 || isSearchingServer}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              size="icon"
              title="Previous page"
              variant="outline"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-3 text-xs font-semibold text-foreground">
              Page {safePage.toLocaleString()} of {pageCount.toLocaleString()}
            </span>

            <Button
              className="h-8 w-8"
              disabled={safePage >= pageCount || isSearchingServer}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              size="icon"
              title="Next page"
              variant="outline"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              className="h-8 w-8"
              disabled={safePage >= pageCount || isSearchingServer}
              onClick={() => setPage(pageCount)}
              size="icon"
              title="Last page"
              variant="outline"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>

            {/* Jump to Page */}
            <div className="flex items-center gap-1 border-l border-border/60 pl-2">
              <span className="text-[11px] text-muted-foreground">Go to:</span>
              <input
                className="h-8 w-16 rounded border border-border bg-card px-1.5 text-center text-xs text-foreground focus:border-primary focus:outline-none"
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
                placeholder={String(safePage)}
                type="number"
                value={jumpPage}
              />
              <Button
                className="h-8 px-2 text-xs"
                disabled={isSearchingServer}
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

      {/* Grantee Detail Modal: Displays all 39 columns organized logically */}
      {selectedGrantee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl dark:border-border dark:bg-card">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                  {selectedGrantee.first_name?.[0] || 'G'}{selectedGrantee.last_name?.[0] || ''}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedGrantee.first_name} {selectedGrantee.middle_name} {selectedGrantee.last_name} {selectedGrantee.ext_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono font-bold text-primary">HH ID: {selectedGrantee.hh_id || 'N/A'}</span>
                    <span>•</span>
                    <span className="font-mono">ENTRY: {selectedGrantee.entry_id || 'N/A'}</span>
                    <span>•</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                      {selectedGrantee.hh_set || 'Unassigned'}
                    </span>
                    {selectedGrantee.client_status && (
                      <>
                        <span>•</span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            String(selectedGrantee.client_status).toUpperCase().includes('ACTIVE') &&
                              !String(selectedGrantee.client_status).toUpperCase().includes('INACTIVE')
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0',
                              String(selectedGrantee.client_status).toUpperCase().includes('ACTIVE') &&
                                !String(selectedGrantee.client_status).toUpperCase().includes('INACTIVE')
                                ? 'bg-emerald-500'
                                : 'bg-rose-500',
                            )}
                          />
                          {selectedGrantee.client_status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => setSelectedGrantee(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - 39 Columns Structured in 5 Sections */}
            <div className="mt-5 space-y-6 text-xs">
              {/* 1. Identification & Demographics */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Personal Information & Identification
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">FIRST_NAME</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.first_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">MIDDLE_NAME</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.middle_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">LAST_NAME</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.last_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">EXT_NAME</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.ext_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">MAIDEN_NAME</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.maiden_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">CONTACT_NUMBER</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.contact_number || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">BIRTHDAY</span>
                    <p className="font-semibold text-foreground mt-0.5">{formatDisplayDate(selectedGrantee.birthday)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">SEX</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.sex || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">CURRENT_AGE / AGE</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.current_age || selectedGrantee.age || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">HH_GRANTEE</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.hh_grantee || '—'}</p>
                  </div>
                </div>
              </div>

              {/* 2. Geographic & Location Info */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Geographic Location (6 Reference Fields)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">REGION</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.region || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">PROVINCE</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.province || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">MUNICIPALITY</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.municipality || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">BARANGAY</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.barangay || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">PUROK</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.purok || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">DISTRICT</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.district || '—'}</p>
                  </div>
                </div>
              </div>

              {/* 3. Program & Banking Information */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  <CreditCard className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  Program, Card & Banking References
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">HH_SET</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.hh_set || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">REGISTRATION_STATUS</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.registration_status || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">PAYMENT_MODE</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.payment_mode || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">LBP_ACCOUNT</span>
                    <p className="font-mono font-bold text-primary mt-0.5">{selectedGrantee.lbp_account || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">IP_LABEL</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.ip_label || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">IP_STATUS</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.ip_status || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">DATE_OF_ENUMERATION</span>
                    <p className="font-semibold text-foreground mt-0.5">{formatDisplayDate(selectedGrantee.date_of_enumeration)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">DATE_REGISTERED (_V2)</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatDisplayDate(selectedGrantee.date_registered || selectedGrantee.date_registered_v2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Client Status & Tagging */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Status & Audit Tagging
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">CLIENT_STATUS</span>
                    <div className="mt-0.5">
                      {selectedGrantee.client_status ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            String(selectedGrantee.client_status).toUpperCase().includes('ACTIVE') &&
                              !String(selectedGrantee.client_status).toUpperCase().includes('INACTIVE')
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0',
                              String(selectedGrantee.client_status).toUpperCase().includes('ACTIVE') &&
                                !String(selectedGrantee.client_status).toUpperCase().includes('INACTIVE')
                                ? 'bg-emerald-500'
                                : 'bg-rose-500',
                            )}
                          />
                          {selectedGrantee.client_status}
                        </span>
                      ) : (
                        <p className="font-semibold text-foreground">—</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">OLD_CLIENT_STATUS</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.old_client_status || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">MEMBER_STATUS</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.member_status || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">RELATION_TO_HH</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.relation_to_hh || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">CS_CATEGORY</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.cs_category || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">DATE_TAGGED</span>
                    <p className="font-semibold text-foreground mt-0.5">{formatDisplayDate(selectedGrantee.date_tagged)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">TAGGED_BY</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.tagged_by || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">FINAL_L3_RESULT</span>
                    <p className="font-bold text-primary mt-0.5">{selectedGrantee.final_l3_result || '—'}</p>
                  </div>
                </div>
              </div>

              {/* 5. Family References */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  <Tag className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  Family & Assessment Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">FAMILY_ID</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.family_id || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">REL_TO_FAM_HEAD</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.rel_to_fam_head || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">SELECTED_FAMILY</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedGrantee.selected_family || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-[11px] text-muted-foreground">
                Database Record #{selectedGrantee.id} • DSWD Caraga Regional Portal
              </span>
              <Button onClick={() => setSelectedGrantee(null)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Live Progress Modal */}
      {showImportModal && importState.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
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
                    {importState.filename || 'grantee_spreadsheet'} • {(importState.fileSize / (1024 * 1024)).toFixed(2)} MB
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
                <strong>Zero-Lag Streaming Engine:</strong> Large files (like 330k rows) are parsed via an <code className="font-mono text-[10px] text-foreground">XMLReader</code> stream in 1,000-row chunks. RAM stays flat under 15MB with zero PC freezing. If the HH_ID already exists, its record is updated with latest values; otherwise, a new record is created.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[11px] font-mono text-muted-foreground">
                Job #{importState.importId || 'init'} • Table: grantee_list
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
