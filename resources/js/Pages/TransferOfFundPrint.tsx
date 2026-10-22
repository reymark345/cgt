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
import React, { useEffect, useRef, useState } from 'react';
import {
  PrintBranchToolbarControls,
  PrintFormEditorSelector,
  PrintFormScreenBanner,
} from '../Components/PrintBranchGroupingControls';
import {
  LbpBranchDirectoryItem,
  PrintRecordWithBranch,
  useMultiBranchPrintForms,
} from '../utils/lbpPrintDirectory';

const DEFAULT_INTRO_MESSAGE = `This is in connection with the implementation of the Pantawid Pamilyang Pilipino Program for the distribution of cash grants and in accordance with the new guidelines signed on June 7, 2022.

The following beneficiary has unwithdrawn grants due to card replacement/ change of grantee/ transfer of servicing branch:`;

const DEFAULT_CLOSING_MESSAGE = `With this, we would like to endorse the request of the above beneficiary for **TRANSFER OF FUND** to new account.

We are hoping to receive a **report on the amount transferred and date of transaction** within nine (9) banking days from receipt of this request based on the said guideline.

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

type TransferOfFundRecord = PrintRecordWithBranch & {
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
};

type TransferOfFundPrintProps = {
  records?: TransferOfFundRecord[];
  branchDirectories?: LbpBranchDirectoryItem[];
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

export default function TransferOfFundPrint({
  records = [],
  branchDirectories = [],
  defaultDate,
  search,
  dswdLogoUrl,
  bagongPilipinasLogoUrl,
}: TransferOfFundPrintProps) {
  const { props } = usePage<{ auth?: { user?: { is_admin?: boolean; permissions?: Record<string, boolean> } | null } }>();
  const canEditLetterDetails = Boolean(
    props?.auth?.user?.is_admin || props?.auth?.user?.permissions?.edit_print_forms
  );

  // Document customization state (prefilled & automatically resolved per LBP Branch Directory)
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
      const saved = localStorage.getItem('cgt_tof_intro_message');
      if (saved) return saved;
    }
    return DEFAULT_INTRO_MESSAGE;
  });

  const [closingMessage, setClosingMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_tof_closing_message');
      if (saved) return saved;
    }
    return DEFAULT_CLOSING_MESSAGE;
  });

  // Save customized message to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_tof_intro_message', introMessage);
    }
  }, [introMessage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_tof_closing_message', closingMessage);
    }
  }, [closingMessage]);

  const handleResetIntro = () => {
    setIntroMessage(DEFAULT_INTRO_MESSAGE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cgt_tof_intro_message');
    }
  };

  const handleResetClosing = () => {
    setClosingMessage(DEFAULT_CLOSING_MESSAGE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cgt_tof_closing_message');
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

  // Dynamic pagination settings
  const [rowsPerPageFirst, setRowsPerPageFirst] = useState<number>(7);
  const [rowsPerPageOther, setRowsPerPageOther] = useState<number>(10);

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Zoom state for on-screen document preview
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_tof_print_zoom');
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
      localStorage.setItem('cgt_tof_print_zoom', String(zoomLevel));
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

  // Multi-branch / Multi-address automated form grouping & pagination
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
  } = useMultiBranchPrintForms<TransferOfFundRecord>({
    records,
    branchDirectories,
    blankRowFactory: () => ({
      id: -1,
      item_no: '1',
      address: null,
      household_id_number: null,
      old_card_number: null,
      old_cardholder_name: null,
      new_card_number: null,
      new_cardholder_name: null,
      status: null,
      remarks: null,
    }),
    rowsPerPageFirst,
    rowsPerPageOther,
    singlePageMax: 5,
    storageKeyPrefix: 'cgt_tof_print',
  });

  const getPageInfo = (pageNum: number, total: number) => {
    return `PAGE ${pageNum} of ${total}`;
  };

  return (
    <>
      <Head title="Print Transfer of Fund Endorsement Letter - DSWD Caraga" />

      {/* Global Print & Page Styling */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, "Helvetica Neue", Helvetica, ui-sans-serif, system-ui, sans-serif !important;
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
                    Transfer of Fund Endorsement Form
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
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
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-95 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                disabled={zoomLevel <= 50}
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                title="Zoom Out"
                type="button"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                className="min-w-[3.2rem] px-1 py-0.5 text-center text-xs font-bold text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
                onClick={() => setZoomLevel(80)}
                title="Click to reset to default (80%)"
                type="button"
              >
                {zoomLevel}%
              </button>

              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-95 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
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
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition ${
                    zoomLevel === preset
                      ? 'bg-white font-bold text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                  onClick={() => setZoomLevel(preset)}
                  type="button"
                >
                  {preset}%
                </button>
              ))}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 cursor-pointer dark:bg-indigo-600 dark:hover:bg-indigo-500"
                onClick={handlePrint}
                type="button"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>

              {canEditLetterDetails && (
                <button
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-2xs transition ${
                    isEditorOpen
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => setIsEditorOpen((o) => !o)}
                  type="button"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{isEditorOpen ? 'Hide Editor' : 'Edit Letter Details'}</span>
                </button>
              )}

              <PrintBranchToolbarControls
                accentColor="indigo"
                groupMode={groupMode}
                onChangeGroupMode={setGroupMode}
                totalForms={totalForms}
                totalRecords={records.length}
              />
            </div>
          </div>

          {/* Collapsible Document Metadata & Customization Drawer */}
          {canEditLetterDetails && isEditorOpen && (
            <div className="mx-auto mt-3 max-w-6xl rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-950/60 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Customize Transfer of Fund Letter
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Headers auto-populate from LBP Branch Directory per address.
                  </span>
                </div>

                <PrintFormEditorSelector
                  accentColor="indigo"
                  activeFormKey={activeFormKey}
                  directories={directories}
                  groupedForms={groupedForms}
                  onApplyBranchDirectory={applyBranchDirectoryToActiveForm}
                  onSelectFormKey={setActiveFormKey}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Date Input */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      Letter Date
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setLetterDate(e.target.value)}
                      type="text"
                      value={letterDate}
                    />
                  </div>

                  {/* Addressee Name */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <User className="h-3 w-3 text-slate-500" />
                      Recipient Name
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setRecipientName(e.target.value)}
                      type="text"
                      value={recipientName}
                    />
                  </div>

                  {/* Addressee Title */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <Building2 className="h-3 w-3 text-slate-500" />
                      Recipient Position
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setRecipientTitle(e.target.value)}
                      type="text"
                      value={recipientTitle}
                    />
                  </div>

                  {/* Bank Branch */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <Building2 className="h-3 w-3 text-slate-500" />
                      Bank Branch
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setBankBranch(e.target.value)}
                      type="text"
                      value={bankBranch}
                    />
                  </div>

                  {/* Bank Address Line 1 */}
                  <div>
                    <label className="mb-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Bank Address Line 1
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setBankAddressLine1(e.target.value)}
                      type="text"
                      value={bankAddressLine1}
                    />
                  </div>

                  {/* Bank Address Line 2 */}
                  <div>
                    <label className="mb-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Bank Address Line 2
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setBankAddressLine2(e.target.value)}
                      type="text"
                      value={bankAddressLine2}
                    />
                  </div>

                  {/* Salutation */}
                  <div>
                    <label className="mb-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Salutation Name (Dear ____:)
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setSalutationName(e.target.value)}
                      type="text"
                      value={salutationName}
                    />
                  </div>

                  {/* Signatory Name */}
                  <div>
                    <label className="mb-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Signatory Full Name
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setSignatoryName(e.target.value)}
                      type="text"
                      value={signatoryName}
                    />
                  </div>

                  {/* Signatory Title */}
                  <div>
                    <label className="mb-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Signatory Designation
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      type="text"
                      value={signatoryTitle}
                    />
                  </div>

                  {/* Rows Per Page for Multi-Page Documents */}
                  <div>
                    <label className="mb-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Page 1 Rows (Multi-page)
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      max={12}
                      min={3}
                      onChange={(e) => setRowsPerPageFirst(Math.max(3, parseInt(e.target.value) || 7))}
                      type="number"
                      value={rowsPerPageFirst}
                    />
                  </div>

                  {/* Continuation Pages Rows */}
                  <div>
                    <label className="mb-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Other Pages Rows
                    </label>
                    <input
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      max={16}
                      min={4}
                      onChange={(e) => setRowsPerPageOther(Math.max(4, parseInt(e.target.value) || 10))}
                      type="number"
                      value={rowsPerPageOther}
                    />
                  </div>
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
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          onClick={() => applyBoldToTextarea(introInputRef, introMessage, setIntroMessage)}
                          title="Wrap selection with **bold**"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
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
                      className="w-full flex-1 rounded-md border border-slate-300 bg-slate-50/50 px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-800 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800"
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
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          onClick={() => applyBoldToTextarea(closingInputRef, closingMessage, setClosingMessage, 'TRANSFER OF FUND')}
                          title="Wrap selection with **bold**"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
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
                      className="w-full flex-1 rounded-md border border-slate-300 bg-slate-50/50 px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-800 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800"
                      onChange={(e) => setClosingMessage(e.target.value)}
                      placeholder="Enter closing request paragraphs..."
                      rows={5}
                      value={closingMessage}
                    />
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Separate paragraphs with a blank line.</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400">Quick bold:</span>
                        <button
                          className="rounded bg-slate-100 px-1 font-mono text-[9px] text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300"
                          onClick={() => {
                            setClosingMessage((prev) => prev.includes('**TRANSFER OF FUND**') ? prev : prev.replace(/TRANSFER OF FUND/g, '**TRANSFER OF FUND**'));
                          }}
                          type="button"
                        >
                          **TRANSFER OF FUND**
                        </button>
                        <button
                          className="rounded bg-slate-100 px-1 font-mono text-[9px] text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300"
                          onClick={() => {
                            setClosingMessage((prev) =>
                              prev.includes('**report on the amount transferred and date of transaction**')
                                ? prev
                                : prev.replace(/report on the amount transferred and date of transaction/g, '**report on the amount transferred and date of transaction**')
                            );
                          }}
                          type="button"
                        >
                          **report on amount**
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Paper Canvas */}
        <main className="py-6 sm:py-8 print:m-0 print:bg-white print:p-0">
          <div
            className="paper-scale-container mx-auto flex flex-col items-center gap-6 transition-all duration-150 print:block print:gap-0"
            style={{
              zoom: `${zoomLevel}%`,
            }}
          >
            {pagesData.map((pageItem) => {
              const currentPageNum = pageItem.pageIndex + 1;
              const pageHeader = pageItem.header;

              return (
                <div
                  key={`${pageItem.formKey}-p-${pageItem.pageIndex}`}
                  className="printable-page relative mx-auto flex w-full max-w-[780px] min-h-[1050px] flex-col justify-between rounded-lg border border-slate-300 bg-white p-8 text-black shadow-xl sm:p-12 print:relative print:m-0 print:h-[272mm] print:min-h-[272mm] print:max-h-[272mm] print:max-w-none print:rounded-none print:border-none print:bg-white print:p-0 print:pb-[22mm] print:shadow-none print:overflow-hidden"
                >
                  <div className="flex-1">
                    {pageItem.isFirstPage && (
                      <PrintFormScreenBanner
                        accentColor="indigo"
                        canEdit={canEditLetterDetails}
                        formIndex={pageItem.formIndex}
                        formLabel={pageItem.formLabel}
                        header={pageHeader}
                        isActive={activeFormKey === pageItem.formKey}
                        onSelectForm={() => {
                          setActiveFormKey(pageItem.formKey);
                          if (canEditLetterDetails) {
                            setIsEditorOpen(true);
                          }
                        }}
                        totalForms={pageItem.totalForms}
                      />
                    )}
                    {pageItem.isFirstPage ? (
                      <>
                        {/* Top Logos Header */}
                        <div className="flex items-center gap-3">
                          {/* DSWD Logo */}
                          <div className="flex items-center">
                            <SmartImage
                              alt="DSWD Field Office - Caraga Region"
                              className="h-14 w-auto max-w-[240px] object-contain print:h-12"
                              fallback={
                                <div className="flex items-center gap-2">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 font-black text-white shadow-xs">
                                    <span className="text-sm tracking-tighter">DSWD</span>
                                  </div>
                                  <div className="text-[10px] font-bold leading-tight text-blue-900">
                                    <div>DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT</div>
                                    <div className="text-[9px] font-semibold text-blue-600">Field Office – Caraga</div>
                                  </div>
                                </div>
                              }
                              sources={[
                                ...(dswdLogoUrl ? [dswdLogoUrl] : []),
                                '/images/dswd_caraga_logo.png',
                                'images/dswd_caraga_logo.png',
                                '/images/dswd-logo.png',
                                '/images/DSWD logo.png',
                                '/images/dswd.png',
                                '/images/DSWD Logo.png',
                                '/images/dswd_logo.png',
                                '/images/dswd.jpg',
                              ]}
                            />
                          </div>

                          {/* Bagong Pilipinas Logo - Moved up to align bottom with DSWD Caraga logo */}
                          <div className="flex items-center -mt-2 print:-mt-[7px]">
                            <SmartImage
                              alt="Bagong Pilipinas"
                              className="h-14 w-auto max-w-[100px] object-contain print:h-12"
                              fallback={
                                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-600 bg-blue-900 text-[8px] font-black tracking-tighter text-yellow-300">
                                  PILIPINAS
                                </div>
                              }
                              sources={[
                                ...(bagongPilipinasLogoUrl ? [bagongPilipinasLogoUrl] : []),
                                '/images/bagong_pilipinas_logo.png',
                                'images/bagong_pilipinas_logo.png',
                                '/images/bagong-pilipinas.png',
                                '/images/bagong pilipinas logo.png',
                                '/images/Bagong Pilipinas Logo.png',
                                '/images/bagong-pilipinas-logo.png',
                                '/images/bagong_pilipinas.png',
                                '/images/Bagong Pilipinas.png',
                                '/images/bagong-pilipinas.jpg',
                              ]}
                            />
                          </div>
                        </div>

                        {/* Date */}
                        <div className="mt-8 text-sm font-normal text-black print:mt-4">
                          {letterDate}
                        </div>

                        {/* Addressee */}
                        <div className="mt-7 text-sm font-normal leading-relaxed text-black print:mt-4">
                          <div className="font-bold tracking-tight">{pageHeader.recipientName}</div>
                          <div>{pageHeader.recipientTitle}</div>
                          <div>{pageHeader.bankBranch}</div>
                          <div>{pageHeader.bankAddressLine1}</div>
                          <div>{pageHeader.bankAddressLine2}</div>
                        </div>

                        {/* Salutation */}
                        <div className="mt-6 text-sm text-black print:mt-3">
                          Dear <span className="font-bold">{pageHeader.salutationName}</span>:
                        </div>

                        {/* Introductory Body Message (Editable) */}
                        <div
                          className={`group relative mt-5 rounded-xs p-1 transition-colors ${
                            canEditLetterDetails
                              ? 'cursor-pointer hover:bg-indigo-50/70 hover:ring-1 hover:ring-indigo-300 dark:hover:bg-indigo-900/20'
                              : ''
                          } print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3`}
                          onClick={canEditLetterDetails ? focusIntroEditor : undefined}
                          title={canEditLetterDetails ? 'Click to edit introductory message' : undefined}
                        >
                          {canEditLetterDetails && (
                            <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-indigo-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Edit Message</span>
                            </div>
                          )}
                          {renderFormattedMessage(introMessage, 'space-y-3 print:space-y-2')}
                        </div>
                      </>
                    ) : (
                      /* Continuation Page Header */
                      <div className="mb-4 flex items-center justify-between border-b border-black pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-tight text-black">
                            DSWD Field Office Caraga
                          </span>
                          <span className="text-slate-400 print:text-black">|</span>
                          <span className="text-slate-700 print:text-black">
                            Endorsement for Transfer of Fund (Continuation)
                          </span>
                        </div>
                        <div className="font-medium text-slate-700 print:text-black">
                          {letterDate}
                        </div>
                      </div>
                    )}

                    {/* Beneficiaries Table (7 columns matching official sample form) */}
                    <div className="mt-4 overflow-x-auto print:mt-2.5">
                      <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead>
                          <tr className="border-b border-black bg-slate-50 font-bold text-black print:bg-transparent">
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '8%' }}>
                              Item No.
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '20%' }}>
                              Address
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '16%' }}>
                              Household ID Number
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '14%' }}>
                              Old Card Number
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '14%' }}>
                              Old Cardholder Name
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '14%' }}>
                              New Card Number
                            </th>
                            <th className="px-2 py-2 text-center" style={{ width: '14%' }}>
                              New Cardholder Name
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
                                  {row.old_card_number || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 text-left font-medium">
                                  {row.old_cardholder_name || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 font-mono">
                                  {row.new_card_number || ''}
                                </td>
                                <td className="px-2 py-1.5 text-left font-medium">
                                  {row.new_cardholder_name || ''}
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
                              ? 'cursor-pointer hover:bg-indigo-50/70 hover:ring-1 hover:ring-indigo-300 dark:hover:bg-indigo-900/20'
                              : ''
                          } print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3`}
                          onClick={canEditLetterDetails ? focusClosingEditor : undefined}
                          title={canEditLetterDetails ? 'Click to edit closing request message' : undefined}
                        >
                          {canEditLetterDetails && (
                            <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-indigo-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Edit Request Message</span>
                            </div>
                          )}
                          {renderFormattedMessage(closingMessage, 'space-y-3 print:space-y-1.5')}
                        </div>

                        {/* Signatory Block */}
                        <div className="mt-8 text-sm text-black print:mt-5">
                          <div>Sincerely yours,</div>

                          <div className="mt-14 print:mt-9">
                            <div className="font-bold tracking-wide text-black">{signatoryName}</div>
                            <div className="text-xs text-black">{signatoryTitle}</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Dynamic Footer with Page & DSWD Contact Info */}
                  <footer className="paper-footer mt-auto pt-3 text-center text-[10px] text-slate-700 print:absolute print:bottom-0 print:left-0 print:right-0 print:w-full print:m-0 print:border-none print:p-0 print:text-black">
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
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}

