import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  Archive,
  ArrowRightLeft,
  Banknote,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FileText,
  FolderOpen,
  GitCompare,
  GitFork,
  HandCoins,
  History,
  Info,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  Scale,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Truck,
  Unlock,
  UserCog,
  UserRound,
  UsersRound,
  UserX,
  X,
} from 'lucide-react';

import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import type { CurrentView } from '../types';

type AppShellProps = PropsWithChildren<{
  currentView: CurrentView;
  darkMode: boolean;
  emvCount?: number;
  granteeCount?: number;
  payrollCount?: number;
  incomingCount: number;
  moduleCounts?: Record<string, number>;
  sidebarOpen: boolean;
  title: string;
  onOpenView: (view: CurrentView) => void;
  onSetSidebarOpen: (open: boolean) => void;
  onSetNotice: (notice: string) => void;
  onToggleDarkMode: () => void;
}>;

type SharedPageProps = {
  auth?: {
    user?: {
      id: number;
      name: string;
      email?: string | null;
      username?: string | null;
      position?: string | null;
      avatar?: string | null;
      division?: string | null;
      section?: string | null;
    } | null;
  };
};

const viewMeta: Record<CurrentView, { section: string; icon: typeof LayoutDashboard }> = {
  dashboard: { section: 'Overview', icon: LayoutDashboard },
  grantee: { section: 'References', icon: UsersRound },
  'emv-database': { section: 'References', icon: Database },
  'emv-payroll': { section: 'References', icon: HandCoins },
  aging: { section: 'References', icon: CalendarClock },
  overpayment: { section: 'References', icon: Scale },
  users: { section: 'Administration', icon: UserCog },
  manual: { section: 'Documentation', icon: BookOpen },
  Inquiry: { section: 'Transactions', icon: UserCog },
  inquiry: { section: 'Transactions', icon: UserCog },
  open: { section: 'Data', icon: UserCog },
  data: { section: 'Data', icon: UserCog },
  opening: { section: 'Request', icon: FolderOpen },
  distribution: { section: 'Request', icon: Truck },
  'otc-withdrawal': { section: 'Request', icon: Banknote },
  replacement: { section: 'Request', icon: RefreshCw },
  'transfer-of-fund': { section: 'Request', icon: ArrowRightLeft },
  'force-pin': { section: 'Request', icon: KeyRound },
  locking: { section: 'Request', icon: Lock },
  lifting: { section: 'Request', icon: Unlock },
  matching: { section: 'Request', icon: GitCompare },
  lock: { section: 'Request', icon: Lock },
  'replacement-series': { section: 'Request', icon: RefreshCw },
  otc: { section: 'Request', icon: Banknote },
  tof: { section: 'Request', icon: FileText },
  'tof-branch': { section: 'Request', icon: GitFork },
  'perforation-series': { section: 'Request', icon: Scissors },
  closure: { section: 'Request', icon: Archive },
  deactivation: { section: 'Request', icon: UserX },
  'distribution-series': { section: 'Request', icon: Truck },
};

