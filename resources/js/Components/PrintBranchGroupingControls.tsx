import { usePage } from '@inertiajs/react';
import { Building2, Check, Edit3, Layers, MapPin, RotateCcw } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FormHeaderDetails,
  GroupedPrintForm,
  LbpBranchDirectoryEntry,
  PrintFormGroupMode,
  PrintRecordWithBranch,
} from '../utils/lbpPrintDirectory';

export const DEFAULT_SECOND_COPY_REF_PREFIX = 'JSP/CDC/mjso/';
export const SECOND_COPY_REF_STORAGE_KEY = 'cgt_second_copy_ref_prefix';
export const SECOND_COPY_REF_EVENT = 'cgt:second-copy-ref-prefix-changed';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

type SharedAuthProps = {
  auth?: {
    user?: {
      name?: string | null;
      role?: string | null;
      is_admin?: boolean;
    } | null;
  };
  second_copy_ref_prefix?: string | null;
};

export function deriveUserInitials(fullName?: string | null): string {
  const target = (fullName && fullName.trim()) ? fullName.trim() : 'Reymark N. Valdehueza';
  const suffixes = new Set(['JR', 'SR', 'II', 'III', 'IV', 'V']);
  return target
    .split(/\s+/)
    .map((part) => part.replace(/[^a-zA-Z]/g, ''))
    .filter((clean) => clean.length > 0 && !suffixes.has(clean.toUpperCase()))
    .map((clean) => clean[0].toLowerCase())
    .join('');
}

export function formatSecondCopyReference(prefix: string, userInitials: string): string {
  const cleanPrefix = prefix.trim();
  if (!cleanPrefix) {
    return userInitials;
  }
  if (!userInitials) {
    return cleanPrefix;
  }
  const lowerPrefix = cleanPrefix.toLowerCase();
  const lowerInitials = userInitials.toLowerCase();
  if (lowerPrefix.endsWith(`/${lowerInitials}`)) {
    return cleanPrefix;
  }
  const normalizedPrefix = cleanPrefix.endsWith('/') ? cleanPrefix : `${cleanPrefix}/`;
  return `${normalizedPrefix}${userInitials}`;
}

export function useSecondCopyReferencePrefix() {
  const { props } = usePage<SharedAuthProps>();
  const user = props?.auth?.user;
  const isAdmin = Boolean(user?.is_admin || user?.role === 'Admin');
  const userName = user?.name || 'Reymark N. Valdehueza';
  const userInitials = useMemo(() => deriveUserInitials(userName), [userName]);
  const serverPrefix = props?.second_copy_ref_prefix?.trim() || '';
  const saveTimerRef = useRef<number | null>(null);

  const [prefix, setPrefixState] = useState<string>(() => {
    if (serverPrefix) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SECOND_COPY_REF_STORAGE_KEY, serverPrefix);
      }
      return serverPrefix;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SECOND_COPY_REF_STORAGE_KEY);
      if (saved !== null && saved.trim() !== '') {
        return saved;
      }
    }
    return DEFAULT_SECOND_COPY_REF_PREFIX;
  });

  useEffect(() => {
    if (serverPrefix) {
      setPrefixState(serverPrefix);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SECOND_COPY_REF_STORAGE_KEY, serverPrefix);
      }
    }
  }, [serverPrefix]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = () => {
      const saved = localStorage.getItem(SECOND_COPY_REF_STORAGE_KEY);
      setPrefixState(saved !== null && saved.trim() !== '' ? saved : DEFAULT_SECOND_COPY_REF_PREFIX);
    };
    window.addEventListener(SECOND_COPY_REF_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SECOND_COPY_REF_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const persistPrefixToBackend = (valueToSave: string) => {
    if (typeof window === 'undefined' || !isAdmin) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      fetch('/libraries/drn/reference-prefix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          second_copy_ref_prefix: valueToSave.trim() || DEFAULT_SECOND_COPY_REF_PREFIX,
        }),
      }).catch(() => {});
    }, 350);
  };

  const setPrefix = (nextValue: string) => {
    if (!isAdmin) return;
    setPrefixState(nextValue);
    if (typeof window !== 'undefined') {
      if (nextValue.trim() === '') {
        localStorage.removeItem(SECOND_COPY_REF_STORAGE_KEY);
      } else {
        localStorage.setItem(SECOND_COPY_REF_STORAGE_KEY, nextValue);
      }
      window.dispatchEvent(new CustomEvent(SECOND_COPY_REF_EVENT));
    }
    persistPrefixToBackend(nextValue);
  };

  const resetPrefix = () => {
    if (!isAdmin) return;
    setPrefixState(DEFAULT_SECOND_COPY_REF_PREFIX);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SECOND_COPY_REF_STORAGE_KEY, DEFAULT_SECOND_COPY_REF_PREFIX);
      window.dispatchEvent(new CustomEvent(SECOND_COPY_REF_EVENT));
    }
    persistPrefixToBackend(DEFAULT_SECOND_COPY_REF_PREFIX);
  };

  const fullReferenceText = useMemo(
    () => formatSecondCopyReference(prefix, userInitials),
    [prefix, userInitials]
  );

  return {
    isAdmin,
    userName,
    userInitials,
    prefix,
    setPrefix,
    resetPrefix,
    fullReferenceText,
  };
}

