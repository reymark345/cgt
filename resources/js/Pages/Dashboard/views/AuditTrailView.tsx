import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Code2,
  Copy,
  Check,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Globe,
  History,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Terminal,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

export type AuditTrailRecord = {
  id: number;
  user_id?: number | null;
  user_name: string;
  user_email?: string;
  user_position?: string;
  user_division?: string;
  method: string;
  module: string;
  action: string;
  route_name?: string;
  url: string;
  target_id?: string;
  payload?: Record<string, unknown> | unknown[];
  status_code: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  created_at_human?: string;
};

type AuditTrailViewProps = {
  isActive?: boolean;
  onCountChange?: (count: number) => void;
  onSetNotice?: (notice: string) => void;
};

type SortKey = 'id' | 'created_at' | 'user_name' | 'module' | 'action' | 'target_id' | 'url' | 'status_code' | 'ip_address';

function getInitials(name: string) {
  return (name || 'SY')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getModuleBadgeStyle(moduleName: string) {
  const lower = (moduleName || '').toLowerCase();
  if (lower.includes('grantee')) {
    return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300';
  }
  if (lower.includes('emv')) {
    return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300';
  }
  if (lower.includes('payroll')) {
    return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300';
  }
  if (lower.includes('inquiry')) {
    return 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:bg-violet-500/20 dark:text-violet-300';
  }
  if (lower.includes('auth')) {
    return 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300';
  }
  return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300';
}

export function AuditTrailView({ isActive = false, onCountChange, onSetNotice }: AuditTrailViewProps) {
  const [records, setRecords] = useState<AuditTrailRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');

  // Filter options from server
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [lastPage, setLastPage] = useState<number>(1);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [totalInDb, setTotalInDb] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditTrailRecord | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchAuditTrails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        module: moduleFilter,
        user: userFilter,
        page: String(currentPage),
        per_page: String(perPage),
        sort_key: sortKey,
        sort_direction: sortDirection,
      });

      const res = await fetch(`/audit-trails/search?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRecords(json.data || []);
          setCurrentPage(json.meta?.current_page ?? 1);
          setLastPage(json.meta?.last_page ?? 1);
          setFilteredTotal(json.meta?.total ?? 0);
          const dbTotal = json.meta?.total_in_db ?? 0;
          setTotalInDb(dbTotal);
          setTodayCount(json.meta?.today_count ?? 0);
          setAvailableModules(json.filters?.modules || []);
          setAvailableUsers(json.filters?.users || []);
          if (onCountChange) {
            onCountChange(dbTotal);
          }
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, moduleFilter, userFilter, currentPage, perPage, sortKey, sortDirection, onCountChange]);

  useEffect(() => {
    fetchAuditTrails();
  }, [fetchAuditTrails]);

  useEffect(() => {
    if (isActive) {
      fetchAuditTrails();
    }
  }, [isActive, fetchAuditTrails]);

  const handleSort = (column: SortKey) => {
    if (sortKey === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setModuleFilter('ALL');
    setUserFilter('ALL');
    setSortKey('id');
    setSortDirection('desc');
    setCurrentPage(1);
    onSetNotice?.('Audit trail filters reset');
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      q: debouncedQuery,
      module: moduleFilter,
      user: userFilter,
    });
    window.location.href = `/audit-trails/export?${params.toString()}`;
    onSetNotice?.('Exporting Audit Trail POST logs to CSV...');
  };

  const handleCopyPayload = (payload: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(payload ?? {}, null, 2));
    setCopiedPayload(true);
    window.setTimeout(() => setCopiedPayload(false), 2000);
  };

  const renderSortIcon = (col: SortKey) => {
    if (sortKey !== col) {
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs dark:border-border dark:bg-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs dark:bg-primary/20 dark:text-cyan-300">
              <History className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Audit Trails</h1>
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary dark:text-cyan-300">
                  table: audit_trail
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  POST Method Only
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                System-wide activity log tracing every user POST operation (data imports, service requests, record creations, updates, deletions, and authentication events).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-9 gap-1.5 text-xs font-semibold"
              disabled={loading}
              onClick={() => {
                fetchAuditTrails();
                onSetNotice?.('Refreshed audit trail records');
              }}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              Refresh Logs
            </Button>
            <Button
              className="h-9 gap-1.5 text-xs font-semibold"
              onClick={handleExportCsv}
              size="sm"
              variant="default"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-background/60 p-4 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total POST Logs
              </div>
              <div className="mt-0.5 text-2xl font-black tracking-tight text-foreground">
                {totalInDb.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-background/60 p-4 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Today&apos;s POST Activity
              </div>
              <div className="mt-0.5 text-2xl font-black tracking-tight text-foreground">
                {todayCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-background/60 p-4 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Users Traced
              </div>
              <div className="mt-0.5 text-2xl font-black tracking-tight text-foreground">
                {availableUsers.length.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-background/60 p-4 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Modules Affected
              </div>
              <div className="mt-0.5 text-2xl font-black tracking-tight text-foreground">
                {availableModules.length.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs dark:border-border dark:bg-card">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9 pr-8 text-xs"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, action, module, HH ID / target, URL, or IP address..."
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Module Filter */}
            <select
              aria-label="Filter by Module"
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setCurrentPage(1);
              }}
              value={moduleFilter}
            >
              <option value="ALL">All Modules</option>
              {availableModules.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>

            {/* User Filter */}
            <select
              aria-label="Filter by User"
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              value={userFilter}
            >
              <option value="ALL">All Users</option>
              {availableUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            {(searchQuery || moduleFilter !== 'ALL' || userFilter !== 'ALL') && (
              <Button
                className="h-9 gap-1.5 text-xs"
                onClick={handleResetFilters}
                size="sm"
                variant="ghost"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>#</span>
                    {renderSortIcon('id')}
                  </div>
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    <span>TIMESTAMP</span>
                    {renderSortIcon('created_at')}
                  </div>
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('user_name')}
                >
                  <div className="flex items-center gap-1">
                    <span>USER</span>
                    {renderSortIcon('user_name')}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3">METHOD</th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('module')}
                >
                  <div className="flex items-center gap-1">
                    <span>MODULE</span>
                    {renderSortIcon('module')}
                  </div>
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center gap-1">
                    <span>ACTION PERFORMED</span>
                    {renderSortIcon('action')}
                  </div>
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('target_id')}
                >
                  <div className="flex items-center gap-1">
                    <span>TARGET / HH ID</span>
                    {renderSortIcon('target_id')}
                  </div>
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('url')}
                >
                  <div className="flex items-center gap-1">
                    <span>ENDPOINT</span>
                    {renderSortIcon('url')}
                  </div>
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('ip_address')}
                >
                  <div className="flex items-center gap-1">
                    <span>IP ADDRESS</span>
                    {renderSortIcon('ip_address')}
                  </div>
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-foreground"
                  onClick={() => handleSort('status_code')}
                >
                  <div className="flex items-center gap-1">
                    <span>STATUS</span>
                    {renderSortIcon('status_code')}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right">PAYLOAD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && records.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-muted-foreground" colSpan={11}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                      <span>Loading audit trail logs...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-muted-foreground" colSpan={11}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="h-8 w-8 text-muted-foreground/50" />
                      <div className="font-semibold text-foreground">No POST Audit Trail Logs Found</div>
                      <p className="max-w-md text-xs text-muted-foreground">
                        Every POST action performed by users (such as adding requests, importing files, updating or deleting records) will automatically appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((log) => {
                  const isSuccessStatus = log.status_code >= 200 && log.status_code < 400;
                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-secondary/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-semibold text-muted-foreground">
                        #{log.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-foreground">{log.created_at || '—'}</div>
                        {log.created_at_human && (
                          <div className="text-[10px] text-muted-foreground">{log.created_at_human}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">
                            {getInitials(log.user_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{log.user_name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {log.user_position || log.user_email || log.user_division || 'Portal User'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {log.method}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                            getModuleBadgeStyle(log.module),
                          )}
                        >
                          {log.module}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-foreground" title={log.action}>
                        {log.action}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {log.target_id ? (
                          <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                            {log.target_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {log.url}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {log.ip_address || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold',
                            isSuccessStatus
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                          )}
                        >
                          {log.status_code}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button
                          className="h-7 gap-1 px-2.5 text-[11px]"
                          onClick={() => setSelectedLog(log)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Showing{' '}
              <span className="font-semibold text-foreground">
                {filteredTotal === 0 ? 0 : (currentPage - 1) * perPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * perPage, filteredTotal)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredTotal.toLocaleString()}</span> POST logs
            </span>
            <select
              aria-label="Rows per page"
              className="ml-2 h-7 rounded border border-border bg-background px-2 text-xs text-foreground"
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              value={perPage}
            >
              {[15, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              className="h-7 w-7"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              size="icon"
              variant="outline"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              className="h-7 w-7"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2.5 text-xs font-semibold text-foreground">
              Page {currentPage} of {lastPage}
            </span>
            <Button
              className="h-7 w-7"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              size="icon"
              variant="outline"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              className="h-7 w-7"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage(lastPage)}
              size="icon"
              variant="outline"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Inspect POST Payload Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">Audit Trail Record #{selectedLog.id}</h3>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedLog.method}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{selectedLog.action}</p>
                </div>
              </div>
              <Button
                className="h-8 w-8"
                onClick={() => setSelectedLog(null)}
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">User</div>
                  <div className="mt-1 font-semibold text-foreground">{selectedLog.user_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {selectedLog.user_email || selectedLog.user_position || '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Timestamp & IP</div>
                  <div className="mt-1 font-semibold text-foreground">{selectedLog.created_at}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    IP: {selectedLog.ip_address || '—'} | Status: {selectedLog.status_code}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Module & Endpoint</div>
                  <div className="mt-1 font-semibold text-foreground">{selectedLog.module}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{selectedLog.url}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Target / HH ID</div>
                  <div className="mt-1 font-mono font-semibold text-foreground">
                    {selectedLog.target_id || '—'}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground" title={selectedLog.user_agent}>
                    {selectedLog.user_agent || '—'}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Submitted POST Payload (JSON)
                  </span>
                  <Button
                    className="h-7 gap-1 px-2 text-[11px]"
                    onClick={() => handleCopyPayload(selectedLog.payload)}
                    size="sm"
                    variant="ghost"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                </div>
                <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-slate-950 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-300">
                  {JSON.stringify(selectedLog.payload ?? {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end border-t border-border/70 px-5 py-3">
              <Button onClick={() => setSelectedLog(null)} size="sm" variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

