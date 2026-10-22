import { Check, Columns, RotateCcw, Shield } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

export type TableColumnOption = {
  key: string;
  label: string;
};

export type TableColumnDefinition = TableColumnOption;

type SharedDisplayPageProps = {
  auth?: {
    user?: {
      id?: number;
      role?: string | null;
      is_admin?: boolean;
    } | null;
  };
  inquiry_display_fields?: {
    grantee_fields?: string[] | null;
    emv_fields?: string[] | null;
    payroll_fields?: string[] | null;
    table_fields?: Record<string, string[]> | null;
  } | null;
};

// Module-level cache so switching views inside Dashboard retains the latest saved display fields immediately
let cachedTableFieldsMap: Record<string, string[]> = {};

export function useTableDisplayFields(
  tableKey: string,
  columns: TableColumnOption[],
  defaultVisibleKeys?: string[]
) {
  const { auth, inquiry_display_fields } = usePage<SharedDisplayPageProps>().props;

  const isAdmin = useMemo(() => {
    const u = auth?.user;
    if (!u) return false;
    if (u.is_admin) return true;
    return typeof u.role === 'string' && u.role.trim().toLowerCase() === 'admin';
  }, [auth?.user]);

  const allKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const fallbackKeys = useMemo(
    () => (defaultVisibleKeys && defaultVisibleKeys.length > 0 ? defaultVisibleKeys : allKeys),
    [defaultVisibleKeys, allKeys]
  );

  const resolveInitialKeys = useCallback((): string[] => {
    const fromCache = cachedTableFieldsMap[tableKey];
    if (Array.isArray(fromCache) && fromCache.length > 0) {
      const valid = fromCache.filter((k) => allKeys.includes(k));
      if (valid.length > 0) return valid;
    }
    const fromShared = inquiry_display_fields?.table_fields?.[tableKey];
    if (Array.isArray(fromShared) && fromShared.length > 0) {
      const valid = fromShared.filter((k) => allKeys.includes(k));
      if (valid.length > 0) {
        cachedTableFieldsMap[tableKey] = valid;
        return valid;
      }
    }
    return fallbackKeys;
  }, [tableKey, allKeys, fallbackKeys, inquiry_display_fields]);

  const [visibleKeys, setVisibleKeys] = useState<string[]>(resolveInitialKeys);
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync when tableKey changes
  useEffect(() => {
    setVisibleKeys(resolveInitialKeys());
  }, [tableKey, resolveInitialKeys]);

  // Fetch latest from server on mount & listen for cross-component updates
  useEffect(() => {
    let isMounted = true;

    const loadFromServer = async () => {
      try {
        const res = await fetch('/inquiry/display-fields', {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
        if (!res.ok) return;
        const json = await res.json();
        const serverMap = json?.display_fields?.table_fields;
        if (serverMap && typeof serverMap === 'object') {
          cachedTableFieldsMap = { ...cachedTableFieldsMap, ...serverMap };
          const savedForTable = serverMap[tableKey];
          if (isMounted && Array.isArray(savedForTable) && savedForTable.length > 0) {
            const valid = savedForTable.filter((k: string) => allKeys.includes(k));
            if (valid.length > 0) {
              setVisibleKeys(valid);
            }
          }
        }
      } catch {
        // Ignore network errors and use fallback/shared props
      }
    };

    loadFromServer();

    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ tableKey?: string; keys?: string[] }>;
      if (customEvent.detail?.tableKey === tableKey && Array.isArray(customEvent.detail.keys)) {
        setVisibleKeys(customEvent.detail.keys);
      }
    };

    window.addEventListener('cgt:table-display-fields-updated', handleUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('cgt:table-display-fields-updated', handleUpdated);
    };
  }, [tableKey, allKeys]);

  const persistKeys = useCallback(
    async (nextKeys: string[]) => {
      if (!isAdmin) return;
      cachedTableFieldsMap[tableKey] = nextKeys;
      setVisibleKeys(nextKeys);
      window.dispatchEvent(
        new CustomEvent('cgt:table-display-fields-updated', {
          detail: { tableKey, keys: nextKeys },
        })
      );

      setIsSaving(true);
      try {
        const metaToken =
          (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
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
            table_fields: {
              [tableKey]: nextKeys,
            },
          }),
        });
      } catch {
        // Ignore network error
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, tableKey, auth?.user?.id]
  );

  const toggleColumn = useCallback(
    (key: string) => {
      if (!isAdmin) return;
      const exists = visibleKeys.includes(key);
      if (exists && visibleKeys.length <= 1) {
        return; // Keep at least 1 column visible
      }
      const next = exists
        ? visibleKeys.filter((k) => k !== key)
        : allKeys.filter((k) => visibleKeys.includes(k) || k === key);
      persistKeys(next);
    },
    [isAdmin, visibleKeys, allKeys, persistKeys]
  );

  const selectAllColumns = useCallback(() => {
    if (!isAdmin) return;
    persistKeys([...allKeys]);
  }, [isAdmin, allKeys, persistKeys]);

  const resetDefaultColumns = useCallback(() => {
    if (!isAdmin) return;
    persistKeys([...fallbackKeys]);
  }, [isAdmin, fallbackKeys, persistKeys]);

  const isColVisible = useCallback(
    (key: string) => visibleKeys.includes(key),
    [visibleKeys]
  );

  return {
    isAdmin,
    visibleKeys,
    isColVisible,
    isColumnVisible: isColVisible,
    toggleColumn,
    selectAllColumns,
    showAllColumns: selectAllColumns,
    resetDefaultColumns,
    isSaving,
    columns,
  };
}