export function PrintBranchToolbarControls({
  recordsCount,
  totalRecords,
  totalForms,
  groupMode,
  onChangeGroupMode,
}: {
  recordsCount?: number;
  totalRecords?: number;
  totalForms: number;
  groupMode: PrintFormGroupMode;
  onChangeGroupMode: (mode: PrintFormGroupMode) => void;
}) {
  const count = recordsCount ?? totalRecords ?? 0;
  if (count <= 1) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/90 p-1 shadow-2xs whitespace-nowrap dark:border-slate-700 dark:bg-slate-800/90">
      <span className="hidden items-center gap-1 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:inline-flex dark:text-slate-400">
        <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        Forms:
      </span>
      <button
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
          groupMode === 'branch'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
        }`}
        onClick={() => onChangeGroupMode('branch')}
        title="Group beneficiaries that share the same LBP servicing branch into one form per branch"
        type="button"
      >
        <Building2 className="h-3 w-3" />
        <span>Per Branch</span>
      </button>
      <button
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
          groupMode === 'municipality'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
        }`}
        onClick={() => onChangeGroupMode('municipality')}
        title="Generate a separate form header for each distinct beneficiary municipality/address"
        type="button"
      >
        <MapPin className="h-3 w-3" />
        <span>Per Address</span>
      </button>
      <button
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
          groupMode === 'single'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
        }`}
        onClick={() => onChangeGroupMode('single')}
        title="Combine all selected beneficiaries onto a single form"
        type="button"
      >
        <Layers className="h-3 w-3" />
        <span>Single Form</span>
      </button>
      <span className="ml-0.5 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 whitespace-nowrap dark:bg-blue-900/50 dark:text-blue-200">
        {totalForms} {totalForms === 1 ? 'Form' : 'Forms'}
      </span>
    </div>
  );
}

export function PrintFormEditorSelector<T extends PrintRecordWithBranch>({
  groupedForms,
  activeFormKey,
  onSelectFormKey,
  directories,
  currentBranchName,
  onSelectBranchDirectory,
  onApplyBranchDirectory,
}: {
  groupedForms: GroupedPrintForm<T>[];
  activeFormKey: string;
  onSelectFormKey: (formKey: string) => void;
  directories: LbpBranchDirectoryEntry[];
  currentBranchName?: string;
  onSelectBranchDirectory?: (branchName: string) => void;
  onApplyBranchDirectory?: (branchName: string) => void;
}) {
  const handleSelectBranch = onSelectBranchDirectory ?? onApplyBranchDirectory;
  const activeBranchText =
    currentBranchName ??
    groupedForms.find((f) => f.formKey === activeFormKey)?.branchDirectory?.addressee_branch ??
    '';

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg border border-blue-200/80 bg-white/90 px-3 py-2 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
            <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            {groupedForms.length > 1 ? 'Select Generated Form to Customize:' : 'Auto-Resolved LBP Branch Header:'}
          </span>
          {groupedForms.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {groupedForms.map((f) => {
                const isSelected = f.formKey === activeFormKey;
                return (
                  <button
                    key={f.formKey}
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                    onClick={() => onSelectFormKey(f.formKey)}
                    type="button"
                  >
                    <span>
                      Form {f.formIndex + 1}: {f.label}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected
                          ? 'bg-blue-800 text-white'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {f.records.length}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {groupedForms[0]?.label} — {groupedForms[0]?.branchDirectory?.addressee_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            LBP Branch Directory Preset:
          </label>
          <select
            className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            onChange={(e) => {
              if (e.target.value && handleSelectBranch) {
                handleSelectBranch(e.target.value);
              }
            }}
            value={
              directories.find((d) =>
                activeBranchText.toUpperCase().includes(d.branch.toUpperCase())
              )?.branch || ''
            }
          >
            <option value="">-- Choose LBP Branch --</option>
            {directories.map((dir) => (
              <option key={dir.branch} value={dir.branch}>
                {dir.branch} Branch ({dir.addressee_name})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function SecondCopySignatoryReference({
  hideHeaderFooter,
}: {
  hideHeaderFooter?: boolean;
}) {
  const { fullReferenceText } = useSecondCopyReferencePrefix();

  if (!hideHeaderFooter) {
    return null;
  }

  return (
    <div className="mt-4 text-xs font-normal text-black print:mt-3">
      <span>{fullReferenceText}</span>
    </div>
  );
}

export function PrintFormScreenBanner({
  formIndex,
  totalForms,
  formLabel,
  recipientName,
  bankBranch,
  header,
  rowsCount,
  isFirstPage = true,
}: {
  formIndex: number;
  totalForms: number;
  formLabel: string;
  recipientName?: string;
  bankBranch?: string;
  header?: FormHeaderDetails;
  rowsCount: number;
  isFirstPage?: boolean;
}) {
  if (!isFirstPage || totalForms <= 1) {
    return null;
  }

  const resolvedRecipientName = recipientName ?? header?.recipientName ?? '';
  const resolvedBankBranch = bankBranch ?? header?.bankBranch ?? '';

  return (
    <div className="no-print mb-2 flex w-full max-w-[780px] flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/95 px-3.5 py-2 text-xs shadow-xs dark:border-blue-900/60 dark:bg-slate-900 print:hidden">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
          Form {formIndex + 1} of {totalForms}
        </span>
        <span className="font-bold text-slate-800 dark:text-slate-100">{formLabel}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-blue-800 dark:text-blue-300">{resolvedRecipientName}</span>
        <span>•</span>
        <span>{resolvedBankBranch}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs dark:bg-slate-800 dark:text-slate-200">
          {rowsCount} {rowsCount === 1 ? 'Beneficiary' : 'Beneficiaries'}
        </span>
      </div>
    </div>
  );
}

