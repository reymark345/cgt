import {
  AlertTriangle,
  Archive,
  ArrowRightLeft,
  ArrowUpDown,
  Banknote,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  GitCompare,
  GitFork,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Scissors,
  Search,
  Truck,
  Undo2,
  Unlock,
  Upload,
  UserX,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
  TableDisplayFieldsButton,
  useTableDisplayFields,
} from '../../../Components/TableDisplayFieldsControl';
import type { CurrentView } from '../types';

type OpeningRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name_of_new_grantee: string | null;
  name_of_old_grantee: string | null;
  card_number_of_old: string | null;
  status_of_old_grantee: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type DistributionRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  run_date: string | null;
  name: string | null;
  card_number: string | null;
  schedule: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type OtcWithdrawalRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name: string | null;
  card_number: string | null;
  reason_of_request: string | null;
  account_balance: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type ReplacementRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name: string | null;
  card_number: string | null;
  reason_of_request: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type TransferOfFundRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  old_card_number: string | null;
  old_cardholder_name: string | null;
  new_card_number: string | null;
  new_cardholder_name: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type ForcePinRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name: string | null;
  card_number: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type LockingRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name: string | null;
  card_number: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type LiftingRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name: string | null;
  card_number: string | null;
  status: string | null;
  remarks: string | null;
  drn?: string | null;
  created_by?: string | null;
  created_at: string | null;
};

type UndoTarget = {
  id: number;
  household_id_number: string | null;
  name: string | null;
  address?: string | null;
  card_number?: string | null;
  moduleType: 'opening' | 'distribution' | 'otc-withdrawal' | 'replacement' | 'transfer-of-fund' | 'force-pin' | 'locking' | 'lifting';
};

type DataModuleConfig = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge: string;
  accentColor: string;
  columns: string[];
};

