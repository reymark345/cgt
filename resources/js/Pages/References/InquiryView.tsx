import { useState, useEffect, useCallback, useTransition, useRef, useMemo, Fragment } from 'react';
import { usePage } from '@inertiajs/react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Expand,
  ClipboardList,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FolderPlus,
  GraduationCap,
  HeartPulse,
  Info,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Shrink,
  SlidersHorizontal,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UsersRound,
  Wheat,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';
import type {
  EmvDatabaseRecord,
  GranteeRecord,
  HouseholdRequestItem,
  InquiryResult,
  PayrollRecord,
  RequestOptionItem,
} from '../Dashboard/types';
import { formatAmount, formatDisplayDate } from '../Dashboard/utils';

type InquiryViewProps = {
  onSetNotice?: (notice: string) => void;
  initialQuery?: string;
};

type SampleItem = {
  hh_id: string;
  label: string;
};

const defaultRequestOptions: RequestOptionItem[] = [
  { id: 1, name: 'opening', label: 'Opening' },
  { id: 2, name: 'distribution', label: 'Distribution' },
  { id: 3, name: 'otc-withdrawal', label: 'OTC Withdrawal' },
  { id: 4, name: 'replacement', label: 'Replacement' },
  { id: 5, name: 'transfer-of-fund', label: 'Transfer of Fund' },
  { id: 6, name: 'force-pin', label: 'Force PIN' },
  { id: 7, name: 'locking', label: 'Locking' },
  { id: 8, name: 'lifting', label: 'Lifting' },
];

export type FieldCategory = {
  id: string;
  label: string;
  icon: typeof User;
  iconColor: string;
  fields: {
    key: string;
    label: string;
  }[];
};

export type GranteeFieldCategory = FieldCategory;

