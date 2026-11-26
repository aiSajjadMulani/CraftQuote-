export type MeasurementUnit = 'Sq. Ft.' | 'Running Ft.' | 'Nos.' | 'Job';

export type DiscountType = 'percent' | 'flat';

export interface BusinessDetails {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  terms: string;
  currencySymbol: string;
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  projectName: string;
  siteAddress: string;
}

export interface QuotationMeta {
  quotationNumber: string;
  date: string;
  validUntil: string;
  notes: string;
}

export interface QuotationItem {
  id: string;
  name: string;
  description: string;
  unit: MeasurementUnit;
  length: number;
  width: number;
  quantity: number;
  rate: number;
  amount: number;
}

export interface QuotationTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
}

export interface QuotationDraft {
  customer: CustomerDetails;
  meta: QuotationMeta;
  items: QuotationItem[];
  discountType: DiscountType;
  discountValue: number;
  gstPercent: number;
}
