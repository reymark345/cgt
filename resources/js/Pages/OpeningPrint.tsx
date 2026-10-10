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

The following beneficiary has transferred residence or LBP servicing branch:`;

const DEFAULT_CLOSING_MESSAGE = `With this, we would like to request for **ACCOUNT OPENING** of the above beneficiary.

Attached herewith are the requirements such as duly accomplished enrollment form with recent ID picture, barangay ID/certificate, and photocopy of 4Ps ID.

We are hoping to receive a **report on the new cash card number** within seven (7) banking days from receipt of this request based on the said guideline.

Moreover, we would like to request for **TRANSFER OF FUND** from old account to new account once opened.

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
};

type OpeningPrintProps = {
  records?: OpeningRecord[];
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

export default function OpeningPrint({
  records = [],
  defaultDate,
  search,
  dswdLogoUrl,
  bagongPilipinasLogoUrl,
}: OpeningPrintProps) {
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
  const introInputRef = useRef<HTMLTextAreaElement>(null);
  const closingInputRef = useRef<HTMLTextAreaElement>(null);

  const [introMessage, setIntroMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_opening_intro_message');
      if (saved !== null && saved.trim() !== '') {
        return saved;
      }
    }
    return DEFAULT_INTRO_MESSAGE;
  });

  const [closingMessage, setClosingMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_opening_closing_message');
      if (saved !== null && saved.trim() !== '') {
        return saved;
      }
    }
    return DEFAULT_CLOSING_MESSAGE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_opening_intro_message', introMessage);
    }
  }, [introMessage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgt_opening_closing_message', closingMessage);
    }
  }, [closingMessage]);

  const handleResetIntro = () => {
    setIntroMessage(DEFAULT_INTRO_MESSAGE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cgt_opening_intro_message');
    }
  };

  const handleResetClosing = () => {
    setClosingMessage(DEFAULT_CLOSING_MESSAGE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cgt_opening_closing_message');
    }
  };

  const focusIntroEditor = () => {
    setIsEditorOpen(true);
    setTimeout(() => {
      introInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      introInputRef.current?.focus();
    }, 120);
  };

  const focusClosingEditor = () => {
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

  // Dynamic pagination settings (default 7 rows on Page 1 to utilize available A4 space)
  const [rowsPerPageFirst, setRowsPerPageFirst] = useState<number>(7);
  const [rowsPerPageOther, setRowsPerPageOther] = useState<number>(10);

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Zoom state for on-screen document preview (default 80% to fit comfortably without heavy zoom)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgt_opening_print_zoom');
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
      localStorage.setItem('cgt_opening_print_zoom', String(zoomLevel));
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

  // Only display the available data. If no records are present, provide a single blank row.
  const displayRows =
    records.length > 0
      ? records
      : [
          {
            id: -1,
            item_no: '1',
            address: null,
            household_id_number: null,
            name_of_new_grantee: null,
            name_of_old_grantee: null,
            card_number_of_old: null,
            status_of_old_grantee: null,
            status: null,
            remarks: null,
          },
        ];

  // Chunk displayRows into pages calibrated strictly for A4 format
  const pagesData = useMemo(() => {
    // If all records fit comfortably on Page 1 along with the signatory block (<= 5 rows), single page
    const SINGLE_PAGE_MAX = 5;
    if (displayRows.length <= SINGLE_PAGE_MAX) {
      return [
        {
          pageIndex: 0,
          rows: displayRows,
          globalStartIdx: 0,
          isFirstPage: true,
          isLastPage: true,
        },
      ];
    }

    const pages = [];
    // For multi-page, Page 1 has no signatory, so it can hold up to rowsPerPageFirst (default 7)
    // Ensure the last page has at least 1 table row (so it's never an orphan signature-only page)
    const firstPageLimit = Math.min(rowsPerPageFirst, Math.max(1, displayRows.length - 1));

    // Page 1
    pages.push({
      pageIndex: 0,
      rows: displayRows.slice(0, firstPageLimit),
      globalStartIdx: 0,
      isFirstPage: true,
      isLastPage: false,
    });

    let currentIdx = firstPageLimit;
    let pageNum = 1;

    while (currentIdx < displayRows.length) {
      const nextChunk = displayRows.slice(currentIdx, currentIdx + rowsPerPageOther);
      const isLast = currentIdx + rowsPerPageOther >= displayRows.length;
      pages.push({
        pageIndex: pageNum,
        rows: nextChunk,
        globalStartIdx: currentIdx,
        isFirstPage: false,
        isLastPage: isLast,
      });
      currentIdx += rowsPerPageOther;
      pageNum++;
    }

    return pages;
  }, [displayRows, rowsPerPageFirst, rowsPerPageOther]);

  const totalPages = pagesData.length;

  const getPageInfo = (currentPage: number, total: number) => {
    return `PAGE ${currentPage} of ${total}`;
  };

  return (
    <>
      <Head title="Endorsement Form - Land Bank Account Opening" />

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
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            min-height: 268mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            zoom: 1 !important;
            transform: none !important;
          }
          .printable-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .paper-footer {
            margin-top: auto !important;
            padding-top: 8px !important;
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
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
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
                    LBP Account Opening Form
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
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
                className="min-w-[3.2rem] px-1 py-0.5 text-center text-xs font-bold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
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
                      ? 'bg-white font-bold text-blue-600 shadow-2xs dark:bg-slate-700 dark:text-blue-400'
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => setIsEditorOpen((v) => !v)}
                type="button"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{isEditorOpen ? 'Hide Customizer' : 'Edit Letter Details'}</span>
              </button>

              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95"
                onClick={handlePrint}
                type="button"
              >
                <Printer className="h-4 w-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Collapsible Form Editor Panel */}
          {isEditorOpen && (
            <div className="mx-auto mt-3 max-w-6xl rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="mb-2.5 flex items-center justify-between font-bold text-blue-900 dark:text-blue-200">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Customize Header, Addressee, Messages & Signatory
                </span>
                <button
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  onClick={() => setIsEditorOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

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
                    Default 7. Fits 7 beneficiaries on Page 1 before continuing to Page 2.
                  </p>
                </div>
              </div>

              {/* Section 2: Letter Body Messages (Opening & Closing Requests) */}
              <div className="mt-4 border-t border-blue-200/80 pt-3 dark:border-blue-900/50">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-950 dark:text-blue-200">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Letter Body Messages (Opening &amp; Closing Requests)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[10px] text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">**bold**</code> text formatting &amp; multi-line paragraphs
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
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          onClick={() => applyBoldToTextarea(introInputRef, introMessage, setIntroMessage)}
                          title="Wrap selection with **bold**"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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
                      className="w-full flex-1 rounded-md border border-slate-300 bg-slate-50/50 px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-800 shadow-inner focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800"
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
                          onClick={() => applyBoldToTextarea(closingInputRef, closingMessage, setClosingMessage, 'ACCOUNT OPENING')}
                          title="Wrap selection with **bold**"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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
                      className="w-full flex-1 rounded-md border border-slate-300 bg-slate-50/50 px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-800 shadow-inner focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800"
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
                          className="rounded bg-slate-100 px-1 font-mono text-[9px] text-slate-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300"
                          onClick={() => {
                            setClosingMessage((prev) => prev.includes('**ACCOUNT OPENING**') ? prev : prev.replace(/ACCOUNT OPENING/g, '**ACCOUNT OPENING**'));
                          }}
                          type="button"
                        >
                          **ACCOUNT OPENING**
                        </button>
                        <button
                          className="rounded bg-slate-100 px-1 font-mono text-[9px] text-slate-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300"
                          onClick={() => {
                            setClosingMessage((prev) => prev.includes('**TRANSFER OF FUND**') ? prev : prev.replace(/TRANSFER OF FUND/g, '**TRANSFER OF FUND**'));
                          }}
                          type="button"
                        >
                          **TRANSFER OF FUND**
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

              return (
                <div
                  key={pageItem.pageIndex}
                  className="printable-page relative mx-auto flex w-full max-w-[780px] min-h-[1050px] flex-col justify-between rounded-lg border border-slate-300 bg-white p-8 text-black shadow-xl sm:p-12 print:m-0 print:min-h-[268mm] print:max-w-none print:rounded-none print:border-none print:bg-white print:p-0 print:shadow-none"
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
                              className="h-14 w-auto max-w-[240px] object-contain"
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

                          {/* Bagong Pilipinas Logo - Moved up with -mt-2 to align with top of DSWD banner */}
                          <div className="flex items-center -mt-2 print:-mt-2">
                            <SmartImage
                              alt="Bagong Pilipinas"
                              className="h-14 w-auto max-w-[100px] object-contain"
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
                          className="group relative mt-5 cursor-pointer rounded-xs p-1 transition-colors hover:bg-blue-50/70 hover:ring-1 hover:ring-blue-300 dark:hover:bg-blue-900/20 print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3"
                          onClick={focusIntroEditor}
                          title="Click to edit introductory message"
                        >
                          <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
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
                            Endorsement for LBP Account Opening (Continuation)
                          </span>
                        </div>
                        <div className="font-medium text-slate-700 print:text-black">
                          {letterDate}
                        </div>
                      </div>
                    )}

                    {/* Beneficiaries Table */}
                    <div className="mt-4 overflow-x-auto print:mt-2.5">
                      <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead>
                          <tr className="border-b border-black bg-slate-50 font-bold text-black print:bg-transparent">
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '8%' }}>
                              Item No.
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '22%' }}>
                              Address
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '20%' }}>
                              Household ID Number
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '20%' }}>
                              Name
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '15%' }}>
                              Card Number in Previous LBP Branch
                            </th>
                            <th className="px-2 py-2 text-center" style={{ width: '15%' }}>
                              Card / Account Status
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
                                  {row.name_of_new_grantee || row.name_of_old_grantee || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 font-mono">
                                  {row.card_number_of_old || ''}
                                </td>
                                <td className="px-2 py-1.5">
                                  {row.status_of_old_grantee || row.status || ''}
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
                          className="group relative mt-5 cursor-pointer rounded-xs p-1 transition-colors hover:bg-blue-50/70 hover:ring-1 hover:ring-blue-300 dark:hover:bg-blue-900/20 print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3"
                          onClick={focusClosingEditor}
                          title="Click to edit closing request message"
                        >
                          <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                            <Edit3 className="h-2.5 w-2.5" />
                            <span>Edit Request Message</span>
                          </div>
                          {renderFormattedMessage(closingMessage, 'space-y-3 print:space-y-1.5')}
                        </div>

                        {/* Signatory Block */}
                        <div className="mt-10 text-sm text-black print:mt-6">
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
                  <footer className="paper-footer mt-auto border-t border-slate-300 pt-3 text-center text-[10px] text-slate-700 print:mt-auto print:border-black print:pt-2 print:text-black">
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
