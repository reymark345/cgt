import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Library,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  TableDisplayFieldsButton,
  useTableDisplayFields,
  type TableColumnDefinition,
} from '@/Components/TableDisplayFieldsControl';

const COVERED_MUNI_COLUMNS: TableColumnDefinition[] = [
  { key: '#', label: '#' },
  { key: 'Province', label: 'Province' },
  { key: 'Municipality', label: 'Municipality' },
  { key: 'Covered LBP Branch', label: 'Covered LBP Branch' },
  { key: 'Actions', label: 'Actions' },
];

const BRANCH_DIRECTORY_COLUMNS: TableColumnDefinition[] = [
  { key: '#', label: '#' },
  { key: 'branch', label: 'branch' },
  { key: 'addressee_name', label: 'addressee_name' },
  { key: 'addressee_position', label: 'addressee_position' },
  { key: 'addressee_branch', label: 'addressee_branch' },
  { key: 'address_1', label: 'address_1' },
  { key: 'address_2', label: 'address_2' },
  { key: 'Actions', label: 'Actions' },
];

export type CoveredMunicipalityItem = {
  id: number;
  province: string;
  municipality: string;
  covered_lbp_branch: string;
  updated_at?: string;
};

export type BranchDirectoryItem = {
  id: number;
  branch: string;
  addressee_name: string;
  addressee_position: string;
  addressee_branch: string;
  address_1: string;
  address_2: string;
  updated_at?: string;
};

type DirectoryViewProps = {
  onSetNotice?: (msg: string) => void;
};

