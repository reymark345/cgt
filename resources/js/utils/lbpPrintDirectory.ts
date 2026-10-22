import { useEffect, useMemo, useState } from 'react';

export type LbpBranchDirectoryEntry = {
  id?: number;
  branch: string;
  addressee_name: string;
  addressee_position: string;
  addressee_branch: string;
  address_1: string;
  address_2: string;
  salutation: string;
};

export type PrintRecordWithBranch = {
  id?: number | string;
  address?: string | null;
  resolved_municipality?: string | null;
  resolved_branch?: string | null;
  branch_directory?: LbpBranchDirectoryEntry | null;
};

export type PrintFormGroupMode = 'municipality' | 'branch' | 'single';

export type GroupedPrintForm<T extends PrintRecordWithBranch> = {
  formKey: string;
  formIndex: number;
  label: string;
  branchDirectory: LbpBranchDirectoryEntry;
  records: T[];
};

export const DEFAULT_LBP_BRANCH_DIRECTORIES: LbpBranchDirectoryEntry[] = [
  {
    id: 1,
    branch: 'Butuan',
    addressee_name: 'MS. EMELITA I. ESCALANTE',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Butuan Branch',
    address_1: 'Ong Hoc Building, Montilla Blvd. Cor. P. Burgoz St.,',
    address_2: 'Butuan City',
    salutation: 'Ms. Escalante',
  },
  {
    id: 2,
    branch: 'Butuan - E. Luna',
    addressee_name: 'MR. CARLITO L. DAING',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Butuan - E. Luna Branch',
    address_1: 'Ground Floor, Saint Joseph Parish Hall, E. Luna Street, Sikatuna,',
    address_2: 'Butuan City',
    salutation: 'Mr. Daing',
  },
  {
    id: 3,
    branch: 'Cabadbaran',
    addressee_name: 'MS. RUBY M. CULTURA',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Cabadbaran Branch',
    address_1: 'Chang Building Atega Cor. Asis Streets,',
    address_2: 'Cabadbaran City',
    salutation: 'Ms. Cultura',
  },
  {
    id: 4,
    branch: 'Bayugan',
    addressee_name: 'MS. MARY JOY A. TORCENDE',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Bayugan Branch',
    address_1: 'Dy Building, National Highway, Brgy. Taglatawan,',
    address_2: 'Bayugan City',
    salutation: 'Ms. Torcende',
  },
  {
    id: 5,
    branch: 'San Francisco',
    addressee_name: 'MS. JULIET T. ARIÑO',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - San Francisco Branch',
    address_1: 'San Francisco Public Market Mall, Center Island Street,',
    address_2: 'San Francisco, Agusan Del Sur',
    salutation: 'Ms. Ariño',
  },
  {
    id: 6,
    branch: 'Bunawan',
    addressee_name: 'MR. ADRIAN LLOYD O. TAN',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Bunawan Branch',
    address_1: 'Municipal Compound, Purok 4, Brgy. San Teodoro,',
    address_2: 'Bunawan, Agusan Del Sur',
    salutation: 'Mr. Tan',
  },
  {
    id: 7,
    branch: 'Dinagat Islands',
    addressee_name: 'MS. MARIA CELESTE F. ADVINCULA',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Dinagat Branch',
    address_1: 'R.R. Buray Ave. Cor H.Tovar St. Poblacion,',
    address_2: 'San Jose, Dinagat Islands',
    salutation: 'Ms. Advincula',
  },
  {
    id: 8,
    branch: 'Surigao',
    addressee_name: 'MS. ABIGAIL A. MALUBAG',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Surigao Branch',
    address_1: 'Surigao City Hall Compound, Borromeo Street,',
    address_2: 'Surigao City',
    salutation: 'Ms. Malubag',
  },
  {
    id: 9,
    branch: 'Surigao - Luna',
    addressee_name: 'MR. CHARLITO D. ARQUION',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Surigao - Luna Branch',
    address_1: 'Parkway Building, Brgy. Luna,',
    address_2: 'Surigao City',
    salutation: 'Mr. Arquion',
  },
  {
    id: 10,
    branch: 'Claver',
    addressee_name: 'MR. RENEBOY L. BONITA',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Claver Branch',
    address_1: 'National Highway, Barangay Ladgaron,',
    address_2: 'Claver, Surigao Del Norte',
    salutation: 'Mr. Bonita',
  },
  {
    id: 11,
    branch: 'Bislig',
    addressee_name: 'MS. CONCEPCION ROXAN U. DIADULA',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Bislig Branch',
    address_1: 'Landbank Building F. Clar Street, Mangagoy,',
    address_2: 'Bislig City',
    salutation: 'Ms. Diadula',
  },
  {
    id: 12,
    branch: 'Tandag',
    addressee_name: 'MS. ELVIRA C. TAN',
    addressee_position: 'Branch Head',
    addressee_branch: 'Land Bank of the Philippines - Tandag Branch',
    address_1: 'Bautista Building, Donasco Street,',
    address_2: 'Tandag City',
    salutation: 'Ms. Tan',
  },
];