type TableDisplayFieldsButtonProps = {
  isAdmin?: boolean;
  columns: TableColumnOption[];
  visibleKeys: string[];
  onToggleColumn: (key: string) => void;
  onSelectAll?: () => void;
  onShowAll?: () => void;
  onResetDefaults: () => void;
  onNotice?: (notice: string) => void;
  isSaving?: boolean;
  align?: 'left' | 'right';
};

export function TableDisplayFieldsButton({
  isAdmin: isAdminProp,
  columns,
  visibleKeys,
  onToggleColumn,
  onSelectAll,
  onShowAll,
  onResetDefaults,
  isSaving = false,
  align = 'right',
}: TableDisplayFieldsButtonProps) {
  const { auth } = usePage<SharedDisplayPageProps>().props;
  const resolvedIsAdmin = useMemo(() => {
    if (typeof isAdminProp === 'boolean') return isAdminProp;
    const u = auth?.user;
    if (!u) return false;
    if (u.is_admin) return true;
    return typeof u.role === 'string' && u.role.trim().toLowerCase() === 'admin';
  }, [isAdminProp, auth?.user]);
  const handleSelectAll = onSelectAll || onShowAll || (() => {});
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  if (!resolvedIsAdmin) {
    return null;
  }

  const filteredColumns = search.trim()
    ? columns.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.key.toLowerCase().includes(search.toLowerCase())
      )
    : columns;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Admin Only: Configure visible table columns for all users"
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
          open
            ? 'border-primary bg-primary/10 text-primary dark:border-cyan-400 dark:bg-primary/20 dark:text-cyan-300'
            : 'border-border bg-background text-foreground hover:bg-secondary'
        }`}
      >
        <Columns className="h-3.5 w-3.5 text-primary dark:text-cyan-300" />
        <span>Display Fields</span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary dark:bg-primary/20 dark:text-cyan-300">
          {visibleKeys.length}/{columns.length}
        </span>
      </button>

      {open && (
        <div
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } z-50 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-xl dark:border-border dark:bg-card`}
        >
          <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary dark:text-cyan-300" />
              <span className="text-xs font-bold text-foreground">Display Fields</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-primary hover:underline dark:text-cyan-300"
              >
                All
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={onResetDefaults}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                title="Reset to default columns"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Default
              </button>
            </div>
          </div>

          {columns.length > 7 && (
            <div className="mb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter columns..."
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          )}

          <div className="max-h-64 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredColumns.map((col) => {
              const isChecked = visibleKeys.includes(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => onToggleColumn(col.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                    isChecked
                      ? 'bg-primary/10 font-semibold text-foreground dark:bg-primary/20'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  }`}
                >
                  <span className="truncate pr-2">{col.label}</span>
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isChecked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background'
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
            <span>Applies to all users</span>
            {isSaving && <span className="font-semibold text-primary">Saving...</span>}
          </div>
        </div>
      )}
    </div>
  );
}