function NavItem({
  active,
  badge,
  badgeColor = 'default',
  children,
  icon: Icon,
  onClick,
}: {
  active?: boolean;
  badge?: string | number;
  badgeColor?: 'default' | 'primary' | 'amber';
  children: string;
  icon: typeof LayoutDashboard;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        'group relative flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-medium transition-all duration-150',
        active
          ? 'bg-primary/10 text-primary font-semibold shadow-2xs dark:bg-primary/20 dark:text-accent-foreground'
          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground dark:hover:bg-secondary/60 dark:hover:text-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-primary" />
      )}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
          active ? 'text-primary dark:text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge !== undefined && (
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight',
            badgeColor === 'primary' && 'bg-primary text-primary-foreground',
            badgeColor === 'amber' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
            badgeColor === 'default' && 'bg-secondary text-muted-foreground dark:bg-secondary/80',
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function AppShell({
  children,
  currentView,
  darkMode,
  emvCount,
  granteeCount,
  payrollCount,
  incomingCount,
  moduleCounts,
  sidebarOpen,
  title,
  onOpenView,
  onSetNotice,
  onSetSidebarOpen,
  onToggleDarkMode,
}: AppShellProps) {
  const { auth } = usePage<SharedPageProps>().props;
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [referencesCollapsed, setReferencesCollapsed] = useState(false);
  const [dataCollapsed, setDataCollapsed] = useState(false);

  // Desktop sidebar collapse/unhide state with persistence
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_desktop_sidebar');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true;
  });

  const toggleDesktopSidebar = () => {
    setDesktopSidebarVisible((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cgt_desktop_sidebar', String(next));
      }
      onSetNotice(next ? 'Sidebar expanded' : 'Sidebar hidden (Full width view)');
      return next;
    });
  };

  const user = auth?.user;
  const displayName = user?.name ?? 'Reymark N. Valdehueza';
  const displayPosition = user?.position ?? user?.email ?? 'COMPUTER PROGRAMMER III';

  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [displayName]);

  function logout() {
    router.post('/sso/logout');
  }

  // Quick keyboard shortcut listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSetNotice('Quick search focused (Ctrl+K)');
        const searchInput = document.getElementById('global-search-input');
        searchInput?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleDesktopSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSetNotice]);

  const mockNotifications = [
    { id: 1, title: 'Database Synced', time: '10m ago', text: `${incomingCount} records loaded and verified.`, unread: true },
    { id: 2, title: 'DSWD Caraga Connect', time: '1h ago', text: 'SSO session active and secure.', unread: false },
    { id: 3, title: 'Audit Schedule', time: 'Yesterday', text: 'Quarterly EMV review due this Friday.', unread: false },
  ];

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-border/80 bg-card p-3 shadow-xs dark:border-border dark:bg-card">
      {/* Brand Header with Collapse Toggle */}
      <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-2.5 transition-colors">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-tight text-foreground">iGrants</span>
            <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold text-primary dark:text-cyan-300">CGT</span>
          </div>
          <div className="truncate text-[10px] font-medium text-muted-foreground">
            DSWD Caraga Cash Grants 
          </div>
        </div>

        {/* Desktop Collapse Icon (Circled in user screenshot) */}
        <button
          aria-label="Hide sidebar and expand page"
          className="hidden h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:flex"
          onClick={toggleDesktopSidebar}
          title="Hide sidebar (Ctrl+B)"
          type="button"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>

        {/* Mobile Close Button */}
        <button
          aria-label="Close mobile sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          onClick={() => onSetSidebarOpen(false)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Role / Office Scope Pill */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 dark:bg-secondary/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-semibold text-foreground/90">Caraga Network</span>
        </div>
        <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-2xs dark:bg-card">
          Admin
        </span>
      </div>

      {/* Navigation Groups */}
      <nav className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar-thin">
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
            Overview
          </div>
          <NavItem
            active={currentView === 'dashboard'}
            icon={LayoutDashboard}
            onClick={() => onOpenView('dashboard')}
          >
            Dashboard
          </NavItem>
        </div>

        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
            Transactions
          </div>
          <div className="space-y-1">
            <NavItem
              active={currentView === 'Inquiry' || currentView === 'inquiry'}
              icon={UserCog}
              onClick={() => onOpenView('Inquiry')}
            >
              Inquiry
            </NavItem>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
              References
            </span>
            <button
              className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={() => setReferencesCollapsed((c) => !c)}
              type="button"
            >
              <ChevronDown
                className={cn('h-3 w-3 transition-transform duration-200', referencesCollapsed && '-rotate-90')}
              />
            </button>
          </div>

          {!referencesCollapsed && (
            <div className="space-y-1">
              <NavItem
                active={currentView === 'grantee'}
                badge={granteeCount && granteeCount > 0 ? (granteeCount > 9999 ? `${Math.round(granteeCount / 1000)}k` : granteeCount.toLocaleString()) : undefined}
                badgeColor="primary"
                icon={UsersRound}
                onClick={() => onOpenView('grantee')}
              >
                Grantee List
              </NavItem>
              <NavItem
                active={currentView === 'emv-database'}
                badge={emvCount !== undefined ? (emvCount > 0 ? (emvCount > 9999 ? `${Math.round(emvCount / 1000)}k` : emvCount.toLocaleString()) : undefined) : (incomingCount > 0 ? incomingCount : undefined)}
                badgeColor="primary"
                icon={Database}
                onClick={() => onOpenView('emv-database')}
              >
                EMV Database
              </NavItem>
              <NavItem
                active={currentView === 'emv-payroll'}
                badge={payrollCount !== undefined ? (payrollCount > 0 ? (payrollCount > 9999 ? `${Math.round(payrollCount / 1000)}k` : payrollCount.toLocaleString()) : undefined) : undefined}
                badgeColor="primary"
                icon={HandCoins}
                onClick={() => onOpenView('emv-payroll')}
              >
                Payroll
              </NavItem>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
              Request
            </span>
            <button
              className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={() => setDataCollapsed((c) => !c)}
              type="button"
            >
              <ChevronDown
                className={cn('h-3 w-3 transition-transform duration-200', dataCollapsed && '-rotate-90')}
              />
            </button>
          </div>

          {!dataCollapsed && (
            <div className="space-y-1">
              <NavItem
                active={currentView === 'opening'}
                badge={moduleCounts?.opening ? moduleCounts.opening.toLocaleString() : undefined}
                badgeColor="primary"
                icon={FolderOpen}
                onClick={() => onOpenView('opening')}
              >
                Opening
              </NavItem>
              <NavItem
                active={currentView === 'distribution'}
                badge={moduleCounts?.distribution ? moduleCounts.distribution.toLocaleString() : undefined}
                badgeColor="primary"
                icon={Truck}
                onClick={() => onOpenView('distribution')}
              >
                Distribution
              </NavItem>
              <NavItem
                active={currentView === 'otc-withdrawal'}
                badge={moduleCounts?.['otc-withdrawal'] ? moduleCounts['otc-withdrawal'].toLocaleString() : undefined}
                badgeColor="primary"
                icon={Banknote}
                onClick={() => onOpenView('otc-withdrawal')}
              >
                OTC Withdrawal
              </NavItem>
              <NavItem
                active={currentView === 'replacement'}
                badge={moduleCounts?.replacement ? moduleCounts.replacement.toLocaleString() : undefined}
                badgeColor="primary"
                icon={RefreshCw}
                onClick={() => onOpenView('replacement')}
              >
                Replacement
              </NavItem>
              <NavItem
                active={currentView === 'transfer-of-fund'}
                badge={moduleCounts?.['transfer-of-fund'] ? moduleCounts['transfer-of-fund'].toLocaleString() : undefined}
                badgeColor="primary"
                icon={ArrowRightLeft}
                onClick={() => onOpenView('transfer-of-fund')}
              >
                Transfer of Fund
              </NavItem>
              <NavItem
                active={currentView === 'force-pin'}
                badge={moduleCounts?.['force-pin'] ? moduleCounts['force-pin'].toLocaleString() : undefined}
                badgeColor="primary"
                icon={KeyRound}
                onClick={() => onOpenView('force-pin')}
              >
                Force PIN
              </NavItem>
              <NavItem
                active={currentView === 'locking'}
                badge={moduleCounts?.locking ? moduleCounts.locking.toLocaleString() : undefined}
                badgeColor="primary"
                icon={Lock}
                onClick={() => onOpenView('locking')}
              >
                Locking
              </NavItem>
              <NavItem
                active={currentView === 'lifting'}
                badge={moduleCounts?.lifting ? moduleCounts.lifting.toLocaleString() : undefined}
                badgeColor="primary"
                icon={Unlock}
                onClick={() => onOpenView('lifting')}
              >
                Lifting
              </NavItem>
            </div>
          )}
        </div>

        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
            System
          </div>
          <div className="space-y-1">
            <NavItem
              active={currentView === 'users'}
              icon={UserCog}
              onClick={() => onOpenView('users')}
            >
              Users
            </NavItem>
            <NavItem
              active={currentView === 'manual'}
              icon={BookOpen}
              onClick={() => onOpenView('manual')}
            >
              User Manual
            </NavItem>
          </div>
        </div>
      </nav>

      {/* User Footer Profile Card */}
      <div className="relative mt-auto border-t border-border/80 pt-3 dark:border-border">
        {profileOpen && (
          <div className="absolute bottom-[4.5rem] left-0 right-0 z-50 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-border dark:bg-card">
            <div className="border-b border-border/60 p-3 dark:border-border">
              <div className="font-semibold text-xs text-foreground">{displayName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{displayPosition}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active Caraga Connect SSO
              </div>
            </div>
            <button
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
              onClick={() => {
                setProfileOpen(false);
                onOpenView('users');
                onSetNotice('Opened user profile');
              }}
              type="button"
            >
              <UserRound className="h-4 w-4 text-muted-foreground" />
              Account Settings
            </button>
            <button
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10"
              onClick={logout}
              type="button"
            >
              <LogOut className="h-4 w-4 text-destructive" />
              Sign Out
            </button>
          </div>
        )}

        <button
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 p-2 text-left transition hover:border-primary/40 hover:bg-secondary dark:bg-secondary/20',
            profileOpen && 'border-primary/40 bg-secondary',
          )}
          onClick={() => setProfileOpen((c) => !c)}
          type="button"
        >
          {user?.avatar ? (
            <img
              alt={displayName}
              className="h-8 w-8 rounded-lg object-cover ring-1 ring-border"
              src={user.avatar}
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-2xs">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold leading-tight text-foreground">{displayName}</div>
            <div className="truncate text-[10px] font-medium text-muted-foreground">{displayPosition}</div>
          </div>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', profileOpen && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );

  const currentMeta = viewMeta[currentView] ?? { section: 'Portal', icon: LayoutDashboard };
  const CurrentIcon = currentMeta.icon;

  return (
    <div className={cn('min-h-screen bg-background text-foreground antialiased selection:bg-primary/20', darkMode && 'dark')}>
      {/* Desktop Fixed Sidebar with smooth slide animation */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden lg:block transition-transform duration-300 ease-in-out',
          !desktopSidebarVisible && 'lg:-translate-x-full',
        )}
      >
        {sidebar}
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => onSetSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebar}
          </div>
        </div>
      ) : null}

      {/* Main Content Area - dynamically adjusts padding to 0 when sidebar is hidden */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          desktopSidebarVisible ? 'lg:pl-64' : 'lg:pl-0',
        )}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border/80 bg-card/90 backdrop-blur-md dark:border-border dark:bg-card/90">
          <div className="flex h-full w-full items-center justify-between px-3 sm:px-6 lg:px-8">
            {/* Left Section: Mobile Menu, Desktop Hide/Unhide Button & Breadcrumbs */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Mobile Drawer Trigger */}
              <Button
                className="lg:hidden"
                onClick={() => onSetSidebarOpen(true)}
                size="icon"
                variant="ghost"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Desktop Unhide / Hide Button (Always visible on desktop in header) */}
              <Button
                className="hidden lg:flex text-muted-foreground hover:text-foreground"
                onClick={toggleDesktopSidebar}
                size="icon"
                title={desktopSidebarVisible ? 'Hide sidebar (Ctrl+B)' : 'Unhide sidebar (Ctrl+B)'}
                variant="ghost"
              >
                {desktopSidebarVisible ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4 text-primary" />
                )}
              </Button>

              {/* Show Sidebar Quick Badge Button when sidebar is collapsed */}
              {!desktopSidebarVisible && (
                <button
                  className="hidden lg:flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition-all hover:bg-primary/20 dark:text-cyan-300 shadow-2xs"
                  onClick={toggleDesktopSidebar}
                  title="Show sidebar (Expand navigation)"
                  type="button"
                >
                  <PanelLeft className="h-3.5 w-3.5" />
                  <span>Show Sidebar</span>
                </button>
              )}

              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
                <span
                  className="font-semibold text-muted-foreground transition hover:text-foreground cursor-pointer"
                  onClick={() => onOpenView('dashboard')}
                >
                  iGrants
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-muted-foreground hidden sm:inline">{currentMeta.section}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 hidden sm:inline" />
                <span className="flex items-center gap-1.5 font-bold text-foreground">
                  <CurrentIcon className="h-3.5 w-3.5 text-primary" />
                  {title}
                </span>
              </nav>
            </div>

            {/* Middle Section: Quick Search Trigger */}
            <div className="hidden md:flex items-center">
              <div
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground shadow-2xs hover:border-primary/40 hover:bg-secondary/70 transition cursor-pointer w-64"
                onClick={() => {
                  onOpenView('emv-database');
                  onSetNotice('Searching EMV database...');
                }}
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">Search records, HH ID...</span>
                <kbd className="ml-auto rounded border border-border bg-card px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                  Ctrl+K
                </kbd>
              </div>
            </div>

            {/* Right Section: System Status, Notifications & Controls */}
            <div className="flex items-center gap-2">
              {/* Online indicator */}
              <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>Live Portal</span>
              </div>

              {/* Notification Popover */}
              <div className="relative">
                <Button
                  className="relative"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  size="icon"
                  title="Notifications"
                  variant="ghost"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                </Button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-border dark:bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <div className="text-xs font-bold">Notifications</div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        1 unread
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {mockNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            'rounded-lg p-2.5 text-xs transition hover:bg-secondary/60 cursor-pointer',
                            notif.unread && 'bg-primary/5 border border-primary/20',
                          )}
                          onClick={() => {
                            setNotificationsOpen(false);
                            onSetNotice(`Notification: ${notif.title}`);
                          }}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{notif.title}</span>
                            <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground leading-normal">{notif.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <Button
                onClick={onToggleDarkMode}
                size="icon"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                variant="ghost"
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </Button>

              {/* Help Button */}
              <Button
                onClick={() => {
                  onOpenView('manual');
                  onSetNotice('Opened User Manual');
                }}
                size="icon"
                title="Documentation & Guide"
                variant="ghost"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="min-h-[calc(100vh-3.5rem)] bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
