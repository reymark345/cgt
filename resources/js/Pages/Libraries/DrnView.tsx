import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  DEFAULT_SECOND_COPY_REF_PREFIX,
  deriveUserInitials,
  formatSecondCopyReference,
  SECOND_COPY_REF_EVENT,
  SECOND_COPY_REF_STORAGE_KEY,
} from '../../Components/PrintBranchGroupingControls';
import {
  TableDisplayFieldsButton,
  useTableDisplayFields,
} from '../../Components/TableDisplayFieldsControl';

export type DrnLibraryItem = {
  id: number;
  drn: string;
  request_type: string;
  added_by: string;
  date_added: string;
  created_at?: string;
  updated_at?: string;
};

type DrnViewProps = {
  currentUserName?: string;
  isAdmin?: boolean;
  onSetNotice?: (msg: string) => void;
};

const STANDARD_REQUEST_TYPES = [
  'Opening',
  'Distribution',
  'OTC Withdrawal',
  'Replacement',
  'Transfer of Fund',
  'Force PIN',
  'Locking',
  'Lifting',
];

function getCsrfToken(): string {
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DrnView({ currentUserName, isAdmin = false, onSetNotice }: DrnViewProps) {
  const [resolvedUserName, setResolvedUserName] = useState<string>(
    currentUserName?.trim() || 'Authenticated User',
  );
  const [isAdminUser, setIsAdminUser] = useState<boolean>(Boolean(isAdmin));

  useEffect(() => {
    if (currentUserName?.trim()) {
      setResolvedUserName(currentUserName.trim());
    }
  }, [currentUserName]);

  useEffect(() => {
    setIsAdminUser(Boolean(isAdmin));
  }, [isAdmin]);

  const [records, setRecords] = useState<DrnLibraryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [importing, setImporting] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [requestTypeFilter, setRequestTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [addingDrn, setAddingDrn] = useState(false);
  const [newForm, setNewForm] = useState({
    drn: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const drnColumnOptions = useMemo(
    () => [
      { key: '#', label: '#' },
      { key: 'DRN', label: 'DRN' },
      { key: 'Request Type', label: 'Request Type' },
      { key: 'Added By', label: 'Added By' },
      { key: 'Date Added', label: 'Date Added' },
      ...(isAdminUser ? [{ key: 'Actions', label: 'Actions' }] : []),
    ],
    [isAdminUser]
  );

  const {
    visibleKeys: visibleDrnColumns,
    isColVisible: isDrnColVisible,
    toggleColumn: toggleDrnColumn,
    selectAllColumns: selectAllDrnColumns,
    resetDefaultColumns: resetDefaultDrnColumns,
    isSaving: isSavingDrnColumns,
  } = useTableDisplayFields(
    'library_drn_table',
    drnColumnOptions,
    drnColumnOptions.map((c) => c.key)
  );
  const [editForm, setEditForm] = useState({
    drn: '',
    request_type: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [refPrefix, setRefPrefix] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SECOND_COPY_REF_STORAGE_KEY);
      if (saved && saved.trim()) return saved;
    }
    return DEFAULT_SECOND_COPY_REF_PREFIX;
  });
  const [savingPrefix, setSavingPrefix] = useState<boolean>(false);

  const userInitials = useMemo(() => deriveUserInitials(resolvedUserName), [resolvedUserName]);
  const fullRefPreview = useMemo(
    () => formatSecondCopyReference(refPrefix, userInitials),
    [refPrefix, userInitials],
  );

  const showMessage = useCallback(
    (text: string, type: 'success' | 'error' = 'success') => {
      setFeedback({ text, type });
      onSetNotice?.(text);
      setTimeout(() => {
        setFeedback((prev) => (prev?.text === text ? null : prev));
      }, 4000);
    },
    [onSetNotice],
  );

  const handleSaveRefPrefix = async (nextPrefixValue?: string) => {
    if (!isAdminUser) return;
    const targetPrefix = (nextPrefixValue ?? refPrefix).trim() || DEFAULT_SECOND_COPY_REF_PREFIX;
    setRefPrefix(targetPrefix);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SECOND_COPY_REF_STORAGE_KEY, targetPrefix);
      window.dispatchEvent(new CustomEvent(SECOND_COPY_REF_EVENT));
    }
    setSavingPrefix(true);
    try {
      const res = await fetch('/libraries/drn/reference-prefix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({ second_copy_ref_prefix: targetPrefix }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage(data.message || 'Global form reference prefix updated.');
      } else {
        showMessage(data.message || 'Failed to update global reference prefix.', 'error');
      }
    } catch {
      showMessage('Network error while saving reference prefix.', 'error');
    } finally {
      setSavingPrefix(false);
    }
  };

  const fetchDrnRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/libraries/drn/data', {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRecords(data.records || []);
          if (data.current_user_name) {
            setResolvedUserName(data.current_user_name);
          }
          if (typeof data.is_admin === 'boolean') {
            setIsAdminUser(data.is_admin);
          }
          if (typeof data.second_copy_ref_prefix === 'string' && data.second_copy_ref_prefix.trim()) {
            setRefPrefix(data.second_copy_ref_prefix);
            if (typeof window !== 'undefined') {
              localStorage.setItem(SECOND_COPY_REF_STORAGE_KEY, data.second_copy_ref_prefix);
            }
          }
        }
      }
    } catch {
      showMessage('Failed to load DRN library records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchDrnRecords();

    const handleRefresh = (e?: Event) => {
      const source = (e as CustomEvent<{ source?: string }>)?.detail?.source;
      if (source === 'drn-view') return;
      fetchDrnRecords();
    };
    window.addEventListener('cgt:drn-updated', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    return () => {
      window.removeEventListener('cgt:drn-updated', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [fetchDrnRecords]);

  const availableDrnCount = useMemo(
    () => records.filter((r) => !(r.request_type || '').trim()).length,
    [records],
  );

  const requestTypeOptions = useMemo(() => {
    const set = new Set<string>(STANDARD_REQUEST_TYPES);
    records.forEach((r) => {
      if (r.request_type && r.request_type.trim()) {
        set.add(r.request_type.trim());
      }
    });
    return Array.from(set);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((item) => {
      if (requestTypeFilter !== 'ALL' && item.request_type !== requestTypeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (item.drn || '').toLowerCase().includes(q) ||
        (item.request_type || '').toLowerCase().includes(q) ||
        (item.added_by || '').toLowerCase().includes(q) ||
        (item.date_added || '').toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, requestTypeFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, requestTypeFilter, perPage]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRecords.length / perPage)),
    [filteredRecords.length, perPage],
  );

  const safePage = Math.min(page, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filteredRecords.slice(start, start + perPage);
  }, [filteredRecords, safePage, perPage]);

  const handleOpenAdd = () => {
    setNewForm({
      drn: '',
    });
    setAddingDrn(true);
  };

  const handleSaveNew = async () => {
    const trimmedDrn = newForm.drn.trim();
    if (!trimmedDrn) {
      showMessage('DRN is required.', 'error');
      return;
    }

    const alreadyExists = records.some(
      (r) => (r.drn || '').trim().toLowerCase() === trimmedDrn.toLowerCase(),
    );
    if (alreadyExists) {
      showMessage(`DRN "${trimmedDrn}" already exists. Duplicate DRN is not allowed.`, 'error');
      return;
    }

    setSavingId('new');
    try {
      const res = await fetch('/libraries/drn/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({ drn: trimmedDrn }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords((prev) => [data.record, ...prev]);
        setAddingDrn(false);
        setNewForm({
          drn: '',
        });
        if (typeof data.available_drn_count === 'number') {
          window.dispatchEvent(
            new CustomEvent('cgt:drn-updated', {
              detail: { availableCount: data.available_drn_count, source: 'drn-view' },
            }),
          );
        }
        showMessage(data.message || 'DRN record added successfully.');
      } else {
        showMessage(data.message || 'Failed to add DRN record.', 'error');
      }
    } catch {
      showMessage('Network error while adding DRN record.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (item: DrnLibraryItem) => {
    if (!isAdminUser) return;
    setEditingId(item.id);
    setEditForm({
      drn: item.drn || '',
      request_type: item.request_type || '',
    });
  };

  const handleSaveEdit = async (id: number) => {
    if (!isAdminUser) return;
    const trimmedDrn = editForm.drn.trim();
    if (!trimmedDrn) {
      showMessage('DRN is required.', 'error');
      return;
    }

    const duplicateOther = records.some(
      (r) => r.id !== id && (r.drn || '').trim().toLowerCase() === trimmedDrn.toLowerCase(),
    );
    if (duplicateOther) {
      showMessage(`DRN "${trimmedDrn}" already exists. Duplicate DRN is not allowed.`, 'error');
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch('/libraries/drn/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          id,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords((prev) => prev.map((r) => (r.id === id ? data.record : r)));
        setEditingId(null);
        if (typeof data.available_drn_count === 'number') {
          window.dispatchEvent(
            new CustomEvent('cgt:drn-updated', {
              detail: { availableCount: data.available_drn_count, source: 'drn-view' },
            }),
          );
        }
        showMessage(data.message || 'DRN record updated successfully.');
      } else {
        showMessage(data.message || 'Failed to update DRN record.', 'error');
      }
    } catch {
      showMessage('Network error while updating DRN record.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item: DrnLibraryItem) => {
    if (!window.confirm(`Remove DRN "${item.drn}" (${item.request_type})?`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      const res = await fetch(`/libraries/drn/${item.id}/destroy`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords((prev) => prev.filter((r) => r.id !== item.id));
        if (typeof data.available_drn_count === 'number') {
          window.dispatchEvent(
            new CustomEvent('cgt:drn-updated', {
              detail: { availableCount: data.available_drn_count, source: 'drn-view' },
            }),
          );
        }
        showMessage(data.message || 'DRN record removed.');
      } else {
        showMessage(data.message || 'Failed to delete DRN record.', 'error');
      }
    } catch {
      showMessage('Network error while deleting DRN record.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_name', file.name);

      if (file.size <= 15 * 1024 * 1024) {
        try {
          const base64DataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          if (base64DataUrl) {
            formData.append('file_base64', base64DataUrl);
          }
        } catch {
          // Proceed with standard file field if FileReader fails
        }
      }

      const res = await fetch('/libraries/drn/import', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.records)) {
          setRecords(data.records);
        } else {
          await fetchDrnRecords();
        }
        if (typeof data.available_drn_count === 'number') {
          window.dispatchEvent(
            new CustomEvent('cgt:drn-updated', {
              detail: { availableCount: data.available_drn_count, source: 'drn-view' },
            }),
          );
        }
        showMessage(data.message || 'Excel file imported successfully.');
      } else {
        showMessage(data.message || 'Failed to import Excel file.', 'error');
      }
    } catch {
      showMessage('Network error while importing Excel file.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      ['DRN'],
      ['DRN-2026-0001'],
      ['DRN-2026-0002'],
      ['DRN-2026-0003'],
    ]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DRN_Import_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
                Libraries — DRN
              </h1>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary dark:text-cyan-300">
                Document Reference Numbers
              </span>
              {!loading && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider ${
                    availableDrnCount <= 50
                      ? 'border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  Available DRN: {availableDrnCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage Document Reference Numbers (DRN) by Request Type. Add individual DRNs or import in bulk via Excel (.xlsx / .csv).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feedback && (
            <div
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <input
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelFileChange}
            ref={fileInputRef}
            type="file"
          />

          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
            onClick={handleDownloadTemplate}
            title="Download Excel/CSV Import Template"
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
            Template
          </button>

          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-50"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {importing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {importing ? 'Importing...' : 'Import Excel'}
          </button>

          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
            disabled={loading}
            onClick={fetchDrnRecords}
            type="button"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global 2nd Form Signatory Reference Prefix Setting (Shared Across All 8 Request Pages) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card px-5 py-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Global Form Setting
          </span>
          <span className="text-xs font-bold text-foreground">
            2nd Form Reference Prefix (Under Regional Director):
          </span>
          <span className="text-xs text-muted-foreground">
            Applies automatically to all 8 Request pages &amp; all generated forms + logged-in user initials.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdminUser ? (
            <>
              <div className="flex items-center">
                <input
                  className="h-8 w-44 rounded-l-lg border border-border bg-background px-2.5 font-mono text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  onChange={(e) => setRefPrefix(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRefPrefix();
                  }}
                  placeholder="JSP/CDC/mjso/"
                  type="text"
                  value={refPrefix}
                />
                <span className="inline-flex h-8 items-center rounded-r-lg border border-l-0 border-border bg-secondary/70 px-2.5 font-mono text-xs font-bold text-foreground">
                  {userInitials}
                </span>
              </div>

              <button
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                disabled={savingPrefix}
                onClick={() => handleSaveRefPrefix()}
                type="button"
              >
                <Check className="h-3.5 w-3.5" />
                {savingPrefix ? 'Saving...' : 'Save Prefix'}
              </button>

              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                disabled={savingPrefix}
                onClick={() => handleSaveRefPrefix(DEFAULT_SECOND_COPY_REF_PREFIX)}
                title="Reset to JSP/CDC/mjso/"
                type="button"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </>
          ) : null}

          <div className="rounded-lg border border-border/70 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground">
            Preview ({resolvedUserName}):{' '}
            <strong className="font-mono text-foreground">{fullRefPreview}</strong>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
        {/* Filter & Search Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border/70 bg-secondary/20 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search DRN, Request Type, Added By, Date Added..."
                type="text"
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setRequestTypeFilter(e.target.value)}
              value={requestTypeFilter}
            >
              <option value="ALL">All Request Types</option>
              {requestTypeOptions.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>

            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:opacity-90"
              onClick={handleOpenAdd}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add DRN
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span>
                Showing <strong className="text-foreground">{filteredRecords.length}</strong> of{' '}
                <strong className="text-foreground">{records.length}</strong> DRN records
              </span>
            </div>
            <TableDisplayFieldsButton
              isAdmin={isAdminUser}
              columns={drnColumnOptions}
              visibleKeys={visibleDrnColumns}
              onToggleColumn={toggleDrnColumn}
              onSelectAll={selectAllDrnColumns}
              onResetDefaults={resetDefaultDrnColumns}
              isSaving={isSavingDrnColumns}
            />
          </div>
        </div>

        {/* Datalist for Request Type suggestions */}
        <datalist id="drn-request-type-options">
          {requestTypeOptions.map((rt) => (
            <option key={rt} value={rt} />
          ))}
        </datalist>

        {/* Add DRN Bar (only DRN input) */}
        {addingDrn && (
          <div className="flex flex-wrap items-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10">
            <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground">
              Add DRN
            </span>
            <input
              autoFocus
              className="min-w-[260px] flex-1 max-w-md rounded-lg border border-primary/50 bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setNewForm({ drn: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNew();
                if (e.key === 'Escape') setAddingDrn(false);
              }}
              placeholder="Enter DRN..."
              type="text"
              value={newForm.drn}
            />
            <div className="inline-flex items-center gap-1.5">
              <button
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                disabled={savingId === 'new'}
                onClick={handleSaveNew}
                type="button"
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => setAddingDrn(false)}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {isDrnColVisible('#') && <th className="w-14 px-4 py-3 text-center">#</th>}
                {isDrnColVisible('DRN') && <th className="px-4 py-3">DRN</th>}
                {isDrnColVisible('Request Type') && <th className="px-4 py-3">Request Type</th>}
                {isDrnColVisible('Added By') && <th className="px-4 py-3">Added By</th>}
                {isDrnColVisible('Date Added') && <th className="px-4 py-3">Date Added</th>}
                {isAdminUser && isDrnColVisible('Actions') && (
                  <th className="w-36 px-4 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={visibleDrnColumns.length || 1}
                  >
                    Loading DRN records...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={visibleDrnColumns.length || 1}
                  >
                    No DRN records found. Click <strong>Add DRN</strong> or <strong>Import Excel</strong> to add records.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item, idx) => {
                  const rowNum = (safePage - 1) * perPage + idx + 1;
                  const isEditing = isAdminUser && editingId === item.id;

                  return (
                    <tr
                      className={`transition hover:bg-secondary/30 ${
                        isEditing ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                      key={item.id}
                      onDoubleClick={() => {
                        if (isAdminUser && !isEditing) startEdit(item);
                      }}
                    >
                      {isDrnColVisible('#') && (
                        <td className="px-4 py-3 text-center font-mono text-[11px] text-muted-foreground">
                          {rowNum}
                        </td>
                      )}
                      {isDrnColVisible('DRN') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                              onChange={(e) => setEditForm((s) => ({ ...s, drn: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              type="text"
                              value={editForm.drn}
                            />
                          ) : (
                            <span className="font-mono text-xs font-bold text-foreground">{item.drn}</span>
                          )}
                        </td>
                      )}
                      {isDrnColVisible('Request Type') && (
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                              list="drn-request-type-options"
                              onChange={(e) =>
                                setEditForm((s) => ({ ...s, request_type: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              type="text"
                              value={editForm.request_type}
                            />
                          ) : item.request_type ? (
                            <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary dark:text-cyan-300">
                              {item.request_type}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      {isDrnColVisible('Added By') && (
                        <td className="px-4 py-3 text-foreground">
                          {item.added_by || resolvedUserName}
                        </td>
                      )}
                      {isDrnColVisible('Date Added') && (
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.date_added || '—'}
                        </td>
                      )}
                      {isAdminUser && isDrnColVisible('Actions') && (
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                                disabled={savingId === item.id}
                                onClick={() => handleSaveEdit(item.id)}
                                type="button"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Save
                              </button>
                              <button
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                onClick={() => setEditingId(null)}
                                type="button"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:bg-secondary"
                                onClick={() => startEdit(item)}
                                title="Edit DRN"
                                type="button"
                              >
                                <Edit3 className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
                                disabled={deletingId === item.id}
                                onClick={() => handleDelete(item)}
                                title="Delete DRN"
                                type="button"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 border-t border-border/70 bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page:</span>
            <select
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setPerPage(Number(e.target.value))}
              value={perPage}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              Page <strong className="text-foreground">{safePage}</strong> of{' '}
              <strong className="text-foreground">{totalPages}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:opacity-40"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

