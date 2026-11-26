import { BusinessDetails, QuotationDraft } from '../types/quotation';

const BUSINESS_KEY = 'craftquote_business_v1';
const SEQUENCE_KEY = 'craftquote_sequence_v1';
const DRAFT_KEY = 'craftquote_draft_v1';

export const DEFAULT_BUSINESS: BusinessDetails = {
  companyName: '',
  tagline: 'Bespoke Furniture & Interior Works',
  address: '',
  phone: '',
  email: '',
  gstin: '',
  terms:
    '1. 50% advance upon confirmation, 40% before dispatch/installation, 10% on handover.\n2. Quotation valid for 15 days from issue date.\n3. Standard carpentry & hardware warranty applies as per material specification.',
  currencySymbol: '₹',
};

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatQuotationNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `QT-${year}-${String(seq).padStart(3, '0')}`;
}

export function loadBusinessDetails(): { details: BusinessDetails; isSaved: boolean } {
  try {
    const raw = localStorage.getItem(BUSINESS_KEY);
    if (!raw) {
      return { details: DEFAULT_BUSINESS, isSaved: false };
    }
    const parsed = JSON.parse(raw) as Partial<BusinessDetails>;
    return {
      details: { ...DEFAULT_BUSINESS, ...parsed },
      isSaved: Boolean(parsed.companyName?.trim()),
    };
  } catch {
    return { details: DEFAULT_BUSINESS, isSaved: false };
  }
}

export function saveBusinessDetails(details: BusinessDetails): void {
  try {
    localStorage.setItem(BUSINESS_KEY, JSON.stringify(details));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCurrentSequence(): number {
  try {
    const raw = localStorage.getItem(SEQUENCE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  } catch {
    return 1;
  }
}

export function incrementSequence(): number {
  const next = getCurrentSequence() + 1;
  try {
    localStorage.setItem(SEQUENCE_KEY, String(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function createEmptyDraft(quotationNumber: string): QuotationDraft {
  return {
    customer: {
      name: '',
      mobile: '',
      projectName: '',
      siteAddress: '',
    },
    meta: {
      quotationNumber,
      date: todayIsoDate(),
      validUntil: addDaysIsoDate(15),
      notes: '',
    },
    items: [],
    discountType: 'percent',
    discountValue: 0,
    gstPercent: 18,
  };
}

export function loadDraft(): QuotationDraft {
  const seq = getCurrentSequence();
  const defaultNum = formatQuotationNumber(seq);
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return createEmptyDraft(defaultNum);
    }
    const parsed = JSON.parse(raw) as Partial<QuotationDraft>;
    const empty = createEmptyDraft(defaultNum);
    return {
      customer: { ...empty.customer, ...(parsed.customer || {}) },
      meta: { ...empty.meta, ...(parsed.meta || {}) },
      items: Array.isArray(parsed.items) ? parsed.items : [],
      discountType: parsed.discountType === 'flat' ? 'flat' : 'percent',
      discountValue: typeof parsed.discountValue === 'number' ? parsed.discountValue : 0,
      gstPercent: typeof parsed.gstPercent === 'number' ? parsed.gstPercent : 18,
    };
  } catch {
    return createEmptyDraft(defaultNum);
  }
}

export function saveDraft(draft: QuotationDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors
  }
}