const FALLBACK_MUNICIPALITY_TO_BRANCH: Array<{
  province: string;
  municipality: string;
  branch: string;
}> = [
  { province: 'AGUSAN DEL NORTE', municipality: 'BUENAVISTA', branch: 'Butuan' },
  { province: 'AGUSAN DEL NORTE', municipality: 'CITY OF BUTUAN', branch: 'Butuan' },
  { province: 'AGUSAN DEL NORTE', municipality: 'BUTUAN CITY', branch: 'Butuan' },
  { province: 'AGUSAN DEL NORTE', municipality: 'CARMEN', branch: 'Butuan - E. Luna' },
  { province: 'AGUSAN DEL NORTE', municipality: 'LAS NIEVES', branch: 'Butuan - E. Luna' },
  { province: 'AGUSAN DEL NORTE', municipality: 'NASIPIT', branch: 'Butuan - E. Luna' },
  { province: 'AGUSAN DEL NORTE', municipality: 'CITY OF CABADBARAN', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'CABADBARAN CITY', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'JABONGA', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'KITCHARAO', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'MAGALLANES', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'REMEDIOS T. ROMUALDEZ', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'R.T. ROMUALDEZ', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'SANTIAGO', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL NORTE', municipality: 'TUBAY', branch: 'Cabadbaran' },
  { province: 'AGUSAN DEL SUR', municipality: 'CITY OF BAYUGAN', branch: 'Bayugan' },
  { province: 'AGUSAN DEL SUR', municipality: 'BAYUGAN CITY', branch: 'Bayugan' },
  { province: 'AGUSAN DEL SUR', municipality: 'BAYUGAN', branch: 'Bayugan' },
  { province: 'AGUSAN DEL SUR', municipality: 'ESPERANZA', branch: 'Bayugan' },
  { province: 'AGUSAN DEL SUR', municipality: 'SIBAGAT', branch: 'Bayugan' },
  { province: 'AGUSAN DEL SUR', municipality: 'LA PAZ', branch: 'San Francisco' },
  { province: 'AGUSAN DEL SUR', municipality: 'LORETO', branch: 'San Francisco' },
  { province: 'AGUSAN DEL SUR', municipality: 'PROSPERIDAD', branch: 'San Francisco' },
  { province: 'AGUSAN DEL SUR', municipality: 'ROSARIO', branch: 'San Francisco' },
  { province: 'AGUSAN DEL SUR', municipality: 'SAN FRANCISCO', branch: 'San Francisco' },
  { province: 'AGUSAN DEL SUR', municipality: 'SAN LUIS', branch: 'San Francisco' },
  { province: 'AGUSAN DEL SUR', municipality: 'TALACOGON', branch: 'San Francisco' },
  { province: 'AGUSAN DEL SUR', municipality: 'BUNAWAN', branch: 'Bunawan' },
  { province: 'AGUSAN DEL SUR', municipality: 'SANTA JOSEFA', branch: 'Bunawan' },
  { province: 'AGUSAN DEL SUR', municipality: 'STA. JOSEFA', branch: 'Bunawan' },
  { province: 'AGUSAN DEL SUR', municipality: 'TRENTO', branch: 'Bunawan' },
  { province: 'AGUSAN DEL SUR', municipality: 'VERUELA', branch: 'Bunawan' },
  { province: 'DINAGAT ISLANDS', municipality: 'BASILISA', branch: 'Dinagat Islands' },
  { province: 'DINAGAT ISLANDS', municipality: 'CAGDIANAO', branch: 'Dinagat Islands' },
  { province: 'DINAGAT ISLANDS', municipality: 'DINAGAT', branch: 'Dinagat Islands' },
  { province: 'DINAGAT ISLANDS', municipality: 'LIBJO', branch: 'Dinagat Islands' },
  { province: 'DINAGAT ISLANDS', municipality: 'LORETO', branch: 'Dinagat Islands' },
  { province: 'DINAGAT ISLANDS', municipality: 'SAN JOSE', branch: 'Dinagat Islands' },
  { province: 'DINAGAT ISLANDS', municipality: 'TUBAJON', branch: 'Dinagat Islands' },
  { province: 'SURIGAO DEL NORTE', municipality: 'ALEGRIA', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'BURGOS', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'DAPA', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'DEL CARMEN', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'GENERAL LUNA', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'MAINIT', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'MALIMONO', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'PILAR', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'SAN BENITO', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'SAN FRANCISCO', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'SAN ISIDRO', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'SANTA MONICA', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'SISON', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'SOCORRO', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'TAGANA-AN', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'TUBOD', branch: 'Surigao' },
  { province: 'SURIGAO DEL NORTE', municipality: 'CITY OF SURIGAO', branch: 'Surigao - Luna' },
  { province: 'SURIGAO DEL NORTE', municipality: 'SURIGAO CITY', branch: 'Surigao - Luna' },
  { province: 'SURIGAO DEL NORTE', municipality: 'BACUAG', branch: 'Claver' },
  { province: 'SURIGAO DEL NORTE', municipality: 'CLAVER', branch: 'Claver' },
  { province: 'SURIGAO DEL NORTE', municipality: 'GIGAQUIT', branch: 'Claver' },
  { province: 'SURIGAO DEL NORTE', municipality: 'PLACER', branch: 'Claver' },
  { province: 'SURIGAO DEL SUR', municipality: 'BAROBO', branch: 'Bislig' },
  { province: 'SURIGAO DEL SUR', municipality: 'CITY OF BISLIG', branch: 'Bislig' },
  { province: 'SURIGAO DEL SUR', municipality: 'BISLIG CITY', branch: 'Bislig' },
  { province: 'SURIGAO DEL SUR', municipality: 'HINATUAN', branch: 'Bislig' },
  { province: 'SURIGAO DEL SUR', municipality: 'LINGIG', branch: 'Bislig' },
  { province: 'SURIGAO DEL SUR', municipality: 'TAGBINA', branch: 'Bislig' },
  { province: 'SURIGAO DEL SUR', municipality: 'BAYABAS', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'CAGWAIT', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'CANTILAN', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'CARMEN', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'CARRASCAL', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'CORTES', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'LANUZA', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'LIANGA', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'MADRID', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'MARIHATAG', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'SAN AGUSTIN', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'SAN MIGUEL', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'TAGO', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'CITY OF TANDAG', branch: 'Tandag' },
  { province: 'SURIGAO DEL SUR', municipality: 'TANDAG CITY', branch: 'Tandag' },
];

export function deriveSalutationFromName(addresseeName?: string | null): string {
  const raw = (addresseeName || '').trim();
  if (!raw) return 'Ms. Escalante';

  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'Ms. Escalante';

  const prefixMap: Record<string, string> = {
    MS: 'Ms.',
    'MS.': 'Ms.',
    MR: 'Mr.',
    'MR.': 'Mr.',
    MRS: 'Mrs.',
    'MRS.': 'Mrs.',
    DR: 'Dr.',
    'DR.': 'Dr.',
    ATTY: 'Atty.',
    'ATTY.': 'Atty.',
    ENGR: 'Engr.',
    'ENGR.': 'Engr.',
    HON: 'Hon.',
    'HON.': 'Hon.',
  };

  const firstUpper = tokens[0].toUpperCase();
  const prefix = prefixMap[firstUpper] || '';

  const suffixes = new Set(['JR', 'JR.', 'SR', 'SR.', 'II', 'III', 'IV', 'V']);
  let lastIdx = tokens.length - 1;
  while (lastIdx > 0 && suffixes.has(tokens[lastIdx].replace(/[.,]/g, '').toUpperCase())) {
    lastIdx--;
  }

  const surnameRaw = tokens[lastIdx].replace(/^[.,]+|[.,]+$/g, '');
  const surname = surnameRaw
    .toLowerCase()
    .replace(/(^|[\s-])(\S)/g, (_m, sep, ch) => `${sep}${ch.toUpperCase()}`);

  return `${prefix ? `${prefix} ` : ''}${surname}`.trim();
}

export function resolveRecordBranchDirectory<T extends PrintRecordWithBranch>(
  record: T,
  branchDirectories: LbpBranchDirectoryEntry[] = DEFAULT_LBP_BRANCH_DIRECTORIES
): {
  municipalityKey: string;
  branchKey: string;
  branchDirectory: LbpBranchDirectoryEntry;
} {
  const directories =
    branchDirectories && branchDirectories.length > 0
      ? branchDirectories
      : DEFAULT_LBP_BRANCH_DIRECTORIES;

  if (record.branch_directory && record.branch_directory.addressee_name) {
    const bd = record.branch_directory;
    return {
      municipalityKey: (record.resolved_municipality || record.address || bd.branch || 'DEFAULT')
        .trim()
        .toUpperCase(),
      branchKey: (record.resolved_branch || bd.branch || 'Butuan').trim(),
      branchDirectory: {
        ...bd,
        salutation: bd.salutation || deriveSalutationFromName(bd.addressee_name),
      },
    };
  }

  const addressUpper = (record.address || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  const segments = addressUpper
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let matchedMuni = '';
  let matchedProv = '';
  let matchedBranchName = 'Butuan';

  for (const item of FALLBACK_MUNICIPALITY_TO_BRANCH) {
    if (segments.includes(item.municipality)) {
      if (!matchedMuni || addressUpper.includes(item.province)) {
        matchedMuni = item.municipality;
        matchedProv = item.province;
        matchedBranchName = item.branch;
        if (addressUpper.includes(item.province)) {
          break;
        }
      }
    }
  }

  if (!matchedMuni && addressUpper) {
    for (const item of FALLBACK_MUNICIPALITY_TO_BRANCH) {
      if (addressUpper.includes(item.municipality)) {
        matchedMuni = item.municipality;
        matchedProv = item.province;
        matchedBranchName = item.branch;
        if (addressUpper.includes(item.province)) {
          break;
        }
      }
    }
  }

  const foundDir =
    directories.find((d) => d.branch.toUpperCase() === matchedBranchName.toUpperCase()) ||
    directories[0] ||
    DEFAULT_LBP_BRANCH_DIRECTORIES[0];

  const municipalityKey = matchedMuni
    ? `${matchedMuni}${matchedProv ? `, ${matchedProv}` : ''}`
    : segments.length >= 2
      ? segments.slice(-2).join(', ')
      : addressUpper || 'DEFAULT';

  return {
    municipalityKey,
    branchKey: foundDir.branch,
    branchDirectory: {
      ...foundDir,
      salutation: foundDir.salutation || deriveSalutationFromName(foundDir.addressee_name),
    },
  };
}

/**
 * Group selected records into endorsement forms based on the active grouping mode:
 * - 'municipality': Each distinct beneficiary municipality/address gets its own form with its LBP Branch Directory header.
 * - 'branch': Each distinct LBP Branch gets its own form combining all selected beneficiaries under that branch.
 * - 'single': All selected beneficiaries are placed on a single form using the first record's LBP Branch Directory header.
 */
export function groupRecordsIntoPrintForms<T extends PrintRecordWithBranch>(
  records: T[],
  branchDirectories: LbpBranchDirectoryEntry[] = DEFAULT_LBP_BRANCH_DIRECTORIES,
  mode: PrintFormGroupMode = 'branch'
): GroupedPrintForm<T>[] {
  const directories =
    branchDirectories && branchDirectories.length > 0
      ? branchDirectories
      : DEFAULT_LBP_BRANCH_DIRECTORIES;

  if (!records || records.length === 0) {
    const defaultDir = directories[0] || DEFAULT_LBP_BRANCH_DIRECTORIES[0];
    return [
      {
        formKey: 'DEFAULT',
        formIndex: 0,
        label: defaultDir.branch,
        branchDirectory: defaultDir,
        records: [],
      },
    ];
  }

  if (mode === 'single') {
    const firstResolved = resolveRecordBranchDirectory(records[0], directories);
    return [
      {
        formKey: 'SINGLE_FORM',
        formIndex: 0,
        label: `${firstResolved.branchDirectory.branch} Branch`,
        branchDirectory: firstResolved.branchDirectory,
        records,
      },
    ];
  }

  const map = new Map<
    string,
    {
      label: string;
      branchDirectory: LbpBranchDirectoryEntry;
      records: T[];
    }
  >();

  for (const rec of records) {
    const resolved = resolveRecordBranchDirectory(rec, directories);
    const key =
      mode === 'branch'
        ? resolved.branchKey.toUpperCase()
        : `${resolved.municipalityKey.toUpperCase()}__${resolved.branchKey.toUpperCase()}`;

    const label =
      mode === 'branch'
        ? `${resolved.branchDirectory.branch} Branch`
        : `${resolved.municipalityKey} (${resolved.branchDirectory.branch} Branch)`;

    const existing = map.get(key);
    if (existing) {
      existing.records.push(rec);
    } else {
      map.set(key, {
        label,
        branchDirectory: resolved.branchDirectory,
        records: [rec],
      });
    }
  }

  return Array.from(map.entries()).map(([formKey, group], idx) => ({
    formKey,
    formIndex: idx,
    label: group.label,
    branchDirectory: group.branchDirectory,
    records: group.records,
  }));
}

export type LbpBranchDirectoryItem = LbpBranchDirectoryEntry;

export type FormHeaderDetails = {
  recipientName: string;
  recipientTitle: string;
  bankBranch: string;
  bankAddressLine1: string;
  bankAddressLine2: string;
  salutationName: string;
};

export type PaginatedFormPage<T> = {
  pageIndex: number;
  formKey: string;
  formIndex: number;
  totalForms: number;
  formLabel: string;
  formPageNum: number;
  formTotalPages: number;
  rows: T[];
  globalStartIdx: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  headerDetails: FormHeaderDetails;
  header: FormHeaderDetails;
};

/**
 * Strictly disables Inspect Element, right-click context menu, F12, and DevTools shortcuts
 * across all Request Print Preview pages. Also shields the document if DevTools is opened.
 */
export function useStrictPrintPreviewProtection() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toUpperCase();
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(target.isContentEditable)
      );
    };

    const blockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }
      return false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      return blockEvent(e);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        return blockEvent(e);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toUpperCase();
      const keyCode = e.keyCode || e.which;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const shiftOrAlt = e.shiftKey || e.altKey;

      // F12
      if (key === 'F12' || keyCode === 123) {
        return blockEvent(e);
      }

      // ContextMenu key or Shift+F10
      if (key === 'CONTEXTMENU' || keyCode === 93 || (e.shiftKey && (key === 'F10' || keyCode === 121))) {
        return blockEvent(e);
      }

      // Ctrl/Cmd + Shift/Alt + I / J / C / K / E / M (DevTools / Inspect / Console / Network)
      if (
        ctrlOrMeta &&
        shiftOrAlt &&
        ['I', 'J', 'C', 'K', 'E', 'M'].includes(key)
      ) {
        return blockEvent(e);
      }

      if (
        ctrlOrMeta &&
        shiftOrAlt &&
        [73, 74, 67, 75, 69, 77].includes(keyCode)
      ) {
        return blockEvent(e);
      }

      // Ctrl/Cmd + U (View Source) or Ctrl/Cmd + S (Save HTML)
      if (ctrlOrMeta && (key === 'U' || key === 'S' || keyCode === 85 || keyCode === 83)) {
        return blockEvent(e);
      }
    };

    const handleSelectStart = (e: Event) => {
      if (!isEditableTarget(e.target)) {
        return blockEvent(e);
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (!isEditableTarget(e.target)) {
        return blockEvent(e);
      }
    };

    const handleCopyCut = (e: ClipboardEvent) => {
      if (!isEditableTarget(e.target)) {
        return blockEvent(e);
      }
    };

    // Inject strict print-preview protection styles (disables text selection outside inputs)
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-print-security', 'strict');
    styleEl.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, select {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      header.no-print > div:first-child,
      header.non-printable > div:first-child {
        max-width: 100% !important;
        width: 100% !important;
        flex-wrap: nowrap !important;
        white-space: nowrap !important;
        gap: 0.5rem !important;
      }
      header.no-print > div:first-child > div,
      header.non-printable > div:first-child > div {
        flex-shrink: 0 !important;
        white-space: nowrap !important;
      }
      body.cgt-devtools-blocked > *:not(#cgt-print-security-shield) {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(styleEl);

    const prevOnContextMenu = document.oncontextmenu;
    const prevOnKeyDown = document.onkeydown;
    document.oncontextmenu = () => false;

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('selectstart', handleSelectStart, { capture: true });
    document.addEventListener('dragstart', handleDragStart, { capture: true });
    document.addEventListener('copy', handleCopyCut, { capture: true });
    document.addEventListener('cut', handleCopyCut, { capture: true });

    // Create security shield overlay if DevTools is forced open via browser menu
    const shieldEl = document.createElement('div');
    shieldEl.id = 'cgt-print-security-shield';
    shieldEl.style.cssText =
      'display:none;position:fixed;inset:0;z-index:2147483647;background:#0f172a;color:#f8fafc;align-items:center;justify-content:center;flex-direction:column;padding:24px;text-align:center;font-family:system-ui,-apple-system,sans-serif;';
    shieldEl.innerHTML = `
      <div style="max-width:460px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="font-size:16px;font-weight:700;color:#f87171;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">
          Protected Print Preview
        </div>
        <div style="font-size:13px;line-height:1.6;color:#cbd5e1;">
          Inspect Element and Developer Tools are strictly restricted on official endorsement print previews. Please close Developer Tools to continue viewing or printing this document.
        </div>
      </div>
    `;
    document.body.appendChild(shieldEl);

    const setShieldActive = (active: boolean) => {
      if (active) {
        document.body.classList.add('cgt-devtools-blocked');
        shieldEl.style.display = 'flex';
      } else {
        document.body.classList.remove('cgt-devtools-blocked');
        shieldEl.style.display = 'none';
      }
    };

    const checkDevTools = () => {
      const start = performance.now();
      try {
        // Only pauses when DevTools is open
        new Function('debugger')();
      } catch {
        // ignore
      }
      const elapsed = performance.now() - start;
      if (elapsed > 120) {
        setShieldActive(true);
      } else {
        setShieldActive(false);
      }
    };

    const intervalId = window.setInterval(checkDevTools, 1000);

    return () => {
      window.clearInterval(intervalId);
      document.oncontextmenu = prevOnContextMenu;
      document.onkeydown = prevOnKeyDown;
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
      document.removeEventListener('copy', handleCopyCut, { capture: true });
      document.removeEventListener('cut', handleCopyCut, { capture: true });
      document.body.classList.remove('cgt-devtools-blocked');
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      if (shieldEl.parentNode) {
        shieldEl.parentNode.removeChild(shieldEl);
      }
    };
  }, []);
}

