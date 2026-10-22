import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  UserCheck,
  UserCog,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import type { UserListItem } from './UsersView';

export type PermissionCatalogItem = {
  key: string;
  label: string;
  category: string;
  description: string;
};

export type RoleItem = {
  id: number;
  roleName: string;
  roleKey: string;
  description: string | null;
  permissions: Record<string, boolean>;
  isSystem: boolean;
  userCount: number;
  updatedAt?: string | null;
};

type RolesPermissionsViewProps = {
  initialUsers?: UserListItem[];
  onSetNotice?: (notice: string) => void;
  onUsersUpdated?: (users: UserListItem[]) => void;
};

function getCsrfHeaders(): Record<string, string> {
  const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
  const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function RolesPermissionsView({
  initialUsers = [],
  onSetNotice,
  onUsersUpdated,
}: RolesPermissionsViewProps) {
  const [activeTab, setActiveTab] = useState<'approvals' | 'roles'>('approvals');
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>(initialUsers);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (initialUsers.length > 0 && users.length === 0) {
      setUsers(initialUsers);
    }
  }, [initialUsers, users.length]);

  // Filters for User Approval & Role Assignment tab
  const [userSearch, setUserSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Add New Role modal state (for adding future roles next week)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/roles-permissions/data', {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRoles(data.roles || []);
          setPermissionCatalog(data.permissionCatalog || []);
          if (Array.isArray(data.users)) {
            setUsers(data.users);
            onUsersUpdated?.(data.users);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load roles & permissions data:', e);
    } finally {
      setLoading(false);
    }
  }, [onUsersUpdated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle a permission checkbox locally and save to backend
  const handleTogglePermission = async (role: RoleItem, permKey: string) => {
    if (role.roleKey === 'admin') {
      setFeedback({
        type: 'error',
        message: 'The Admin role has full access to all modules and cannot be restricted.',
      });
      return;
    }

    const updatedPermissions = {
      ...role.permissions,
      [permKey]: !role.permissions[permKey],
    };

    // Optimistic update
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, permissions: updatedPermissions } : r)),
    );
    setSavingRoleId(role.id);

    try {
      const res = await fetch(`/roles-permissions/roles/${role.id}`, {
        method: 'POST',
        headers: getCsrfHeaders(),
        body: JSON.stringify({
          role_name: role.roleName,
          description: role.description,
          permissions: updatedPermissions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRoles((prev) => prev.map((r) => (r.id === role.id ? data.role : r)));
        const msg = `Updated permissions for ${role.roleName}.`;
        setFeedback({ type: 'success', message: msg });
        onSetNotice?.(msg);
      } else {
        await fetchData();
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to update role permissions.',
        });
      }
    } catch {
      await fetchData();
      setFeedback({ type: 'error', message: 'Network error while updating permissions.' });
    } finally {
      setSavingRoleId(null);
    }
  };

  // Create a new role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreatingRole(true);

    try {
      const res = await fetch('/roles-permissions/roles', {
        method: 'POST',
        headers: getCsrfHeaders(),
        body: JSON.stringify({
          role_name: newRoleName.trim(),
          description: newRoleDescription.trim() || 'Custom staff role configured by Admin.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRoles((prev) => [...prev, data.role]);
        setShowAddRoleModal(false);
        setNewRoleName('');
        setNewRoleDescription('');
        setFeedback({ type: 'success', message: data.message || 'Role created successfully.' });
        onSetNotice?.(data.message || 'Role created');
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Could not create role.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while creating role.' });
    } finally {
      setCreatingRole(false);
    }
  };

  // Approve or revoke user login
  const handleApproveUser = async (user: UserListItem, approved: boolean) => {
    setProcessingUserId(user.id);
    try {
      const res = await fetch(`/roles-permissions/users/${user.id}/approve`, {
        method: 'POST',
        headers: getCsrfHeaders(),
        body: JSON.stringify({
          approved,
          role: user.role || 'Financial Analyst',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const nextUsers = users.map((u) => (u.id === user.id ? data.user : u));
        setUsers(nextUsers);
        onUsersUpdated?.(nextUsers);
        setFeedback({ type: 'success', message: data.message });
        onSetNotice?.(data.message);
        fetchData();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to update user approval status.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while updating user approval.' });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Change user role
  const handleChangeUserRole = async (user: UserListItem, newRole: string) => {
    setProcessingUserId(user.id);
    try {
      const res = await fetch(`/roles-permissions/users/${user.id}/role`, {
        method: 'POST',
        headers: getCsrfHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const nextUsers = users.map((u) => (u.id === user.id ? data.user : u));
        setUsers(nextUsers);
        onUsersUpdated?.(nextUsers);
        setFeedback({ type: 'success', message: data.message });
        onSetNotice?.(data.message);
        fetchData();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to update user role.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while updating user role.' });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Computed metrics
  const pendingCount = useMemo(
    () => users.filter((u) => !u.isApproved).length,
    [users],
  );
  const approvedCount = useMemo(
    () => users.filter((u) => u.isApproved).length,
    [users],
  );
  const adminCount = useMemo(
    () => users.filter((u) => (u.role || '').toLowerCase() === 'admin').length,
    [users],
  );
  const staffCount = useMemo(
    () => users.filter((u) => (u.role || 'Financial Analyst').toLowerCase() !== 'admin').length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (approvalFilter === 'PENDING' && u.isApproved) return false;
      if (approvalFilter === 'APPROVED' && !u.isApproved) return false;
      if (roleFilter !== 'ALL' && (u.role || 'Financial Analyst') !== roleFilter) return false;

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase().trim();
        const match =
          u.name.toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.position || '').toLowerCase().includes(q) ||
          (u.role || '').toLowerCase().includes(q) ||
          (u.employeeId || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [users, approvalFilter, roleFilter, userSearch]);

  const roleOptions = useMemo(() => {
    const names = roles.map((r) => r.roleName);
    if (!names.includes('Admin')) names.unshift('Admin');
    if (!names.includes('Financial Analyst')) names.push('Financial Analyst');
    return Array.from(new Set(names));
  }, [roles]);

  return (
    <section className="mx-auto w-full max-w-[1800px] space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm dark:border-border dark:bg-card">
        <div className="pointer-events-none absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-primary dark:text-cyan-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                System Access Control
              </span>
              <span>•</span>
              <span>Login Gate & Role Matrix</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Roles and Permissions
            </h1>

            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Manage system roles (<strong className="text-foreground">Admin</strong> and{' '}
              <strong className="text-foreground">Financial Analyst</strong>), module access restrictions (Libraries,
              System sidebar, and Request Print Preview forms), and manually approve staff accounts before they can
              proceed into the application.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              className="gap-1.5 text-xs font-semibold"
              onClick={fetchData}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className="gap-1.5 text-xs font-semibold"
              onClick={() => setShowAddRoleModal(true)}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add New Role
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => {
            setActiveTab('approvals');
            setApprovalFilter('PENDING');
          }}
          className="cursor-pointer rounded-xl border border-amber-500/30 bg-card p-5 shadow-xs transition hover:border-amber-500/60 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Login Approval
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-foreground">{pendingCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Staff accounts awaiting manual Admin approval
          </p>
        </div>

        <div
          onClick={() => {
            setActiveTab('approvals');
            setApprovalFilter('APPROVED');
          }}
          className="cursor-pointer rounded-xl border border-border/80 bg-card p-5 shadow-xs transition hover:border-emerald-500/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Approved Accounts
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-foreground">{approvedCount}</div>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Authorized to sign in to GRANTS
          </p>
        </div>

        <div
          onClick={() => setActiveTab('roles')}
          className="cursor-pointer rounded-xl border border-border/80 bg-card p-5 shadow-xs transition hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Admin Accounts
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-foreground">{adminCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Full System, Libraries & Print Preview access
          </p>
        </div>

        <div
          onClick={() => setActiveTab('roles')}
          className="cursor-pointer rounded-xl border border-border/80 bg-card p-5 shadow-xs transition hover:border-blue-500/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Financial Analyst (Default)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-foreground">{staffCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Restricted from System, Libraries & Print Forms
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="inline-flex rounded-xl border border-border bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'approvals'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="h-4 w-4 text-primary" />
            <span>User Login Approvals & Role Assignment</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {pendingCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'roles'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Roles & Permissions Matrix ({roles.length || 2})</span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          Default role for newly synced users:{' '}
          <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-bold text-blue-600 dark:text-blue-300">
            Financial Analyst (Pending Admin Approval)
          </span>
        </div>
      </div>

      {/* TAB 1: USER LOGIN APPROVALS & ROLE ASSIGNMENT */}
      {activeTab === 'approvals' && (
        <div className="rounded-xl border border-border/80 bg-card shadow-xs">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border/80 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9 text-xs"
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name, username, position, or role..."
                  value={userSearch}
                />
              </div>

              <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setApprovalFilter('ALL')}
                  className={`rounded-md px-3 py-1.5 font-semibold transition ${
                    approvalFilter === 'ALL'
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('PENDING')}
                  className={`rounded-md px-3 py-1.5 font-semibold transition ${
                    approvalFilter === 'PENDING'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pending Approval ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('APPROVED')}
                  className={`rounded-md px-3 py-1.5 font-semibold transition ${
                    approvalFilter === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Approved ({approvedCount})
                </button>
              </div>

              <select
                aria-label="Filter by Role"
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold text-foreground"
                onChange={(e) => setRoleFilter(e.target.value)}
                value={roleFilter}
              >
                <option value="ALL">All Roles</option>
                {roleOptions.map((rName) => (
                  <option key={rName} value={rName}>
                    {rName}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{filteredUsers.length}</strong> of{' '}
              <strong className="text-foreground">{users.length}</strong> accounts
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto custom-scrollbar-table">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-border bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Personnel / Account</th>
                  <th className="px-4 py-3.5">Position & Office</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Effective Access Summary</th>
                  <th className="px-4 py-3.5">Login Approval Status</th>
                  <th className="px-5 py-3.5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Loading user accounts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">
                      No user accounts match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isUserAdmin = (u.role || '').toLowerCase() === 'admin';
                    const isPrimaryAdmin = u.id === 1;
                    const isBusy = processingUserId === u.id;

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors hover:bg-secondary/30 ${
                          !u.isApproved ? 'bg-amber-500/5 dark:bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Personnel */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img
                                alt={u.name}
                                className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                                src={u.avatar}
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                                {getInitials(u.name)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <span>{u.name}</span>
                                {isPrimaryAdmin && (
                                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                    Primary Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                @{u.username || 'staff'} {u.employeeId ? `• ID: ${u.employeeId}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Position & Office */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground">{u.position || 'Staff'}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {u.section || u.division || 'DSWD Caraga'}
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="px-4 py-3.5">
                          <select
                            aria-label={`Assign role for ${u.name}`}
                            disabled={isPrimaryAdmin || isBusy}
                            value={u.role || 'Financial Analyst'}
                            onChange={(e) => handleChangeUserRole(u, e.target.value)}
                            className={`h-8 rounded-lg border px-2.5 text-xs font-bold shadow-2xs transition focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 ${
                              isUserAdmin
                                ? 'border-primary/40 bg-primary/10 text-primary dark:text-cyan-300'
                                : 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {roleOptions.map((rName) => (
                              <option key={rName} value={rName} className="bg-card text-foreground">
                                {rName}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Access Summary */}
                        <td className="px-4 py-3.5">
                          {isUserAdmin ? (
                            <div className="flex flex-wrap gap-1">
                              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                All Modules
                              </span>
                              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                Libraries Edit
                              </span>
                              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                Print Preview Edit
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                No System Sidebar
                              </span>
                              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                No Libraries
                              </span>
                              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                No Print Form Edit
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Approval Status Badge */}
                        <td className="px-4 py-3.5">
                          {u.isApproved ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approved for Login
                              </span>
                              {u.approvedBy && (
                                <div className="text-[10px] text-muted-foreground">
                                  by {u.approvedBy}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                              <Clock className="h-3.5 w-3.5" />
                              Pending Admin Approval
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-right">
                          {isPrimaryAdmin ? (
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              System Owner
                            </span>
                          ) : u.isApproved ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleApproveUser(u, false)}
                              className="h-8 gap-1.5 border-rose-500/30 bg-rose-500/5 text-xs font-semibold text-rose-600 hover:bg-rose-500/15 dark:text-rose-400"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserX className="h-3.5 w-3.5" />
                              )}
                              Set Pending / Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleApproveUser(u, true)}
                              className="h-8 gap-1.5 bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-500"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                              Approve Login
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Role Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => {
              const isAdminRole = role.roleKey === 'admin';
              return (
                <div
                  key={role.id}
                  className={`rounded-2xl border p-5 shadow-xs ${
                    isAdminRole
                      ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card'
                      : 'border-border/80 bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          isAdminRole
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                        }`}
                      >
                        {isAdminRole ? (
                          <ShieldCheck className="h-6 w-6" />
                        ) : (
                          <Users className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-foreground">
                            {role.roleName}
                          </h3>
                          {(role.roleKey === 'financial-analyst' || role.roleKey === 'grants-staff') && (
                            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                              Default Staff Role
                            </span>
                          )}
                          {isAdminRole && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-cyan-300">
                              Full Access
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs font-bold text-foreground">
                      {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Permissions Matrix Table */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
            <div className="border-b border-border/80 p-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Module & Feature Permissions Matrix
                </h2>
                <p className="text-xs text-muted-foreground">
                  Toggle permissions for any role below. You can also add more roles next week using the{' '}
                  <strong>Add New Role</strong> button.
                </p>
              </div>
              {savingRoleId && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving changes...
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="border-b border-border bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 w-[44%]">Permission / Capability</th>
                    <th className="px-4 py-3.5 w-[16%]">Category</th>
                    {roles.map((r) => (
                      <th key={r.id} className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="text-foreground font-extrabold">{r.roleName}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            ({r.userCount} users)
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {permissionCatalog.map((perm) => (
                    <tr key={perm.key} className="transition-colors hover:bg-secondary/30">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-foreground">{perm.label}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {perm.description}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {perm.category}
                        </span>
                      </td>
                      {roles.map((role) => {
                        const enabled = Boolean(role.permissions?.[perm.key]);
                        const isAdminRole = role.roleKey === 'admin';
                        return (
                          <td key={role.id} className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              disabled={isAdminRole || savingRoleId === role.id}
                              onClick={() => handleTogglePermission(role, perm.key)}
                              title={
                                isAdminRole
                                  ? 'Admin always has full access'
                                  : `Toggle ${perm.label} for ${role.roleName}`
                              }
                              className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition ${
                                enabled
                                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                              } ${
                                isAdminRole
                                  ? 'cursor-not-allowed opacity-80'
                                  : 'cursor-pointer hover:scale-105'
                              }`}
                            >
                              {enabled ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Allowed</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3" />
                                  <span>Restricted</span>
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add New Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Add New Role</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Create an additional role and configure its permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Role Name</label>
                <Input
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Regional Focal, Provincial Staff, Verifier..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Description</label>
                <textarea
                  rows={3}
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Describe what modules and actions this role is allowed to access..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/80 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddRoleModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creatingRole || !newRoleName.trim()}>
                  {creatingRole ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border bg-card p-4 shadow-xl ${
            feedback.type === 'success' ? 'border-emerald-500/40' : 'border-rose-500/40'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          )}
          <div className="text-xs font-medium text-foreground">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}