function getCsrfToken(): string {
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function DirectoryView({ onSetNotice }: DirectoryViewProps) {
  const [activeTab, setActiveTab] = useState<'covered-municipality' | 'branch-directory'>('covered-municipality');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);

  const {
    visibleKeys: muniVisibleKeys,
    isColumnVisible: isMuniColVisible,
    toggleColumn: toggleMuniCol,
    showAllColumns: showAllMuniCols,
    resetDefaultColumns: resetDefaultMuniCols,
  } = useTableDisplayFields('library_covered_municipality_table', COVERED_MUNI_COLUMNS);

  const {
    visibleKeys: branchVisibleKeys,
    isColumnVisible: isBranchColVisible,
    toggleColumn: toggleBranchCol,
    showAllColumns: showAllBranchCols,
    resetDefaultColumns: resetDefaultBranchCols,
  } = useTableDisplayFields('library_branch_directory_table', BRANCH_DIRECTORY_COLUMNS);

  const [municipalities, setMunicipalities] = useState<CoveredMunicipalityItem[]>([]);
  const [branches, setBranches] = useState<BranchDirectoryItem[]>([]);

  // Search & Filter & Pagination states for Tab 1 (LBP Branch Covered Municipality)
  const [muniSearch, setMuniSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [muniPage, setMuniPage] = useState(1);
  const [muniPerPage, setMuniPerPage] = useState(10);

  // Inline editing state for Tab 1
  const [editingMuniId, setEditingMuniId] = useState<number | null>(null);
  const [editMuniForm, setEditMuniForm] = useState({
    province: '',
    municipality: '',
    covered_lbp_branch: '',
  });
  const [addingMuni, setAddingMuni] = useState(false);
  const [newMuniForm, setNewMuniForm] = useState({
    province: 'AGUSAN DEL NORTE',
    municipality: '',
    covered_lbp_branch: 'Butuan',
  });

  // Search & Pagination state for Tab 2 (LBP Branch Directory)
  const [branchSearch, setBranchSearch] = useState('');
  const [branchPage, setBranchPage] = useState(1);
  const [branchPerPage, setBranchPerPage] = useState(10);

  // Inline editing state for Tab 2
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editBranchForm, setEditBranchForm] = useState({
    branch: '',
    addressee_name: '',
    addressee_position: '',
    addressee_branch: '',
    address_1: '',
    address_2: '',
  });
  const [addingBranch, setAddingBranch] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({
    branch: '',
    addressee_name: '',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - ',
    address_1: '',
    address_2: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback(
    (text: string, type: 'success' | 'error' = 'success') => {
      setFeedback({ text, type });
      onSetNotice?.(text);
      setTimeout(() => {
        setFeedback((prev) => (prev?.text === text ? null : prev));
      }, 3500);
    },
    [onSetNotice],
  );

  const fetchDirectoryData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/libraries/directory/data', {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMunicipalities(data.covered_municipalities || []);
          setBranches(data.branch_directories || []);
        }
      }
    } catch {
      showMessage('Failed to load directory records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchDirectoryData();
  }, [fetchDirectoryData]);

  // Unique provinces and branches for Tab 1 filters & suggestions
  const provinceOptions = useMemo(() => {
    const set = new Set<string>();
    municipalities.forEach((m) => {
      if (m.province) set.add(m.province);
    });
    return Array.from(set).sort();
  }, [municipalities]);

  const branchNameOptions = useMemo(() => {
    const set = new Set<string>();
    branches.forEach((b) => {
      if (b.branch) set.add(b.branch);
    });
    municipalities.forEach((m) => {
      if (m.covered_lbp_branch) set.add(m.covered_lbp_branch);
    });
    return Array.from(set).sort();
  }, [branches, municipalities]);

  const filteredMunicipalities = useMemo(() => {
    const q = muniSearch.trim().toLowerCase();
    return municipalities.filter((item) => {
      if (provinceFilter !== 'ALL' && item.province !== provinceFilter) return false;
      if (branchFilter !== 'ALL' && item.covered_lbp_branch !== branchFilter) return false;
      if (!q) return true;
      return (
        item.province.toLowerCase().includes(q) ||
        item.municipality.toLowerCase().includes(q) ||
        item.covered_lbp_branch.toLowerCase().includes(q)
      );
    });
  }, [municipalities, muniSearch, provinceFilter, branchFilter]);

  useEffect(() => {
    setMuniPage(1);
  }, [muniSearch, provinceFilter, branchFilter, muniPerPage]);

  const muniTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredMunicipalities.length / muniPerPage)),
    [filteredMunicipalities.length, muniPerPage],
  );

  const safeMuniPage = Math.min(muniPage, muniTotalPages);
  const paginatedMunicipalities = useMemo(() => {
    const start = (safeMuniPage - 1) * muniPerPage;
    return filteredMunicipalities.slice(start, start + muniPerPage);
  }, [filteredMunicipalities, safeMuniPage, muniPerPage]);

  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.branch.toLowerCase().includes(q) ||
        (b.addressee_name || '').toLowerCase().includes(q) ||
        (b.addressee_position || '').toLowerCase().includes(q) ||
        (b.addressee_branch || '').toLowerCase().includes(q) ||
        (b.address_1 || '').toLowerCase().includes(q) ||
        (b.address_2 || '').toLowerCase().includes(q),
    );
  }, [branches, branchSearch]);

  useEffect(() => {
    setBranchPage(1);
  }, [branchSearch, branchPerPage]);

  const branchTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBranches.length / branchPerPage)),
    [filteredBranches.length, branchPerPage],
  );

  const safeBranchPage = Math.min(branchPage, branchTotalPages);
  const paginatedBranches = useMemo(() => {
    const start = (safeBranchPage - 1) * branchPerPage;
    return filteredBranches.slice(start, start + branchPerPage);
  }, [filteredBranches, safeBranchPage, branchPerPage]);

  // Tab 1 Handlers: Save / Create / Delete Covered Municipality
  const startEditMuni = (item: CoveredMunicipalityItem) => {
    setEditingMuniId(item.id);
    setEditMuniForm({
      province: item.province,
      municipality: item.municipality,
      covered_lbp_branch: item.covered_lbp_branch,
    });
  };

  const saveEditMuni = async (id: number) => {
    if (!editMuniForm.province.trim() || !editMuniForm.municipality.trim() || !editMuniForm.covered_lbp_branch.trim()) {
      showMessage('Province, Municipality, and Covered LBP Branch are required.', 'error');
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch('/libraries/directory/municipalities/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          id,
          ...editMuniForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMunicipalities((prev) => prev.map((m) => (m.id === id ? data.record : m)));
        setEditingMuniId(null);
        showMessage(data.message || 'Covered Municipality updated.');
      } else {
        showMessage(data.message || 'Failed to update record.', 'error');
      }
    } catch {
      showMessage('Network error while saving Covered Municipality.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const saveNewMuni = async () => {
    if (!newMuniForm.province.trim() || !newMuniForm.municipality.trim() || !newMuniForm.covered_lbp_branch.trim()) {
      showMessage('Please fill in Province, Municipality, and Covered LBP Branch.', 'error');
      return;
    }

    setSavingId('new');
    try {
      const res = await fetch('/libraries/directory/municipalities/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(newMuniForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMunicipalities((prev) =>
          [...prev, data.record].sort(
            (a, b) => a.province.localeCompare(b.province) || a.municipality.localeCompare(b.municipality),
          ),
        );
        setAddingMuni(false);
        setNewMuniForm({
          province: newMuniForm.province,
          municipality: '',
          covered_lbp_branch: newMuniForm.covered_lbp_branch,
        });
        showMessage(data.message || 'New Covered Municipality added.');
      } else {
        showMessage(data.message || 'Failed to add record.', 'error');
      }
    } catch {
      showMessage('Network error while adding Covered Municipality.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Tab 2 Handlers: Save / Create LBP Branch Directory
  const startEditBranch = (item: BranchDirectoryItem) => {
    setEditingBranchId(item.id);
    setEditBranchForm({
      branch: item.branch || '',
      addressee_name: item.addressee_name || '',
      addressee_position: item.addressee_position || '',
      addressee_branch: item.addressee_branch || '',
      address_1: item.address_1 || '',
      address_2: item.address_2 || '',
    });
  };

  const saveEditBranch = async (id: number) => {
    if (!editBranchForm.branch.trim()) {
      showMessage('Branch name is required.', 'error');
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch('/libraries/directory/branches/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          id,
          ...editBranchForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBranches((prev) => prev.map((b) => (b.id === id ? data.record : b)));
        setEditingBranchId(null);
        showMessage(data.message || 'LBP Branch Directory updated.');
      } else {
        showMessage(data.message || 'Failed to update branch directory.', 'error');
      }
    } catch {
      showMessage('Network error while saving LBP Branch Directory.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const saveNewBranch = async () => {
    if (!newBranchForm.branch.trim()) {
      showMessage('Branch name is required.', 'error');
      return;
    }

    setSavingId('new');
    try {
      const res = await fetch('/libraries/directory/branches/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(newBranchForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBranches((prev) => [...prev, data.record]);
        setAddingBranch(false);
        setNewBranchForm({
          branch: '',
          addressee_name: '',
          addressee_position: 'Branch Head',
          addressee_branch: 'Land Bank of the Philippines - ',
          address_1: '',
          address_2: '',
        });
        showMessage(data.message || 'New LBP Branch added to directory.');
      } else {
        showMessage(data.message || 'Failed to add branch.', 'error');
      }
    } catch {
      showMessage('Network error while adding LBP Branch.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-300">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
                Libraries — Directory
              </h1>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary dark:text-cyan-300">
                Editable Master Reference
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage LBP Branch Covered Municipalities and Official LBP Branch Directory addressees & addresses. Click any row&apos;s Edit button (or double-click a row) to modify fields directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {feedback && (
            <div
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
            disabled={loading}
            onClick={fetchDirectoryData}
            type="button"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex rounded-xl border border-border bg-secondary/40 p-1">
          <button
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'covered-municipality'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('covered-municipality')}
            type="button"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>LBP Branch Covered Municipality</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                activeTab === 'covered-municipality'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {municipalities.length}
            </span>
          </button>

          <button
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'branch-directory'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('branch-directory')}
            type="button"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>LBP Branch Directory</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                activeTab === 'branch-directory'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {branches.length}
            </span>
          </button>
        </div>

        {activeTab === 'covered-municipality' ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
            onClick={() => setAddingMuni(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Covered Municipality
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
            onClick={() => setAddingBranch(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add LBP Branch
          </button>
        )}
      </div>

      {/* TAB 1: LBP Branch Covered Municipality */}
      {activeTab === 'covered-municipality' && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border/70 bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                onChange={(e) => setMuniSearch(e.target.value)}
                placeholder="Search Province, Municipality, or Covered LBP Branch..."
                type="text"
                value={muniSearch}
              />
              {muniSearch && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setMuniSearch('')}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                onChange={(e) => setProvinceFilter(e.target.value)}
                value={provinceFilter}
              >
                <option value="ALL">All Provinces ({provinceOptions.length})</option>
                {provinceOptions.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                onChange={(e) => setBranchFilter(e.target.value)}
                value={branchFilter}
              >
                <option value="ALL">All Covered LBP Branches ({branchNameOptions.length})</option>
                {branchNameOptions.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>

              <span className="text-xs font-semibold text-muted-foreground">
                Showing {filteredMunicipalities.length} of {municipalities.length}
              </span>

              <TableDisplayFieldsButton
                columns={COVERED_MUNI_COLUMNS}
                onNotice={onSetNotice}
                onResetDefaults={resetDefaultMuniCols}
                onShowAll={showAllMuniCols}
                onToggleColumn={toggleMuniCol}
                visibleKeys={muniVisibleKeys}
              />
            </div>
          </div>

          <datalist id="covered-branch-options">
            {branchNameOptions.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-foreground">
                  {isMuniColVisible('#') && (
                    <th className="w-12 border-r border-border/60 px-3 py-3 text-center">#</th>
                  )}
                  {isMuniColVisible('Province') && (
                    <th className="border-r border-border/60 px-4 py-3">Province</th>
                  )}
                  {isMuniColVisible('Municipality') && (
                    <th className="border-r border-border/60 px-4 py-3">Municipality</th>
                  )}
                  {isMuniColVisible('Covered LBP Branch') && (
                    <th className="border-r border-border/60 px-4 py-3">Covered LBP Branch</th>
                  )}
                  {isMuniColVisible('Actions') && (
                    <th className="w-32 px-4 py-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {addingMuni && (
                  <tr className="bg-primary/5">
                    {isMuniColVisible('#') && (
                      <td className="border-r border-border/60 px-3 py-2.5 text-center font-bold text-primary">
                        NEW
                      </td>
                    )}
                    {isMuniColVisible('Province') && (
                      <td className="border-r border-border/60 px-3 py-2">
                        <input
                          className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium uppercase text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewMuniForm((f) => ({ ...f, province: e.target.value.toUpperCase() }))}
                          placeholder="e.g. AGUSAN DEL NORTE"
                          type="text"
                          value={newMuniForm.province}
                        />
                      </td>
                    )}
                    {isMuniColVisible('Municipality') && (
                      <td className="border-r border-border/60 px-3 py-2">
                        <input
                          autoFocus
                          className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium uppercase text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewMuniForm((f) => ({ ...f, municipality: e.target.value.toUpperCase() }))}
                          placeholder="e.g. BUENAVISTA"
                          type="text"
                          value={newMuniForm.municipality}
                        />
                      </td>
                    )}
                    {isMuniColVisible('Covered LBP Branch') && (
                      <td className="border-r border-border/60 px-3 py-2">
                        <input
                          className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                          list="covered-branch-options"
                          onChange={(e) => setNewMuniForm((f) => ({ ...f, covered_lbp_branch: e.target.value }))}
                          placeholder="e.g. Butuan"
                          type="text"
                          value={newMuniForm.covered_lbp_branch}
                        />
                      </td>
                    )}
                    {isMuniColVisible('Actions') && (
                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                            disabled={savingId === 'new'}
                            onClick={saveNewMuni}
                            type="button"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            className="inline-flex items-center rounded-lg border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => setAddingMuni(false)}
                            title="Cancel"
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )}

                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={Math.max(1, muniVisibleKeys.length)}>
                      Loading LBP Branch Covered Municipalities...
                    </td>
                  </tr>
                ) : filteredMunicipalities.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={Math.max(1, muniVisibleKeys.length)}>
                      No matching municipalities found.
                    </td>
                  </tr>
                ) : (
                  paginatedMunicipalities.map((item, idx) => {
                    const isEditing = editingMuniId === item.id;
                    const rowNum = (safeMuniPage - 1) * muniPerPage + idx + 1;
                    return (
                      <tr
                        key={item.id}
                        className={`transition hover:bg-secondary/40 ${isEditing ? 'bg-primary/5' : ''}`}
                        onDoubleClick={() => {
                          if (!isEditing) startEditMuni(item);
                        }}
                      >
                        {isMuniColVisible('#') && (
                          <td className="border-r border-border/60 px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                            {rowNum}
                          </td>
                        )}
                        {isMuniColVisible('Province') && (
                          <td className="border-r border-border/60 px-4 py-2 font-medium text-foreground">
                            {isEditing ? (
                              <input
                                className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs font-medium uppercase text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) =>
                                  setEditMuniForm((f) => ({ ...f, province: e.target.value.toUpperCase() }))
                                }
                                type="text"
                                value={editMuniForm.province}
                              />
                            ) : (
                              item.province
                            )}
                          </td>
                        )}
                        {isMuniColVisible('Municipality') && (
                          <td className="border-r border-border/60 px-4 py-2 font-semibold text-foreground">
                            {isEditing ? (
                              <input
                                autoFocus
                                className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs font-semibold uppercase text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) =>
                                  setEditMuniForm((f) => ({ ...f, municipality: e.target.value.toUpperCase() }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditMuni(item.id);
                                  if (e.key === 'Escape') setEditingMuniId(null);
                                }}
                                type="text"
                                value={editMuniForm.municipality}
                              />
                            ) : (
                              item.municipality
                            )}
                          </td>
                        )}
                        {isMuniColVisible('Covered LBP Branch') && (
                          <td className="border-r border-border/60 px-4 py-2">
                            {isEditing ? (
                              <input
                                className="w-full rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                                list="covered-branch-options"
                                onChange={(e) =>
                                  setEditMuniForm((f) => ({ ...f, covered_lbp_branch: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditMuni(item.id);
                                  if (e.key === 'Escape') setEditingMuniId(null);
                                }}
                                type="text"
                                value={editMuniForm.covered_lbp_branch}
                              />
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary dark:text-cyan-300">
                                {item.covered_lbp_branch}
                              </span>
                            )}
                          </td>
                        )}
                        {isMuniColVisible('Actions') && (
                          <td className="px-3 py-2 text-center">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                                  disabled={savingId === item.id}
                                  onClick={() => saveEditMuni(item.id)}
                                  type="button"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Save
                                </button>
                                <button
                                  className="inline-flex items-center rounded-lg border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => setEditingMuniId(null)}
                                  title="Cancel"
                                  type="button"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/50 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                onClick={() => startEditMuni(item)}
                                title="Edit row"
                                type="button"
                              >
                                <Edit3 className="h-3 w-3" />
                                Edit
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer for Tab 1 */}
          <div className="flex flex-col gap-3 border-t border-border/70 bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing{' '}
                <strong className="font-semibold text-foreground">
                  {filteredMunicipalities.length === 0 ? 0 : (safeMuniPage - 1) * muniPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="font-semibold text-foreground">
                  {Math.min(safeMuniPage * muniPerPage, filteredMunicipalities.length)}
                </strong>{' '}
                of <strong className="font-semibold text-foreground">{filteredMunicipalities.length}</strong> entries
              </span>

              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  onChange={(e) => setMuniPerPage(Number(e.target.value))}
                  value={muniPerPage}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeMuniPage <= 1}
                onClick={() => setMuniPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>

              {Array.from({ length: muniTotalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`min-w-[30px] rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
                    pageNum === safeMuniPage
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                  onClick={() => setMuniPage(pageNum)}
                  type="button"
                >
                  {pageNum}
                </button>
              ))}

              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeMuniPage >= muniTotalPages}
                onClick={() => setMuniPage((p) => Math.min(muniTotalPages, p + 1))}
                type="button"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LBP Branch Directory */}
      {activeTab === 'branch-directory' && (
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          {/* Search Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border/70 bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branch, addressee_name, addressee_branch, address..."
                type="text"
                value={branchSearch}
              />
              {branchSearch && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setBranchSearch('')}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Showing {filteredBranches.length} of {branches.length} LBP Branches
              </span>

              <TableDisplayFieldsButton
                columns={BRANCH_DIRECTORY_COLUMNS}
                onNotice={onSetNotice}
                onResetDefaults={resetDefaultBranchCols}
                onShowAll={showAllBranchCols}
                onToggleColumn={toggleBranchCol}
                visibleKeys={branchVisibleKeys}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-[11px] font-bold tracking-wider text-foreground">
                  {isBranchColVisible('#') && (
                    <th className="w-10 border-r border-border/60 px-3 py-3 text-center">#</th>
                  )}
                  {isBranchColVisible('branch') && (
                    <th className="border-r border-border/60 px-3.5 py-3">branch</th>
                  )}
                  {isBranchColVisible('addressee_name') && (
                    <th className="border-r border-border/60 px-3.5 py-3">addressee_name</th>
                  )}
                  {isBranchColVisible('addressee_position') && (
                    <th className="border-r border-border/60 px-3.5 py-3">addressee_position</th>
                  )}
                  {isBranchColVisible('addressee_branch') && (
                    <th className="border-r border-border/60 px-3.5 py-3">addressee_branch</th>
                  )}
                  {isBranchColVisible('address_1') && (
                    <th className="border-r border-border/60 px-3.5 py-3">address_1</th>
                  )}
                  {isBranchColVisible('address_2') && (
                    <th className="border-r border-border/60 px-3.5 py-3">address_2</th>
                  )}
                  {isBranchColVisible('Actions') && (
                    <th className="w-32 px-3.5 py-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {addingBranch && (
                  <tr className="bg-primary/5 align-top">
                    {isBranchColVisible('#') && (
                      <td className="border-r border-border/60 px-3 py-2.5 text-center font-bold text-primary">
                        NEW
                      </td>
                    )}
                    {isBranchColVisible('branch') && (
                      <td className="border-r border-border/60 p-2">
                        <input
                          autoFocus
                          className="w-full min-w-[120px] rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewBranchForm((f) => ({ ...f, branch: e.target.value }))}
                          placeholder="e.g. Butuan"
                          type="text"
                          value={newBranchForm.branch}
                        />
                      </td>
                    )}
                    {isBranchColVisible('addressee_name') && (
                      <td className="border-r border-border/60 p-2">
                        <input
                          className="w-full min-w-[180px] rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewBranchForm((f) => ({ ...f, addressee_name: e.target.value }))}
                          placeholder="e.g. MS. EMELITA I. ESCALANTE"
                          type="text"
                          value={newBranchForm.addressee_name}
                        />
                      </td>
                    )}
                    {isBranchColVisible('addressee_position') && (
                      <td className="border-r border-border/60 p-2">
                        <input
                          className="w-full min-w-[110px] rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewBranchForm((f) => ({ ...f, addressee_position: e.target.value }))}
                          placeholder="Branch Head"
                          type="text"
                          value={newBranchForm.addressee_position}
                        />
                      </td>
                    )}
                    {isBranchColVisible('addressee_branch') && (
                      <td className="border-r border-border/60 p-2">
                        <input
                          className="w-full min-w-[260px] rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewBranchForm((f) => ({ ...f, addressee_branch: e.target.value }))}
                          placeholder="Land Bank of the Philippines - ..."
                          type="text"
                          value={newBranchForm.addressee_branch}
                        />
                      </td>
                    )}
                    {isBranchColVisible('address_1') && (
                      <td className="border-r border-border/60 p-2">
                        <input
                          className="w-full min-w-[260px] rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewBranchForm((f) => ({ ...f, address_1: e.target.value }))}
                          placeholder="Street / Building Address..."
                          type="text"
                          value={newBranchForm.address_1}
                        />
                      </td>
                    )}
                    {isBranchColVisible('address_2') && (
                      <td className="border-r border-border/60 p-2">
                        <input
                          className="w-full min-w-[150px] rounded-lg border border-primary/50 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                          onChange={(e) => setNewBranchForm((f) => ({ ...f, address_2: e.target.value }))}
                          placeholder="City / Province"
                          type="text"
                          value={newBranchForm.address_2}
                        />
                      </td>
                    )}
                    {isBranchColVisible('Actions') && (
                      <td className="p-2 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                            disabled={savingId === 'new'}
                            onClick={saveNewBranch}
                            type="button"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            className="inline-flex items-center rounded-lg border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => setAddingBranch(false)}
                            title="Cancel"
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )}

                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={Math.max(1, branchVisibleKeys.length)}>
                      Loading LBP Branch Directory...
                    </td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={Math.max(1, branchVisibleKeys.length)}>
                      No matching LBP branches found.
                    </td>
                  </tr>
                ) : (
                  paginatedBranches.map((item, idx) => {
                    const isEditing = editingBranchId === item.id;
                    const rowNum = (safeBranchPage - 1) * branchPerPage + idx + 1;
                    return (
                      <tr
                        key={item.id}
                        className={`transition hover:bg-secondary/40 ${isEditing ? 'bg-primary/5' : ''}`}
                        onDoubleClick={() => {
                          if (!isEditing) startEditBranch(item);
                        }}
                      >
                        {isBranchColVisible('#') && (
                          <td className="border-r border-border/60 px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                            {rowNum}
                          </td>
                        )}
                        {isBranchColVisible('branch') && (
                          <td className="border-r border-border/60 px-3.5 py-2.5 font-bold text-foreground whitespace-nowrap">
                            {isEditing ? (
                              <input
                                autoFocus
                                className="w-full min-w-[130px] rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) => setEditBranchForm((f) => ({ ...f, branch: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditBranch(item.id);
                                  if (e.key === 'Escape') setEditingBranchId(null);
                                }}
                                type="text"
                                value={editBranchForm.branch}
                              />
                            ) : (
                              item.branch
                            )}
                          </td>
                        )}
                        {isBranchColVisible('addressee_name') && (
                          <td className="border-r border-border/60 px-3.5 py-2.5 font-semibold text-foreground whitespace-nowrap">
                            {isEditing ? (
                              <input
                                className="w-full min-w-[190px] rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) => setEditBranchForm((f) => ({ ...f, addressee_name: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditBranch(item.id);
                                  if (e.key === 'Escape') setEditingBranchId(null);
                                }}
                                type="text"
                                value={editBranchForm.addressee_name}
                              />
                            ) : (
                              item.addressee_name
                            )}
                          </td>
                        )}
                        {isBranchColVisible('addressee_position') && (
                          <td className="border-r border-border/60 px-3.5 py-2.5 text-foreground whitespace-nowrap">
                            {isEditing ? (
                              <input
                                className="w-full min-w-[110px] rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) =>
                                  setEditBranchForm((f) => ({ ...f, addressee_position: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditBranch(item.id);
                                  if (e.key === 'Escape') setEditingBranchId(null);
                                }}
                                type="text"
                                value={editBranchForm.addressee_position}
                              />
                            ) : (
                              item.addressee_position
                            )}
                          </td>
                        )}
                        {isBranchColVisible('addressee_branch') && (
                          <td className="border-r border-border/60 px-3.5 py-2.5 text-foreground">
                            {isEditing ? (
                              <input
                                className="w-full min-w-[270px] rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) => setEditBranchForm((f) => ({ ...f, addressee_branch: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditBranch(item.id);
                                  if (e.key === 'Escape') setEditingBranchId(null);
                                }}
                                type="text"
                                value={editBranchForm.addressee_branch}
                              />
                            ) : (
                              item.addressee_branch
                            )}
                          </td>
                        )}
                        {isBranchColVisible('address_1') && (
                          <td className="border-r border-border/60 px-3.5 py-2.5 text-foreground">
                            {isEditing ? (
                              <input
                                className="w-full min-w-[270px] rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) => setEditBranchForm((f) => ({ ...f, address_1: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditBranch(item.id);
                                  if (e.key === 'Escape') setEditingBranchId(null);
                                }}
                                type="text"
                                value={editBranchForm.address_1}
                              />
                            ) : (
                              item.address_1
                            )}
                          </td>
                        )}
                        {isBranchColVisible('address_2') && (
                          <td className="border-r border-border/60 px-3.5 py-2.5 text-foreground whitespace-nowrap">
                            {isEditing ? (
                              <input
                                className="w-full min-w-[160px] rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                onChange={(e) => setEditBranchForm((f) => ({ ...f, address_2: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditBranch(item.id);
                                  if (e.key === 'Escape') setEditingBranchId(null);
                                }}
                                type="text"
                                value={editBranchForm.address_2}
                              />
                            ) : (
                              item.address_2
                            )}
                          </td>
                        )}
                        {isBranchColVisible('Actions') && (
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                                  disabled={savingId === item.id}
                                  onClick={() => saveEditBranch(item.id)}
                                  type="button"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Save
                                </button>
                                <button
                                  className="inline-flex items-center rounded-lg border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => setEditingBranchId(null)}
                                  title="Cancel"
                                  type="button"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/50 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                onClick={() => startEditBranch(item)}
                                title="Edit row"
                                type="button"
                              >
                                <Edit3 className="h-3 w-3" />
                                Edit
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer for Tab 2 */}
          <div className="flex flex-col gap-3 border-t border-border/70 bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing{' '}
                <strong className="font-semibold text-foreground">
                  {filteredBranches.length === 0 ? 0 : (safeBranchPage - 1) * branchPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="font-semibold text-foreground">
                  {Math.min(safeBranchPage * branchPerPage, filteredBranches.length)}
                </strong>{' '}
                of <strong className="font-semibold text-foreground">{filteredBranches.length}</strong> entries
              </span>

              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  onChange={(e) => setBranchPerPage(Number(e.target.value))}
                  value={branchPerPage}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeBranchPage <= 1}
                onClick={() => setBranchPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>

              {Array.from({ length: branchTotalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`min-w-[30px] rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
                    pageNum === safeBranchPage
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                  onClick={() => setBranchPage(pageNum)}
                  type="button"
                >
                  {pageNum}
                </button>
              ))}

              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeBranchPage >= branchTotalPages}
                onClick={() => setBranchPage((p) => Math.min(branchTotalPages, p + 1))}
                type="button"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