export function useMultiBranchPrintForms<T extends PrintRecordWithBranch>({
  records,
  fallbackBlankRows,
  blankRowFactory,
  branchDirectories,
  singlePageMaxRows,
  singlePageMax,
  rowsPerPageFirst = 7,
  rowsPerPageOther = 10,
}: {
  records: T[];
  fallbackBlankRows?: T[];
  blankRowFactory?: () => T;
  branchDirectories?: LbpBranchDirectoryEntry[];
  singlePageMaxRows?: number;
  singlePageMax?: number;
  rowsPerPageFirst?: number;
  rowsPerPageOther?: number;
}) {
  useStrictPrintPreviewProtection();

  const effectiveSinglePageMaxRows = singlePageMaxRows ?? singlePageMax ?? 5;
  const effectiveFallbackRows = useMemo(() => {
    if (fallbackBlankRows && fallbackBlankRows.length > 0) {
      return fallbackBlankRows;
    }
    if (blankRowFactory) {
      return [blankRowFactory()];
    }
    return [] as T[];
  }, [fallbackBlankRows, blankRowFactory]);

  const directories = useMemo(
    () =>
      branchDirectories && branchDirectories.length > 0
        ? branchDirectories
        : DEFAULT_LBP_BRANCH_DIRECTORIES,
    [branchDirectories]
  );

  const [groupMode, setGroupMode] = useState<PrintFormGroupMode>('branch');
  const [formOverrides, setFormOverrides] = useState<Record<string, Partial<FormHeaderDetails>>>({});

  const groupedForms = useMemo(() => {
    if (!records || records.length === 0) {
      const defaultDir = directories[0] || DEFAULT_LBP_BRANCH_DIRECTORIES[0];
      return [
        {
          formKey: 'DEFAULT',
          formIndex: 0,
          label: `${defaultDir.branch} Branch`,
          branchDirectory: defaultDir,
          records: effectiveFallbackRows,
        },
      ];
    }
    return groupRecordsIntoPrintForms(records, directories, groupMode);
  }, [records, directories, groupMode, effectiveFallbackRows]);

  const [activeFormKey, setActiveFormKey] = useState<string>(() => groupedForms[0]?.formKey || 'DEFAULT');

  useEffect(() => {
    if (!groupedForms.some((f) => f.formKey === activeFormKey)) {
      setActiveFormKey(groupedForms[0]?.formKey || 'DEFAULT');
    }
  }, [groupedForms, activeFormKey]);

  const getHeaderDetailsForForm = (form: GroupedPrintForm<T>): FormHeaderDetails => {
    const dir = form.branchDirectory || directories[0] || DEFAULT_LBP_BRANCH_DIRECTORIES[0];
    const override = formOverrides[form.formKey] || {};
    return {
      recipientName: override.recipientName ?? dir.addressee_name,
      recipientTitle: override.recipientTitle ?? dir.addressee_position,
      bankBranch: override.bankBranch ?? dir.addressee_branch,
      bankAddressLine1: override.bankAddressLine1 ?? dir.address_1,
      bankAddressLine2: override.bankAddressLine2 ?? dir.address_2,
      salutationName:
        override.salutationName ?? (dir.salutation || deriveSalutationFromName(dir.addressee_name)),
    };
  };

  const activeForm = useMemo(
    () => groupedForms.find((f) => f.formKey === activeFormKey) || groupedForms[0],
    [groupedForms, activeFormKey]
  );

  const activeHeader = getHeaderDetailsForForm(activeForm);

  const updateActiveField = (field: keyof FormHeaderDetails, value: string) => {
    const key = activeForm?.formKey || 'DEFAULT';
    setFormOverrides((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const applyBranchDirectoryToActiveForm = (branchName: string) => {
    const found = directories.find((d) => d.branch.toUpperCase() === branchName.toUpperCase());
    if (!found) return;
    const key = activeForm?.formKey || 'DEFAULT';
    setFormOverrides((prev) => ({
      ...prev,
      [key]: {
        recipientName: found.addressee_name,
        recipientTitle: found.addressee_position,
        bankBranch: found.addressee_branch,
        bankAddressLine1: found.address_1,
        bankAddressLine2: found.address_2,
        salutationName: found.salutation || deriveSalutationFromName(found.addressee_name),
      },
    }));
  };

  const resetHeaderOverrides = () => {
    setFormOverrides({});
  };

  const pagesData: PaginatedFormPage<T>[] = useMemo(() => {
    const allPages: PaginatedFormPage<T>[] = [];
    let globalPageIndex = 0;
    const totalForms = groupedForms.length;

    for (const form of groupedForms) {
      const formRows = form.records;
      const headerDetails = getHeaderDetailsForForm(form);

      if (formRows.length <= effectiveSinglePageMaxRows) {
        allPages.push({
          pageIndex: globalPageIndex++,
          formKey: form.formKey,
          formIndex: form.formIndex,
          totalForms,
          formLabel: form.label,
          formPageNum: 1,
          formTotalPages: 1,
          rows: formRows,
          globalStartIdx: 0,
          isFirstPage: true,
          isLastPage: true,
          headerDetails,
          header: headerDetails,
        });
        continue;
      }

      const firstPageLimit = Math.min(rowsPerPageFirst, Math.max(1, formRows.length - 1));
      const formChunks: {
        rows: T[];
        globalStartIdx: number;
        isFirstPage: boolean;
        isLastPage: boolean;
      }[] = [];

      formChunks.push({
        rows: formRows.slice(0, firstPageLimit),
        globalStartIdx: 0,
        isFirstPage: true,
        isLastPage: false,
      });

      let currentIdx = firstPageLimit;
      while (currentIdx < formRows.length) {
        const nextChunk = formRows.slice(currentIdx, currentIdx + rowsPerPageOther);
        const isLast = currentIdx + rowsPerPageOther >= formRows.length;
        formChunks.push({
          rows: nextChunk,
          globalStartIdx: currentIdx,
          isFirstPage: false,
          isLastPage: isLast,
        });
        currentIdx += rowsPerPageOther;
      }

      const formTotalPages = formChunks.length;
      formChunks.forEach((chunk, cIdx) => {
        allPages.push({
          pageIndex: globalPageIndex++,
          formKey: form.formKey,
          formIndex: form.formIndex,
          totalForms,
          formLabel: form.label,
          formPageNum: cIdx + 1,
          formTotalPages,
          rows: chunk.rows,
          globalStartIdx: chunk.globalStartIdx,
          isFirstPage: chunk.isFirstPage,
          isLastPage: chunk.isLastPage,
          headerDetails,
          header: headerDetails,
        });
      });
    }

    return allPages;
  }, [groupedForms, formOverrides, effectiveSinglePageMaxRows, rowsPerPageFirst, rowsPerPageOther, directories]);

  return {
    directories,
    groupMode,
    setGroupMode,
    groupedForms,
    activeFormKey,
    setActiveFormKey,
    activeForm,
    pagesData,
    totalPages: pagesData.length,
    totalForms: groupedForms.length,
    recipientName: activeHeader.recipientName,
    setRecipientName: (v: string) => updateActiveField('recipientName', v),
    recipientTitle: activeHeader.recipientTitle,
    setRecipientTitle: (v: string) => updateActiveField('recipientTitle', v),
    bankBranch: activeHeader.bankBranch,
    setBankBranch: (v: string) => updateActiveField('bankBranch', v),
    bankAddressLine1: activeHeader.bankAddressLine1,
    setBankAddressLine1: (v: string) => updateActiveField('bankAddressLine1', v),
    bankAddressLine2: activeHeader.bankAddressLine2,
    setBankAddressLine2: (v: string) => updateActiveField('bankAddressLine2', v),
    salutationName: activeHeader.salutationName,
    setSalutationName: (v: string) => updateActiveField('salutationName', v),
    applyBranchDirectoryToActiveForm,
    resetHeaderOverrides,
  };
}

