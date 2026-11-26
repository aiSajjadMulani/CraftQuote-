import { useEffect, useMemo, useState } from 'react';
import { Download, FilePlus2, FileText, PenLine } from 'lucide-react';
import { QuotationBuilder } from './components/QuotationBuilder';
import { QuotationPreview } from './components/QuotationPreview';
import { BusinessDetails, QuotationDraft } from './types/quotation';
import { calculateQuotationTotals, formatCurrency } from './utils/calculations';
import { generateQuotationPdf } from './utils/pdfGenerator';
import {
  createEmptyDraft,
  formatQuotationNumber,
  incrementSequence,
  loadBusinessDetails,
  loadDraft,
  saveBusinessDetails,
  saveDraft,
} from './utils/storage';

type ViewMode = 'split' | 'builder' | 'preview';

export default function App() {
  const initialBiz = useMemo(() => loadBusinessDetails(), []);
  const [business, setBusiness] = useState<BusinessDetails>(initialBiz.details);
  const [isBusinessSaved, setIsBusinessSaved] = useState<boolean>(initialBiz.isSaved);
  const [draft, setDraft] = useState<QuotationDraft>(() => loadDraft());
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [mobileTab, setMobileTab] = useState<'builder' | 'preview'>('builder');
  const [confirmNewQuote, setConfirmNewQuote] = useState<boolean>(false);

  // Auto-persist active draft to localStorage
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  // Auto-persist business details when updated if already saved once
  const handleUpdateBusiness = (updated: BusinessDetails) => {
    setBusiness(updated);
    if (isBusinessSaved) {
      saveBusinessDetails(updated);
    }
  };

  const handleSaveBusiness = () => {
    saveBusinessDetails(business);
    setIsBusinessSaved(true);
  };

  const handleNextQuotationNumber = () => {
    const nextSeq = incrementSequence();
    const nextNum = formatQuotationNumber(nextSeq);
    setDraft((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        quotationNumber: nextNum,
      },
    }));
  };

  const handleStartNewQuotation = () => {
    if (draft.items.length > 0 && !confirmNewQuote) {
      setConfirmNewQuote(true);
      return;
    }
    const nextSeq = incrementSequence();
    const nextNum = formatQuotationNumber(nextSeq);
    setDraft(createEmptyDraft(nextNum));
    setConfirmNewQuote(false);
    setMobileTab('builder');
  };

  const totals = useMemo(
    () =>
      calculateQuotationTotals(
        draft.items,
        draft.discountType,
        draft.discountValue,
        draft.gstPercent
      ),
    [draft.items, draft.discountType, draft.discountValue, draft.gstPercent]
  );

  const sym = business.currencySymbol || '₹';

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F1] text-[#1A1916]">
      {/* Top Bar (Strict 3-zone contract) */}
      <header className="no-print sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-[#E5E3DD]">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('split');
              setMobileTab('builder');
            }}
            className="font-display text-lg font-bold tracking-tight text-[#1E3A34] whitespace-nowrap shrink-0"
          >
            CraftQuote
          </a>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#5C5A54]">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hover:text-[#1A1916] transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'split'
                  ? 'text-[#1A1916] underline underline-offset-8 decoration-2 decoration-[#1E3A34]'
                  : ''
              }`}
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={() => setViewMode('builder')}
              className={`hover:text-[#1A1916] transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'builder'
                  ? 'text-[#1A1916] underline underline-offset-8 decoration-2 decoration-[#1E3A34]'
                  : ''
              }`}
            >
              Quotation Builder
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`hover:text-[#1A1916] transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'preview'
                  ? 'text-[#1A1916] underline underline-offset-8 decoration-2 decoration-[#1E3A34]'
                  : ''
              }`}
            >
              PDF Layout
            </button>
            <button
              type="button"
              onClick={handleStartNewQuotation}
              className="hover:text-[#1A1916] transition-colors whitespace-nowrap shrink-0"
            >
              New Quote
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => generateQuotationPdf(business, draft, totals)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A34] hover:bg-[#162C27] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Inline New Quotation Confirmation Banner (when triggered with existing items) */}
      {confirmNewQuote && (
        <div className="no-print bg-[#EEF3F1] border-b border-[#D2DFDA] px-4 sm:px-6 py-2.5">
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-[#1E3A34]">
              Start a fresh quotation? This clears current customer details and items while keeping your saved business profile.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmNewQuote(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#5C5A54] hover:text-[#1A1916] bg-white border border-[#DCD9D0] rounded-md transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartNewQuotation}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#1E3A34] hover:bg-[#162C27] rounded-md transition-colors whitespace-nowrap"
              >
                Confirm New Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile / Tablet Switcher & Quick Summary */}
      <div className="no-print lg:hidden bg-white border-b border-[#E5E3DD] px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex p-1 bg-[#F6F5F1] rounded-lg border border-[#E5E3DD]">
            <button
              type="button"
              onClick={() => setMobileTab('builder')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mobileTab === 'builder'
                  ? 'bg-white text-[#1A1916] shadow-xs'
                  : 'text-[#5C5A54]'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Create Quote
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mobileTab === 'preview'
                  ? 'bg-white text-[#1A1916] shadow-xs'
                  : 'text-[#5C5A54]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              PDF Layout
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#1E3A34]">
              {formatCurrency(totals.grandTotal, sym)}
            </span>
            <button
              type="button"
              onClick={handleStartNewQuotation}
              aria-label="New Quotation"
              className="p-2 text-[#5C5A54] hover:text-[#1A1916] bg-[#F6F5F1] rounded-lg transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        <div
          className={`grid gap-6 items-start ${
            viewMode === 'split'
              ? 'grid-cols-1 lg:grid-cols-12'
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}
        >
          {/* Quotation Creation Page */}
          {(viewMode === 'split' || viewMode === 'builder') && (
            <div
              className={`no-print ${
                viewMode === 'split' ? 'lg:col-span-6 xl:col-span-6' : ''
              } ${mobileTab === 'builder' ? 'block' : 'hidden lg:block'}`}
            >
              <QuotationBuilder
                business={business}
                isBusinessSaved={isBusinessSaved}
                onUpdateBusiness={handleUpdateBusiness}
                onSaveBusiness={handleSaveBusiness}
                draft={draft}
                onUpdateDraft={setDraft}
                onNextQuotationNumber={handleNextQuotationNumber}
                totals={totals}
              />
            </div>
          )}

          {/* Quotation PDF Layout */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div
              className={`${
                viewMode === 'split'
                  ? 'lg:col-span-6 xl:col-span-6 lg:sticky lg:top-20'
                  : ''
              } ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}
            >
              <QuotationPreview business={business} draft={draft} totals={totals} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