const moduleConfigs: Record<string, DataModuleConfig> = {
  opening: {
    title: 'Opening',
    subtitle: 'Manage and monitor account opening records, depository batch files, and bank endorsement status.',
    icon: FolderOpen,
    badge: 'Account Services',
    accentColor: 'text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Name of New Grantee',
      'Name of Old Grantee',
      'Card Number of Old',
      'Status of Old Grantee',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  distribution: {
    title: 'Distribution',
    subtitle: 'Manage and monitor card distribution schedules, releasing batch endorsements, and beneficiary card claims.',
    icon: Truck,
    badge: 'Logistics',
    accentColor: 'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Run Date',
      'Name',
      'Card Number',
      'Schedule',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  'otc-withdrawal': {
    title: 'OTC Withdrawal',
    subtitle: 'Manage and track Over-The-Counter payout schedules, offsite authorization batches, and Land Bank endorsement letters.',
    icon: Banknote,
    badge: 'Disbursement',
    accentColor: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Name/ Updated Name',
      'Card Number',
      'Reason of Request',
      'Account Balance',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  replacement: {
    title: 'Replacement',
    subtitle: 'Track and manage card replacement batch series, re-issuance records, and cardholder exchange logs.',
    icon: RefreshCw,
    badge: 'Card Management',
    accentColor: 'text-purple-600 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Name/ Updated Name',
      'Card Number',
      'Reason of Request',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  'transfer-of-fund': {
    title: 'Transfer of Fund',
    subtitle: 'Manage and monitor fund transfer endorsements, depository crediting requests, and unwithdrawn grant reconciliations.',
    icon: ArrowRightLeft,
    badge: 'Fund Transfers',
    accentColor: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Old Card Number',
      'Old Cardholder Name',
      'New Card Number',
      'New Cardholder Name',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  'force-pin': {
    title: 'Force PIN',
    subtitle: 'Process and monitor EMV card PIN resets, forced authorization requests, and branch security validations.',
    icon: KeyRound,
    badge: 'Security & PIN',
    accentColor: 'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Name',
      'Card Number',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  locking: {
    title: 'Locking',
    subtitle: 'Manage and monitor card locking requests, depository restriction flags, and security endorsement status.',
    icon: Lock,
    badge: 'Security',
    accentColor: 'text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Name',
      'Card Number',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  lifting: {
    title: 'Lifting',
    subtitle: 'Manage and monitor card unfreezing requests, lifting restriction flags, and security endorsement status.',
    icon: Unlock,
    badge: 'Resolution',
    accentColor: 'text-teal-600 bg-teal-500/10 dark:text-teal-400 dark:bg-teal-500/20',
    columns: [
      'Item No',
      'Address',
      'Household Id Number',
      'Name',
      'Card Number',
      'DRN',
      'Added By',
      'Action',
    ],
  },
  matching: {
    title: 'Matching',
    subtitle: 'Cross-match cash cards, grantee household identification, and Land Bank depository database records.',
    icon: GitCompare,
    badge: 'Validation',
    accentColor: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    columns: ['Match ID', 'Household ID', 'Masterlist Name', 'Bank Name Match', 'LBP Account', 'Confidence', 'Match Status'],
  },
  lock: {
    title: 'Lock',
    subtitle: 'Manage card locking requests, restriction flags, lost/stolen reports, and frozen transaction batches.',
    icon: Lock,
    badge: 'Security',
    accentColor: 'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
    columns: ['Reference No.', 'Household ID', 'Cardholder Name', 'Account Number', 'Lock Reason', 'Date Locked', 'Lock Status'],
  },
  'replacement-series': {
    title: 'Replacement Series',
    subtitle: 'Track and manage card replacement batch series, re-issuance records, and cardholder exchange logs.',
    icon: RefreshCw,
    badge: 'Card Management',
    accentColor: 'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/20',
    columns: ['Series No.', 'Household ID', 'Grantee Name', 'Old Account', 'New Account', 'Reason for Replacement', 'Series Status'],
  },
  otc: {
    title: 'OTC (Over-The-Counter)',
    subtitle: 'Manage and track Over-The-Counter payout schedules, offsite authorization batches, and acknowledgment receipts.',
    icon: Banknote,
    badge: 'Disbursement',
    accentColor: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    columns: ['Payout Batch', 'Municipality', 'Household ID', 'Grantee Name', 'Disbursement Amount', 'Servicing Branch', 'Payout Status'],
  },
  tof: {
    title: 'TOF (Transfer of Funds)',
    subtitle: 'Track fund transfer batches, depository crediting orders, transmittal numbers, and settlement reconciliation.',
    icon: FileText,
    badge: 'Fund Transfers',
    accentColor: 'text-purple-600 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-500/20',
    columns: ['TOF Batch No.', 'Funding Source', 'Total Accounts', 'Total Amount', 'Endorsement Date', 'Settlement Reference', 'TOF Status'],
  },
  'tof-branch': {
    title: 'TOF Branch',
    subtitle: 'Manage servicing branch assignments, fund distribution routing, and branch confirmation receipts.',
    icon: GitFork,
    badge: 'Branch Logistics',
    accentColor: 'text-teal-600 bg-teal-500/10 dark:text-teal-400 dark:bg-teal-500/20',
    columns: ['Routing ID', 'Branch Name', 'Branch Code', 'Assigned Households', 'Total Allocation', 'Transmittal Date', 'Branch Status'],
  },
  'perforation-series': {
    title: 'Perforation Series',
    subtitle: 'Maintain records of decommissioned and perforated cards, destruction series logs, and audit trail proofs.',
    icon: Scissors,
    badge: 'Decommissioning',
    accentColor: 'text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/20',
    columns: ['Perforation No.', 'Card Serial No.', 'Account Number', 'Grantee Name', 'Perforated Date', 'Disposal Officer', 'Disposal Status'],
  },
  closure: {
    title: 'Closure',
    subtitle: 'Process account closures, settlement terminations, inactive card retirement, and archived registries.',
    icon: Archive,
    badge: 'Account Lifecycle',
    accentColor: 'text-slate-600 bg-slate-500/10 dark:text-slate-400 dark:bg-slate-500/20',
    columns: ['Closure Case ID', 'Household ID', 'Grantee Name', 'Account Number', 'Terminal Balance', 'Closure Reason', 'Closure Status'],
  },
  deactivation: {
    title: 'Deactivation',
    subtitle: 'Manage card deactivations, beneficiary status invalidation reports, and inactive account registries.',
    icon: UserX,
    badge: 'Status Control',
    accentColor: 'text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20',
    columns: ['Deactivation ID', 'Household ID', 'Grantee Name', 'Account Number', 'Deactivation Date', 'Authority Order', 'Deactivation Status'],
  },
  'distribution-series': {
    title: 'Distribution Series',
    subtitle: 'Oversee payout distribution batch series, logistics schedules, releasing events, and field issuance logs.',
    icon: Truck,
    badge: 'Logistics',
    accentColor: 'text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
    columns: ['Distribution Batch', 'Cluster / Area', 'Target Beneficiaries', 'Scheduled Date', 'Focal Person', 'Cards Released', 'Progress'],
  },
};

type DataModuleViewProps = {
  view: CurrentView;
};

type SharedAuthPageProps = {
  auth?: {
    user?: {
      role?: string | null;
      is_admin?: boolean;
      permissions?: Record<string, boolean>;
    } | null;
  };
};

export function DataModuleView({ view }: DataModuleViewProps) {
  const { auth } = usePage<SharedAuthPageProps>().props;
  const canEditPrintForms = Boolean(
    auth?.user?.is_admin ||
    auth?.user?.role === 'Admin' ||
    auth?.user?.permissions?.edit_print_forms
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openingRecords, setOpeningRecords] = useState<OpeningRecord[]>([]);
  const [openingTotal, setOpeningTotal] = useState(0);
  const [distributionRecords, setDistributionRecords] = useState<DistributionRecord[]>([]);
  const [distributionTotal, setDistributionTotal] = useState(0);
  const [otcRecords, setOtcRecords] = useState<OtcWithdrawalRecord[]>([]);
  const [otcTotal, setOtcTotal] = useState(0);
  const [replacementRecords, setReplacementRecords] = useState<ReplacementRecord[]>([]);
  const [replacementTotal, setReplacementTotal] = useState(0);
  const [transferOfFundRecords, setTransferOfFundRecords] = useState<TransferOfFundRecord[]>([]);
  const [transferOfFundTotal, setTransferOfFundTotal] = useState(0);
  const [forcePinRecords, setForcePinRecords] = useState<ForcePinRecord[]>([]);
  const [forcePinTotal, setForcePinTotal] = useState(0);
  const [lockingRecords, setLockingRecords] = useState<LockingRecord[]>([]);
  const [lockingTotal, setLockingTotal] = useState(0);
  const [liftingRecords, setLiftingRecords] = useState<LiftingRecord[]>([]);
  const [liftingTotal, setLiftingTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const config = moduleConfigs[view] || {
    title: 'Data Module',
    subtitle: 'Manage and monitor data batches and transactions.',
    icon: FolderOpen,
    badge: 'Data Management',
    accentColor: 'text-primary bg-primary/10 dark:text-accent-foreground dark:bg-primary/20',
    columns: ['ID', 'Reference', 'Household ID', 'Name', 'Date', 'Status'],
  };

  const columnOptions = useMemo(
    () => config.columns.map((col) => ({ key: col, label: col })),
    [config.columns]
  );

  const {
    isAdmin: isAdminUser,
    visibleKeys: visibleColumns,
    isColVisible,
    toggleColumn: handleToggleColumn,
    selectAllColumns: handleSelectAllColumns,
    resetDefaultColumns: handleResetDefaultColumns,
    isSaving: isSavingDisplayFields,
  } = useTableDisplayFields(`request_${view}`, columnOptions, config.columns);

  const Icon = config.icon;

  const fetchOpeningData = useCallback(async (page = 1, query = '') => {
    if (view !== 'opening') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/opening/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOpeningRecords(json.data || []);
          setOpeningTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load opening records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  const fetchDistributionData = useCallback(async (page = 1, query = '') => {
    if (view !== 'distribution') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/distribution/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDistributionRecords(json.data || []);
          setDistributionTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load distribution records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  const fetchOtcData = useCallback(async (page = 1, query = '') => {
    if (view !== 'otc-withdrawal') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/otc-withdrawal/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOtcRecords(json.data || []);
          setOtcTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load OTC withdrawal records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  const fetchReplacementData = useCallback(async (page = 1, query = '') => {
    if (view !== 'replacement') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/replacement/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setReplacementRecords(json.data || []);
          setReplacementTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load replacement records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  const fetchTransferOfFundData = useCallback(async (page = 1, query = '') => {
    if (view !== 'transfer-of-fund') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/transfer-of-fund/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTransferOfFundRecords(json.data || []);
          setTransferOfFundTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load transfer of fund records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  const fetchForcePinData = useCallback(async (page = 1, query = '') => {
    if (view !== 'force-pin') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/force-pin/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setForcePinRecords(json.data || []);
          setForcePinTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load force pin records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  const fetchLockingData = useCallback(async (page = 1, query = '') => {
    if (view !== 'locking') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/locking/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLockingRecords(json.data || []);
          setLockingTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load locking records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  const fetchLiftingData = useCallback(async (page = 1, query = '') => {
    if (view !== 'lifting') return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        search: query,
      });
      const res = await fetch(`/lifting/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLiftingRecords(json.data || []);
          setLiftingTotal(json.total || 0);
          setCurrentPage(json.current_page || 1);
          setLastPage(json.last_page || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load lifting records:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (!['opening', 'distribution', 'otc-withdrawal', 'replacement', 'transfer-of-fund', 'force-pin', 'locking', 'lifting'].includes(view)) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, view]);

  useEffect(() => {
    if (view === 'opening') {
      fetchOpeningData(currentPage, debouncedSearch);
    } else if (view === 'distribution') {
      fetchDistributionData(currentPage, debouncedSearch);
    } else if (view === 'otc-withdrawal') {
      fetchOtcData(currentPage, debouncedSearch);
    } else if (view === 'replacement') {
      fetchReplacementData(currentPage, debouncedSearch);
    } else if (view === 'transfer-of-fund') {
      fetchTransferOfFundData(currentPage, debouncedSearch);
    } else if (view === 'force-pin') {
      fetchForcePinData(currentPage, debouncedSearch);
    } else if (view === 'locking') {
      fetchLockingData(currentPage, debouncedSearch);
    } else if (view === 'lifting') {
      fetchLiftingData(currentPage, debouncedSearch);
    }
  }, [view, currentPage, debouncedSearch, fetchOpeningData, fetchDistributionData, fetchOtcData, fetchReplacementData, fetchTransferOfFundData, fetchForcePinData, fetchLockingData, fetchLiftingData]);

  const [recordToUndo, setRecordToUndo] = useState<UndoTarget | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isAssigningDrn, setIsAssigningDrn] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isRequestModule = [
    'opening',
    'distribution',
    'otc-withdrawal',
    'replacement',
    'transfer-of-fund',
    'force-pin',
    'locking',
    'lifting',
  ].includes(view);

  useEffect(() => {
    setSelectedIds([]);
  }, [view]);

  const currentRecords =
    view === 'opening'
      ? openingRecords
      : view === 'distribution'
      ? distributionRecords
      : view === 'otc-withdrawal'
      ? otcRecords
      : view === 'replacement'
      ? replacementRecords
      : view === 'transfer-of-fund'
      ? transferOfFundRecords
      : view === 'force-pin'
      ? forcePinRecords
      : view === 'locking'
      ? lockingRecords
      : view === 'lifting'
      ? liftingRecords
      : [];

  const currentPageIds = currentRecords.map((r) => r.id).filter((id): id is number => Boolean(id));
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
  const somePageSelected = currentPageIds.some((id) => selectedIds.includes(id)) && !allPageSelected;
  const hasSelectedRows = selectedIds.length > 0;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const renderRowCheckbox = (id: number, idx: number) => (
    <td className="w-10 px-4 py-3 text-center">
      <input
        type="checkbox"
        checked={selectedIds.includes(id)}
        onChange={() => toggleSelectRow(id)}
        aria-label={`Select row ${(currentPage - 1) * 15 + idx + 1}`}
        className="h-4 w-4 cursor-pointer rounded border-border bg-background text-primary accent-primary focus:ring-primary"
      />
    </td>
  );

  const refreshCurrentModuleData = useCallback(() => {
    if (view === 'opening') {
      fetchOpeningData(currentPage, debouncedSearch);
    } else if (view === 'distribution') {
      fetchDistributionData(currentPage, debouncedSearch);
    } else if (view === 'otc-withdrawal') {
      fetchOtcData(currentPage, debouncedSearch);
    } else if (view === 'replacement') {
      fetchReplacementData(currentPage, debouncedSearch);
    } else if (view === 'transfer-of-fund') {
      fetchTransferOfFundData(currentPage, debouncedSearch);
    } else if (view === 'force-pin') {
      fetchForcePinData(currentPage, debouncedSearch);
    } else if (view === 'locking') {
      fetchLockingData(currentPage, debouncedSearch);
    } else if (view === 'lifting') {
      fetchLiftingData(currentPage, debouncedSearch);
    }
  }, [
    view,
    currentPage,
    debouncedSearch,
    fetchOpeningData,
    fetchDistributionData,
    fetchOtcData,
    fetchReplacementData,
    fetchTransferOfFundData,
    fetchForcePinData,
    fetchLockingData,
    fetchLiftingData,
  ]);

  const renderDrnCell = (drn?: string | null) => (
    <td className="px-4 py-3 whitespace-nowrap">
      {drn ? (
        <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
          {drn}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )}
    </td>
  );

  const handlePrintFormRequest = async (modulePath: string, idsToPrint: number[]) => {
    if (isAssigningDrn || idsToPrint.length === 0) return;
    setIsAssigningDrn(true);
    setFeedback(null);

    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

      const res = await fetch('/libraries/drn/assign-for-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        body: JSON.stringify({
          module: modulePath,
          ids: idsToPrint,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: 'error',
          message: data.message || 'DRN is not enough please add more DRN',
        });
        return;
      }

      window.dispatchEvent(new CustomEvent('cgt:drn-updated'));
      refreshCurrentModuleData();

      const printUrl =
        data.print_url ||
        `/${modulePath}/print?ids=${idsToPrint.join(',')}${
          Array.isArray(data.drns) && data.drns.length > 0
            ? `&drns=${encodeURIComponent(data.drns.join(','))}`
            : ''
        }`;

      const link = document.createElement('a');
      link.href = printUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to assign DRN for print:', err);
      setFeedback({
        type: 'error',
        message: 'DRN is not enough please add more DRN',
      });
    } finally {
      setIsAssigningDrn(false);
    }
  };

  const renderRowPrintButton = (id: number, modulePath: string, hoverClasses: string, titleText: string) => {
    const isChecked = selectedIds.includes(id);
    if (!isChecked) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex h-7 cursor-not-allowed items-center gap-1 rounded-md border border-border/60 bg-card/50 px-2 text-[11px] font-medium text-muted-foreground opacity-45"
          title="Check this row first to enable printing"
        >
          <Printer className="h-3 w-3" />
          <span>Print</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled={isAssigningDrn}
        onClick={() => handlePrintFormRequest(modulePath, [id])}
        className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-foreground transition disabled:opacity-50 ${hoverClasses}`}
        title={titleText}
      >
        <Printer className="h-3 w-3" />
        <span>Print</span>
      </button>
    );
  };

  const handleConfirmUndo = async () => {
    if (!recordToUndo) return;
    setIsUndoing(true);
    setFeedback(null);

    const isDist = recordToUndo.moduleType === 'distribution';
    const isOtc = recordToUndo.moduleType === 'otc-withdrawal';
    const isRep = recordToUndo.moduleType === 'replacement';
    const isTof = recordToUndo.moduleType === 'transfer-of-fund';
    const isFp = recordToUndo.moduleType === 'force-pin';
    const isLock = recordToUndo.moduleType === 'locking';
    const isLift = recordToUndo.moduleType === 'lifting';
    const endpoint = isDist
      ? `/distribution/${recordToUndo.id}`
      : isOtc
      ? `/otc-withdrawal/${recordToUndo.id}`
      : isRep
      ? `/replacement/${recordToUndo.id}`
      : isTof
      ? `/transfer-of-fund/${recordToUndo.id}`
      : isFp
      ? `/force-pin/${recordToUndo.id}`
      : isLock
      ? `/locking/${recordToUndo.id}`
      : isLift
      ? `/lifting/${recordToUndo.id}`
      : `/opening/${recordToUndo.id}`;

    const moduleLabel = isDist
      ? 'Distribution'
      : isOtc
      ? 'OTC Withdrawal'
      : isRep
      ? 'Replacement'
      : isTof
      ? 'Transfer of Fund'
      : isFp
      ? 'Force PIN'
      : isLock
      ? 'Locking'
      : isLift
      ? 'Lifting'
      : 'Opening';

    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
      });

      const data = await res.json();
      if (data.success) {
        if (isDist) {
          setDistributionRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setDistributionTotal((prev) => Math.max(0, prev - 1));
        } else if (isOtc) {
          setOtcRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setOtcTotal((prev) => Math.max(0, prev - 1));
        } else if (isRep) {
          setReplacementRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setReplacementTotal((prev) => Math.max(0, prev - 1));
        } else if (isTof) {
          setTransferOfFundRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setTransferOfFundTotal((prev) => Math.max(0, prev - 1));
        } else if (isFp) {
          setForcePinRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setForcePinTotal((prev) => Math.max(0, prev - 1));
        } else if (isLock) {
          setLockingRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setLockingTotal((prev) => Math.max(0, prev - 1));
        } else if (isLift) {
          setLiftingRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setLiftingTotal((prev) => Math.max(0, prev - 1));
        } else {
          setOpeningRecords((prev) => prev.filter((r) => r.id !== recordToUndo.id));
          setOpeningTotal((prev) => Math.max(0, prev - 1));
        }
        setFeedback({
          type: 'success',
          message:
            data.message ||
            `${moduleLabel} record for Household ${recordToUndo.household_id_number} was successfully undone and removed.`,
        });
        setSelectedIds((prev) => prev.filter((id) => id !== recordToUndo.id));
        setRecordToUndo(null);

        // Live update sidebar badges and dashboard metrics immediately
        if (data.module_counts) {
          window.dispatchEvent(
            new CustomEvent('cgt:module-counts-updated', {
              detail: { counts: data.module_counts },
            })
          );
        } else {
          window.dispatchEvent(new CustomEvent('cgt:refresh-module-counts'));
        }
      } else {
        setFeedback({
          type: 'error',
          message: data.message || `Failed to remove the ${moduleLabel.toLowerCase()} record.`,
        });
      }
    } catch (err) {
      console.error(`Failed to undo ${recordToUndo.moduleType} record:`, err);
      setFeedback({
        type: 'error',
        message: `A network error occurred while removing the ${moduleLabel.toLowerCase()} record.`,
      });
    } finally {
      setIsUndoing(false);
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <section className="mx-auto w-full max-w-[1800px] space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs dark:border-border dark:bg-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.accentColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {config.badge}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-muted-foreground">Data Operations</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{config.title}</h1>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground leading-relaxed sm:text-sm">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            {isRequestModule ? (
              <a
                href={`/${view}/export`}
                download
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-secondary dark:border-border"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Data</span>
              </a>
            ) : (
              <>
                <button
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-secondary dark:border-border"
                  type="button"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Template</span>
                </button>
                <button
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                  type="button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import Data</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Records</div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {view === 'opening'
                ? openingTotal.toLocaleString()
                : view === 'distribution'
                ? distributionTotal.toLocaleString()
                : view === 'otc-withdrawal'
                ? otcTotal.toLocaleString()
                : view === 'replacement'
                ? replacementTotal.toLocaleString()
                : view === 'transfer-of-fund'
                ? transferOfFundTotal.toLocaleString()
                : view === 'force-pin'
                ? forcePinTotal.toLocaleString()
                : view === 'locking'
                ? lockingTotal.toLocaleString()
                : view === 'lifting'
                ? liftingTotal.toLocaleString()
                : '0'}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Current system entries</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Batches</div>
            <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {view === 'opening'
                ? openingRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed').length
                : view === 'distribution'
                ? distributionRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'claimed').length
                : view === 'otc-withdrawal'
                ? otcRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'claimed').length
                : view === 'replacement'
                ? replacementRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'replaced').length
                : view === 'transfer-of-fund'
                ? transferOfFundRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'transferred').length
                : view === 'force-pin'
                ? forcePinRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed').length
                : view === 'locking'
                ? lockingRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed').length
                : view === 'lifting'
                ? liftingRecords.filter((r) => r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'completed').length
                : '0'}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Processed & validated</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Action</div>
            <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
              {view === 'opening'
                ? openingRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending').length
                : view === 'distribution'
                ? distributionRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'scheduled').length
                : view === 'otc-withdrawal'
                ? otcRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'scheduled').length
                : view === 'replacement'
                ? replacementRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'processing').length
                : view === 'transfer-of-fund'
                ? transferOfFundRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'processing').length
                : view === 'force-pin'
                ? forcePinRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'processing').length
                : view === 'locking'
                ? lockingRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'processing').length
                : view === 'lifting'
                ? liftingRecords.filter((r) => !r.status || r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'processing').length
                : '0'}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Awaiting review or dispatch</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 dark:border-border/60 dark:bg-secondary/20">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Last Sync</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Up to date</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Caraga Regional Database</div>
          </div>
        </div>
      </div>

      {/* Main Table / Data Section */}
      <div className="rounded-xl border border-border bg-card shadow-xs dark:border-border dark:bg-card">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-input dark:bg-background"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${config.title} records...`}
                type="text"
                value={searchTerm}
              />
            </div>

            {isRequestModule && (
              hasSelectedRows ? (
                <button
                  type="button"
                  disabled={isAssigningDrn}
                  onClick={() => handlePrintFormRequest(view, selectedIds)}
                  className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-2xs transition disabled:opacity-50 ${
                    view === 'distribution'
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-300 dark:hover:bg-cyan-400/25'
                      : view === 'otc-withdrawal'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25'
                      : view === 'replacement'
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:border-purple-400/30 dark:bg-purple-400/15 dark:text-purple-300 dark:hover:bg-purple-400/25'
                      : view === 'transfer-of-fund'
                      ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 dark:border-indigo-400/30 dark:bg-indigo-400/15 dark:text-indigo-300 dark:hover:bg-indigo-400/25'
                      : view === 'force-pin'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300 dark:hover:bg-amber-400/25'
                      : view === 'locking'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300 dark:hover:bg-rose-400/25'
                      : view === 'lifting'
                      ? 'border-teal-500/30 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300 dark:hover:bg-teal-400/25'
                      : 'border-blue-500/30 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300 dark:hover:bg-blue-400/25'
                  }`}
                  title={`Open printable ${config.title} Form for ${selectedIds.length} selected record(s)`}
                >
                  {isAssigningDrn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" />
                  )}
                  <span>Print Form ({selectedIds.length})</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-semibold text-muted-foreground opacity-50 shadow-2xs"
                  title="Select at least one row to enable Print Form"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Form</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <TableDisplayFieldsButton
              isAdmin={isAdminUser}
              columns={columnOptions}
              visibleKeys={visibleColumns}
              onToggleColumn={handleToggleColumn}
              onSelectAll={handleSelectAllColumns}
              onResetDefaults={handleResetDefaultColumns}
              isSaving={isSavingDisplayFields}
            />
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground dark:border-border"
              type="button"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground dark:border-border"
              type="button"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort</span>
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground dark:border-border"
              onClick={() => {
                if (view === 'opening') {
                  fetchOpeningData(currentPage, debouncedSearch);
                } else if (view === 'distribution') {
                  fetchDistributionData(currentPage, debouncedSearch);
                } else if (view === 'otc-withdrawal') {
                  fetchOtcData(currentPage, debouncedSearch);
                } else if (view === 'replacement') {
                  fetchReplacementData(currentPage, debouncedSearch);
                } else if (view === 'transfer-of-fund') {
                  fetchTransferOfFundData(currentPage, debouncedSearch);
                } else if (view === 'force-pin') {
                  fetchForcePinData(currentPage, debouncedSearch);
                } else if (view === 'locking') {
                  fetchLockingData(currentPage, debouncedSearch);
                } else if (view === 'lifting') {
                  fetchLiftingData(currentPage, debouncedSearch);
                }
              }}
              type="button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table Data Preview */}
        <div className="overflow-x-auto custom-scrollbar-table">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-border bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:bg-secondary/30">
              <tr>
                {isRequestModule && (
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = somePageSelected;
                      }}
                      onChange={toggleSelectAll}
                      disabled={currentPageIds.length === 0}
                      aria-label="Select all rows on this page"
                      title="Check All"
                      className="h-4 w-4 cursor-pointer rounded border-border bg-background text-primary accent-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </th>
                )}
                {config.columns.filter((col) => isColVisible(col)).map((col, idx) => (
                  <th key={idx} className={`px-4 py-3 ${col === 'Action' ? 'text-right' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view === 'opening' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Opening records...</span>
                      </div>
                    </td>
                  </tr>
                ) : openingRecords.length > 0 ? (
                  openingRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Name of New Grantee') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name_of_new_grantee || (
                            <span className="text-muted-foreground italic">None / Pending</span>
                          )}
                        </td>
                      )}
                      {isColVisible('Name of Old Grantee') && (
                        <td className="px-4 py-3 text-foreground">
                          {item.name_of_old_grantee || '-'}
                        </td>
                      )}
                      {isColVisible('Card Number of Old') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {item.card_number_of_old || '-'}
                        </td>
                      )}
                      {isColVisible('Status of Old Grantee') && (
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              item.status_of_old_grantee?.toLowerCase().includes('active')
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {item.status_of_old_grantee || 'Active'}
                          </span>
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'opening',
                              'hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400',
                              'Print Endorsement Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.name_of_old_grantee || item.name_of_new_grantee || null,
                                  address: item.address,
                                  card_number: item.card_number_of_old,
                                  moduleType: 'opening',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from Opening list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No account opening records found matching "${debouncedSearch}".`
                            : 'There are no account opening records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : view === 'distribution' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Distribution records...</span>
                      </div>
                    </td>
                  </tr>
                ) : distributionRecords.length > 0 ? (
                  distributionRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Run Date') && (
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {item.run_date || '-'}
                        </td>
                      )}
                      {isColVisible('Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name || '-'}
                        </td>
                      )}
                      {isColVisible('Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.card_number || '-'}
                        </td>
                      )}
                      {isColVisible('Schedule') && (
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">
                          {item.schedule ? (
                            <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                              {item.schedule}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Pending schedule</span>
                          )}
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'distribution',
                              'hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400',
                              'Print Distribution Endorsement Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.name,
                                  address: item.address,
                                  card_number: item.card_number,
                                  moduleType: 'distribution',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from Distribution list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No distribution records found matching "${debouncedSearch}".`
                            : 'There are no distribution records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : view === 'otc-withdrawal' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading OTC Withdrawal records...</span>
                      </div>
                    </td>
                  </tr>
                ) : otcRecords.length > 0 ? (
                  otcRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Name/ Updated Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name || '-'}
                        </td>
                      )}
                      {isColVisible('Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.card_number || '-'}
                        </td>
                      )}
                      {isColVisible('Reason of Request') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.reason_of_request || ''}>
                          {item.reason_of_request || '-'}
                        </td>
                      )}
                      {isColVisible('Account Balance') && (
                        <td className="px-4 py-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {item.account_balance || '-'}
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'otc-withdrawal',
                              'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400',
                              'Print OTC Withdrawal Endorsement Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.name,
                                  address: item.address,
                                  card_number: item.card_number,
                                  moduleType: 'otc-withdrawal',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from OTC Withdrawal list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No OTC withdrawal records found matching "${debouncedSearch}".`
                            : 'There are no OTC withdrawal records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : view === 'replacement' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600 dark:text-purple-400" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Replacement records...</span>
                      </div>
                    </td>
                  </tr>
                ) : replacementRecords.length > 0 ? (
                  replacementRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Name/ Updated Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name || '-'}
                        </td>
                      )}
                      {isColVisible('Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.card_number || '-'}
                        </td>
                      )}
                      {isColVisible('Reason of Request') && (
                        <td className="max-w-[250px] truncate px-4 py-3 text-muted-foreground" title={item.reason_of_request || ''}>
                          {item.reason_of_request || '-'}
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'replacement',
                              'hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400',
                              'Print Replacement Endorsement Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.name,
                                  address: item.address,
                                  card_number: item.card_number,
                                  moduleType: 'replacement',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from Replacement list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No replacement records found matching "${debouncedSearch}".`
                            : 'There are no replacement records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : view === 'transfer-of-fund' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Transfer of Fund records...</span>
                      </div>
                    </td>
                  </tr>
                ) : transferOfFundRecords.length > 0 ? (
                  transferOfFundRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Old Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.old_card_number || '-'}
                        </td>
                      )}
                      {isColVisible('Old Cardholder Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.old_cardholder_name || '-'}
                        </td>
                      )}
                      {isColVisible('New Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.new_card_number || '-'}
                        </td>
                      )}
                      {isColVisible('New Cardholder Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.new_cardholder_name || '-'}
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'transfer-of-fund',
                              'hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400',
                              'Print Transfer of Fund Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.new_cardholder_name || item.old_cardholder_name || null,
                                  address: item.address,
                                  card_number: item.old_card_number || item.new_card_number,
                                  moduleType: 'transfer-of-fund',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from Transfer of Fund list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No transfer of fund records found matching "${debouncedSearch}".`
                            : 'There are no transfer of fund records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : view === 'force-pin' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600 dark:text-amber-400" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Force PIN records...</span>
                      </div>
                    </td>
                  </tr>
                ) : forcePinRecords.length > 0 ? (
                  forcePinRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name || '-'}
                        </td>
                      )}
                      {isColVisible('Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.card_number || '-'}
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'force-pin',
                              'hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400',
                              'Print Force PIN Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.name,
                                  address: item.address,
                                  card_number: item.card_number,
                                  moduleType: 'force-pin',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from Force PIN list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No force pin records found matching "${debouncedSearch}".`
                            : 'There are no force pin records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : view === 'locking' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-rose-600 dark:text-rose-400" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Locking records...</span>
                      </div>
                    </td>
                  </tr>
                ) : lockingRecords.length > 0 ? (
                  lockingRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name || '-'}
                        </td>
                      )}
                      {isColVisible('Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.card_number || '-'}
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'locking',
                              'hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400',
                              'Print Locking Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.name,
                                  address: item.address,
                                  card_number: item.card_number,
                                  moduleType: 'locking',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from Locking list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No locking records found matching "${debouncedSearch}".`
                            : 'There are no locking records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : view === 'lifting' ? (
                loading ? (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400" />
                        <span className="mt-2 text-xs font-medium text-muted-foreground">Loading Lifting records...</span>
                      </div>
                    </td>
                  </tr>
                ) : liftingRecords.length > 0 ? (
                  liftingRecords.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${
                        selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {renderRowCheckbox(item.id, idx)}
                      {isColVisible('Item No') && (
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {(currentPage - 1) * 15 + idx + 1}
                        </td>
                      )}
                      {isColVisible('Address') && (
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={item.address || ''}>
                          {item.address || '-'}
                        </td>
                      )}
                      {isColVisible('Household Id Number') && (
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {item.household_id_number || '-'}
                        </td>
                      )}
                      {isColVisible('Name') && (
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name || '-'}
                        </td>
                      )}
                      {isColVisible('Card Number') && (
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {item.card_number || '-'}
                        </td>
                      )}
                      {isColVisible('DRN') && renderDrnCell(item.drn)}
                      {isColVisible('Added By') && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {item.created_by || '-'}
                        </td>
                      )}
                      {isColVisible('Action') && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderRowPrintButton(
                              item.id,
                              'lifting',
                              'hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400',
                              'Print Lifting Form for this grantee'
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setRecordToUndo({
                                  id: item.id,
                                  household_id_number: item.household_id_number,
                                  name: item.name,
                                  address: item.address,
                                  card_number: item.card_number,
                                  moduleType: 'lifting',
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2 text-[11px] font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                              title="Undo / Remove from Lifting list"
                            >
                              <Undo2 className="h-3 w-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={visibleColumns.length + 1}>
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          No {config.title} records found
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {debouncedSearch
                            ? `No lifting records found matching "${debouncedSearch}".`
                            : 'There are no lifting records logged yet. Records will automatically appear here when requests are submitted in Inquiry.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td className="px-4 py-16 text-center" colSpan={visibleColumns.length}>
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-foreground">
                        No {config.title} records found
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        There are no data records logged for {config.title} yet. Click Import Data above or upload an approved CSV/Excel batch file to populate this module.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Placeholder */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {['opening', 'distribution', 'otc-withdrawal', 'replacement', 'transfer-of-fund', 'force-pin', 'locking', 'lifting'].includes(view) ? (
            <>
              {(() => {
                const totalEntries =
                  view === 'opening'
                    ? openingTotal
                    : view === 'distribution'
                    ? distributionTotal
                    : view === 'otc-withdrawal'
                    ? otcTotal
                    : view === 'replacement'
                    ? replacementTotal
                    : view === 'transfer-of-fund'
                    ? transferOfFundTotal
                    : view === 'force-pin'
                    ? forcePinTotal
                    : view === 'locking'
                    ? lockingTotal
                    : liftingTotal;
                return (
                  <span>
                    Showing {totalEntries === 0 ? 0 : (currentPage - 1) * 15 + 1} to{' '}
                    {Math.min(currentPage * 15, totalEntries)} of {totalEntries} entries
                  </span>
                );
              })()}
              <div className="flex items-center gap-1.5">
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  Previous
                </button>
                <span className="px-2 text-xs font-medium text-foreground">
                  Page {currentPage} of {Math.max(1, lastPage)}
                </span>
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={currentPage >= lastPage || loading}
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <span>Showing 0 of 0 entries</span>
              <div className="flex items-center gap-1">
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:opacity-50"
                  disabled
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="rounded px-2.5 py-1 text-muted-foreground hover:bg-secondary disabled:opacity-50"
                  disabled
                  type="button"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Undo Confirmation Modal */}
      {recordToUndo && (() => {
        const undoLabel =
          recordToUndo.moduleType === 'distribution'
            ? 'Distribution'
            : recordToUndo.moduleType === 'otc-withdrawal'
            ? 'OTC Withdrawal'
            : recordToUndo.moduleType === 'replacement'
            ? 'Replacement'
            : recordToUndo.moduleType === 'transfer-of-fund'
            ? 'Transfer of Fund'
            : recordToUndo.moduleType === 'force-pin'
            ? 'Force PIN'
            : recordToUndo.moduleType === 'locking'
            ? 'Locking'
            : recordToUndo.moduleType === 'lifting'
            ? 'Lifting'
            : 'Opening';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    <Undo2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Undo {undoLabel} Record
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Remove grantee from {undoLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isUndoing && setRecordToUndo(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to remove this grantee from the {undoLabel} list? If this was added by mistake in the Inquiry page, this action will remove the record from {undoLabel} and cancel its pending request.
                </p>

              <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Household ID:</span>
                  <span className="font-mono font-bold text-foreground">{recordToUndo.household_id_number || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Grantee Name:</span>
                  <span className="font-semibold text-foreground">
                    {recordToUndo.name || '-'}
                  </span>
                </div>
                {recordToUndo.address && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="max-w-[220px] truncate text-foreground">{recordToUndo.address}</span>
                  </div>
                )}
                {recordToUndo.card_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Card Number:</span>
                    <span className="font-mono text-muted-foreground">{recordToUndo.card_number}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border/80 pt-4">
              <button
                type="button"
                disabled={isUndoing}
                onClick={() => setRecordToUndo(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUndoing}
                onClick={handleConfirmUndo}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 dark:bg-rose-600 dark:hover:bg-rose-700"
              >
                {isUndoing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Undo2 className="h-3.5 w-3.5" />
                    <span>Confirm Undo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
      })()}

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border p-4 shadow-xl transition-all animate-in slide-in-from-bottom-2 ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-card text-foreground dark:border-emerald-500/40'
              : 'border-rose-500/30 bg-card text-foreground dark:border-rose-500/40'
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-foreground">
              {feedback.type === 'success' ? 'Action Completed' : 'Action Failed'}
            </p>
            <p className="mt-0.5 text-muted-foreground">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}

