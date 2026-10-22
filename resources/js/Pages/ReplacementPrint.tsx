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

The following beneficiary has lost/stolen, damaged/defective, perforated, compromised, or change of basic information in cash card:`;

const DEFAULT_CLOSING_MESSAGE = `With this, we would like to endorse the request of the above beneficiary for **CASH CARD REPLACEMENT** and further **TRANSFER OF FUND** to new account.

Attached herewith are the requirements such as duly accomplished ACRUF, affidavit of loss / damaged card / birth/marriage certificate, and photocopy of 4Ps ID.

We are hoping to receive a report on the **new cash card number and the amount transferred from old to new cash card account within nine (9) banking days** from receipt of this request based on the said guideline.

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

type ReplacementRecord = PrintRecordWithBranch & {
  id: number;
  item_no: string | null;
  address: string | null;
  household_id_number: string | null;
  name: string | null;
  card_number: string | null;
  reason_of_request: string | null;
  status: string | null;
  remarks: string | null;
};

type ReplacementPrintProps = {
  records?: ReplacementRecord[];
  branchDirectories?: LbpBranchDirectoryEntry[];
  defaultDate?: string;
  search?: string;
  dswdLogoUrl?: string;
  bagongPilipinasLogoUrl?: string;
};

function SmartImage({
  sources,
  alt,
  className,
  fallback,
}: {
  sources: string[];
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentIdx(0);
    setFailed(false);
  }, [sources]);

  if (failed || sources.length === 0 || currentIdx >= sources.length) {
    return <>{fallback || null}</>;
  }

  const currentSrc = sources[currentIdx];

  return (
    <img
      alt={alt}
      className={className}
      onError={() => {
        if (currentIdx + 1 < sources.length) {
          setCurrentIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      src={currentSrc}
    />
  );
}

export default function ReplacementPrint({
  records = [],
  branchDirectories,
  defaultDate = 'October 10, 2026',
  search = '',
  dswdLogoUrl,
  bagongPilipinasLogoUrl,
}: ReplacementPrintProps) {
  const { props } = usePage<{ auth?: { user?: { is_admin?: boolean; permissions?: Record<string, boolean> } | null } }>();
  const canEditLetterDetails = Boolean(
    props?.auth?.user?.is_admin || props?.auth?.user?.permissions?.edit_print_forms
  );

  const [zoomLevel, setZoomLevel] = useState(80);
  const [rowsPerPageFirst, setRowsPerPageFirst] = useState(6);
  const [rowsPerPageSubsequent, setRowsPerPageSubsequent] = useState(13);

  // Editable Letter & Header Details
  const [letterDate, setLetterDate] = useState(defaultDate);
  const [signatoryName, setSignatoryName] = useState('MARI-FLOR A. DOLLAGA-LIBANG');
  const [signatoryTitle, setSignatoryTitle] = useState('Regional Director');

  // Editable Letter Messages
  const [introMessage, setIntroMessage] = useState(DEFAULT_INTRO_MESSAGE);
  const [closingMessage, setClosingMessage] = useState(DEFAULT_CLOSING_MESSAGE);

  // Editor toggle state
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const introInputRef = useRef<HTMLTextAreaElement>(null);
  const closingInputRef = useRef<HTMLTextAreaElement>(null);

  const fallbackBlankRows: ReplacementRecord[] = useMemo(
    () => [
      {
        id: 1,
        item_no: '1',
        address: 'Poblacion, Esperanza, Agusan del Sur',
        household_id_number: '160303001-0001',
        name: 'SANTOS, MARIA CLARA D.',
        card_number: '1114-5521-9012',
        reason_of_request: 'Damaged / Defective card',
        status: 'Pending',
        remarks: null,
      },
      {
        id: 2,
        item_no: '2',
        address: 'Taglatawan, Bayugan City, Agusan del Sur',
        household_id_number: '160302005-0042',
        name: 'DELA CRUZ, JUAN P.',
        card_number: '1114-8842-1234',
        reason_of_request: 'Lost / Stolen cash card',
        status: 'Pending',
        remarks: null,
      },
      {
        id: 3,
        item_no: '3',
        address: 'Doongan, Butuan City, Agusan del Norte',
        household_id_number: '160201012-0089',
        name: 'ALVAREZ, GLORIA R.',
        card_number: '1114-9901-7765',
        reason_of_request: 'Perforated / Compromised card',
        status: 'Pending',
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
    singlePageMaxRows: rowsPerPageFirst,
    rowsPerPageFirst,
    rowsPerPageOther: rowsPerPageSubsequent,
  });

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

  const handleResetIntro = () => {
    setIntroMessage(DEFAULT_INTRO_MESSAGE);
  };

  const handleResetClosing = () => {
    setClosingMessage(DEFAULT_CLOSING_MESSAGE);
  };

  const applyBoldToSelection = (
    textarea: HTMLTextAreaElement | null,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    if (start === end) {
      const nextText = val.slice(0, start) + '**bold text**' + val.slice(end);
      setter(nextText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 11);
      }, 50);
      return;
    }

    const selectedText = val.slice(start, end);
    const isAlreadyBold = selectedText.startsWith('**') && selectedText.endsWith('**');
    let replacement = '';
    if (isAlreadyBold) {
      replacement = selectedText.slice(2, -2);
    } else {
      replacement = `**${selectedText}**`;
    }

    const nextText = val.slice(0, start) + replacement + val.slice(end);
    setter(nextText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 50);
  };

  const focusIntroEditor = () => {
    if (!canEditLetterDetails) return;
    setIsEditorOpen(true);
    setTimeout(() => {
      introInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      introInputRef.current?.focus();
    }, 150);
  };

  const focusClosingEditor = () => {
    if (!canEditLetterDetails) return;
    setIsEditorOpen(true);
    setTimeout(() => {
      closingInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      closingInputRef.current?.focus();
    }, 150);
  };

  return (
    <>
      <Head title="Card Replacement Endorsement Form - DSWD Caraga" />

      {/* Screen styling & Print media query */}
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
            background-color: white !important;
            color: black !important;
            font-size: 11pt;
            line-height: 1.35;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, .screen-controls {
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

      <div className="min-h-screen bg-slate-100 font-sans text-slate-800 dark:bg-slate-900 dark:text-slate-100 print:bg-white print:text-black">
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
                    Card Replacement Endorsement Form
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
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-95 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer"
                disabled={zoomLevel <= 50}
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                title="Zoom Out"
                type="button"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                className="min-w-[3.2rem] px-1 py-0.5 text-center text-xs font-bold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 cursor-pointer"
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
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95 cursor-pointer"
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
                  <Edit3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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

          {/* Quick Customization Drawer / Modal */}
          {canEditLetterDetails && isEditorOpen && (
            <div className="mx-auto mt-3 max-w-6xl rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="mb-2.5 flex items-center justify-between font-bold text-blue-900 dark:text-blue-200">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                    onChange={(e) => setRowsPerPageFirst(Math.max(1, parseInt(e.target.value, 10) || 6))}
                    type="number"
                    value={rowsPerPageFirst}
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Default 6. Fits beneficiaries on Page 1 with requirements & SLA notice.
                  </p>
                </div>
              </div>

              {/* Editable Intro and Closing Message Sections */}
              <div className="mt-4 border-t border-blue-200/80 pt-4 dark:border-blue-900/50">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Intro Message Editor */}
                  <div className="flex flex-col">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Introductory Message (Top Paragraphs)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
                          onClick={() => applyBoldToSelection(introInputRef.current, setIntroMessage)}
                          title="Wrap selection in bold (**text**)"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                          onClick={handleResetIntro}
                          title="Reset to official default intro message"
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
                      placeholder="Enter introductory paragraphs..."
                      rows={4}
                      value={introMessage}
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Separate paragraphs with a blank line.</span>
                      <button
                        className="text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
                        onClick={focusIntroEditor}
                        type="button"
                      >
                        Click text in preview to edit
                      </button>
                    </div>
                  </div>

                  {/* Closing Message Editor */}
                  <div className="flex flex-col">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Closing Endorsement Statements (Bottom Endorsement & SLA)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
                          onClick={() => applyBoldToSelection(closingInputRef.current, setClosingMessage)}
                          title="Wrap selection in bold (**text**)"
                          type="button"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </button>
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
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
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Quick bold:</span>
                        <button
                          className="rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/60 dark:text-blue-200 cursor-pointer"
                          onClick={() =>
                            setClosingMessage((prev) =>
                              prev.includes('**CASH CARD REPLACEMENT**')
                                ? prev
                                : prev.replace(/CASH CARD REPLACEMENT/g, '**CASH CARD REPLACEMENT**')
                            )
                          }
                          type="button"
                        >
                          **CASH CARD REPLACEMENT**
                        </button>
                        <button
                          className="rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/60 dark:text-blue-200 cursor-pointer"
                          onClick={() =>
                            setClosingMessage((prev) =>
                              prev.includes('**TRANSFER OF FUND**')
                                ? prev
                                : prev.replace(/TRANSFER OF FUND/g, '**TRANSFER OF FUND**')
                            )
                          }
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
                              ? 'cursor-pointer hover:bg-purple-50/70 hover:ring-1 hover:ring-purple-300 dark:hover:bg-purple-900/20'
                              : ''
                          } print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-3`}
                          onClick={canEditLetterDetails ? focusIntroEditor : undefined}
                          title={canEditLetterDetails ? 'Click to edit intro message' : undefined}
                        >
                          {canEditLetterDetails && (
                            <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-purple-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
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
                            Endorsement for Cash Card Replacement & Transfer of Fund (Continuation)
                          </span>
                        </div>
                        <div className="font-medium text-slate-700 print:text-black">
                          {letterDate}
                        </div>
                      </div>
                    )}

                    {/* Beneficiaries Table - 6 Columns matching image 2 */}
                    <div className={`${!pageItem.isFirstPage && pageItem.hideHeaderFooter ? 'mt-0 print:mt-0' : 'mt-4 print:mt-2.5'} overflow-x-auto`}>
                      <table className="w-full border-collapse border border-black text-center text-xs">
                        <thead>
                          <tr className="border-b border-black bg-slate-50 font-bold text-black print:bg-transparent">
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '7%' }}>
                              Item No.
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '23%' }}>
                              Address
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '18%' }}>
                              Household ID Number
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '20%' }}>
                              Name/ Updated Name
                            </th>
                            <th className="border-r border-black px-2 py-2 text-center" style={{ width: '17%' }}>
                              Card Number
                            </th>
                            <th className="px-2 py-2 text-center" style={{ width: '15%' }}>
                              Reason of Request
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
                                <td className="border-r border-black px-2 py-1.5 text-left font-medium">
                                  {row.name || ''}
                                </td>
                                <td className="border-r border-black px-2 py-1.5 font-mono">
                                  {row.card_number || ''}
                                </td>
                                <td className="px-2 py-1.5 text-left">
                                  {row.reason_of_request || ''}
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
                              ? 'cursor-pointer hover:bg-purple-50/70 hover:ring-1 hover:ring-purple-300 dark:hover:bg-purple-900/20'
                              : ''
                          } print:m-0 print:cursor-default print:p-0 print:hover:bg-transparent print:hover:ring-0 print:mt-4`}
                          onClick={canEditLetterDetails ? focusClosingEditor : undefined}
                          title={canEditLetterDetails ? 'Click to edit closing request text' : undefined}
                        >
                          {canEditLetterDetails && (
                            <div className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-purple-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs group-hover:flex print:hidden">
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Edit Message</span>
                            </div>
                          )}
                          {renderFormattedMessage(closingMessage, 'space-y-3 print:space-y-2')}
                        </div>

                        {/* Signatory Block */}
                        <div className="mt-8 text-sm text-black print:mt-6">
                          <div>Sincerely yours,</div>
                          <div className="mt-12 font-bold tracking-wide uppercase text-black">
                            {signatoryName}
                          </div>
                          <div>{signatoryTitle}</div>
                          <SecondCopySignatoryReference hideHeaderFooter={pageItem.hideHeaderFooter} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Clean Official Footer (No JSP/reference code as requested) */}
                  <footer
                    className={`paper-footer mt-auto pt-4 text-center text-[10px] text-slate-800 print:absolute print:bottom-0 print:left-0 print:right-0 print:w-full print:m-0 print:border-none print:p-0 print:text-black ${pageItem.hideHeaderFooter ? 'hidden print:hidden' : ''}`}
                    style={pageItem.hideHeaderFooter ? { display: 'none' } : undefined}
                  >
                    <div className="text-xs font-semibold text-black">
                      PAGE {currentPageNum} of {pageItem.formTotalPages}
                    </div>
                    <div className="mt-1 text-[9px] leading-tight text-slate-700 print:text-black">
                      DSWD Field Office Caraga, R. Palma St., Butuan City, Philippines, 8600
                      <br />
                      Website:{' '}
                      <span className="underline">https://caraga.dswd.gov.ph</span> Tel Nos.: (085)
                      303-8620 email: focrg@dswd.gov.ph
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

