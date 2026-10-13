import { useState, useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Eye,
  Filter,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';

export type UserListItem = {
  id: number;
  employeeId?: string | null;
  idNumber?: string | null;
  name: string;
  email?: string | null;
  username?: string | null;
  avatar?: string | null;
  position?: string | null;
  employmentStatus?: string | null;
  portalStatus?: string | null;
  division?: string | null;
  section?: string | null;
  areaOfAssignment?: string | null;
  contactNumber?: string | null;
  lastLogin?: string | null;
};

type UsersViewProps = {
  users: UserListItem[];
};

type SortField = 'name' | 'employeeId' | 'position' | 'division' | 'status';
type SortOrder = 'asc' | 'desc';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-600 to-indigo-600 text-white',
    'from-emerald-600 to-teal-600 text-white',
    'from-violet-600 to-purple-600 text-white',
    'from-amber-600 to-orange-600 text-white',
    'from-rose-600 to-pink-600 text-white',
    'from-cyan-600 to-blue-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function UsersView({ users = [] }: UsersViewProps) {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [employmentFilter, setEmploymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(10);

  // Selected user for details modal
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Unique options for filter dropdowns
  const uniqueDivisions = useMemo(() => {
    const list = users
      .map((u) => u.division?.trim())
      .filter((d): d is string => Boolean(d));
    return Array.from(new Set(list)).sort();
  }, [users]);

  const uniqueEmploymentStatuses = useMemo(() => {
    const list = users
      .map((u) => u.employmentStatus?.trim())
      .filter((s): s is string => Boolean(s));
    return Array.from(new Set(list)).sort();
  }, [users]);

  // Compute KPI metrics
  const totalCount = users.length;
  const activeCount = users.filter((u) => (u.portalStatus?.toLowerCase() || 'active') === 'active').length;
  const totalDivisions = uniqueDivisions.length;
  const totalPositions = useMemo(() => {
    const positions = users.map((u) => u.position?.trim()).filter(Boolean);
    return new Set(positions).size;
  }, [users]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
          (u.idNumber && u.idNumber.toLowerCase().includes(q)) ||
          (u.position && u.position.toLowerCase().includes(q)) ||
          (u.division && u.division.toLowerCase().includes(q)) ||
          (u.section && u.section.toLowerCase().includes(q)) ||
          (u.areaOfAssignment && u.areaOfAssignment.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
      );
    }

    // Division filter
    if (divisionFilter !== 'ALL') {
      result = result.filter((u) => (u.division || '') === divisionFilter);
    }

    // Employment filter
    if (employmentFilter !== 'ALL') {
      result = result.filter((u) => (u.employmentStatus || '') === employmentFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(
        (u) => (u.portalStatus || 'Active').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'employeeId':
          valA = (a.employeeId || '').toLowerCase();
          valB = (b.employeeId || '').toLowerCase();
          break;
        case 'position':
          valA = (a.position || '').toLowerCase();
          valB = (b.position || '').toLowerCase();
          break;
        case 'division':
          valA = (a.division || '').toLowerCase();
          valB = (b.division || '').toLowerCase();
          break;
        case 'status':
          valA = (a.portalStatus || 'Active').toLowerCase();
          valB = (b.portalStatus || 'Active').toLowerCase();
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, divisionFilter, employmentFilter, statusFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const effectivePageSize = pageSize === 'ALL' ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    if (pageSize === 'ALL') return filteredUsers;
    const start = (validCurrentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, validCurrentPage, pageSize]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Reset filters
  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    divisionFilter !== 'ALL' ||
    employmentFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setDivisionFilter('ALL');
    setEmploymentFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredUsers.length) return;

    const headers = [
      'Name',
      'Username',
      'Employee ID',
      'ID Number',
      'Position',
      'Employment Status',
      'Division',
      'Section',
      'Area of Assignment',
      'Email',
      'Contact Number',
      'Status',
      'Last Login',
    ];

    const rows = filteredUsers.map((u) => [
      `"${u.name || ''}"`,
      `"${u.username || ''}"`,
      `"${u.employeeId || ''}"`,
      `"${u.idNumber || ''}"`,
      `"${u.position || ''}"`,
      `"${u.employmentStatus || ''}"`,
      `"${u.division || ''}"`,
      `"${u.section || ''}"`,
      `"${u.areaOfAssignment || ''}"`,
      `"${u.email || ''}"`,
      `"${u.contactNumber || ''}"`,
      `"${u.portalStatus || 'Active'}"`,
      `"${u.lastLogin || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `grants_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="mx-auto w-full max-w-[1800px] space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm dark:border-border dark:bg-card">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-primary dark:text-cyan-300">
                <ShieldCheck className="h-3 w-3" />
                Caraga Portal SSO Synced
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <UsersRound className="h-3.5 w-3.5" />
                User Access & Directory
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              User Directory & Credentials
            </h1>

            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              View and manage authenticated personnel synced from the regional SSO portal. Access employee
              identifications, office designations, and division convergence data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="gap-2 shadow-xs font-semibold"
              onClick={handleExportCSV}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Users</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-foreground">
              {totalCount.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {activeCount} Active Personnel
              </span>
              <span>100% Synced</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${totalCount ? Math.round((activeCount / totalCount) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Accounts</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-foreground">
              {activeCount.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              SSO Authenticated
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-emerald-500 w-full" />
            </div>
          </div>
        </div>

        {/* Operating Divisions */}
        <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-violet-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Divisions Represented</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-foreground">
              {totalDivisions.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{uniqueDivisions[0] || 'Regional Offices'}</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-violet-500 w-3/4" />
            </div>
          </div>
        </div>

        {/* Assigned Designations */}
        <div className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unique Designations</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-foreground">
              {totalPositions.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Technical & Admin Roles</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-amber-500 w-2/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-border/80 bg-card shadow-sm dark:border-border dark:bg-card">
        {/* Table Controls & Filter Toolbar */}
        <div className="flex flex-col gap-3.5 border-b border-border/80 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 pr-8 text-xs sm:text-sm h-9 bg-background/60"
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, ID, username, position, office..."
                value={searchTerm}
              />
              {searchTerm && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Division Filter */}
            {uniqueDivisions.length > 0 && (
              <div className="relative">
                <select
                  aria-label="Filter by Division"
                  className="h-9 w-full sm:w-auto rounded-md border border-input bg-background/60 px-3 py-1 text-xs font-medium text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  onChange={(e) => {
                    setDivisionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  value={divisionFilter}
                >
                  <option value="ALL">All Offices / Divisions</option>
                  {uniqueDivisions.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Employment Status Filter */}
            {uniqueEmploymentStatuses.length > 0 && (
              <div className="relative">
                <select
                  aria-label="Filter by Employment Status"
                  className="h-9 w-full sm:w-auto rounded-md border border-input bg-background/60 px-3 py-1 text-xs font-medium text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  onChange={(e) => {
                    setEmploymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  value={employmentFilter}
                >
                  <option value="ALL">All Employment Statuses</option>
                  {uniqueEmploymentStatuses.map((stat) => (
                    <option key={stat} value={stat}>
                      {stat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleResetFilters}
                size="sm"
                variant="ghost"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Rows per page selector & Result count */}
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground sm:justify-end">
            <span className="font-medium">
              Found <strong className="text-foreground">{totalItems}</strong> users
            </span>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Rows per page:</span>
              <select
                aria-label="Rows per page"
                className="h-8 rounded-md border border-input bg-background/60 px-2 text-xs font-medium text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                onChange={(e) => {
                  const val = e.target.value;
                  setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                  setCurrentPage(1);
                }}
                value={pageSize}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value="ALL">All</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop / Tablet Table View */}
        <div className="hidden overflow-x-auto xl:block custom-scrollbar-table">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase font-semibold text-muted-foreground dark:bg-card dark:text-accent-foreground border-b border-border/80">
              <tr>
                {/* User Column */}
                <th
                  className="w-[26%] px-5 py-3.5 cursor-pointer select-none transition hover:text-foreground"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>User / Personnel</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Employee ID Column */}
                <th
                  className="w-[16%] px-4 py-3.5 cursor-pointer select-none transition hover:text-foreground"
                  onClick={() => handleSort('employeeId')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee ID</span>
                    {sortField === 'employeeId' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Position Column */}
                <th
                  className="w-[24%] px-4 py-3.5 cursor-pointer select-none transition hover:text-foreground"
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Position & Type</span>
                    {sortField === 'position' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Office Column */}
                <th
                  className="w-[22%] px-4 py-3.5 cursor-pointer select-none transition hover:text-foreground"
                  onClick={() => handleSort('division')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Office & Section</span>
                    {sortField === 'division' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Status Column */}
                <th
                  className="w-[10%] px-4 py-3.5 cursor-pointer select-none transition hover:text-foreground"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* Action Column */}
                <th className="w-[12%] px-4 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedUsers.map((user) => {
                const isActive = (user.portalStatus || 'Active').toLowerCase() === 'active';
                const avatarBg = getAvatarColor(user.name);

                return (
                  <tr
                    className="group transition-colors hover:bg-secondary/40 dark:hover:bg-secondary/20 cursor-pointer"
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {user.avatar ? (
                            <img
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-border/80 shadow-xs"
                              src={user.avatar}
                            />
                          ) : (
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarBg} text-xs font-bold ring-2 ring-border/80 shadow-xs`}
                            >
                              {getInitials(user.name)}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                            {user.name}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>@{user.username || 'no-username'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                        {user.employeeId || 'N/A'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                        {user.idNumber || '-'}
                      </div>
                    </td>

                    {/* Position & Type */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground text-xs leading-snug line-clamp-1">
                        {user.position || 'No position recorded'}
                      </div>
                      {user.employmentStatus && (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.2 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                            {user.employmentStatus}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Office & Section */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground text-xs line-clamp-1">
                        {user.division || '-'}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground line-clamp-1">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span>{user.section || user.areaOfAssignment || 'Regional Office'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {user.portalStatus || 'Active'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile / Compact Responsive Card View (< xl) */}
        <div className="divide-y divide-border/60 xl:hidden">
          {paginatedUsers.map((user) => {
            const isActive = (user.portalStatus || 'Active').toLowerCase() === 'active';
            const avatarBg = getAvatarColor(user.name);

            return (
              <article
                className="p-4 transition hover:bg-secondary/30 cursor-pointer space-y-3"
                key={user.id}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {user.avatar ? (
                        <img
                          alt={user.name}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-border shadow-xs"
                          src={user.avatar}
                        />
                      ) : (
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${avatarBg} text-xs font-bold ring-2 ring-border shadow-xs`}
                        >
                          {getInitials(user.name)}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                          isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="truncate font-bold text-foreground text-sm">{user.name}</h4>
                      <p className="truncate text-xs text-muted-foreground">@{user.username || 'no-username'}</p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      isActive
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                    {user.portalStatus || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Employee ID</span>
                    <div className="font-mono font-semibold text-foreground">{user.employeeId || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Employment</span>
                    <div className="font-semibold text-foreground truncate">
                      {user.employmentStatus || 'Contractual'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Position</span>
                    <div className="font-medium text-foreground text-xs">{user.position || '-'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Office</span>
                    <div className="font-medium text-muted-foreground text-xs truncate">
                      {user.division || '-'} {user.section ? `• ${user.section}` : ''}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    className="h-8 gap-1.5 text-xs font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Empty State */}
        {!paginatedUsers.length && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">No users found</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
              {hasActiveFilters
                ? 'No personnel records matched your search query or filter criteria. Try adjusting or clearing your filters.'
                : 'No users have been synced yet. Users will appear here after successful SSO login.'}
            </p>
            {hasActiveFilters && (
              <Button
                className="mt-4 h-9 gap-1.5 text-xs font-semibold"
                onClick={handleResetFilters}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Modern Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/80 px-5 py-4 text-xs text-muted-foreground">
          <div>
            {totalItems > 0 ? (
              <span>
                Showing{' '}
                <strong className="text-foreground">
                  {pageSize === 'ALL' ? 1 : (validCurrentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-foreground">
                  {pageSize === 'ALL' ? totalItems : Math.min(validCurrentPage * pageSize, totalItems)}
                </strong>{' '}
                of <strong className="text-foreground">{totalItems}</strong> entries
                {hasActiveFilters && ` (filtered from ${totalCount} total)`}
              </span>
            ) : (
              <span>Showing 0 of 0 entries</span>
            )}
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                aria-label="First page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                type="button"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Prev Page */}
              <button
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    return Math.abs(page - validCurrentPage) <= 1;
                  })
                  .map((page, index, arr) => {
                    const prev = arr[index - 1];
                    const showEllipsis = prev && page - prev > 1;

                    return (
                      <span className="flex items-center gap-1" key={page}>
                        {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                        <button
                          className={`flex h-8 min-w-[2rem] px-2 items-center justify-center rounded-md text-xs font-semibold transition ${
                            page === validCurrentPage
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'border border-border/70 text-muted-foreground hover:bg-secondary hover:text-foreground'
                          }`}
                          onClick={() => setCurrentPage(page)}
                          type="button"
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                aria-label="Last page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                type="button"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          aria-labelledby="user-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedUser(null)}
          role="dialog"
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-2xl dark:border-border dark:bg-card animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              aria-label="Close modal"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              onClick={() => setSelectedUser(null)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-border/80">
              <div className="relative">
                {selectedUser.avatar ? (
                  <img
                    alt={selectedUser.name}
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
                    src={selectedUser.avatar}
                  />
                ) : (
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(
                      selectedUser.name
                    )} text-lg font-bold ring-4 ring-primary/20 shadow-md`}
                  >
                    {getInitials(selectedUser.name)}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${
                    (selectedUser.portalStatus || 'Active').toLowerCase() === 'active'
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-foreground tracking-tight" id="user-modal-title">
                    {selectedUser.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      (selectedUser.portalStatus || 'Active').toLowerCase() === 'active'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {selectedUser.portalStatus || 'Active'}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">@{selectedUser.username || 'no-username'}</span>
                  {selectedUser.employmentStatus && (
                    <>
                      <span>•</span>
                      <span className="rounded bg-secondary px-2 py-0.5 font-medium text-foreground">
                        {selectedUser.employmentStatus}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 text-xs">
              {/* Employee ID Card */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Employee ID
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {selectedUser.employeeId || 'N/A'}
                  </span>
                  {selectedUser.employeeId && (
                    <button
                      className="text-muted-foreground hover:text-foreground transition"
                      onClick={() => handleCopy(selectedUser.employeeId!, 'empId')}
                      title="Copy Employee ID"
                      type="button"
                    >
                      {copiedKey === 'empId' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* ID Number */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  System ID Number
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {selectedUser.idNumber || 'N/A'}
                  </span>
                  {selectedUser.idNumber && (
                    <button
                      className="text-muted-foreground hover:text-foreground transition"
                      onClick={() => handleCopy(selectedUser.idNumber!, 'idNum')}
                      title="Copy ID Number"
                      type="button"
                    >
                      {copiedKey === 'idNum' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Position */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-1 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Official Position
                </span>
                <div className="font-semibold text-sm text-foreground">
                  {selectedUser.position || 'No recorded designation'}
                </div>
              </div>

              {/* Office / Division */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Division
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Building2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{selectedUser.division || 'Unassigned'}</span>
                </div>
              </div>

              {/* Section / Unit */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Section / Unit / Area
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span>{selectedUser.section || selectedUser.areaOfAssignment || 'Regional Office'}</span>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </span>
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium text-foreground">
                    {selectedUser.email || 'None provided'}
                  </span>
                  {selectedUser.email && (
                    <button
                      className="text-muted-foreground hover:text-foreground transition"
                      onClick={() => handleCopy(selectedUser.email!, 'email')}
                      title="Copy Email"
                      type="button"
                    >
                      {copiedKey === 'email' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Number */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Number
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {selectedUser.contactNumber || 'None provided'}
                  </span>
                  {selectedUser.contactNumber && (
                    <button
                      className="text-muted-foreground hover:text-foreground transition"
                      onClick={() => handleCopy(selectedUser.contactNumber!, 'contact')}
                      title="Copy Contact Number"
                      type="button"
                    >
                      {copiedKey === 'contact' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Last Login / Synced: {selectedUser.lastLogin || 'Recorded via Caraga SSO'}
              </span>

              <Button
                className="h-8 font-semibold text-xs"
                onClick={() => setSelectedUser(null)}
                size="sm"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
