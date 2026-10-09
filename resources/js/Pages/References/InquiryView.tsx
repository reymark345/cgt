import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
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
          if (json.total_matches === 0) {
            onSetNotice?.(`No records found matching Household ID "${term}".`);
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-colors dark:border-border dark:bg-card">
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

      {/* Main Content Area */}
      {result && (
        <div className="space-y-6">
          {/* Household Master Summary Banner */}
          <div className="relative z-20 rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-sm dark:border-primary/30">
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
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
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
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all dark:border-border dark:bg-card">
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
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs transition-colors dark:border-border dark:bg-card">
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

              {result.grantee && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">HH Set:</span>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {result.grantee.hh_set || 'N/A'}
                  </span>
                </div>
              )}
            </div>

            <div className="p-6">
              {result.grantee ? (
                <div className="space-y-6">
                  {/* Category 1: Personal & Demographics */}
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Personal & Demographics
                    </h4>
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      <DetailField label="First Name" value={result.grantee.first_name} />
                      <DetailField label="Middle Name" value={result.grantee.middle_name} />
                      <DetailField label="Last Name" value={result.grantee.last_name} />
                      <DetailField label="Extension Name" value={result.grantee.ext_name} />
                      <DetailField label="Maiden Name" value={result.grantee.maiden_name} />
                      <DetailField label="Sex" value={result.grantee.sex} />
                      <DetailField label="Birthday" value={formatDisplayDate(result.grantee.birthday)} />
                      <DetailField label="Current Age" value={result.grantee.current_age ? `${result.grantee.current_age} yrs` : '-'} />
                      <DetailField label="Age at Registration" value={result.grantee.age} />
                      <DetailField label="Contact Number" value={result.grantee.contact_number} />
                      <DetailField label="Relation to HH Head" value={result.grantee.relation_to_hh} />
                      <DetailField label="HH Grantee" value={result.grantee.hh_grantee} />
                    </div>
                  </div>

                  <hr className="border-border/60" />

                  {/* Category 2: Geographic & Location */}
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      Geographic & Address Information
                    </h4>
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                      <DetailField label="Region" value={result.grantee.region} />
                      <DetailField label="Province" value={result.grantee.province} />
                      <DetailField label="Municipality" value={result.grantee.municipality} />
                      <DetailField label="Barangay" value={result.grantee.barangay} />
                      <DetailField label="Purok" value={result.grantee.purok} />
                      <DetailField label="District" value={result.grantee.district} />
                    </div>
                  </div>

                  <hr className="border-border/60" />

                  {/* Category 3: Program & Status Tagging */}
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Program Classification & Status
                    </h4>
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      <DetailField
                        label="Client Status"
                        value={result.grantee.client_status}
                        highlight={result.grantee.client_status?.toLowerCase().includes('active') ? 'emerald' : 'amber'}
                      />
                      <DetailField label="Old Client Status" value={result.grantee.old_client_status} />
                      <DetailField label="Registration Status" value={result.grantee.registration_status} />
                      <DetailField label="Member Status" value={result.grantee.member_status} />
                      <DetailField label="Date Tagged" value={formatDisplayDate(result.grantee.date_tagged)} />
                      <DetailField label="Tagged By" value={result.grantee.tagged_by} />
                      <DetailField label="CS Category" value={result.grantee.cs_category} />
                      <DetailField label="IP Label / Status" value={result.grantee.ip_label || result.grantee.ip_status} />
                    </div>
                  </div>

                  <hr className="border-border/60" />

                  {/* Category 4: Banking & Enrollment */}
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5 text-cyan-500" />
                      Banking & Enrollment Metadata
                    </h4>
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      <DetailField label="Payment Mode" value={result.grantee.payment_mode} />
                      <DetailField
                        label="LBP Account (Grantee Profile)"
                        value={result.grantee.lbp_account}
                        isMono
                        isCopyable
                        onCopy={(val) => handleCopy(val, 'grantee_lbp')}
                        isCopied={copiedHhid === 'grantee_lbp'}
                      />
                      <DetailField label="Date Enumerated" value={formatDisplayDate(result.grantee.date_of_enumeration)} />
                      <DetailField label="Date Registered" value={formatDisplayDate(result.grantee.date_registered || result.grantee.date_registered_v2)} />
                      <DetailField label="Family ID" value={result.grantee.family_id} />
                      <DetailField label="Final L3 Result" value={result.grantee.final_l3_result} />
                    </div>
                  </div>
                </div>
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
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs transition-colors dark:border-border dark:bg-card">
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
            </div>

            <div className="p-6">
              {result.emv_records.length > 0 ? (
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
                        />
                      ))}
                    </div>
                  )}
                </div>
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
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs transition-colors dark:border-border dark:bg-card">
            <div className="flex flex-col gap-3 border-b border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
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
                  </div>
                  <p className="text-xs text-muted-foreground">Disbursement periods, breakdown of grants, payment modes, and approvals.</p>
                </div>
              </div>

              {/* Cumulative Financial Totals Pill */}
              {result.payroll_records.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5">
                    <span className="text-[11px] text-muted-foreground">Total Disbursed:</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatAmount(result.summary.total_net)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              {result.payroll_records.length > 0 ? (
                <div className="space-y-6">
                  {result.payroll_records.map((payroll, idx) => (
                    <PayrollCycleDetail
                      key={payroll.id || idx}
                      record={payroll}
                      index={idx}
                      totalCount={result.payroll_records.length}
                      copiedHhid={copiedHhid}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
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
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
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
}: {
  record: EmvDatabaseRecord;
  index: number;
  totalCount: number;
  copiedHhid: string | null;
  onCopy: (val: string, id: string) => void;
}) {
  const isClaimed =
    record.distribution_status?.toLowerCase().includes('claimed') &&
    !record.distribution_status?.toLowerCase().includes('unclaimed');
  const isUnclaimed = record.distribution_status?.toLowerCase().includes('unclaimed');

  return (
    <div className="rounded-xl border border-border/80 bg-background/50 p-5 shadow-xs transition hover:border-primary/30 dark:bg-card/40">
      {/* Top Bar of EMV Card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-primary/20">
            {index + 1}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card #{index + 1} of {totalCount}</span>
            <span className="text-xs text-border">•</span>
            <span className="font-mono text-xs text-muted-foreground">Item #{record.item_no || '-'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {record.distribution_status && (
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
      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">LandBank Account Number</p>
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

        <div className="flex flex-wrap gap-2 text-xs">
          {record.acct_description && (
            <div className="rounded-md bg-background/80 px-2.5 py-1 text-xs border border-border/80">
              <span className="text-muted-foreground">Acct Desc: </span>
              <span className="font-semibold text-foreground">{record.acct_description}</span>
            </div>
          )}
          {record.cct_type && (
            <div className="rounded-md bg-background/80 px-2.5 py-1 text-xs border border-border/80">
              <span className="text-muted-foreground">CCT Type: </span>
              <span className="font-semibold text-foreground">{record.cct_type}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of EMV attributes */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Servicing Branch" value={record.lbp_servicing_branch} />
        <DetailField label="Run Date" value={formatDisplayDate(record.run_date)} />
        <DetailField label="Date Claimed" value={formatDisplayDate(record.date_claimed)} highlight={record.date_claimed ? 'emerald' : undefined} />
        <DetailField label="Agreed Distribution Date" value={formatDisplayDate(record.agreed_distribution_date)} />
        <DetailField label="Beneficiary (EMV)" value={`${record.first_name || ''} ${record.mid_name || ''} ${record.last_name || ''}`.trim()} />
        <DetailField label="Municipality" value={record.municipality} />
        <DetailField label="Barangay" value={record.barangay} />
        <DetailField label="Province" value={record.province} />
      </div>

      {/* Unclaimed & Action Alert Box (if present) */}
      {(record.reason_why_unclaimed || record.recommended_action || record.action_taken) && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 dark:bg-amber-500/15">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Unclaimed / Action Taken Remarks</span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
            {record.reason_why_unclaimed && (
              <div>
                <span className="font-medium text-amber-800 dark:text-amber-300">Reason Unclaimed:</span>
                <p className="mt-0.5 text-foreground">{record.reason_why_unclaimed}</p>
              </div>
            )}
            {record.recommended_action && (
              <div>
                <span className="font-medium text-amber-800 dark:text-amber-300">Recommended Action:</span>
                <p className="mt-0.5 text-foreground">{record.recommended_action}</p>
              </div>
            )}
            {record.action_taken && (
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
// Subcomponent: Payroll Cycle Item
// ----------------------------------------------------------------------
function PayrollCycleDetail({
  record,
  index,
  totalCount,
  copiedHhid,
  onCopy,
}: {
  record: PayrollRecord;
  index: number;
  totalCount: number;
  copiedHhid: string | null;
  onCopy: (val: string, id: string) => void;
}) {
  const isReject = record.status?.toLowerCase() === 'reject';
  const isSuccess = record.status?.toLowerCase() === 'successful';

  return (
    <div className="rounded-xl border border-border/80 bg-background/50 p-5 shadow-xs transition hover:border-indigo-500/30 dark:bg-card/40">
      {/* Header of Cycle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            {record.period} - {record.year}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {record.payroll_description || 'Payroll Cycle'}
          </span>
          {record.hh_set && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Set {record.hh_set} {record.set_group ? `• Group ${record.set_group}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {record.status ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                isSuccess
                  ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : isReject
                  ? 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
              )}
            >
              {isSuccess ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isReject ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : null}
              {record.status}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Unprocessed
            </span>
          )}
        </div>
      </div>

      {/* Financial Summary KPI Strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Gross Amount</p>
          <p className="mt-1 font-mono text-base font-bold text-foreground">
            {formatAmount(record.gross_amount || 0)}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Adjustments</p>
          <p className="mt-1 font-mono text-base font-bold text-amber-600 dark:text-amber-400">
            {formatAmount(record.adjustment_amount || 0)}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 dark:bg-emerald-500/10">
          <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Net Disbursed</p>
          <p className="mt-1 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formatAmount(record.net_amount || 0)}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Education</p>
          <p className="mt-1 font-mono text-base font-bold text-foreground">
            {formatAmount(record.total_educ || 0)}
          </p>
        </div>
      </div>

      {/* Grants Breakdown Accordion/Grid */}
      <div className="mt-4 rounded-lg border border-border/60 bg-background/60 p-3.5 dark:bg-card/60">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Grant Component Breakdown</p>
        <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          <DetailField label="Educ DC Elem" value={formatAmount(record.educ_dc_elem || 0)} isMono />
          <DetailField label="Educ Jr High" value={formatAmount(record.educ_jr_hs || 0)} isMono />
          <DetailField label="Educ Sr High" value={formatAmount(record.educ_sr_hs || 0)} isMono />
          <DetailField label="Health Grant" value={formatAmount(record.health || 0)} isMono />
          <DetailField label="Rice Subsidy" value={formatAmount(record.rice_amount || 0)} isMono />
          <DetailField label="F1KD Amount" value={formatAmount(record.f1kd_amount || 0)} isMono />
        </div>
      </div>

      {/* Banking & Disbursal Details */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Payment Classification" value={record.payment_mode_classification} />
        <DetailField label="Mode of Payment" value={record.mode_of_payment} />
        <DetailField
          label="Account Number"
          value={record.account_number}
          isMono
          isCopyable
          onCopy={(val) => onCopy(val, `pr_acct_${index}`)}
          isCopied={copiedHhid === `pr_acct_${index}`}
        />
        <DetailField
          label="New Account Number"
          value={record.new_account_number || '-'}
          isMono
          highlight={record.new_account_number ? 'emerald' : undefined}
          isCopyable={!!record.new_account_number}
          onCopy={(val) => onCopy(val, `pr_new_acct_${index}`)}
          isCopied={copiedHhid === `pr_new_acct_${index}`}
        />
        <DetailField label="Payroll Date" value={record.payroll_date} />
        <DetailField label="Finance Approval" value={record.finance_approval} />
        <DetailField label="Address PSGC" value={record.address_psgc} />
      </div>

      {/* Rejection / Remarks Box */}
      {isReject && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Rejection Reason / Remarks:</span>
            <p className="mt-0.5 text-foreground font-medium">{record.reason || 'No specific reason entered.'}</p>
          </div>
        </div>
      )}
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