export const GRANTEE_FIELD_CATEGORIES: FieldCategory[] = [
  {
    id: 'personal',
    label: 'Personal & Demographics',
    icon: User,
    iconColor: 'text-primary',
    fields: [
      { key: 'first_name', label: 'First Name' },
      { key: 'middle_name', label: 'Middle Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'ext_name', label: 'Extension Name' },
      { key: 'maiden_name', label: 'Maiden Name' },
      { key: 'sex', label: 'Sex' },
      { key: 'birthday', label: 'Birthday' },
      { key: 'current_age', label: 'Current Age' },
      { key: 'age', label: 'Age at Registration' },
      { key: 'contact_number', label: 'Contact Number' },
      { key: 'relation_to_hh', label: 'Relation to HH Head' },
      { key: 'hh_grantee', label: 'HH Grantee' },
    ],
  },
  {
    id: 'geographic',
    label: 'Geographic & Address Information',
    icon: MapPin,
    iconColor: 'text-rose-500',
    fields: [
      { key: 'region', label: 'Region' },
      { key: 'province', label: 'Province' },
      { key: 'municipality', label: 'Municipality' },
      { key: 'barangay', label: 'Barangay' },
      { key: 'purok', label: 'Purok' },
      { key: 'district', label: 'District' },
    ],
  },
  {
    id: 'program',
    label: 'Program Classification & Status',
    icon: ShieldCheck,
    iconColor: 'text-emerald-500',
    fields: [
      { key: 'client_status', label: 'Client Status' },
      { key: 'old_client_status', label: 'Old Client Status' },
      { key: 'registration_status', label: 'Registration Status' },
      { key: 'member_status', label: 'Member Status' },
      { key: 'date_tagged', label: 'Date Tagged' },
      { key: 'tagged_by', label: 'Tagged By' },
      { key: 'cs_category', label: 'CS Category' },
      { key: 'ip_label', label: 'IP Label / Status' },
    ],
  },
  {
    id: 'banking',
    label: 'Banking & Enrollment Metadata',
    icon: CreditCard,
    iconColor: 'text-cyan-500',
    fields: [
      { key: 'payment_mode', label: 'Payment Mode' },
      { key: 'lbp_account', label: 'LBP Account (Grantee Profile)' },
      { key: 'date_of_enumeration', label: 'Date Enumerated' },
      { key: 'date_registered', label: 'Date Registered' },
      { key: 'family_id', label: 'Family ID' },
      { key: 'final_l3_result', label: 'Final L3 Result' },
    ],
  },
];

export const ALL_GRANTEE_FIELD_KEYS: string[] = GRANTEE_FIELD_CATEGORIES.flatMap((c) =>
  c.fields.map((f) => f.key)
);
export const STORAGE_KEY_GRANTEE_FIELDS = 'cgt_grantee_visible_fields';

// ----------------------------------------------------------------------
// EMV Database Field Customization Constants
// ----------------------------------------------------------------------
export const EMV_FIELD_CATEGORIES: FieldCategory[] = [
  {
    id: 'account',
    label: 'Card & Account Information',
    icon: CreditCard,
    iconColor: 'text-emerald-500',
    fields: [
      { key: 'lbp_account', label: 'LandBank Account Number' },
      { key: 'acct_description', label: 'Account Description' },
      { key: 'cct_type', label: 'CCT Type' },
      { key: 'item_no', label: 'Item Number' },
      { key: 'distribution_status', label: 'Distribution Status' },
    ],
  },
  {
    id: 'distribution',
    label: 'Distribution & Servicing',
    icon: Building2,
    iconColor: 'text-blue-500',
    fields: [
      { key: 'lbp_servicing_branch', label: 'Servicing Branch' },
      { key: 'run_date', label: 'Run Date' },
      { key: 'agreed_distribution_date', label: 'Agreed Distribution Date' },
      { key: 'date_claimed', label: 'Date Claimed' },
    ],
  },
  {
    id: 'location',
    label: 'Beneficiary & Location',
    icon: MapPin,
    iconColor: 'text-rose-500',
    fields: [
      { key: 'beneficiary_name', label: 'Beneficiary (EMV)' },
      { key: 'province', label: 'Province' },
      { key: 'municipality', label: 'Municipality' },
      { key: 'barangay', label: 'Barangay' },
    ],
  },
  {
    id: 'remarks',
    label: 'Remarks & Action Taken',
    icon: ShieldAlert,
    iconColor: 'text-amber-500',
    fields: [
      { key: 'reason_why_unclaimed', label: 'Reason Unclaimed' },
      { key: 'recommended_action', label: 'Recommended Action' },
      { key: 'action_taken', label: 'Action Taken & Date' },
    ],
  },
];

export const ALL_EMV_FIELD_KEYS: string[] = EMV_FIELD_CATEGORIES.flatMap((c) =>
  c.fields.map((f) => f.key)
);
export const STORAGE_KEY_EMV_FIELDS = 'cgt_emv_visible_fields';

// ----------------------------------------------------------------------
// Payroll Disbursal Field Customization Constants (30 Columns)
// ----------------------------------------------------------------------
export const PAYROLL_FIELD_CATEGORIES: FieldCategory[] = [
  {
    id: 'cycle_period',
    label: 'Period & Payroll Info',
    icon: Calendar,
    iconColor: 'text-indigo-500',
    fields: [
      { key: 'period', label: 'PERIOD' },
      { key: 'year', label: 'YEAR' },
      { key: 'payroll_description', label: 'PAYROLL DESCRIPTION' },
    ],
  },
  {
    id: 'location_psgc',
    label: 'Geographic & PSGC',
    icon: MapPin,
    iconColor: 'text-rose-500',
    fields: [
      { key: 'region', label: 'REGION' },
      { key: 'province', label: 'PROVINCE' },
      { key: 'municipality', label: 'MUNICIPALITY' },
      { key: 'barangay', label: 'BARANGAY' },
      { key: 'address_psgc', label: 'ADDRESS PSGC' },
    ],
  },
  {
    id: 'beneficiary_hh',
    label: 'Beneficiary & Household',
    icon: User,
    iconColor: 'text-blue-500',
    fields: [
      { key: 'last_name', label: 'LAST NAME' },
      { key: 'first_name', label: 'FIRST NAME' },
      { key: 'middle_name', label: 'MIDDLE NAME' },
      { key: 'household_id', label: 'HOUSEHOLD ID' },
    ],
  },
  {
    id: 'payment_account',
    label: 'Payment, Account & Approval',
    icon: CreditCard,
    iconColor: 'text-cyan-500',
    fields: [
      { key: 'payment_mode_classification', label: 'PAYMENT MODE CLASSIFICATION' },
      { key: 'mode_of_payment', label: 'MODE OF PAYMENT' },
      { key: 'account_number', label: 'ACCOUNT NUMBER' },
      { key: 'payroll_date', label: 'PAYROLL DATE' },
      { key: 'finance_approval', label: 'FINANCE APPROVAL' },
    ],
  },
  {
    id: 'grants_financial',
    label: 'Grants Breakdown & Totals',
    icon: DollarSign,
    iconColor: 'text-emerald-500',
    fields: [
      { key: 'educ_dc_elem', label: 'EDUC DC ELEM' },
      { key: 'educ_jr_hs', label: 'EDUC JR HS' },
      { key: 'educ_sr_hs', label: 'EDUC SR HS' },
      { key: 'educ_total_hs', label: 'EDUC TOTAL HS' },
      { key: 'total_educ', label: 'TOTAL EDUC' },
      { key: 'health', label: 'HEALTH' },
      { key: 'rice_amount', label: 'RICE AMOUNT' },
      { key: 'f1kd_amount', label: 'F1KD AMOUNT' },
      { key: 'gross_amount', label: 'GROSS AMOUNT' },
      { key: 'adjustment_amount', label: 'ADJUSTMENT AMOUNT' },
      { key: 'net_amount', label: 'NET AMOUNT' },
    ],
  },
  {
    id: 'set_classification',
    label: 'Household Set & Group',
    icon: ShieldCheck,
    iconColor: 'text-amber-500',
    fields: [
      { key: 'hh_set', label: 'HH SET' },
      { key: 'set_group', label: 'SET GROUP' },
    ],
  },
];

export const ALL_PAYROLL_FIELD_KEYS: string[] = PAYROLL_FIELD_CATEGORIES.flatMap((c) =>
  c.fields.map((f) => f.key)
);
export const STORAGE_KEY_PAYROLL_FIELDS = 'cgt_payroll_visible_fields_v3';

export function InquiryView({ onSetNotice, initialQuery }: InquiryViewProps) {
  const page = usePage<{
    auth?: {
      user?: {
        id: number;
        name: string;
        email?: string | null;
        username?: string | null;
      } | null;
    };
  }>();
  const currentUserName = page?.props?.auth?.user?.name || '';

  const [searchInput, setSearchInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InquiryResult | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [copiedHhid, setCopiedHhid] = useState<string | null>(null);
  const [emvViewMode, setEmvViewMode] = useState<'all' | 'tabbed'>('all');
  const [activeEmvIndex, setActiveEmvIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Request Dropdown & Add to Request State
  const [requestOptions, setRequestOptions] = useState<RequestOptionItem[]>(defaultRequestOptions);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [requestDropdownOpen, setRequestDropdownOpen] = useState(false);
  const [requestRemarks, setRequestRemarks] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAutomateModal, setShowAutomateModal] = useState(false);
  const [automatingRequest, setAutomatingRequest] = useState(false);
  const [automateRemarks, setAutomateRemarks] = useState('Automated request batch triggered via Inquiry console');
  const [householdRequestsList, setHouseholdRequestsList] = useState<HouseholdRequestItem[]>([]);
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRequestDropdownOpen(false);
      }
    }
    if (requestDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [requestDropdownOpen]);

  const toggleRequestSelection = (name: string) => {
    setSelectedRequests((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const selectAllRequests = () => {
    setSelectedRequests(requestOptions.map((opt) => opt.name));
  };

  const clearAllRequests = () => {
    setSelectedRequests([]);
  };

  // 1. Grantee Master Details Field Customization
  const [selectedGranteeFields, setSelectedGranteeFields] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_GRANTEE_FIELDS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((key: string) => ALL_GRANTEE_FIELD_KEYS.includes(key));
            if (valid.length > 0) return valid;
          }
        }
      } catch {
        // fallback
      }
    }
    return ALL_GRANTEE_FIELD_KEYS;
  });
  const [granteeFieldDropdownOpen, setGranteeFieldDropdownOpen] = useState(false);
  const [granteeFieldSearch, setGranteeFieldSearch] = useState('');
  const granteeFieldDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_GRANTEE_FIELDS, JSON.stringify(selectedGranteeFields));
      } catch {
        // ignore
      }
    }
  }, [selectedGranteeFields]);

  const toggleGranteeField = (key: string) => {
    setSelectedGranteeFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleGranteeCategory = (categoryFields: { key: string }[]) => {
    const categoryKeys = categoryFields.map((f) => f.key);
    const allSelected = categoryKeys.every((k) => selectedGranteeFields.includes(k));

    if (allSelected) {
      setSelectedGranteeFields((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setSelectedGranteeFields((prev) => Array.from(new Set([...prev, ...categoryKeys])));
    }
  };

  const selectAllGranteeFields = () => {
    setSelectedGranteeFields(ALL_GRANTEE_FIELD_KEYS);
  };

  const clearAllGranteeFields = () => {
    setSelectedGranteeFields([]);
  };

  const isGranteeFieldVisible = (key: string) => selectedGranteeFields.includes(key);

  // 2. EMV Database Field Customization
  const [selectedEmvFields, setSelectedEmvFields] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_EMV_FIELDS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((key: string) => ALL_EMV_FIELD_KEYS.includes(key));
            if (valid.length > 0) return valid;
          }
        }
      } catch {
        // fallback
      }
    }
    return ALL_EMV_FIELD_KEYS;
  });
  const [emvFieldDropdownOpen, setEmvFieldDropdownOpen] = useState(false);
  const [emvFieldSearch, setEmvFieldSearch] = useState('');
  const emvFieldDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_EMV_FIELDS, JSON.stringify(selectedEmvFields));
      } catch {
        // ignore
      }
    }
  }, [selectedEmvFields]);

  const toggleEmvField = (key: string) => {
    setSelectedEmvFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleEmvCategory = (categoryFields: { key: string }[]) => {
    const categoryKeys = categoryFields.map((f) => f.key);
    const allSelected = categoryKeys.every((k) => selectedEmvFields.includes(k));

    if (allSelected) {
      setSelectedEmvFields((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setSelectedEmvFields((prev) => Array.from(new Set([...prev, ...categoryKeys])));
    }
  };

  const selectAllEmvFields = () => {
    setSelectedEmvFields(ALL_EMV_FIELD_KEYS);
  };

  const clearAllEmvFields = () => {
    setSelectedEmvFields([]);
  };

  // 3. Payroll Disbursals Field Customization
  const [selectedPayrollFields, setSelectedPayrollFields] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PAYROLL_FIELDS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((key: string) => ALL_PAYROLL_FIELD_KEYS.includes(key));
            if (valid.length > 0) return valid;
          }
        }
      } catch {
        // fallback
      }
    }
    return ALL_PAYROLL_FIELD_KEYS;
  });
  const [payrollFieldDropdownOpen, setPayrollFieldDropdownOpen] = useState(false);
  const [payrollFieldSearch, setPayrollFieldSearch] = useState('');
  const payrollFieldDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PAYROLL_FIELDS, JSON.stringify(selectedPayrollFields));
      } catch {
        // ignore
      }
    }
  }, [selectedPayrollFields]);

  const togglePayrollField = (key: string) => {
    setSelectedPayrollFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const togglePayrollCategory = (categoryFields: { key: string }[]) => {
    const categoryKeys = categoryFields.map((f) => f.key);
    const allSelected = categoryKeys.every((k) => selectedPayrollFields.includes(k));

    if (allSelected) {
      setSelectedPayrollFields((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setSelectedPayrollFields((prev) => Array.from(new Set([...prev, ...categoryKeys])));
    }
  };

  const selectAllPayrollFields = () => {
    setSelectedPayrollFields(ALL_PAYROLL_FIELD_KEYS);
  };

  const clearAllPayrollFields = () => {
    setSelectedPayrollFields([]);
  };

  // 4. Payroll Card Width Expansion & Fullscreen State
  const [payrollCardExpanded, setPayrollCardExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_inquiry_payroll_expanded');
      return saved === 'true';
    }
    return false;
  });
  const [payrollFullscreen, setPayrollFullscreen] = useState(false);

  const togglePayrollCardExpanded = () => {
    setPayrollCardExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cgt_inquiry_payroll_expanded', String(next));
      }
      onSetNotice?.(
        next
          ? 'Payroll card stretched to full width'
          : 'Payroll card restored to standard width'
      );
      return next;
    });
  };

  // Keyboard shortcut listener for Fullscreen modal (Esc to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && payrollFullscreen) {
        setPayrollFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [payrollFullscreen]);

  // Unified click-outside listener for all field customization dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        granteeFieldDropdownRef.current &&
        !granteeFieldDropdownRef.current.contains(target)
      ) {
        setGranteeFieldDropdownOpen(false);
      }
      if (
        emvFieldDropdownRef.current &&
        !emvFieldDropdownRef.current.contains(target)
      ) {
        setEmvFieldDropdownOpen(false);
      }
      if (
        payrollFieldDropdownRef.current &&
        !payrollFieldDropdownRef.current.contains(target)
      ) {
        setPayrollFieldDropdownOpen(false);
      }
    }
    if (granteeFieldDropdownOpen || emvFieldDropdownOpen || payrollFieldDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [granteeFieldDropdownOpen, emvFieldDropdownOpen, payrollFieldDropdownOpen]);

  // Fetch quick samples on mount
  useEffect(() => {
    fetch('/inquiry/samples')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data.success && Array.isArray(data.samples)) {
          setSamples(data.samples);
        }
      })
      .catch(() => {
        // Fallback samples if network fails
        setSamples([
          { hh_id: 'HHID013302003-6338-00086', label: 'Multi-Card (2 EMV Accounts)' },
          { hh_id: '0100002085033', label: 'Grantee & Payroll Match' },
        ]);
      });
  }, []);

  // Fetch request options dynamically from database table 'request'
  useEffect(() => {
    fetch('/inquiry/request-options')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data.success && Array.isArray(data.options) && data.options.length > 0) {
          setRequestOptions(data.options);
        }
      })
      .catch((err) => {
        console.error('Failed to load request options from database:', err);
      });
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHhid(id);
    setTimeout(() => {
      setCopiedHhid(null);
    }, 2000);
  };

  const handleSearch = useCallback(
    async (queryOverride?: string) => {
      const term = (queryOverride !== undefined ? queryOverride : searchInput).trim();
      if (!term) {
        setError('Please enter a Household ID (HH_ID) to search.');
        return;
      }

      setError(null);
      setLoading(true);
      setRequestFeedback(null);
      setSelectedRequests([]);
      setRequestDropdownOpen(false);

      try {
        const res = await fetch(`/inquiry/search?hh_id=${encodeURIComponent(term)}`);
        const json = await res.json();

        if (json.success) {
          startTransition(() => {
            setResult(json);
            setActiveEmvIndex(0);
            setHouseholdRequestsList(json.requests || []);
            setRequestsExpanded(false);
            setSelectedRequests([]);
          });
          if (json.total_matches === 0 && (!json.requests || json.requests.length === 0)) {
            onSetNotice?.(`Household ID "${term}" does not exist in any database.`);
          } else {
            onSetNotice?.(
              `Found ${json.total_matches} record${json.total_matches > 1 ? 's' : ''} across ${
                (json.summary?.grantee_count > 0 ? 1 : 0) +
                (json.summary?.emv_count > 0 ? 1 : 0) +
                (json.summary?.payroll_count > 0 ? 1 : 0)
              } database(s).`
            );
          }
        } else {
          setError(json.message || 'Failed to search Household ID.');
        }
      } catch (err) {
        console.error('Inquiry search error:', err);
        setError('Network error occurred while fetching inquiry records.');
      } finally {
        setLoading(false);
      }
    },
    [searchInput, onSetNotice]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setSearchInput(initialQuery.trim());
      handleSearch(initialQuery.trim());
    }
  }, [initialQuery, handleSearch]);

  const clearSearch = () => {
    setSearchInput('');
    setResult(null);
    setError(null);
    setHouseholdRequestsList([]);
    setRequestsExpanded(false);
    setRequestFeedback(null);
    setSelectedRequests([]);
    setRequestDropdownOpen(false);
  };

  const handleOpenAddRequestModal = () => {
    setRequestRemarks('');
    setRequestFeedback(null);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!result || !result.display_hhid || selectedRequests.length === 0) return;

    setSubmittingRequest(true);
    setRequestFeedback(null);

    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

      const res = await fetch('/inquiry/add-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        body: JSON.stringify({
          hh_id: result.display_hhid,
          request_names: selectedRequests,
          beneficiary_name: result.summary?.full_name || '',
          remarks: requestRemarks.trim(),
          created_by: currentUserName || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.requests) && data.requests.length > 0) {
          setHouseholdRequestsList((prev) => [...data.requests, ...prev]);
        } else if (data.request) {
          setHouseholdRequestsList((prev) => [data.request, ...prev]);
        }
        setRequestsExpanded(true);
        setShowRequestModal(false);
        setRequestRemarks('');
        setSelectedRequests([]);
        const successMsg = data.message || `Requests added successfully for Household ${result.display_hhid}`;
        setRequestFeedback({
          type: 'success',
          message: successMsg,
        });
        onSetNotice?.(successMsg);
        setTimeout(() => setRequestFeedback(null), 6000);

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
        setRequestFeedback({
          type: 'error',
          message: data.message || 'Failed to submit request.',
        });
      }
    } catch (err) {
      console.error('Add request error:', err);
      setRequestFeedback({
        type: 'error',
        message: 'Network error occurred while submitting request.',
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleOpenAutomateModal = () => {
    setAutomateRemarks('Automated request batch triggered via Inquiry console');
    setShowAutomateModal(true);
  };

  const handleExecuteAutomate = async () => {
    if (!result || !result.display_hhid) return;

    if (selectedRequests.length === 0) {
      setAutomatingRequest(true);
      setTimeout(() => {
        setAutomatingRequest(false);
        setShowAutomateModal(false);
        const successMsg = `⚡ Automated workflow executed for Household ${result.display_hhid}`;
        setRequestFeedback({
          type: 'success',
          message: successMsg,
        });
        onSetNotice?.(successMsg);
        setTimeout(() => setRequestFeedback(null), 6000);
      }, 500);
      return;
    }

    setAutomatingRequest(true);
    setRequestFeedback(null);

    try {
      const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

      const res = await fetch('/inquiry/add-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        body: JSON.stringify({
          hh_id: result.display_hhid,
          request_names: selectedRequests,
          beneficiary_name: result.summary?.full_name || '',
          remarks: automateRemarks.trim() || 'Automated request batch triggered via Inquiry console',
          created_by: currentUserName || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.requests) && data.requests.length > 0) {
          setHouseholdRequestsList((prev) => [...data.requests, ...prev]);
        } else if (data.request) {
          setHouseholdRequestsList((prev) => [data.request, ...prev]);
        }
        setRequestsExpanded(true);
        setShowAutomateModal(false);
        setSelectedRequests([]);
        const successMsg = `⚡ Automated Request: Successfully queued ${selectedRequests.length} request(s) for Household ${result.display_hhid}`;
        setRequestFeedback({
          type: 'success',
          message: successMsg,
        });
        onSetNotice?.(successMsg);
        setTimeout(() => setRequestFeedback(null), 6000);

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
        setRequestFeedback({
          type: 'error',
          message: data.message || 'Failed to execute automated request.',
        });
      }
    } catch (err) {
      console.error('Automate request error:', err);
      setRequestFeedback({
        type: 'error',
        message: 'Network error occurred while automating request.',
      });
    } finally {
      setAutomatingRequest(false);
    }
  };

  const isHouseholdExisting = Boolean(
    result &&
      (result.exists !== undefined
        ? result.exists
        : result.total_matches > 0 || (householdRequestsList && householdRequestsList.length > 0))
  );

  return (
    <div
      className={cn(
        'mx-auto w-full space-y-6 pb-12 transition-all duration-300',
        payrollCardExpanded ? 'max-w-none' : 'max-w-7xl'
      )}
    >
      {/* Header Banner */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 dark:border-border dark:bg-card',
          payrollCardExpanded && 'max-w-7xl mx-auto'
        )}
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20 dark:bg-primary/20 dark:text-cyan-300">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Household Record Inquiry</h1>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-cyan-300">
                  Consolidated 360°
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Unified cross-database verification. Search any Household ID (<span className="font-mono">HH_ID</span>) to inspect matched records across Grantee Profile, EMV Cash Cards, and Payroll Disbursals.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="mt-6">
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Household ID (e.g. HHID160202004-1516-00001, 013302003-6338-00086, 0100002085033)..."
                className="h-11 pl-10 pr-10 font-mono text-sm shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-primary/40 dark:bg-background/80"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Clear input"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading || !searchInput.trim()}
              className="h-11 px-6 font-semibold shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search HH_ID
                </>
              )}
            </Button>
          </div>

          {/* Quick Samples Section */}
          {samples.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Quick Samples:</span>
              {samples.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchInput(item.hh_id);
                    handleSearch(item.hh_id);
                  }}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/60 px-2.5 py-1 text-xs font-mono text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:bg-card/60"
                >
                  <span className="font-semibold text-primary group-hover:underline">{item.hh_id}</span>
                  <span className="text-[11px] text-muted-foreground">({item.label})</span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Household ID Not Existed State */}
      {result && !isHouseholdExisting && (
        <div
          className={cn(
            'rounded-2xl border border-rose-500/30 bg-card p-8 sm:p-12 text-center shadow-xs transition-all duration-300 dark:border-rose-500/20',
            payrollCardExpanded && 'max-w-7xl mx-auto'
          )}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400">
            <XCircle className="h-3.5 w-3.5" />
            <span>Not Existed in Any Database</span>
          </div>

          <h3 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Household ID Does Not Exist
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
            The Household ID{' '}
            <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border/80">
              {result.display_hhid}
            </span>{' '}
            was not found in any database across the system.
          </p>

          {/* Cross-check Summary across Databases */}
          <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3 text-left">
            <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 dark:bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Grantee List</span>
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  0 Found
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Not in master beneficiaries</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 dark:bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">EMV Database</span>
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  0 Found
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">No cash cards registered</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 dark:bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Payroll Records</span>
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  0 Found
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">No payout disbursals</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSearch}
              className="text-xs"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Clear Search
            </Button>

            {samples.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchInput(samples[0].hh_id);
                  handleSearch(samples[0].hh_id);
                }}
                className="text-xs font-mono"
              >
                <Search className="mr-1.5 h-3.5 w-3.5" />
                Try Sample: {samples[0].hh_id}
              </Button>
            )}
          </div>

          {/* Quick Samples List */}
          {samples.length > 1 && (
            <div className="mt-6 border-t border-border/60 pt-5">
              <p className="text-xs font-medium text-muted-foreground">Or test with a known valid Household ID:</p>
              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                {samples.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchInput(item.hh_id);
                      handleSearch(item.hh_id);
                    }}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/60 px-2.5 py-1 text-xs font-mono text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:bg-card/60"
                  >
                    <span className="font-semibold text-primary group-hover:underline">{item.hh_id}</span>
                    <span className="text-[11px] text-muted-foreground">({item.label})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {result && isHouseholdExisting && (
        <div className="space-y-6">
          {/* Household Master Summary Banner */}
          <div
            className={cn(
              'relative z-20 rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-sm transition-all duration-300 dark:border-primary/30',
              payrollCardExpanded && 'max-w-7xl mx-auto'
            )}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                  <User className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {result.summary.full_name || 'Household Beneficiary'}
                    </h2>
                    {result.summary.client_status && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          result.summary.client_status.toLowerCase().includes('active')
                            ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
                        )}
                      >
                        {result.summary.client_status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span>{result.display_hhid}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(result.display_hhid, 'main_hhid')}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Copy HH_ID"
                      >
                        {copiedHhid === 'main_hhid' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {result.summary.location && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>{result.summary.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/60 pt-4 lg:border-t-0 lg:pt-0">
                <div className="rounded-xl border border-border/80 bg-background/50 p-3 text-center dark:bg-background/40">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Grantee</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {result.summary.grantee_count > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Linked</span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/50 p-3 text-center dark:bg-background/40">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">EMV Cards</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {result.summary.emv_count > 0 ? (
                      <span className="text-primary font-mono">{result.summary.emv_count}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/50 p-3 text-center dark:bg-background/40">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Payroll</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {result.summary.payroll_count > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {result.summary.payroll_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/50 p-3 text-center dark:bg-background/40">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Requests</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {householdRequestsList.length > 0 ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                        {householdRequestsList.length}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Request Strip in Master Summary Banner */}
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-indigo-500/30 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-500/25 dark:bg-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Action Request</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Select request type from database for Household <span className="font-mono font-semibold text-foreground">{result.display_hhid}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Multi-Select Dropdown Popover */}
                <div className="relative min-w-[220px] sm:min-w-[260px]" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setRequestDropdownOpen((prev) => !prev)}
                    className={cn(
                      'flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-background px-3.5 text-xs font-semibold text-foreground shadow-xs transition hover:border-indigo-500/50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                      requestDropdownOpen && 'border-indigo-500 ring-2 ring-indigo-500/20'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {selectedRequests.length === 0 ? (
                        <span className="font-normal text-muted-foreground">Select request types...</span>
                      ) : (
                        <>
                          <span className="inline-flex h-5 items-center justify-center rounded-full bg-indigo-600 px-2 text-[10px] font-bold text-white">
                            {selectedRequests.length}
                          </span>
                          <span className="truncate">
                            {selectedRequests.length === 1
                              ? requestOptions.find((o) => o.name === selectedRequests[0])?.label || selectedRequests[0]
                              : `${selectedRequests.length} types selected`}
                          </span>
                        </>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                        requestDropdownOpen && 'rotate-180 text-indigo-600'
                      )}
                    />
                  </button>

                  {/* Popover Menu */}
                  {requestDropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1.5 w-72 sm:w-80 rounded-2xl border border-border/80 bg-card p-2.5 shadow-2xl ring-1 ring-black/10 animate-in fade-in zoom-in-95 dark:border-border dark:bg-card dark:shadow-black/50">
                      <div className="flex items-center justify-between border-b border-border/80 px-2 pb-2 text-xs">
                        <span className="font-semibold text-foreground">
                          Select Types ({selectedRequests.length}/{requestOptions.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={selectAllRequests}
                            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Select All
                          </button>
                          <span className="text-muted-foreground">•</span>
                          <button
                            type="button"
                            onClick={clearAllRequests}
                            className="font-medium text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="mt-1.5 max-h-60 space-y-0.5 overflow-y-auto pr-0.5">
                        {requestOptions.map((opt) => {
                          const isChecked = selectedRequests.includes(opt.name);
                          return (
                            <label
                              key={opt.id || opt.name}
                              className={cn(
                                'flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none',
                                isChecked
                                  ? 'bg-indigo-500/10 font-semibold text-indigo-900 dark:text-indigo-200'
                                  : 'font-normal text-foreground hover:bg-muted'
                              )}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleRequestSelection(opt.name)}
                                  className="h-3.5 w-3.5 rounded border-input text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="truncate">{opt.label || opt.name}</span>
                              </div>
                              {isChecked && (
                                <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                              )}
                            </label>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-border/80 px-1 pt-2">
                        <span className="text-[11px] text-muted-foreground">
                          {selectedRequests.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setRequestDropdownOpen(false)}
                          className="rounded-lg bg-indigo-600 px-3.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleOpenAddRequestModal}
                  disabled={selectedRequests.length === 0}
                  className="h-10 gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Plus className="h-4 w-4" />
                  {selectedRequests.length > 1
                    ? `Add ${selectedRequests.length} Requests`
                    : 'Add to Request'}
                </Button>

                <Button
                  type="button"
                  onClick={handleOpenAutomateModal}
                  className="h-10 gap-1.5 rounded-xl border border-violet-500/40 bg-violet-600/10 px-4 text-xs font-semibold text-violet-700 hover:bg-violet-600 hover:text-white dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white shadow-xs active:scale-95 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  Automate Request
                </Button>
              </div>
            </div>
          </div>

          {/* Request Feedback Alert */}
          {requestFeedback && (
            <div
              className={cn(
                'flex items-center justify-between rounded-xl p-4 text-sm font-medium shadow-xs transition-all animate-in fade-in',
                requestFeedback.type === 'success'
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                payrollCardExpanded && 'max-w-7xl mx-auto'
              )}
            >
              <div className="flex items-center gap-2.5">
                {requestFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{requestFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setRequestFeedback(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Household Requests History Card */}
          {householdRequestsList.length > 0 && (
            <div
              className={cn(
                'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 dark:border-border dark:bg-card',
                payrollCardExpanded && 'max-w-7xl mx-auto'
              )}
            >
              <button
                type="button"
                onClick={() => setRequestsExpanded((prev) => !prev)}
                className={cn(
                  "flex w-full flex-col gap-2 px-6 py-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 cursor-pointer select-none",
                  requestsExpanded && "border-b border-border/80"
                )}
                aria-expanded={requestsExpanded}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">Submitted Requests</h3>
                      <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        {householdRequestsList.length} {householdRequestsList.length === 1 ? 'Record' : 'Records'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Requests initiated and recorded for this household.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {requestsExpanded ? 'Hide Details' : 'View Details'}
                  </span>
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground transition-transform duration-200",
                      requestsExpanded && "rotate-180 text-foreground"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </button>

              {requestsExpanded && (
                <div className="divide-y divide-border/60 animate-in fade-in-50 duration-200">
                  {householdRequestsList.map((req, idx) => (
                    <div
                      key={req.id || idx}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            {req.request_label || req.request_name}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            {req.status || 'Pending'}
                          </span>
                        </div>
                        {req.remarks && (
                          <p className="text-xs text-muted-foreground pt-1">
                            <span className="font-medium text-foreground">Remarks:</span> {req.remarks}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                        {(() => {
                          const creatorName =
                            req.created_by && req.created_by !== 'Authorized User'
                              ? req.created_by
                              : (currentUserName || req.created_by || 'Authorized User');
                          return (
                            <div
                              className="flex items-center gap-1.5 font-medium text-foreground/90"
                              title={`Requested by: ${creatorName}`}
                            >
                              <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate max-w-[220px]">{creatorName}</span>
                            </div>
                          );
                        })()}
                        {req.created_at && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CARD 1: Grantee List Record */}
          <div
            className={cn(
              'rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 dark:border-border dark:bg-card',
              payrollCardExpanded && 'max-w-7xl mx-auto'
            )}
          >
            <div className="flex flex-col gap-3 border-b border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Grantee Master Details</h3>
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      Grantee Database
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Beneficiary registration profile, address, and demographic information.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Dynamic Dropdown Menu to customize fields */}
                <FieldCustomizerDropdown
                  title="Customize Grantee Fields"
                  subtitle="Select fields to show on this card"
                  categories={GRANTEE_FIELD_CATEGORIES}
                  allFieldKeys={ALL_GRANTEE_FIELD_KEYS}
                  selectedFields={selectedGranteeFields}
                  isOpen={granteeFieldDropdownOpen}
                  onOpenChange={setGranteeFieldDropdownOpen}
                  onToggleField={toggleGranteeField}
                  onToggleCategory={toggleGranteeCategory}
                  onSelectAll={selectAllGranteeFields}
                  onClearAll={clearAllGranteeFields}
                  search={granteeFieldSearch}
                  onSearchChange={setGranteeFieldSearch}
                  dropdownRef={granteeFieldDropdownRef}
                />

                {result.grantee && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">HH Set:</span>
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                      {result.grantee.hh_set || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {result.grantee ? (
                (() => {
                  const isVisible = (k: string) => selectedGranteeFields.includes(k);

                  const personalFields = GRANTEE_FIELD_CATEGORIES[0].fields;
                  const geoFields = GRANTEE_FIELD_CATEGORIES[1].fields;
                  const programFields = GRANTEE_FIELD_CATEGORIES[2].fields;
                  const bankingFields = GRANTEE_FIELD_CATEGORIES[3].fields;

                  const visiblePersonal = personalFields.filter((f) => isVisible(f.key));
                  const visibleGeo = geoFields.filter((f) => isVisible(f.key));
                  const visibleProgram = programFields.filter((f) => isVisible(f.key));
                  const visibleBanking = bankingFields.filter((f) => isVisible(f.key));

                  const totalVisible =
                    visiblePersonal.length + visibleGeo.length + visibleProgram.length + visibleBanking.length;

                  if (totalVisible === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <SlidersHorizontal className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">No Fields Selected</p>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                          All fields are currently hidden based on your display preferences. Use the "Display Fields" menu above to select which fields to show.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4 gap-1.5 text-xs"
                          onClick={selectAllGranteeFields}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Show All Fields
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Category 1: Personal & Demographics */}
                      {visiblePersonal.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <User className="h-3.5 w-3.5 text-primary" />
                            Personal & Demographics
                            <span className="text-[10px] font-normal text-muted-foreground/70">
                              ({visiblePersonal.length})
                            </span>
                          </h4>
                          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {isVisible('first_name') && <DetailField label="First Name" value={result.grantee.first_name} />}
                            {isVisible('middle_name') && <DetailField label="Middle Name" value={result.grantee.middle_name} />}
                            {isVisible('last_name') && <DetailField label="Last Name" value={result.grantee.last_name} />}
                            {isVisible('ext_name') && <DetailField label="Extension Name" value={result.grantee.ext_name} />}
                            {isVisible('maiden_name') && <DetailField label="Maiden Name" value={result.grantee.maiden_name} />}
                            {isVisible('sex') && <DetailField label="Sex" value={result.grantee.sex} />}
                            {isVisible('birthday') && <DetailField label="Birthday" value={formatDisplayDate(result.grantee.birthday)} />}
                            {isVisible('current_age') && (
                              <DetailField
                                label="Current Age"
                                value={result.grantee.current_age ? `${result.grantee.current_age} yrs` : '-'}
                              />
                            )}
                            {isVisible('age') && <DetailField label="Age at Registration" value={result.grantee.age} />}
                            {isVisible('contact_number') && <DetailField label="Contact Number" value={result.grantee.contact_number} />}
                            {isVisible('relation_to_hh') && <DetailField label="Relation to HH Head" value={result.grantee.relation_to_hh} />}
                            {isVisible('hh_grantee') && <DetailField label="HH Grantee" value={result.grantee.hh_grantee} />}
                          </div>
                        </div>
                      )}

                      {/* Divider between Personal and subsequent visible categories */}
                      {visiblePersonal.length > 0 &&
                        (visibleGeo.length > 0 || visibleProgram.length > 0 || visibleBanking.length > 0) && (
                          <hr className="border-border/60" />
                        )}

                      {/* Category 2: Geographic & Location */}
                      {visibleGeo.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                            Geographic & Address Information
                            <span className="text-[10px] font-normal text-muted-foreground/70">
                              ({visibleGeo.length})
                            </span>
                          </h4>
                          <div
                            className={cn(
                              'mt-3 grid gap-4 grid-cols-2',
                              visibleGeo.length >= 6
                                ? 'sm:grid-cols-3 lg:grid-cols-6'
                                : visibleGeo.length >= 4
                                ? 'sm:grid-cols-2 lg:grid-cols-4'
                                : visibleGeo.length === 3
                                ? 'sm:grid-cols-3'
                                : 'sm:grid-cols-2'
                            )}
                          >
                            {isVisible('region') && <DetailField label="Region" value={result.grantee.region} />}
                            {isVisible('province') && <DetailField label="Province" value={result.grantee.province} />}
                            {isVisible('municipality') && <DetailField label="Municipality" value={result.grantee.municipality} />}
                            {isVisible('barangay') && <DetailField label="Barangay" value={result.grantee.barangay} />}
                            {isVisible('purok') && <DetailField label="Purok" value={result.grantee.purok} />}
                            {isVisible('district') && <DetailField label="District" value={result.grantee.district} />}
                          </div>
                        </div>
                      )}

                      {/* Divider between Geographic and subsequent visible categories */}
                      {visibleGeo.length > 0 && (visibleProgram.length > 0 || visibleBanking.length > 0) && (
                        <hr className="border-border/60" />
                      )}

                      {/* Category 3: Program & Status Tagging */}
                      {visibleProgram.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Program Classification & Status
                            <span className="text-[10px] font-normal text-muted-foreground/70">
                              ({visibleProgram.length})
                            </span>
                          </h4>
                          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {isVisible('client_status') && (
                              <DetailField
                                label="Client Status"
                                value={result.grantee.client_status}
                                highlight={result.grantee.client_status?.toLowerCase().includes('active') ? 'emerald' : 'amber'}
                              />
                            )}
                            {isVisible('old_client_status') && <DetailField label="Old Client Status" value={result.grantee.old_client_status} />}
                            {isVisible('registration_status') && <DetailField label="Registration Status" value={result.grantee.registration_status} />}
                            {isVisible('member_status') && <DetailField label="Member Status" value={result.grantee.member_status} />}
                            {isVisible('date_tagged') && <DetailField label="Date Tagged" value={formatDisplayDate(result.grantee.date_tagged)} />}
                            {isVisible('tagged_by') && <DetailField label="Tagged By" value={result.grantee.tagged_by} />}
                            {isVisible('cs_category') && <DetailField label="CS Category" value={result.grantee.cs_category} />}
                            {isVisible('ip_label') && <DetailField label="IP Label / Status" value={result.grantee.ip_label || result.grantee.ip_status} />}
                          </div>
                        </div>
                      )}

                      {/* Divider between Program and Banking */}
                      {visibleProgram.length > 0 && visibleBanking.length > 0 && (
                        <hr className="border-border/60" />
                      )}

                      {/* Category 4: Banking & Enrollment */}
                      {visibleBanking.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <CreditCard className="h-3.5 w-3.5 text-cyan-500" />
                            Banking & Enrollment Metadata
                            <span className="text-[10px] font-normal text-muted-foreground/70">
                              ({visibleBanking.length})
                            </span>
                          </h4>
                          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {isVisible('payment_mode') && <DetailField label="Payment Mode" value={result.grantee.payment_mode} />}
                            {isVisible('lbp_account') && (
                              <DetailField
                                label="LBP Account (Grantee Profile)"
                                value={result.grantee.lbp_account}
                                isMono
                                isCopyable
                                onCopy={(val) => handleCopy(val, 'grantee_lbp')}
                                isCopied={copiedHhid === 'grantee_lbp'}
                              />
                            )}
                            {isVisible('date_of_enumeration') && <DetailField label="Date Enumerated" value={formatDisplayDate(result.grantee.date_of_enumeration)} />}
                            {isVisible('date_registered') && (
                              <DetailField
                                label="Date Registered"
                                value={formatDisplayDate(result.grantee.date_registered || result.grantee.date_registered_v2)}
                              />
                            )}
                            {isVisible('family_id') && <DetailField label="Family ID" value={result.grantee.family_id} />}
                            {isVisible('final_l3_result') && <DetailField label="Final L3 Result" value={result.grantee.final_l3_result} />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">No Record in Grantee List</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Household ID <span className="font-mono font-medium">{result.display_hhid}</span> is not registered in the Grantee List master database.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: EMV Database & Multiple Cash Cards */}
          <div
            className={cn(
              'rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 dark:border-border dark:bg-card',
              payrollCardExpanded && 'max-w-7xl mx-auto'
            )}
          >
            <div className="flex flex-col gap-3 border-b border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">EMV Database & Cash Cards</h3>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        result.emv_records.length > 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {result.emv_records.length} {result.emv_records.length === 1 ? 'Linked Card' : 'Linked Cards'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    LandBank EMV account numbers, run dates, distribution status, and card details.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Toggle when multiple cards are present */}
                {result.emv_records.length > 1 && (
                  <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-1">
                    <button
                      type="button"
                      onClick={() => setEmvViewMode('all')}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium transition',
                        emvViewMode === 'all'
                          ? 'bg-card font-bold text-foreground shadow-xs dark:bg-card'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      All Cards ({result.emv_records.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmvViewMode('tabbed')}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium transition',
                        emvViewMode === 'tabbed'
                          ? 'bg-card font-bold text-foreground shadow-xs dark:bg-card'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Card Selector
                    </button>
                  </div>
                )}

                {/* Dynamic Dropdown Menu to customize EMV fields */}
                <FieldCustomizerDropdown
                  title="Customize EMV Fields"
                  subtitle="Select fields to show across cash card records"
                  categories={EMV_FIELD_CATEGORIES}
                  allFieldKeys={ALL_EMV_FIELD_KEYS}
                  selectedFields={selectedEmvFields}
                  isOpen={emvFieldDropdownOpen}
                  onOpenChange={setEmvFieldDropdownOpen}
                  onToggleField={toggleEmvField}
                  onToggleCategory={toggleEmvCategory}
                  onSelectAll={selectAllEmvFields}
                  onClearAll={clearAllEmvFields}
                  search={emvFieldSearch}
                  onSearchChange={setEmvFieldSearch}
                  dropdownRef={emvFieldDropdownRef}
                />
              </div>
            </div>

            <div className="p-6">
              {result.emv_records.length > 0 ? (
                selectedEmvFields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <SlidersHorizontal className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">No Fields Selected</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      All fields are currently hidden based on your display preferences. Use the "Display Fields" menu above to select which fields to show.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-1.5 text-xs"
                      onClick={selectAllEmvFields}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Show All Fields
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tab Selector when tabbed mode active */}
                    {emvViewMode === 'tabbed' && result.emv_records.length > 1 && (
                      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-4">
                        {result.emv_records.map((emv, idx) => (
                          <button
                            key={emv.id || idx}
                            type="button"
                            onClick={() => setActiveEmvIndex(idx)}
                            className={cn(
                              'group flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition',
                              activeEmvIndex === idx
                                ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30 dark:bg-primary/20 dark:text-cyan-300'
                                : 'border-border/80 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
                            )}
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Card #{idx + 1}</span>
                            <span className="font-mono text-[11px] opacity-80">({emv.lbp_account || 'No Acct'})</span>
                            {emv.distribution_status && (
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                  emv.distribution_status.toLowerCase().includes('claimed') &&
                                    !emv.distribution_status.toLowerCase().includes('unclaimed')
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                )}
                              >
                                {emv.distribution_status.replace(/\/\d+$/, '')}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Render Cards according to view mode */}
                    {emvViewMode === 'tabbed' && result.emv_records.length > 1 ? (
                      <EmvCardDetail
                        record={result.emv_records[activeEmvIndex]}
                        index={activeEmvIndex}
                        totalCount={result.emv_records.length}
                        copiedHhid={copiedHhid}
                        onCopy={handleCopy}
                        selectedFields={selectedEmvFields}
                      />
                    ) : (
                      <div className="space-y-5">
                        {result.emv_records.map((record, index) => (
                          <EmvCardDetail
                            key={record.id || index}
                            record={record}
                            index={index}
                            totalCount={result.emv_records.length}
                            copiedHhid={copiedHhid}
                            onCopy={handleCopy}
                            selectedFields={selectedEmvFields}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">No Records in EMV Database</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Household ID <span className="font-mono font-medium">{result.display_hhid}</span> does not have any registered EMV cash cards or LandBank accounts.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: Payroll Disbursements Record */}
          <div
            className={cn(
              'rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 dark:border-border dark:bg-card',
              payrollCardExpanded ? 'w-full' : 'max-w-7xl mx-auto'
            )}
          >
            <div className="flex flex-col gap-3 border-b border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Payroll & Disbursal History</h3>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        result.payroll_records.length > 0
                          ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {result.payroll_records.length} {result.payroll_records.length === 1 ? 'Cycle' : 'Cycles'}
                    </span>
                    {payrollCardExpanded && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        <Maximize2 className="h-3 w-3" />
                        Full Width
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Disbursement periods, breakdown of grants, payment modes, and approvals.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Cumulative Financial Totals Pill */}
                {result.payroll_records.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5">
                      <span className="text-[11px] text-muted-foreground">Total Disbursed:</span>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAmount(result.summary.total_net)}
                      </span>
                    </div>

                    {/* Dynamic Dropdown Menu to customize Payroll table columns */}
                    <FieldCustomizerDropdown
                      title="Customize Table Columns"
                      subtitle="Select columns to show in the disbursal table"
                      categories={PAYROLL_FIELD_CATEGORIES}
                      allFieldKeys={ALL_PAYROLL_FIELD_KEYS}
                      selectedFields={selectedPayrollFields}
                      isOpen={payrollFieldDropdownOpen}
                      onOpenChange={setPayrollFieldDropdownOpen}
                      onToggleField={togglePayrollField}
                      onToggleCategory={togglePayrollCategory}
                      onSelectAll={selectAllPayrollFields}
                      onClearAll={clearAllPayrollFields}
                      search={payrollFieldSearch}
                      onSearchChange={setPayrollFieldSearch}
                      dropdownRef={payrollFieldDropdownRef}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleExportPayrollCsv(result.payroll_records, result.display_hhid)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                  </>
                )}

                {/* Stretch Card / Standard Width Toggle */}
                <Button
                  type="button"
                  variant={payrollCardExpanded ? 'secondary' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 gap-1.5 text-xs transition-colors',
                    payrollCardExpanded
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={togglePayrollCardExpanded}
                  title={payrollCardExpanded ? 'Compress back to standard layout' : 'Stretch card horizontally to fill screen width'}
                >
                  {payrollCardExpanded ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" />
                      Standard Width
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5" />
                      Stretch to Full
                    </>
                  )}
                </Button>

                {/* Fullscreen Modal View Button */}
                {result.payroll_records.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setPayrollFullscreen(true)}
                    title="Open Payroll table in full-screen modal view"
                  >
                    <Expand className="h-3.5 w-3.5" />
                    Fullscreen
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-hidden">
              {result.payroll_records.length > 0 ? (
                selectedPayrollFields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <SlidersHorizontal className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">No Columns Selected</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      All columns are currently hidden based on your display preferences. Use the "Display Fields" menu above to select which columns to show.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-1.5 text-xs"
                      onClick={selectAllPayrollFields}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Show All Columns
                    </Button>
                  </div>
                ) : (
                  <PayrollRecordsTable
                    records={result.payroll_records}
                    displayHhid={result.display_hhid}
                    selectedFields={selectedPayrollFields}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">No Records in Payroll Database</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Household ID <span className="font-mono font-medium">{result.display_hhid}</span> does not have any registered payroll disbursals.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Initial Empty State (before searching) */}
      {!result && !loading && (
        <div
          className={cn(
            'rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center transition-all duration-300',
            payrollCardExpanded && 'max-w-7xl mx-auto'
          )}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-300">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">Enter a Household ID to Begin</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
            Search any Household ID to cross-reference records across the Grantee List, EMV Database (including multiple cash cards per household), and Payroll disbursal cycles.
          </p>

          {samples.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {samples.map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput(item.hh_id);
                    handleSearch(item.hh_id);
                  }}
                  className="font-mono text-xs shadow-xs"
                >
                  <ChevronRight className="mr-1 h-3.5 w-3.5 text-primary" />
                  Try {item.hh_id}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add to Request Modal Dialog */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Submit Service Request</h3>
                  <p className="text-xs text-muted-foreground">Add request to the household registry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Household Info */}
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Household ID:</span>
                  <span className="font-mono font-bold text-foreground">{result?.display_hhid}</span>
                </div>
                {result?.summary?.full_name && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Beneficiary Name:</span>
                    <span className="font-semibold text-foreground">{result.summary.full_name}</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5">
                  <span className="text-muted-foreground">Requested By:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-500" />
                    {currentUserName || 'Authorized User'}
                  </span>
                </div>
              </div>

              {/* Request Type Selector (Multi-select) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Request Types ({selectedRequests.length} selected) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllRequests}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={clearAllRequests}
                      className="font-medium text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Selected Tags Display */}
                {selectedRequests.length > 0 && (
                  <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-indigo-500/20 bg-indigo-50/50 p-2 dark:border-indigo-500/20 dark:bg-indigo-950/20">
                    {selectedRequests.map((name) => {
                      const opt = requestOptions.find((o) => o.name === name);
                      return (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-md border border-indigo-500/30 bg-background px-2 py-0.5 text-xs font-semibold text-indigo-700 shadow-2xs dark:text-indigo-300"
                        >
                          {opt?.label || name}
                          <button
                            type="button"
                            onClick={() => toggleRequestSelection(name)}
                            className="rounded-xs text-muted-foreground transition hover:text-rose-600"
                            title="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Checkbox List */}
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-input bg-background p-2">
                  {requestOptions.map((opt) => {
                    const isChecked = selectedRequests.includes(opt.name);
                    return (
                      <label
                        key={opt.id || opt.name}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none',
                          isChecked
                            ? 'bg-indigo-500/10 font-semibold text-indigo-900 dark:text-indigo-200'
                            : 'font-normal text-foreground hover:bg-muted'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRequestSelection(opt.name)}
                            className="h-3.5 w-3.5 rounded border-input text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{opt.label || opt.name}</span>
                        </div>
                        {isChecked && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Remarks / Notes Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Remarks / Notes <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  value={requestRemarks}
                  onChange={(e) => setRequestRemarks(e.target.value)}
                  placeholder="Enter any additional details, case notes, or instructions..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-border/80 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRequestModal(false)}
                disabled={submittingRequest}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitRequest}
                disabled={submittingRequest || selectedRequests.length === 0}
                className="gap-2 rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingRequest ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Confirm & Submit ({selectedRequests.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Automate Request Modal Dialog */}
      {showAutomateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-violet-500/30 bg-card p-6 shadow-2xl transition-all dark:border-violet-500/30 dark:bg-card">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:bg-violet-500/25 dark:text-violet-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Automate Request</h3>
                  <p className="text-xs text-muted-foreground">Automated workflow execution for Household {result?.display_hhid}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAutomateModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Notice */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs text-violet-900 dark:text-violet-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  <span>
                    {selectedRequests.length > 0 ? (
                      <>
                        This automated workflow will immediately register and queue <strong>{selectedRequests.length}</strong> service request(s) into the household registry with automated verification.
                      </>
                    ) : (
                      <>
                        This independent automated workflow will execute automated verification and routine processing for Household <strong>{result?.display_hhid}</strong>.
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Household Info */}
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Household ID:</span>
                  <span className="font-mono font-bold text-foreground">{result?.display_hhid}</span>
                </div>
                {result?.summary?.full_name && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Beneficiary Name:</span>
                    <span className="font-semibold text-foreground">{result.summary.full_name}</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5">
                  <span className="text-muted-foreground">Requested By:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-violet-500" />
                    {currentUserName || 'Authorized User'}
                  </span>
                </div>
              </div>

              {/* Requests to Automate */}
              {selectedRequests.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Requests to Automate ({selectedRequests.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto rounded-xl border border-violet-500/20 bg-violet-50/50 p-2 dark:border-violet-500/20 dark:bg-violet-950/20">
                    {selectedRequests.map((name) => {
                      const opt = requestOptions.find((o) => o.name === name);
                      return (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-background px-2 py-0.5 text-xs font-semibold text-violet-700 shadow-2xs dark:text-violet-300"
                        >
                          {opt?.label || name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span className="font-medium text-foreground">Mode:</span>
                  <span className="rounded-md bg-violet-500/15 px-2 py-0.5 font-semibold text-violet-700 dark:text-violet-300">
                    Independent Automation Workflow
                  </span>
                </div>
              )}

              {/* Automation Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Automation Notes / Log <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  value={automateRemarks}
                  onChange={(e) => setAutomateRemarks(e.target.value)}
                  placeholder="Enter automation instructions or system notes..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-border/80 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAutomateModal(false)}
                disabled={automatingRequest}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleExecuteAutomate}
                disabled={automatingRequest}
                className="gap-2 rounded-xl bg-violet-600 px-4 text-white hover:bg-violet-700 active:scale-95 transition disabled:opacity-50"
              >
                {automatingRequest ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Automating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    {selectedRequests.length > 0
                      ? `Confirm & Automate (${selectedRequests.length})`
                      : 'Confirm & Automate'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Payroll Records Modal */}
      {payrollFullscreen && result && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in">
          {/* Top header of fullscreen modal */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-md sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Payroll & Disbursal History (Fullscreen)</h3>
                  <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    {result.payroll_records.length} {result.payroll_records.length === 1 ? 'Cycle' : 'Cycles'}
                  </span>
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    HHID: {result.display_hhid}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Beneficiary: <span className="font-semibold text-foreground">{result.summary.full_name || 'Household Beneficiary'}</span> • Fullscreen disbursal inspection
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5">
                <span className="text-[11px] text-muted-foreground">Total Disbursed:</span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatAmount(result.summary.total_net)}
                </span>
              </div>

              <FieldCustomizerDropdown
                title="Customize Table Columns"
                subtitle="Select columns to show in the disbursal table"
                categories={PAYROLL_FIELD_CATEGORIES}
                allFieldKeys={ALL_PAYROLL_FIELD_KEYS}
                selectedFields={selectedPayrollFields}
                isOpen={payrollFieldDropdownOpen}
                onOpenChange={setPayrollFieldDropdownOpen}
                onToggleField={togglePayrollField}
                onToggleCategory={togglePayrollCategory}
                onSelectAll={selectAllPayrollFields}
                onClearAll={clearAllPayrollFields}
                search={payrollFieldSearch}
                onSearchChange={setPayrollFieldSearch}
                dropdownRef={payrollFieldDropdownRef}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleExportPayrollCsv(result.payroll_records, result.display_hhid)}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => setPayrollFullscreen(false)}
                title="Exit fullscreen modal view (Esc)"
              >
                <Shrink className="h-3.5 w-3.5" />
                Exit Fullscreen (Esc)
              </Button>
            </div>
          </div>

          {/* Modal Body with full table */}
          <div className="mt-3 flex-1 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg flex flex-col">
            <div className="flex-1 overflow-auto">
              <PayrollRecordsTable
                records={result.payroll_records}
                displayHhid={result.display_hhid}
                selectedFields={selectedPayrollFields}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponent: Reusable Field Customizer Dropdown
// ----------------------------------------------------------------------
interface FieldCustomizerDropdownProps {
  title?: string;
  subtitle?: string;
  categories: FieldCategory[];
  allFieldKeys: string[];
  selectedFields: string[];
  isOpen: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleField: (key: string) => void;
  onToggleCategory: (categoryFields: { key: string }[]) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  buttonLabel?: string;
}

function FieldCustomizerDropdown({
  title = 'Customize Display Fields',
  subtitle = 'Select fields to show on this card',
  categories,
  allFieldKeys,
  selectedFields,
  isOpen,
  onOpenChange,
  onToggleField,
  onToggleCategory,
  onSelectAll,
  onClearAll,
  search,
  onSearchChange,
  dropdownRef,
  buttonLabel = 'Display Fields',
}: FieldCustomizerDropdownProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onOpenChange((prev) => !prev)}
        className={cn(
          'h-8 gap-1.5 rounded-lg border-border/80 bg-background/50 px-2.5 text-xs font-medium hover:bg-muted/80 transition-colors shadow-2xs',
          isOpen && 'bg-muted border-primary/50 text-foreground'
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
        <span>{buttonLabel}</span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-primary/20">
          {selectedFields.length}/{allFieldKeys.length}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 sm:w-96 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <h4 className="text-xs font-semibold text-foreground">{title}</h4>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onSelectAll}
                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Select All
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={onClearAll}
                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Filter Search Input */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search fields..."
              className="h-8 pl-8 pr-7 text-xs rounded-lg bg-background/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category & Field List */}
          <div className="mt-2.5 max-h-72 overflow-y-auto space-y-3 pr-1 text-xs divide-y divide-border/40">
            {categories.map((category) => {
              const Icon = category.icon;
              const filteredFields = category.fields.filter(
                (f) =>
                  !search.trim() ||
                  f.label.toLowerCase().includes(search.toLowerCase()) ||
                  f.key.toLowerCase().includes(search.toLowerCase())
              );

              if (filteredFields.length === 0) return null;

              const categoryFieldKeys = category.fields.map((f) => f.key);
              const selectedCount = categoryFieldKeys.filter((k) =>
                selectedFields.includes(k)
              ).length;
              const allSelected = selectedCount === categoryFieldKeys.length;

              return (
                <div key={category.id} className="pt-2.5 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onToggleCategory(category.fields)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground hover:text-primary transition-colors text-left"
                    >
                      <Icon className={cn('h-3.5 w-3.5', category.iconColor)} />
                      <span>{category.label}</span>
                      <span className="font-normal text-muted-foreground">
                        ({selectedCount}/{categoryFieldKeys.length})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleCategory(category.fields)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline decoration-dotted transition-colors"
                    >
                      {allSelected ? 'Uncheck All' : 'Check All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    {filteredFields.map((field) => {
                      const isChecked = selectedFields.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2 py-1 text-xs cursor-pointer select-none transition-colors',
                            isChecked
                              ? 'bg-primary/10 text-foreground font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleField(field.key)}
                            className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-1 focus:ring-primary/40 cursor-pointer"
                          />
                          <span className="truncate" title={field.label}>
                            {field.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponent: EMV Card Item
// ----------------------------------------------------------------------
function EmvCardDetail({
  record,
  index,
  totalCount,
  copiedHhid,
  onCopy,
  selectedFields,
}: {
  record: EmvDatabaseRecord;
  index: number;
  totalCount: number;
  copiedHhid: string | null;
  onCopy: (val: string, id: string) => void;
  selectedFields: string[];
}) {
  const isVisible = (k: string) => selectedFields.includes(k);

  const isClaimed =
    record.distribution_status?.toLowerCase().includes('claimed') &&
    !record.distribution_status?.toLowerCase().includes('unclaimed');
  const isUnclaimed = record.distribution_status?.toLowerCase().includes('unclaimed');

  const showHero = isVisible('lbp_account') || isVisible('acct_description') || isVisible('cct_type');

  const attributeFields = [
    { key: 'lbp_servicing_branch', label: 'Servicing Branch', value: record.lbp_servicing_branch },
    { key: 'run_date', label: 'Run Date', value: formatDisplayDate(record.run_date) },
    { key: 'date_claimed', label: 'Date Claimed', value: formatDisplayDate(record.date_claimed), highlight: (record.date_claimed ? 'emerald' : undefined) as 'emerald' | undefined },
    { key: 'agreed_distribution_date', label: 'Agreed Distribution Date', value: formatDisplayDate(record.agreed_distribution_date) },
    { key: 'beneficiary_name', label: 'Beneficiary (EMV)', value: `${record.first_name || ''} ${record.mid_name || ''} ${record.last_name || ''}`.trim() },
    { key: 'municipality', label: 'Municipality', value: record.municipality },
    { key: 'barangay', label: 'Barangay', value: record.barangay },
    { key: 'province', label: 'Province', value: record.province },
  ].filter((attr) => isVisible(attr.key));

  const showRemarks =
    (isVisible('reason_why_unclaimed') && !!record.reason_why_unclaimed) ||
    (isVisible('recommended_action') && !!record.recommended_action) ||
    (isVisible('action_taken') && !!record.action_taken);

  const remarksCount = [
    isVisible('reason_why_unclaimed') && !!record.reason_why_unclaimed,
    isVisible('recommended_action') && !!record.recommended_action,
    isVisible('action_taken') && !!record.action_taken,
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border/80 bg-background/50 p-5 shadow-xs transition hover:border-primary/30 dark:bg-card/40">
      {/* Top Bar of EMV Card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-primary/20">
            {index + 1}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Card #{index + 1} of {totalCount}
            </span>
            {isVisible('item_no') && (
              <>
                <span className="text-xs text-border">•</span>
                <span className="font-mono text-xs text-muted-foreground">Item #{record.item_no || '-'}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVisible('distribution_status') && record.distribution_status && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                isClaimed
                  ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : isUnclaimed
                  ? 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
              )}
            >
              {isClaimed ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isUnclaimed ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : null}
              {record.distribution_status}
            </span>
          )}
        </div>
      </div>

      {/* Account Number Hero */}
      {showHero && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          {isVisible('lbp_account') ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                LandBank Account Number
              </p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-base font-bold text-foreground sm:text-lg">
                  {record.lbp_account || 'No Account Recorded'}
                </p>
                {record.lbp_account && (
                  <button
                    type="button"
                    onClick={() => onCopy(record.lbp_account, `emv_acct_${index}`)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Copy account number"
                  >
                    {copiedHhid === `emv_acct_${index}` ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {(isVisible('acct_description') || isVisible('cct_type')) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {isVisible('acct_description') && record.acct_description && (
                <div className="rounded-md bg-background/80 px-2.5 py-1 text-xs border border-border/80">
                  <span className="text-muted-foreground">Acct Desc: </span>
                  <span className="font-semibold text-foreground">{record.acct_description}</span>
                </div>
              )}
              {isVisible('cct_type') && record.cct_type && (
                <div className="rounded-md bg-background/80 px-2.5 py-1 text-xs border border-border/80">
                  <span className="text-muted-foreground">CCT Type: </span>
                  <span className="font-semibold text-foreground">{record.cct_type}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid of EMV attributes */}
      {attributeFields.length > 0 && (
        <div
          className={cn(
            'mt-4 grid gap-4',
            attributeFields.length === 1 && 'grid-cols-1 sm:grid-cols-2',
            attributeFields.length === 2 && 'grid-cols-2',
            attributeFields.length === 3 && 'grid-cols-2 sm:grid-cols-3',
            attributeFields.length >= 4 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          )}
        >
          {attributeFields.map((attr) => (
            <DetailField
              key={attr.key}
              label={attr.label}
              value={attr.value}
              highlight={attr.highlight}
            />
          ))}
        </div>
      )}

      {/* Unclaimed & Action Alert Box (if present) */}
      {showRemarks && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 dark:bg-amber-500/15">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Unclaimed / Action Taken Remarks</span>
          </div>
          <div
            className={cn(
              'mt-2 grid gap-3 text-xs',
              remarksCount === 1
                ? 'grid-cols-1'
                : remarksCount === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-3'
            )}
          >
            {isVisible('reason_why_unclaimed') && record.reason_why_unclaimed && (
              <div>
                <span className="font-medium text-amber-800 dark:text-amber-300">Reason Unclaimed:</span>
                <p className="mt-0.5 text-foreground">{record.reason_why_unclaimed}</p>
              </div>
            )}
            {isVisible('recommended_action') && record.recommended_action && (
              <div>
                <span className="font-medium text-amber-800 dark:text-amber-300">Recommended Action:</span>
                <p className="mt-0.5 text-foreground">{record.recommended_action}</p>
              </div>
            )}
            {isVisible('action_taken') && record.action_taken && (
              <div>
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  Action Taken {record.date_acted ? `(${formatDisplayDate(record.date_acted)})` : ''}:
                </span>
                <p className="mt-0.5 text-foreground">{record.action_taken}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponent: Payroll Records Table & Disbursal Helpers
// ----------------------------------------------------------------------
function getMonthNumber(period?: string | null, payrollDate?: string | null): string {
  if (period) {
    const stripped = period.replace(/^[pP](eriod)?\s*/i, '').trim();
    if (stripped) return stripped;
    return period;
  }
  if (payrollDate) {
    const d = new Date(payrollDate);
    if (!isNaN(d.getTime())) {
      return String(d.getMonth() + 1);
    }
  }
  return '-';
}

function getEducAmount(rec: PayrollRecord): number {
  if (rec.total_educ !== undefined && rec.total_educ !== null && rec.total_educ > 0) {
    return Number(rec.total_educ);
  }
  const elem = Number(rec.educ_dc_elem || 0);
  const jr = Number(rec.educ_jr_hs || 0);
  const sr = Number(rec.educ_sr_hs || 0);
  const hs = Number(rec.educ_total_hs || 0);
  return elem + jr + sr + hs;
}

function getTotalAmount(rec: PayrollRecord, educAmount: number): number {
  if (rec.net_amount !== undefined && rec.net_amount !== null && rec.net_amount > 0) {
    return Number(rec.net_amount);
  }
  if (rec.gross_amount !== undefined && rec.gross_amount !== null && rec.gross_amount > 0) {
    return Number(rec.gross_amount);
  }
  return (
    educAmount +
    Number(rec.health || 0) +
    Number(rec.rice_amount || 0) +
    Number(rec.f1kd_amount || 0) +
    Number(rec.adjustment_amount || 0)
  );
}

function formatEducHealthRice(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return val % 1 === 0 ? String(Math.round(val)) : val.toFixed(2);
}

function formatDecimal(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return Number(val).toFixed(2);
}

function isCredited(rec: PayrollRecord): boolean {
  const st = (rec.status || '').toLowerCase().trim();
  return st === 'successful' || st === 'success' || st === 'credited' || st === 'paid';
}

export const PAYROLL_TABLE_COLUMNS: { key: keyof PayrollRecord; label: string }[] = [
  { key: 'period', label: 'PERIOD' },
  { key: 'year', label: 'YEAR' },
  { key: 'payroll_description', label: 'PAYROLL DESCRIPTION' },
  { key: 'region', label: 'REGION' },
  { key: 'province', label: 'PROVINCE' },
  { key: 'municipality', label: 'MUNICIPALITY' },
  { key: 'barangay', label: 'BARANGAY' },
  { key: 'address_psgc', label: 'ADDRESS PSGC' },
  { key: 'last_name', label: 'LAST NAME' },
  { key: 'first_name', label: 'FIRST NAME' },
  { key: 'middle_name', label: 'MIDDLE NAME' },
  { key: 'household_id', label: 'HOUSEHOLD ID' },
  { key: 'payment_mode_classification', label: 'PAYMENT MODE CLASSIFICATION' },
  { key: 'mode_of_payment', label: 'MODE OF PAYMENT' },
  { key: 'account_number', label: 'ACCOUNT NUMBER' },
  { key: 'payroll_date', label: 'PAYROLL DATE' },
  { key: 'finance_approval', label: 'FINANCE APPROVAL' },
  { key: 'educ_dc_elem', label: 'EDUC DC ELEM' },
  { key: 'educ_jr_hs', label: 'EDUC JR HS' },
  { key: 'educ_sr_hs', label: 'EDUC SR HS' },
  { key: 'educ_total_hs', label: 'EDUC TOTAL HS' },
  { key: 'total_educ', label: 'TOTAL EDUC' },
  { key: 'health', label: 'HEALTH' },
  { key: 'rice_amount', label: 'RICE AMOUNT' },
  { key: 'f1kd_amount', label: 'F1KD AMOUNT' },
  { key: 'gross_amount', label: 'GROSS AMOUNT' },
  { key: 'adjustment_amount', label: 'ADJUSTMENT AMOUNT' },
  { key: 'net_amount', label: 'NET AMOUNT' },
  { key: 'hh_set', label: 'HH SET' },
  { key: 'set_group', label: 'SET GROUP' },
];

function handleExportPayrollCsv(records: PayrollRecord[], hhid: string) {
  const headers = PAYROLL_TABLE_COLUMNS.map((c) => c.label);

  const escapeCsv = (val: unknown): string => {
    const str = val !== undefined && val !== null ? String(val) : '';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = records.map((rec) => {
    const totalEduc = getEducAmount(rec);
    const grossVal =
      rec.gross_amount !== undefined && rec.gross_amount !== null && Number(rec.gross_amount) > 0
        ? Number(rec.gross_amount)
        : getTotalAmount(rec, totalEduc);
    const netVal =
      rec.net_amount !== undefined && rec.net_amount !== null && Number(rec.net_amount) > 0
        ? Number(rec.net_amount)
        : getTotalAmount(rec, totalEduc);

    return [
      escapeCsv(rec.period),
      escapeCsv(rec.year),
      escapeCsv(rec.payroll_description || '1 - CVS Regular'),
      escapeCsv(rec.region),
      escapeCsv(rec.province),
      escapeCsv(rec.municipality),
      escapeCsv(rec.barangay),
      escapeCsv(rec.address_psgc),
      escapeCsv(rec.last_name),
      escapeCsv(rec.first_name),
      escapeCsv(rec.middle_name),
      escapeCsv(rec.household_id),
      escapeCsv(rec.payment_mode_classification),
      escapeCsv(rec.mode_of_payment),
      escapeCsv(rec.account_number),
      escapeCsv(rec.payroll_date),
      escapeCsv(rec.finance_approval),
      formatEducHealthRice(Number(rec.educ_dc_elem || 0)),
      formatEducHealthRice(Number(rec.educ_jr_hs || 0)),
      formatEducHealthRice(Number(rec.educ_sr_hs || 0)),
      formatEducHealthRice(Number(rec.educ_total_hs || 0)),
      formatEducHealthRice(totalEduc),
      formatEducHealthRice(Number(rec.health || 0)),
      formatEducHealthRice(Number(rec.rice_amount || 0)),
      formatDecimal(Number(rec.f1kd_amount || 0)),
      formatDecimal(grossVal),
      formatDecimal(Number(rec.adjustment_amount || 0)),
      formatDecimal(netVal),
      escapeCsv(rec.hh_set),
      escapeCsv(rec.set_group),
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `payroll_${hhid}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface SortHeaderProps {
  columnKey: string;
  label: string;
  currentSortKey: string;
  sortDirection: 'asc' | 'desc';
  onSort: (key: string) => void;
  className?: string;
}

function SortHeader({
  columnKey,
  label,
  currentSortKey,
  sortDirection,
  onSort,
  className = '',
}: SortHeaderProps) {
  const isSorted = currentSortKey === columnKey;

  return (
    <th
      onClick={() => onSort(columnKey)}
      className={cn(
        'group cursor-pointer select-none px-3.5 py-3 text-left font-semibold text-muted-foreground transition hover:text-foreground',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {isSorted ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-3 w-3 shrink-0 text-primary" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0 text-primary" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40 hover:opacity-100" />
        )}
      </div>
    </th>
  );
}

function PayrollRecordsTable({
  records,
  displayHhid,
  selectedFields = ALL_PAYROLL_FIELD_KEYS,
}: {
  records: PayrollRecord[];
  displayHhid: string;
  selectedFields?: string[];
}) {
  const [sortKey, setSortKey] = useState<string>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setCurrentPage(1);
    setExpandedRowId(null);
  }, [records, pageSize, searchQuery]);

  const isVisible = (k: string) => selectedFields.includes(k);
  const visibleColumnCount = Math.max(1, selectedFields.length);

  const columnOrder = PAYROLL_TABLE_COLUMNS.map((c) => c.key as string);
  const firstVisibleCol = columnOrder.find((k) => isVisible(k));

  const leadingCols = [
    'period',
    'year',
    'payroll_description',
    'region',
    'province',
    'municipality',
    'barangay',
    'address_psgc',
    'last_name',
    'first_name',
    'middle_name',
    'household_id',
    'payment_mode_classification',
    'mode_of_payment',
    'account_number',
    'payroll_date',
    'finance_approval',
  ];
  const leadingColSpan = leadingCols.filter((k) => isVisible(k)).length;

  const renderExpandChevron = (colKey: string, isExpanded: boolean) => {
    if (firstVisibleCol !== colKey) return null;
    return (
      <ChevronRight
        className={cn(
          'h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform',
          isExpanded && 'rotate-90 text-primary'
        )}
      />
    );
  };

  const handleCopyAccount = (account: string, rowId: string | number) => {
    navigator.clipboard.writeText(account);
    setCopiedAccountId(String(rowId));
    setTimeout(() => setCopiedAccountId(null), 2000);
  };

  const numericColKeys = [
    'year',
    'educ_dc_elem',
    'educ_jr_hs',
    'educ_sr_hs',
    'educ_total_hs',
    'total_educ',
    'health',
    'rice_amount',
    'f1kd_amount',
    'gross_amount',
    'adjustment_amount',
    'net_amount',
  ];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(numericColKeys.includes(key) ? 'desc' : 'asc');
    }
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'year': {
          const valA = Number(a.year || 0);
          const valB = Number(b.year || 0);
          comparison = valA - valB;
          if (comparison === 0) {
            const mA = Number(getMonthNumber(a.period, a.payroll_date)) || 0;
            const mB = Number(getMonthNumber(b.period, b.payroll_date)) || 0;
            return sortDirection === 'desc' ? mB - mA : mA - mB;
          }
          break;
        }
        case 'period': {
          const mA = Number(getMonthNumber(a.period, a.payroll_date));
          const mB = Number(getMonthNumber(b.period, b.payroll_date));
          if (!isNaN(mA) && !isNaN(mB) && mA !== mB) {
            comparison = mA - mB;
          } else {
            comparison = String(a.period || '').localeCompare(String(b.period || ''));
          }
          break;
        }
        case 'educ_dc_elem':
        case 'educ_jr_hs':
        case 'educ_sr_hs':
        case 'educ_total_hs':
        case 'health':
        case 'rice_amount':
        case 'f1kd_amount':
        case 'adjustment_amount': {
          const valA = Number(a[sortKey as keyof PayrollRecord] || 0);
          const valB = Number(b[sortKey as keyof PayrollRecord] || 0);
          comparison = valA - valB;
          break;
        }
        case 'total_educ': {
          comparison = getEducAmount(a) - getEducAmount(b);
          break;
        }
        case 'gross_amount': {
          const gA =
            a.gross_amount !== undefined && a.gross_amount !== null && Number(a.gross_amount) > 0
              ? Number(a.gross_amount)
              : getTotalAmount(a, getEducAmount(a));
          const gB =
            b.gross_amount !== undefined && b.gross_amount !== null && Number(b.gross_amount) > 0
              ? Number(b.gross_amount)
              : getTotalAmount(b, getEducAmount(b));
          comparison = gA - gB;
          break;
        }
        case 'net_amount': {
          const nA = getTotalAmount(a, getEducAmount(a));
          const nB = getTotalAmount(b, getEducAmount(b));
          comparison = nA - nB;
          break;
        }
        default: {
          const valA = String(a[sortKey as keyof PayrollRecord] || '').toLowerCase();
          const valB = String(b[sortKey as keyof PayrollRecord] || '').toLowerCase();
          comparison = valA.localeCompare(valB);
          break;
        }
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [records, sortKey, sortDirection]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return sortedRecords;
    const q = searchQuery.toLowerCase().trim();
    return sortedRecords.filter((rec) => {
      return PAYROLL_TABLE_COLUMNS.some((col) => {
        const val = rec[col.key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      });
    });
  }, [sortedRecords, searchQuery]);

  // Pagination calculation
  const totalItems = filteredRecords.length;
  const effectivePageSize = pageSize === 'ALL' ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRecords = useMemo(() => {
    if (pageSize === 'ALL') return filteredRecords;
    const start = (validCurrentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, validCurrentPage, pageSize]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (validCurrentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (validCurrentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  const totals = useMemo(() => {
    const list = searchQuery.trim() ? filteredRecords : records;
    return list.reduce(
      (acc, rec) => {
        const educElem = Number(rec.educ_dc_elem || 0);
        const educJr = Number(rec.educ_jr_hs || 0);
        const educSr = Number(rec.educ_sr_hs || 0);
        const educTotalHs = Number(rec.educ_total_hs || 0);
        const totalEduc = getEducAmount(rec);
        const health = Number(rec.health || 0);
        const rice = Number(rec.rice_amount || 0);
        const f1kd = Number(rec.f1kd_amount || 0);
        const adj = Number(rec.adjustment_amount || 0);
        const gross =
          rec.gross_amount !== undefined && rec.gross_amount !== null && Number(rec.gross_amount) > 0
            ? Number(rec.gross_amount)
            : getTotalAmount(rec, totalEduc);
        const net = getTotalAmount(rec, totalEduc);

        acc.educ_dc_elem += educElem;
        acc.educ_jr_hs += educJr;
        acc.educ_sr_hs += educSr;
        acc.educ_total_hs += educTotalHs;
        acc.total_educ += totalEduc;
        acc.health += health;
        acc.rice_amount += rice;
        acc.f1kd_amount += f1kd;
        acc.gross_amount += gross;
        acc.adjustment_amount += adj;
        acc.net_amount += net;
        return acc;
      },
      {
        educ_dc_elem: 0,
        educ_jr_hs: 0,
        educ_sr_hs: 0,
        educ_total_hs: 0,
        total_educ: 0,
        health: 0,
        rice_amount: 0,
        f1kd_amount: 0,
        gross_amount: 0,
        adjustment_amount: 0,
        net_amount: 0,
      }
    );
  }, [records, filteredRecords, searchQuery]);

  return (
    <div>
      {/* Search / Filter bar for larger histories */}
      {records.length > 5 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/20 px-6 py-2.5 text-xs">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by period, year, mode, account, location..."
              className="h-8 pl-8 pr-7 text-xs bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {searchQuery.trim() ? (
              <span>
                Found <strong className="text-foreground">{filteredRecords.length}</strong> of {records.length} records
              </span>
            ) : (
              <span>Total records: <strong className="text-foreground">{records.length}</strong></span>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
        <thead className="border-b border-border/80 bg-muted/40 dark:bg-muted/20">
          <tr>
            {PAYROLL_TABLE_COLUMNS.map(
              (col) =>
                isVisible(col.key) && (
                  <SortHeader
                    key={col.key}
                    columnKey={col.key}
                    label={col.label}
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {paginatedRecords.length === 0 ? (
            <tr>
              <td colSpan={visibleColumnCount} className="py-10 text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Search className="h-5 w-5 text-muted-foreground/50" />
                  <p>No payroll records match &ldquo;{searchQuery}&rdquo;</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 h-7 text-xs"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Filter
                  </Button>
                </div>
              </td>
            </tr>
          ) : (
            paginatedRecords.map((record, idx) => {
              const globalIdx = pageSize === 'ALL' ? idx : (validCurrentPage - 1) * pageSize + idx;
              const rowKey = record.id || `row_${globalIdx}`;
              const totalEduc = getEducAmount(record);
              const grossVal =
                record.gross_amount !== undefined && record.gross_amount !== null && Number(record.gross_amount) > 0
                  ? Number(record.gross_amount)
                  : getTotalAmount(record, totalEduc);
              const netVal = getTotalAmount(record, totalEduc);
              const isExpanded = expandedRowId === rowKey;

              return (
                <Fragment key={rowKey}>
                  <tr
                    onClick={() => setExpandedRowId((prev) => (prev === rowKey ? null : rowKey))}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/40',
                      isExpanded ? 'bg-muted/30 font-medium' : idx % 2 === 1 ? 'bg-muted/10' : 'bg-transparent'
                    )}
                  >
                    {/* 1. PERIOD */}
                    {isVisible('period') && (
                      <td className="px-3.5 py-3 text-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('period', isExpanded)}
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary dark:text-cyan-300">
                            {record.period || '-'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* 2. YEAR */}
                    {isVisible('year') && (
                      <td className="px-3.5 py-3 text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('year', isExpanded)}
                          <span>{record.year || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 3. PAYROLL DESCRIPTION */}
                    {isVisible('payroll_description') && (
                      <td className="px-3.5 py-3 text-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('payroll_description', isExpanded)}
                          <span>{record.payroll_description || '1 - CVS Regular'}</span>
                        </div>
                      </td>
                    )}

                    {/* 4. REGION */}
                    {isVisible('region') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('region', isExpanded)}
                          <span>{record.region || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 5. PROVINCE */}
                    {isVisible('province') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('province', isExpanded)}
                          <span>{record.province || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 6. MUNICIPALITY */}
                    {isVisible('municipality') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('municipality', isExpanded)}
                          <span>{record.municipality || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 7. BARANGAY */}
                    {isVisible('barangay') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('barangay', isExpanded)}
                          <span>{record.barangay || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 8. ADDRESS PSGC */}
                    {isVisible('address_psgc') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('address_psgc', isExpanded)}
                          <span>{record.address_psgc || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 9. LAST NAME */}
                    {isVisible('last_name') && (
                      <td className="px-3.5 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('last_name', isExpanded)}
                          <span>{record.last_name || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 10. FIRST NAME */}
                    {isVisible('first_name') && (
                      <td className="px-3.5 py-3 text-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('first_name', isExpanded)}
                          <span>{record.first_name || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 11. MIDDLE NAME */}
                    {isVisible('middle_name') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('middle_name', isExpanded)}
                          <span>{record.middle_name || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 12. HOUSEHOLD ID */}
                    {isVisible('household_id') && (
                      <td className="px-3.5 py-3 font-mono text-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('household_id', isExpanded)}
                          <span>{record.household_id || displayHhid || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 13. PAYMENT MODE CLASSIFICATION */}
                    {isVisible('payment_mode_classification') && (
                      <td
                        className="px-3.5 py-3 text-muted-foreground max-w-xs truncate"
                        title={record.payment_mode_classification || '-'}
                      >
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('payment_mode_classification', isExpanded)}
                          <span className="truncate">{record.payment_mode_classification || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 14. MODE OF PAYMENT */}
                    {isVisible('mode_of_payment') && (
                      <td
                        className="px-3.5 py-3 text-muted-foreground max-w-xs truncate"
                        title={record.mode_of_payment || '-'}
                      >
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('mode_of_payment', isExpanded)}
                          <span className="truncate">{record.mode_of_payment || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 15. ACCOUNT NUMBER */}
                    {isVisible('account_number') && (
                      <td className="px-3.5 py-3 font-mono text-foreground/90">
                        <div className="flex items-center gap-1.5 group">
                          {renderExpandChevron('account_number', isExpanded)}
                          <span>{record.account_number || '-'}</span>
                          {record.account_number && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAccount(record.account_number!, rowKey);
                              }}
                              className="rounded p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground opacity-40 group-hover:opacity-100"
                              title="Copy account number"
                            >
                              {copiedAccountId === String(rowKey) ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 16. PAYROLL DATE */}
                    {isVisible('payroll_date') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('payroll_date', isExpanded)}
                          <span>{record.payroll_date || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 17. FINANCE APPROVAL */}
                    {isVisible('finance_approval') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('finance_approval', isExpanded)}
                          <span>{record.finance_approval || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 18. EDUC DC ELEM */}
                    {isVisible('educ_dc_elem') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('educ_dc_elem', isExpanded)}
                          <span>{formatEducHealthRice(Number(record.educ_dc_elem ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 19. EDUC JR HS */}
                    {isVisible('educ_jr_hs') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('educ_jr_hs', isExpanded)}
                          <span>{formatEducHealthRice(Number(record.educ_jr_hs ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 20. EDUC SR HS */}
                    {isVisible('educ_sr_hs') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('educ_sr_hs', isExpanded)}
                          <span>{formatEducHealthRice(Number(record.educ_sr_hs ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 21. EDUC TOTAL HS */}
                    {isVisible('educ_total_hs') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('educ_total_hs', isExpanded)}
                          <span>{formatEducHealthRice(Number(record.educ_total_hs ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 22. TOTAL EDUC */}
                    {isVisible('total_educ') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('total_educ', isExpanded)}
                          <span>{formatEducHealthRice(totalEduc)}</span>
                        </div>
                      </td>
                    )}

                    {/* 23. HEALTH */}
                    {isVisible('health') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('health', isExpanded)}
                          <span>{formatEducHealthRice(Number(record.health ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 24. RICE AMOUNT */}
                    {isVisible('rice_amount') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('rice_amount', isExpanded)}
                          <span>{formatEducHealthRice(Number(record.rice_amount ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 25. F1KD AMOUNT */}
                    {isVisible('f1kd_amount') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('f1kd_amount', isExpanded)}
                          <span>{formatDecimal(Number(record.f1kd_amount ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 26. GROSS AMOUNT */}
                    {isVisible('gross_amount') && (
                      <td className="px-3.5 py-3 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('gross_amount', isExpanded)}
                          <span>{formatDecimal(grossVal)}</span>
                        </div>
                      </td>
                    )}

                    {/* 27. ADJUSTMENT AMOUNT */}
                    {isVisible('adjustment_amount') && (
                      <td className="px-3.5 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('adjustment_amount', isExpanded)}
                          <span>{formatDecimal(Number(record.adjustment_amount ?? 0))}</span>
                        </div>
                      </td>
                    )}

                    {/* 28. NET AMOUNT */}
                    {isVisible('net_amount') && (
                      <td className="px-3.5 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('net_amount', isExpanded)}
                          <span>{formatDecimal(netVal)}</span>
                        </div>
                      </td>
                    )}

                    {/* 29. HH SET */}
                    {isVisible('hh_set') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('hh_set', isExpanded)}
                          <span>{record.hh_set || '-'}</span>
                        </div>
                      </td>
                    )}

                    {/* 30. SET GROUP */}
                    {isVisible('set_group') && (
                      <td className="px-3.5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renderExpandChevron('set_group', isExpanded)}
                          <span>{record.set_group || '-'}</span>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expanded Row for Extra Details */}
                  {isExpanded && (
                    <tr className="bg-muted/20 border-b border-border/80">
                      <td colSpan={visibleColumnCount} className="px-6 py-4">
                        <div className="rounded-xl border border-border/70 bg-card/90 p-4 shadow-2xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                Cycle #{globalIdx + 1} Breakdown: {record.period || 'Period'} - {record.year || 'Year'}
                              </span>
                              {record.hh_set && (
                                <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                  Set {record.hh_set} {record.set_group ? `• Group ${record.set_group}` : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                                  record.status?.toLowerCase() === 'successful'
                                    ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : record.status?.toLowerCase() === 'reject'
                                    ? 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400'
                                    : 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
                                )}
                              >
                                {record.status?.toLowerCase() === 'successful' ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : record.status?.toLowerCase() === 'reject' ? (
                                  <XCircle className="h-3 w-3" />
                                ) : null}
                                {record.status || 'Unprocessed'}
                              </span>
                            </div>
                          </div>

                          {/* Breakdown of education components & dates */}
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 text-xs">
                            <div>
                              <span className="text-[10px] font-medium uppercase text-muted-foreground">Educ DC Elem</span>
                              <p className="font-mono font-medium text-foreground">{formatAmount(record.educ_dc_elem || 0)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase text-muted-foreground">Educ Jr High</span>
                              <p className="font-mono font-medium text-foreground">{formatAmount(record.educ_jr_hs || 0)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase text-muted-foreground">Educ Sr High</span>
                              <p className="font-mono font-medium text-foreground">{formatAmount(record.educ_sr_hs || 0)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase text-muted-foreground">Gross Amount</span>
                              <p className="font-mono font-bold text-foreground">{formatAmount(record.gross_amount || 0)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase text-muted-foreground">Payroll Date</span>
                              <p className="font-medium text-foreground">{record.payroll_date || '-'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase text-muted-foreground">Finance Approval</span>
                              <p className="font-medium text-foreground">{record.finance_approval || '-'}</p>
                            </div>
                            {record.new_account_number && (
                              <div>
                                <span className="text-[10px] font-medium uppercase text-muted-foreground">New Account Number</span>
                                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{record.new_account_number}</p>
                              </div>
                            )}
                            {record.address_psgc && (
                              <div>
                                <span className="text-[10px] font-medium uppercase text-muted-foreground">PSGC Code</span>
                                <p className="font-medium text-foreground">{record.address_psgc}</p>
                              </div>
                            )}
                          </div>

                          {/* Rejection / Remarks box */}
                          {record.reason && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-400">
                              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Remarks / Rejection Reason:</span>
                                <p className="mt-0.5 text-foreground">{record.reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
        <tfoot className="border-t-2 border-border/80 bg-muted/30 font-semibold text-xs text-foreground">
          <tr>
            {leadingColSpan > 0 && (
              <td colSpan={leadingColSpan} className="px-3.5 py-3 text-left">
                <div className="flex flex-col">
                  <span>
                    {searchQuery.trim()
                      ? `Filtered Total (${filteredRecords.length} of ${records.length} records)`
                      : `Total (${records.length} ${records.length === 1 ? 'record' : 'records'})`}
                  </span>
                  {totalPages > 1 && pageSize !== 'ALL' && (
                    <span className="text-[10px] font-normal text-muted-foreground">
                      Page {validCurrentPage} of {totalPages}
                    </span>
                  )}
                </div>
              </td>
            )}
            {isVisible('educ_dc_elem') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatEducHealthRice(totals.educ_dc_elem)}</td>
            )}
            {isVisible('educ_jr_hs') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatEducHealthRice(totals.educ_jr_hs)}</td>
            )}
            {isVisible('educ_sr_hs') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatEducHealthRice(totals.educ_sr_hs)}</td>
            )}
            {isVisible('educ_total_hs') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatEducHealthRice(totals.educ_total_hs)}</td>
            )}
            {isVisible('total_educ') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatEducHealthRice(totals.total_educ)}</td>
            )}
            {isVisible('health') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatEducHealthRice(totals.health)}</td>
            )}
            {isVisible('rice_amount') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatEducHealthRice(totals.rice_amount)}</td>
            )}
            {isVisible('f1kd_amount') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatDecimal(totals.f1kd_amount)}</td>
            )}
            {isVisible('gross_amount') && (
              <td className="px-3.5 py-3 text-left font-mono font-bold text-foreground">
                {formatDecimal(totals.gross_amount)}
              </td>
            )}
            {isVisible('adjustment_amount') && (
              <td className="px-3.5 py-3 text-left font-mono">{formatDecimal(totals.adjustment_amount)}</td>
            )}
            {isVisible('net_amount') && (
              <td className="px-3.5 py-3 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatDecimal(totals.net_amount)}
              </td>
            )}
            {isVisible('hh_set') && (
              <td className="px-3.5 py-3 text-left text-muted-foreground">-</td>
            )}
            {isVisible('set_group') && (
              <td className="px-3.5 py-3 text-left text-muted-foreground">-</td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>

    {/* Modern Pagination Footer */}
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80 px-6 py-3.5 text-xs text-muted-foreground bg-card">
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
            {searchQuery.trim() && ` (filtered from ${records.length} total)`}
          </span>
        ) : (
          <span>Showing 0 of 0 entries</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Rows Per Page */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Rows per page:</span>
          <select
            aria-label="Rows per page"
            className="h-7 rounded-md border border-border/80 bg-secondary/50 px-2 py-0.5 text-xs font-semibold text-foreground transition focus:border-primary focus:outline-none"
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              setPageSize(val);
              setCurrentPage(1);
            }}
            value={pageSize}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value="ALL">All</option>
          </select>
        </div>

        {/* Pagination Navigation */}
        {pageSize !== 'ALL' && totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              aria-label="First page"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              type="button"
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>

            {/* Prev Page */}
            <button
              aria-label="Previous page"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              type="button"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((p, pIdx) => {
                if (p === '...') {
                  return (
                    <span className="px-1 text-xs text-muted-foreground" key={`dots-${pIdx}`}>
                      ...
                    </span>
                  );
                }
                const pageNum = Number(p);
                const isCurrent = pageNum === validCurrentPage;
                return (
                  <button
                    className={cn(
                      'flex h-7 min-w-[1.75rem] items-center justify-center rounded-md px-2 text-xs font-semibold transition',
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'border border-border/70 text-foreground hover:bg-secondary'
                    )}
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    type="button"
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              aria-label="Next page"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              type="button"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Last Page */}
            <button
              aria-label="Last page"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              type="button"
              title="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

// ----------------------------------------------------------------------
// Subcomponent: Detail Field
// ----------------------------------------------------------------------
function DetailField({
  label,
  value,
  isMono = false,
  highlight,
  isCopyable = false,
  onCopy,
  isCopied = false,
}: {
  label: string;
  value?: string | number | null;
  isMono?: boolean;
  highlight?: 'emerald' | 'amber' | 'rose' | 'blue';
  isCopyable?: boolean;
  onCopy?: (val: string) => void;
  isCopied?: boolean;
}) {
  const displayVal = value !== undefined && value !== null && value !== '' ? String(value) : '-';

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'text-xs font-semibold leading-snug',
            isMono && 'font-mono',
            highlight === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
            highlight === 'amber' && 'text-amber-600 dark:text-amber-400',
            highlight === 'rose' && 'text-rose-600 dark:text-rose-400',
            highlight === 'blue' && 'text-blue-600 dark:text-blue-400',
            !highlight && 'text-foreground'
          )}
        >
          {displayVal}
        </span>
        {isCopyable && value && (
          <button
            type="button"
            onClick={() => onCopy?.(String(value))}
            className="rounded p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Copy value"
          >
            {isCopied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

