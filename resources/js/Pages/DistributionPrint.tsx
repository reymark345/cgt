import { Head, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  Bold,
  Building2,
  Calendar,
  Check,
  Edit3,
  FileText,
  Printer,
  RotateCcw,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PrintBranchToolbarControls,
  PrintFormEditorSelector,
  PrintFormScreenBanner,
  SecondCopySignatoryReference,
} from '../Components/PrintBranchGroupingControls';
import {
  LbpBranchDirectoryEntry,
  PrintRecordWithBranch,
  useMultiBranchPrintForms,
} from '../utils/lbpPrintDirectory';

const DEFAULT_INTRO_MESSAGE = `This is in connection with the implementation of the Pantawid Pamilyang Pilipino Program for the distribution of cash grants and in accordance with the new guidelines signed on June 7, 2022.

The following beneficiary has a new cash card due to card replacement/ change of grantee/ transfer of residence:`;

const DEFAULT_CLOSING_MESSAGE = `With this, we would like to request for **SCHEDULE and CARD DISTRIBUTION** of the above beneficiary.

Also, we would like to request for **LIFTING** the above account/s once claimed.

Thank you very much for your continued support.`;

function renderFormattedMessage(rawText: string, containerClassName = '') {
  const paragraphs = rawText
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className={containerClassName}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <p key={pIdx} className="text-justify text-sm leading-relaxed text-black">
            {lines.map((line, lIdx) => {
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <React.Fragment key={lIdx}>
                  {lIdx > 0 && <br />}
                  {parts.map((part, partIdx) => {
                    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                      return (
                        <strong key={partIdx} className="font-bold">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return <React.Fragment key={partIdx}>{part}</React.Fragment>;
                  })}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

type DistributionRecord = PrintRecordWithBranch & {
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
};

type DistributionPrintProps = {
  records?: DistributionRecord[];
  branchDirectories?: LbpBranchDirectoryEntry[];
  defaultDate?: string;
  search?: string;
  dswdLogoUrl?: string;
  bagongPilipinasLogoUrl?: string;
};

// Component that tries multiple image file variations and falls back gracefully
function SmartImage({
  sources,
  alt,
  className,
  fallback,
}: {
  sources: string[];
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      alt={alt}
      className={className}
      onError={() => {
        if (index + 1 < sources.length) {
          setIndex(index + 1);
        } else {
          setFailed(true);
        }
      }}
      src={sources[index]}
    />
  );
}

export default function DistributionPrint({
  records = [],
  branchDirectories,
  defaultDate,
  search,
  dswdLogoUrl,
  bagongPilipinasLogoUrl,
}: DistributionPrintProps) {
  const { props } = usePage<{ auth?: { user?: { is_admin?: boolean; permissions?: Record<string, boolean> } | null } }>();
  const canEditLetterDetails = Boolean(
    props?.auth?.user?.is_admin || props?.auth?.user?.permissions?.edit_print_forms
  );

  // Document customization state (prefilled exactly matching the official sample)
  const [letterDate, setLetterDate] = useState(
    defaultDate ||
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
      })
  );
  const [signatoryName, setSignatoryName] = useState('MARI-FLOR A. DOLLAGA-LIBANG');
  const [signatoryTitle, setSignatoryTitle] = useState('Regional Director');

  // Letter body message states with localStorage persistence
  const introInputRef = useRef<HTMLTextAreaElement>(null);
  const closingInputRef = useRef<HTMLTextAreaElement>(null);

  const [introMessage, setIntroMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_distribution_intro_message');
      if (saved !== null && saved.trim() !== '') {
        return saved;
      }
    }
    return DEFAULT_INTRO_MESSAGE;
  });

  const [closingMessage, setClosingMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_distribution_closing_message');
      if (saved !== null && saved.trim() !== '') {
        return saved;
      }
    }
    return DEFAULT_CLOSING_MESSAGE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_distribution_intro_message', introMessage);
    }
  }, [introMessage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_distribution_closing_message', closingMessage);
    }
  }, [closingMessage]);

  const handleResetIntro = () => {
    setIntroMessage(DEFAULT_INTRO_MESSAGE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cgt_distribution_intro_message');
    }
  };

  const handleResetClosing = () => {
    setClosingMessage(DEFAULT_CLOSING_MESSAGE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cgt_distribution_closing_message');
    }
  };

  const focusIntroEditor = () => {
    if (!canEditLetterDetails) return;
    setIsEditorOpen(true);
    setTimeout(() => {
      introInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      introInputRef.current?.focus();
    }, 120);
  };

  const focusClosingEditor = () => {
    if (!canEditLetterDetails) return;
    setIsEditorOpen(true);
    setTimeout(() => {
      closingInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      closingInputRef.current?.focus();
    }, 120);
  };

  const applyBoldToTextarea = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    currentText: string,
    setText: (newText: string) => void,
    placeholderText = 'bold text'
  ) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start !== end) {
      const selected = currentText.substring(start, end);
      const replacement = `**${selected}**`;
      const nextText = currentText.substring(0, start) + replacement + currentText.substring(end);
      setText(nextText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start, start + replacement.length);
      }, 0);
    } else {
      const replacement = `**${placeholderText}**`;
      const nextText = currentText.substring(0, start) + replacement + currentText.substring(end);
      setText(nextText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + 2, start + replacement.length - 2);
      }, 0);
    }
  };

  // Dynamic pagination settings (default 7 rows on Page 1)
  const [rowsPerPageFirst, setRowsPerPageFirst] = useState<number>(7);
  const [rowsPerPageOther, setRowsPerPageOther] = useState<number>(10);

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Zoom state for on-screen document preview (default 80%)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_distribution_print_zoom');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 40 && parsed <= 150) {
          return parsed;
        }
      }
    }
    return 80;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_distribution_print_zoom', String(zoomLevel));
    }
  }, [zoomLevel]);

  // Auto trigger print prompt if opened with ?autoprint=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoprint') === '1') {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (window.opener) {
      window.close();
      return;
    }
    window.close();
    setTimeout(() => {
      if (!window.closed && window.history.length > 1) {
        window.history.back();
      }
    }, 150);
  };

  const handlePrint = () => {
    window.print();
  };

  const fallbackBlankRows: DistributionRecord[] = useMemo(
    () => [
      {
        id: -1,
        item_no: '1',
        address: null,
        household_id_number: null,
        run_date: null,
        name: null,
        card_number: null,
        schedule: null,
        status: null,
        remarks: null,
      },
    ],
    []
  );

  const {
    directories,
    groupMode,
    setGroupMode,
    groupedForms,
    activeFormKey,
    setActiveFormKey,
    pagesData,
    totalPages,
    totalForms,
    recipientName,
    setRecipientName,
    recipientTitle,
    setRecipientTitle,
    bankBranch,
    setBankBranch,
    bankAddressLine1,
    setBankAddressLine1,
    bankAddressLine2,
    setBankAddressLine2,
    salutationName,
    setSalutationName,
    applyBranchDirectoryToActiveForm,
  } = useMultiBranchPrintForms({
    records,
    fallbackBlankRows,
    branchDirectories,
    singlePageMaxRows: 6,
    rowsPerPageFirst,
    rowsPerPageOther,
  });

  const getPageInfo = (currentPage: number, total: number) => {
    return `PAGE ${currentPage} of ${total}`;
  };

  return (
    <>
      <Head title="Endorsement Form - Land Bank Schedule and Card Distribution" />

      {/* Embedded CSS for Print Layout and styling strictly calibrated for A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header {
            display: none !important;
          }
          .min-h-screen {
            background: #ffffff !important;
            background-color: #ffffff !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          main,
          .paper-scale-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            zoom: 1 !important;
            transform: none !important;
          }
          .printable-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 0 22mm 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            position: relative !important;
            height: 272mm !important;
            min-height: 272mm !important;
            max-height: 272mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            zoom: 1 !important;
            transform: none !important;
          }
          .printable-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .paper-footer {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            border: none !important;
            border-top: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border-color: #000000 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased dark:bg-slate-950 print:m-0 print:min-h-0 print:bg-white print:p-0">
        {/* Floating Top Control Toolbar (Hidden during print) */}
        <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 print:hidden">
          <div className="mx-auto flex w-full max-w-full flex-nowrap items-center justify-between gap-2 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                onClick={handleClose}
                title="Close Tab or Go Back"
                type="button"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Close</span>
              </button>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    LBP Schedule and Card Distribution Form
                  </span>
                  <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
                    {records.length > 0
                      ? `${records.length} Beneficiaries (${totalPages} ${totalPages === 1 ? 'Page' : 'Pages'})`
                      : 'Blank Template Form'}
                  </span>
                </div>
                {search ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Filtered by: <span className="font-medium text-slate-700 dark:text-slate-300">"{search}"</span>
                  </p>
                ) : null}
              </div>
            </div>

            {/* Center Section: Interactive Zoom Controls */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/90 p-1 shadow-2xs dark:border-slate-700 dark:bg-slate-800/90">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-95 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer"
                disabled={zoomLevel <= 50}
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                title="Zoom Out"
                type="button"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                className="min-w-[3.2rem] px-1 py-0.5 text-center text-xs font-bold text-slate-700 hover:text-cyan-600 dark:text-slate-200 dark:hover:text-cyan-400 cursor-pointer"
                onClick={() => setZoomLevel(80)}
                title="Click to reset to default (80%)"
                type="button"
              >
                {zoomLevel}%
              </button>

              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-95 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer"
                disabled={zoomLevel >= 130}
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                title="Zoom In"
                type="button"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              <div className="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Quick Presets */}
              {[70, 80, 90, 100].map((preset) => (
                <button
                  key={preset}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                    zoomLevel === preset
                      ? 'bg-white font-bold text-cyan-700 shadow-2xs dark:bg-slate-700 dark:text-cyan-300'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                  onClick={() => setZoomLevel(preset)}
                  type="button"
                >
                  {preset}%
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-xs font-bold text-white shadow-md shadow-cyan-500/25 transition hover:bg-cyan-700 active:scale-95 cursor-pointer"
                onClick={handlePrint}
                type="button"
              >
                <Printer className="h-4 w-4" />
                <span>Print Document</span>
              </button>

              {canEditLetterDetails && (
                <button
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => setIsEditorOpen((v) => !v)}
                  type="button"
                >
                  <Edit3 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>{isEditorOpen ? 'Hide Customizer' : 'Edit Letter Details'}</span>
                </button>
              )}

              <PrintBranchToolbarControls
                groupMode={groupMode}
                onChangeGroupMode={setGroupMode}
                recordsCount={records.length}
                totalForms={totalForms}
              />
            </div>
          </div>

          {/* Collapsible Form Editor Panel */}
          {canEditLetterDetails && isEditorOpen && (
            <div className="mx-auto mt-3 max-w-6xl rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 text-xs dark:border-cyan-900/50 dark:bg-cyan-950/30">
              <div className="mb-2.5 flex items-center justify-between font-bold text-cyan-950 dark:text-cyan-200">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  Customize Header, Addressee, Messages & Signatory
                </span>
                <button
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  onClick={() => setIsEditorOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <PrintFormEditorSelector
                activeFormKey={activeFormKey}
                currentBranchName={bankBranch}
                directories={directories}
                groupedForms={groupedForms}
                onSelectBranchDirectory={applyBranchDirectoryToActiveForm}
                onSelectFormKey={setActiveFormKey}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Date of Letter</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setLetterDate(e.target.value)}
                    type="text"
                    value={letterDate}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Addressee Name</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setRecipientName(e.target.value)}
                    type="text"
                    value={recipientName}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Salutation (Dear...)</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setSalutationName(e.target.value)}
                    type="text"
                    value={salutationName}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Branch Name</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setBankBranch(e.target.value)}
                    type="text"
                    value={bankBranch}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Branch Address Line 1</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setBankAddressLine1(e.target.value)}
                    type="text"
                    value={bankAddressLine1}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">City / Province</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setBankAddressLine2(e.target.value)}
                    type="text"
                    value={bankAddressLine2}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Signatory Full Name</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setSignatoryName(e.target.value)}
                    type="text"
                    value={signatoryName}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Signatory Position</label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    type="text"
                    value={signatoryTitle}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Max Rows on Page 1
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    max="15"
                    min="1"
                    onChange={(e) => setRowsPerPageFirst(Math.max(1, parseInt(e.target.value, 10) || 7))}
                    type="number"
                    value={rowsPerPageFirst}
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Default 7. Fits beneficiaries on Page 1 before continuing to Page 2.
                  </p>
                </div>
              </div>

              {/* Section 2: Letter Body Messages */}
              <div className="mt-4 border-t border-cyan-200/80 pt-3 dark:border-cyan-900/50">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-950 dark:text-cyan-200">
                    <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Letter Body Messages (Introductory &amp; Closing Requests)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports <code className="rounded bg-cyan-100 px-1 py-0.5 font-mono text-[10px] text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200">**bold**</code> text formatting &amp; multi-line paragraphs
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Introductory Message Card */}
                  <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Introductory Message (Page 1 - Above Table)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                          onClick={() => applyBoldToTextarea(introInputRef, introMessage, setIntroMessage)}
                          title="Wrap selection with **bold**"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-600 hover:text-cyan-800 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                          onClick={handleResetIntro}
                          title="Reset to official default intro text"
                          type="button"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          Reset Default
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={introInputRef}
                      className="w-full flex-1 rounded-md border border-slate-300 bg-slate-50/50 px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-800 shadow-inner focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800"
                      onChange={(e) => setIntroMessage(e.target.value)}
                      placeholder="Enter introductory message paragraphs..."
                      rows={4}
                      value={introMessage}
                    />
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      Separate paragraphs with a blank line. Appears above the beneficiaries table on Page 1.
                    </p>
                  </div>

                  {/* Closing Request & Remarks Card */}
                  <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Closing Request &amp; Remarks (Last Page - Below Table)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                          onClick={() => applyBoldToTextarea(closingInputRef, closingMessage, setClosingMessage, 'SCHEDULE and CARD DISTRIBUTION')}
                          title="Wrap selection with **bold**"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-600 hover:text-cyan-800 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                          onClick={handleResetClosing}
                          title="Reset to official default closing request text"
                          type="button"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          Reset Default
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={closingInputRef}
                      className="w-full flex-1 rounded-md border border-slate-300 bg-slate-50/50 px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-800 shadow-inner focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800"
                      onChange={(e) => setClosingMessage(e.target.value)}
                      placeholder="Enter closing request paragraphs..."
                      rows={4}
                      value={closingMessage}
                    />
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Separate paragraphs with a blank line.</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Quick bold:</span>
                        <button
                          className="rounded bg-cyan-100 px-1 py-0.5 text-[10px] font-medium text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/60 dark:text-cyan-200 cursor-pointer"
                          onClick={() =>
                            setClosingMessage((prev) =>
                              prev.includes('**SCHEDULE and CARD DISTRIBUTION**')
                                ? prev
                                : prev.replace(/SCHEDULE and CARD DISTRIBUTION/g, '**SCHEDULE and CARD DISTRIBUTION**')
                            )
                          }
                          type="button"
                        >
                          **SCHEDULE and CARD DISTRIBUTION**
                        </button>
                        <button
                          className="rounded bg-cyan-100 px-1 py-0.5 text-[10px] font-medium text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/60 dark:text-cyan-200 cursor-pointer"
                          onClick={() =>
                            setClosingMessage((prev) =>
                              prev.includes('**LIFTING**')
                                ? prev
                                : prev.replace(/LIFTING/g, '**LIFTING**')
                            )
                          }
                          type="button"
                        >
                          **LIFTING**
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Printable Paper Area */}
        <main className="mx-auto flex flex-col items-center justify-start p-4 sm:p-6 print:m-0 print:p-0">
          <div
            className="paper-scale-container origin-top transition-transform duration-200 print:transform-none"
            style={{
              zoom: `${zoomLevel}%`,
            }}
          >
            {pagesData.map((pageItem) => {
              const currentPageNum = pageItem.formPageNum;
              const pageHeader = pageItem.headerDetails;

              return (
                <React.Fragment key={pageItem.pageIndex}>
                  <PrintFormScreenBanner
                    bankBranch={pageHeader.bankBranch}
                    formIndex={pageItem.formIndex}
                    formLabel={pageItem.formLabel}
                    isFirstPage={pageItem.isFirstPage && !pageItem.hideHeaderFooter}
                    recipientName={pageHeader.recipientName}
                    rowsCount={groupedForms[pageItem.formIndex]?.records.length || pageItem.rows.length}
                    totalForms={pageItem.totalForms}
                  />
                  <div
                    className="printable-page relative mb-8 flex min-h-[297mm] w-[210mm] flex-col justify-between rounded-lg bg-white p-[15mm] text-black shadow-xl ring-1 ring-slate-200/80 print:relative print:m-0 print:mb-0 print:h-[272mm] print:min-h-[272mm] print:max-h-[272mm] print:w-full print:rounded-none print:p-0 print:pb-[22mm] print:shadow-none print:ring-0 print:overflow-hidden"
                  >
                  <div className="flex-1">
                    {/* Header Logos & Agency Branding (Page 1 only) */}
                    {pageItem.isFirstPage ? (
                      <>
                        <div
                          className={`flex items-center justify-start gap-4 pb-2 ${pageItem.hideHeaderFooter ? 'hidden print:hidden' : ''}`}
                          style={pageItem.hideHeaderFooter ? { display: 'none' } : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <SmartImage
                              alt="DSWD Field Office - Caraga"
                              className="h-14 w-auto object-contain print:h-12"
                              fallback={
                                <div className="flex h-12 w-28 items-center justify-center rounded border border-slate-300 text-center font-bold text-blue-900">
                                  DSWD
                                </div>
                              }
                              sources={[
                                dswdLogoUrl || '',
                                '/images/dswd_caraga_logo.png',
                                '/images/dswd_logo.png',
                                '/dswd_logo.png',
                              ].filter(Boolean)}
                            />

                            {/* Bagong Pilipinas Logo - Moved up to align bottom with DSWD Caraga logo */}
                            <div className="flex items-center -mt-2 print:-mt-[7px]">
                              <SmartImage
                                alt="Bagong Pilipinas"
                                className="h-14 w-auto object-contain print:h-12"
                                fallback={
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 text-center text-[10px] font-bold text-amber-600">
                                    BP
                                  </div>
                                }
                                sources={[
                                  bagongPilipinasLogoUrl || '',
                                  '/images/bagong_pilipinas_logo.png',
                                  '/bagong_pilipinas_logo.png',
                                ].filter(Boolean)}
                              />
                            </div>
                          </div>
                        </div>

                        {pageItem.hideHeaderFooter && pageItem.drn && (
                          <div className="mb-1 text-right text-xs font-normal text-black">
                            DRN: {pageItem.drn}
                          </div>
                        )}

                        {/* Date of Letter */}
                        <div className={`${pageItem.hideHeaderFooter ? 'mt-0 print:mt-0' : 'mt-6 print:mt-4'} text-sm text-black`}>
                          {letterDate}
                        </div>

                        {/* Recipient Addressee Block */}
                        <div className="mt-6 text-sm leading-snug text-black print:mt-4">
                          <div className="font-bold tracking-wide uppercase">{pageHeader.recipientName}</div>
                          <div>{pageHeader.recipientTitle}</div>
                          <div>{pageHeader.bankBranch}</div>
                          <div>{pageHeader.bankAddressLine1}</div>
                          <div>{pageHeader.bankAddressLine2}</div>
                        </div>

                        {/* Salutation */}
                        <div className="mt-6 text-sm text-black print:mt-4">
                          Dear <span className="font-bold">{pageHeader.salutationName}</span>:
                        </div>

                        {/* Introductory Paragraphs (Editable) */}
                        <div
                          className={`group relative mt-4 rounded-xs p-1 transition-colors ${
                            canEditLetterDetails
                              ? 'cursor-pointer hover:bg-cyan-50/70 hover:ring-1 hover:ring-cyan-300 dark:hover:bg-cyan-900/20'
                              : ''
                          } print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3`}
                          onClick={canEditLetterDetails ? focusIntroEditor : undefined}
                          title={canEditLetterDetails ? 'Click to edit intro message' : undefined}
                        >
                          {canEditLetterDetails && (
                            <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-cyan-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Edit Message</span>
                            </div>
                          )}
                          {renderFormattedMessage(introMessage, 'space-y-3 print:space-y-1.5')}
                        </div>
                      </>
                    ) : (
                      /* Continuation Header for Page 2+ */
                      <div
                        className={`mb-4 flex items-center justify-between border-b border-black pb-2 text-xs ${pageItem.hideHeaderFooter ? 'hidden print:hidden' : ''}`}
                        style={pageItem.hideHeaderFooter ? { display: 'none' } : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-tight text-black">
                            DSWD Field Office Caraga
                          </span>
                          <span className="text-slate-400 print:text-black">|</span>
                          <span className="text-slate-700 print:text-black">
                            Endorsement for Schedule and Card Distribution (Continuation)
                          </span>
                        </div>
                        <div className="font-medium text-slate-700 print:text-black">
                          {letterDate}
                        </div>
                      </div>
                    )}

                    {/* Beneficiaries Table */}
                    <div className={`${!pageItem.isFirstPage && pageItem.hideHeaderFooter ? 'mt-0 print:mt-0' : 'mt-4 print:mt-2.5'} overflow-x-auto`}>
                      <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead>
                          <tr className="border-b border-black bg-slate-50 font-bold text-black print:bg-transparent">
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '7%' }}>
                              Item No.
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '22%' }}>
                              Address
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '18%' }}>
                              Household ID Number
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '12%' }}>
                              Run Date
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '18%' }}>
                              Name
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '13%' }}>
                              Card Number
                            </th>
                            <th className="px-2 py-2 text-center" style={{ width: '10%' }}>
                              Schedule
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItem.rows.map((row, idx) => {
                            const itemNo = String(pageItem.globalStartIdx + idx + 1);
                            return (
                              <tr key={row.id || idx} className="border-b border-black">
                                <td className="border-r border-black px-2 py-1.5 font-medium">
                                  {itemNo}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 text-left">
                                  {row.address || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 font-mono">
                                  {row.household_id_number || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 font-mono">
                                  {row.run_date || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 text-left font-medium">
                                  {row.name || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 font-mono">
                                  {row.card_number || ''}
                                </td>
                                <td className="px-2 py-1.5">
                                  {row.schedule || ''}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Request Statements and Signatory on the Last Page */}
                    {pageItem.isLastPage && (
                      <>
                        {/* Closing Request Statements (Editable) */}
                        <div
                          className={`group relative mt-5 rounded-xs p-1 transition-colors ${
                            canEditLetterDetails
                              ? 'cursor-pointer hover:bg-cyan-50/70 hover:ring-1 hover:ring-cyan-300 dark:hover:bg-cyan-900/20'
                              : ''
                          } print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3`}
                          onClick={canEditLetterDetails ? focusClosingEditor : undefined}
                          title={canEditLetterDetails ? 'Click to edit closing request message' : undefined}
                        >
                          {canEditLetterDetails && (
                            <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-cyan-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Edit Request Message</span>
                            </div>
                          )}
                          {renderFormattedMessage(closingMessage, 'space-y-3 print:space-y-1.5')}
                        </div>

                        {/* Signatory Block */}
                        <div className="mt-8 text-sm text-black print:mt-5">
                          <div>Sincerely yours,</div>

                          <div className="mt-12 print:mt-8">
                            <div className="font-bold tracking-wide text-black">{signatoryName}</div>
                            <div className="text-xs text-black">{signatoryTitle}</div>
                            <SecondCopySignatoryReference hideHeaderFooter={pageItem.hideHeaderFooter} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Dynamic Footer with Page & DSWD Contact Info */}
                  <footer
                    className={`paper-footer mt-auto pt-3 text-center text-[10px] text-slate-700 print:absolute print:bottom-0 print:left-0 print:right-0 print:w-full print:m-0 print:border-none print:p-0 print:text-black ${pageItem.hideHeaderFooter ? 'hidden print:hidden' : ''}`}
                    style={pageItem.hideHeaderFooter ? { display: 'none' } : undefined}
                  >
                    <div className="font-bold tracking-wider">
                      {getPageInfo(currentPageNum, pageItem.formTotalPages)}
                    </div>
                    <div className="mt-1 leading-tight">
                      DSWD Field Office Caraga, R. Palma St., Butuan City, Philippines, 8600
                    </div>
                    <div className="mt-0.5 leading-tight">
                      Website:{' '}
                      <a
                        className="text-blue-600 underline print:no-underline print:text-black"
                        href="https://caraga.dswd.gov.ph"
                        rel="noreferrer"
                        target="_blank"
                      >
                        https://caraga.dswd.gov.ph
                      </a>{' '}
                      Tel Nos.: (085) 303-8620 email: focrg@dswd.gov.ph
                    </div>
                  </footer>
                </div>
                </React.Fragment>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}

