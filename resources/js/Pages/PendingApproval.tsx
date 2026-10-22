import { Head, router } from '@inertiajs/react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Lock,
  LogOut,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';

type PendingApprovalProps = {
  account?: {
    id: number;
    name: string;
    email?: string | null;
    username?: string | null;
    position?: string | null;
    division?: string | null;
    section?: string | null;
    avatar?: string | null;
    role: string;
    approvalStatus: string;
    requestedAt?: string | null;
  };
};

export default function PendingApproval({ account }: PendingApprovalProps) {
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = () => {
    setChecking(true);
    router.reload({
      onFinish: () => setChecking(false),
    });
  };

  const handleLogout = () => {
    router.post('/sso/logout');
  };

  const initials = (account?.name || 'GS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <Head title="Pending Admin Approval - GRANTS" />

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl">
          {/* Top Brand Header */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <img
              alt="GRANTS Logo"
              className="h-11 w-11 object-contain"
              src="/images/grants_logo_dark.png"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">GRANTS</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                  CGT PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grants Registry & Navigation Tracking System
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
            {/* Banner Strip */}
            <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent px-6 py-4">
              <div className="flex items-center gap-2.5 text-amber-300">
                <Clock className="h-5 w-5 shrink-0 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Account Awaiting Administrator Approval
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Administrator Approval Required
                </h1>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  Your Caraga Connect SSO sign-in was verified, but you cannot proceed to the application yet.
                  For security, an <strong className="text-white">Administrator</strong> must manually approve your
                  account before you can access the GRANTS portal.
                </p>
              </div>

              {/* User Profile Summary Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
                <div className="flex items-center gap-3.5">
                  {account?.avatar ? (
                    <img
                      alt={account.name}
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-amber-500/40"
                      src={account.avatar}
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white ring-2 ring-amber-500/40">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">
                      {account?.name || 'Authenticated Staff'}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {account?.position || account?.email || 'DSWD Field Office Caraga'}
                    </div>
                    {account?.username && (
                      <div className="mt-0.5 text-[11px] font-mono text-slate-500">
                        @{account.username}
                      </div>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 border-t border-slate-800/80 pt-3 text-xs sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/90 px-3 py-2">
                    <span className="text-slate-400">Default Assigned Role:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-cyan-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {account?.role || 'Financial Analyst'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/90 px-3 py-2">
                    <span className="text-slate-400">Division / Section:</span>
                    <span className="truncate max-w-[140px] font-semibold text-slate-200">
                      {account?.section || account?.division || 'Pantawid / Grants'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Steps / Info Box */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-4 space-y-2.5 text-xs text-slate-300">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span>What happens next?</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-slate-400">
                  <li>
                    Your account has been registered in the queue with the default role of{' '}
                    <strong className="text-slate-200">{account?.role || 'Financial Analyst'}</strong>.
                  </li>
                  <li>
                    Please notify the <strong className="text-slate-200">System Administrator</strong> to approve your account under{' '}
                    <span className="font-mono text-slate-300">System &rarr; Roles and Permissions</span>.
                  </li>
                  <li>
                    Once approved, click <strong className="text-slate-200">Check Approval Status</strong> below to enter the portal immediately.
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className="gap-2 border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                  onClick={handleLogout}
                  type="button"
                  variant="outline"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>

                <Button
                  className="gap-2 bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25"
                  disabled={checking}
                  onClick={handleCheckStatus}
                  type="button"
                >
                  <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Checking Approval Status...' : 'Check Approval Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

