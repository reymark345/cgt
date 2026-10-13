import { Head } from '@inertiajs/react';
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

const DEFAULT_INTRO_MESSAGE = `This is in connection with the implementation of the Pantawid Pamilyang Pilipino Program for the distribution of cash grants and in accordance with the new guidelines signed on June 7, 2022.

We would like to endorse the following beneficiary to be tagged as **LOCKED** for security purposes.`;

const DEFAULT_CLOSING_MESSAGE = `Thank you very much for your continued support.`;

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

type LockingRecord = {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name: string | null;
  card_number: string | null;
  status: string | null;
  remarks: string | null;
};

type LockingPrintProps = {
  records?: LockingRecord[];
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

export default function LockingPrint({
  records = [],
  defaultDate,
  search,
  dswdLogoUrl,
  bagongPilipinasLogoUrl,
}: LockingPrintProps) {
  // Document customization state (prefilled exactly matching the official sample)
  const [letterDate, setLetterDate] = useState(
    defaultDate ||
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
      })
  );
  const [recipientName, setRecipientName] = useState('MS. EMELITA I. ESCALANTE');
  const [recipientTitle, setRecipientTitle] = useState('Branch Head');
  const [bankBranch, setBankBranch] = useState('Land Bank of the Philippines - Butuan Branch');
  const [bankAddressLine1, setBankAddressLine1] = useState('Ong Hoc Building, Montilla Blvd. Cor. P. Burgoz St.,');
  const [bankAddressLine2, setBankAddressLine2] = useState('Butuan City');
  const [salutationName, setSalutationName] = useState('Ms. Escalante');
  const [signatoryName, setSignatoryName] = useState('MARI-FLOR A. DOLLAGA-LIBANG');
  const [signatoryTitle, setSignatoryTitle] = useState('Regional Director');

  // Letter body message states with localStorage persistence
  const [introMessage, setIntroMessage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_locking_print_intro');
      if (saved) return saved;
    }
    return DEFAULT_INTRO_MESSAGE;
  });

  const [closingMessage, setClosingMessage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_locking_print_closing');
      if (saved) return saved;
    }
    return DEFAULT_CLOSING_MESSAGE;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(80);

  const introInputRef = useRef<HTMLTextAreaElement>(null);
  const closingInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync state changes with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cgt_locking_print_intro', introMessage);
    } catch {
      // ignore
    }
  }, [introMessage]);

  useEffect(() => {
    try {
      localStorage.setItem('cgt_locking_print_closing', closingMessage);
    } catch {
      // ignore
    }
  }, [closingMessage]);

  const handleResetIntro = () => {
    setIntroMessage(DEFAULT_INTRO_MESSAGE);
  };

  const handleResetClosing = () => {
    setClosingMessage(DEFAULT_CLOSING_MESSAGE);
  };

  const handleResetAll = () => {
    setIntroMessage(DEFAULT_INTRO_MESSAGE);
    setClosingMessage(DEFAULT_CLOSING_MESSAGE);
    setRecipientName('MS. EMELITA I. ESCALANTE');
    setRecipientTitle('Branch Head');
    setBankBranch('Land Bank of the Philippines - Butuan Branch');
    setBankAddressLine1('Ong Hoc Building, Montilla Blvd. Cor. P. Burgoz St.,');
    setBankAddressLine2('Butuan City');
    setSalutationName('Ms. Escalante');
    setSignatoryName('MARI-FLOR A. DOLLAGA-LIBANG');
    setSignatoryTitle('Regional Director');
  };

  const focusIntroEditor = () => {
    setIsCustomizing(true);
    setTimeout(() => {
      introInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      introInputRef.current?.focus();
    }, 120);
  };

  const focusClosingEditor = () => {
    setIsCustomizing(true);
    setTimeout(() => {
      closingInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      closingInputRef.current?.focus();
    }, 120);
  };

  // Provide blank rows if no records exist so form renders like official template
  const rowsToDisplay: LockingRecord[] = useMemo(() => {
    if (records && records.length > 0) {
      return records;
    }
    return [
      {
        id: 1,
        item_no: '1',
        address: '',
        household_id_number: '',
        name: '',
        card_number: '',
        status: '',
        remarks: '',
      },
      {
        id: 2,
        item_no: '2',
        address: '',
        household_id_number: '',
        name: '',
        card_number: '',
        status: '',
        remarks: '',
      },
      {
        id: 3,
        item_no: '3',
        address: '',
        household_id_number: '',
        name: '',
        card_number: '',
        status: '',
        remarks: '',
      },
    ];
  }, [records]);

  // Pagination calculation: Page 1 holds up to 10 rows (with header & intro).
  // Subsequent continuation pages hold up to 16 rows.
  const FIRST_PAGE_ROWS = 10;
  const CONTINUATION_PAGE_ROWS = 16;

  const pagesData = useMemo(() => {
    if (rowsToDisplay.length <= FIRST_PAGE_ROWS) {
      return [
        {
          pageIndex: 0,
          rows: rowsToDisplay,
          isFirstPage: true,
          isLastPage: true,
          globalStartIdx: 0,
        },
      ];
    }

    const pages = [];
    const firstPageRows = rowsToDisplay.slice(0, FIRST_PAGE_ROWS);
    pages.push({
      pageIndex: 0,
      rows: firstPageRows,
      isFirstPage: true,
      isLastPage: false,
      globalStartIdx: 0,
    });

    let currentIdx = FIRST_PAGE_ROWS;
    let pageCount = 1;

    while (currentIdx < rowsToDisplay.length) {
      const remainingRows = rowsToDisplay.slice(currentIdx, currentIdx + CONTINUATION_PAGE_ROWS);
      const isLast = currentIdx + CONTINUATION_PAGE_ROWS >= rowsToDisplay.length;
      pages.push({
        pageIndex: pageCount,
        rows: remainingRows,
        isFirstPage: false,
        isLastPage: isLast,
        globalStartIdx: currentIdx,
      });
      currentIdx += CONTINUATION_PAGE_ROWS;
      pageCount++;
    }

    return pages;
  }, [rowsToDisplay]);

  const totalPages = pagesData.length;

  const handlePrint = () => {
    window.print();
  };

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

  const getPageInfo = (pageNum: number, total: number) => {
    return `PAGE ${pageNum} of ${total}`;
  };

  return (
    <>
      <Head title={`Locking Endorsement - DSWD Caraga`} />

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin-top: 12mm;
            margin-bottom: 8mm;
            margin-left: 14mm;
            margin-right: 14mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
            min-height: 272mm !important;
            height: 272mm !important;
            max-height: 272mm !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            padding-bottom: 22mm !important;
          }
          .printable-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
          .paper-scale-container {
            zoom: 100% !important;
            transform: none !important;
          }
          .paper-footer {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            padding: 0 !important;
          }
        }
        @media screen {
          .printable-page {
            font-family: Arial, Helvetica, sans-serif !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100 print:bg-white print:p-0">
        {/* Screen Toolbar / Header */}
        <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 print:hidden">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            {/* Left Section: Close & Document Title */}
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
                    Locking Endorsement Form
                  </span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                    {records.length > 0
                      ? `${records.length} ${records.length === 1 ? 'Beneficiary' : 'Beneficiaries'} (${totalPages} ${totalPages === 1 ? 'Page' : 'Pages'})`
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
                className="min-w-[3.2rem] px-1 py-0.5 text-center text-xs font-bold text-slate-700 hover:text-rose-600 dark:text-slate-200 dark:hover:text-rose-400"
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
                      ? 'bg-white font-bold text-rose-600 shadow-2xs dark:bg-slate-700 dark:text-rose-400'
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
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-2xs transition ${
                  isCustomizing
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                } cursor-pointer`}
                onClick={() => setIsCustomizing((prev) => !prev)}
                type="button"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isCustomizing ? 'Hide Details' : 'Edit Letter Details'}</span>
              </button>

              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-98 dark:bg-rose-600 dark:hover:bg-rose-500 cursor-pointer"
                onClick={handlePrint}
                type="button"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Form Customization Drawer */}
          {isCustomizing && (
            <div className="mx-auto mt-3 max-w-6xl rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-inner dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex items-center justify-between border-b border-rose-200/80 pb-2.5 dark:border-rose-900/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">
                    Form Layout & Content Customizer
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-rose-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-rose-900/40"
                    onClick={handleResetAll}
                    title="Reset all form fields to default"
                    type="button"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset All Defaults</span>
                  </button>
                  <button
                    className="rounded-md p-1 text-slate-400 hover:bg-rose-100 hover:text-slate-700 dark:hover:bg-rose-900/40"
                    onClick={() => setIsCustomizing(false)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Letter Metadata */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Letter Header & Date
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Date on Letter</label>
                    <input
                      className="mt-0.5 h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 font-sans text-xs text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setLetterDate(e.target.value)}
                      type="text"
                      value={letterDate}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Salutation Name</label>
                    <input
                      className="mt-0.5 h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 font-sans text-xs text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setSalutationName(e.target.value)}
                      placeholder="e.g. Ms. Escalante"
                      type="text"
                      value={salutationName}
                    />
                  </div>
                </div>

                {/* Recipient Bank Details */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Addressee / Bank Branch
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Recipient Name</label>
                    <input
                      className="mt-0.5 h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 font-sans text-xs font-semibold text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setRecipientName(e.target.value)}
                      type="text"
                      value={recipientName}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Recipient Title & Branch</label>
                    <input
                      className="mt-0.5 h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 font-sans text-xs text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setRecipientTitle(e.target.value)}
                      placeholder="Title"
                      type="text"
                      value={recipientTitle}
                    />
                    <input
                      className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 font-sans text-xs text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="Branch name"
                      type="text"
                      value={bankBranch}
                    />
                  </div>
                </div>

                {/* Signatory Info */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Signatory Information
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Signatory Full Name</label>
                    <input
                      className="mt-0.5 h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 font-sans text-xs font-bold text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setSignatoryName(e.target.value)}
                      type="text"
                      value={signatoryName}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Signatory Title</label>
                    <input
                      className="mt-0.5 h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 font-sans text-xs text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      type="text"
                      value={signatoryTitle}
                    />
                  </div>
                </div>

                {/* Custom Body Messages */}
                <div className="col-span-1 sm:col-span-3 grid grid-cols-1 gap-4 pt-2 border-t border-rose-200/80 dark:border-rose-900/50 sm:grid-cols-2">
                  {/* Introductory Message */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                        Introductory Message (Above Table)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900/40"
                          onClick={handleResetIntro}
                          title="Reset to official template default"
                          type="button"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={introInputRef}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 font-sans text-xs leading-relaxed text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setIntroMessage(e.target.value)}
                      rows={5}
                      value={introMessage}
                    />
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Tip: Wrap text in **bold** to emphasize keywords.</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400">Quick bold:</span>
                        <button
                          className="rounded bg-slate-100 px-1 font-mono text-[9px] text-slate-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-slate-800 dark:text-slate-300"
                          onClick={() => {
                            setIntroMessage((prev) => prev.includes('**LOCKED**') ? prev : prev.replace(/LOCKED/g, '**LOCKED**'));
                          }}
                          type="button"
                        >
                          **LOCKED**
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Closing Request Message */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                        Closing Message (Below Table)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900/40"
                          onClick={handleResetClosing}
                          title="Reset to official template default"
                          type="button"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={closingInputRef}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 font-sans text-xs leading-relaxed text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      onChange={(e) => setClosingMessage(e.target.value)}
                      rows={5}
                      value={closingMessage}
                    />
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Separate paragraphs with a blank line.</span>
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

              return (
                <div
                  key={pageItem.pageIndex}
                  className="printable-page relative mx-auto flex w-full max-w-[780px] min-h-[1050px] flex-col justify-between rounded-lg border border-slate-300 bg-white p-8 text-black shadow-xl sm:p-12 print:relative print:m-0 print:h-[272mm] print:min-h-[272mm] print:max-h-[272mm] print:max-w-none print:rounded-none print:border-none print:bg-white print:p-0 print:pb-[22mm] print:shadow-none print:overflow-hidden"
                >
                  <div className="flex-1">
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
                          <div className="font-bold tracking-tight">{recipientName}</div>
                          <div>{recipientTitle}</div>
                          <div>{bankBranch}</div>
                          <div>{bankAddressLine1}</div>
                          <div>{bankAddressLine2}</div>
                        </div>

                        {/* Salutation */}
                        <div className="mt-6 text-sm text-black print:mt-3">
                          Dear <span className="font-bold">{salutationName}</span>:
                        </div>

                        {/* Introductory Body Message (Editable) */}
                        <div
                          className="group relative mt-5 cursor-pointer rounded-xs p-1 transition-colors hover:bg-rose-50/70 hover:ring-1 hover:ring-rose-300 dark:hover:bg-rose-900/20 print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3"
                          onClick={focusIntroEditor}
                          title="Click to edit introductory message"
                        >
                          <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-rose-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                            <Edit3 className="h-2.5 w-2.5" />
                            <span>Edit Message</span>
                          </div>
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
                            Endorsement for Card Locking (Continuation)
                          </span>
                        </div>
                        <div className="font-medium text-slate-700 print:text-black">
                          {letterDate}
                        </div>
                      </div>
                    )}

                    {/* Beneficiaries Table (5 columns matching official sample form) */}
                    <div className="mt-4 overflow-x-auto print:mt-2.5">
                      <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead>
                          <tr className="border-b border-black bg-slate-50 font-bold text-black print:bg-transparent">
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '8%' }}>
                              Item No.
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '32%' }}>
                              Address
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '20%' }}>
                              Household ID Number
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '22%' }}>
                              Name
                            </th>
                            <th className="px-2 py-2 text-center" style={{ width: '18%' }}>
                              Card Number
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItem.rows.map((row, idx) => {
                            const itemNo = row.item_no || String(pageItem.globalStartIdx + idx + 1);
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
                                <td className="border-r border-black px-2 py-1.5 text-left font-medium">
                                  {row.name || ''}
                                </td>
                                <td className="px-2 py-1.5 font-mono">
                                  {row.card_number || ''}
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
                          className="group relative mt-5 cursor-pointer rounded-xs p-1 transition-colors hover:bg-rose-50/70 hover:ring-1 hover:ring-rose-300 dark:hover:bg-rose-900/20 print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3"
                          onClick={focusClosingEditor}
                          title="Click to edit closing request message"
                        >
                          <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-rose-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                            <Edit3 className="h-2.5 w-2.5" />
                            <span>Edit Request Message</span>
                          </div>
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

                  {/* Dynamic Footer with Page & DSWD Contact Info (Strictly without any JSP reference code) */}
                  <footer className="paper-footer mt-auto pt-3 text-center text-[10px] text-slate-700 print:absolute print:bottom-0 print:left-0 print:right-0 print:w-full print:m-0 print:border-none print:p-0 print:text-black">
                    <div className="font-bold tracking-wider">
                      {getPageInfo(currentPageNum, totalPages)}
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

