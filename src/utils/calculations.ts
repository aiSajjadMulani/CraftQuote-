import { DiscountType, QuotationItem, QuotationTotals } from '../types/quotation';

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Area = Length × Width
 */
export function calculateArea(length: number, width: number): number {
  const l = Math.max(0, Number(length) || 0);
  const w = Math.max(0, Number(width) || 0);
  return round2(l * w);
}

/**
 * Amount = Quantity × Rate
 */
export function calculateItemAmount(quantity: number, rate: number): number {
  const q = Math.max(0, Number(quantity) || 0);
  const r = Math.max(0, Number(rate) || 0);
  return round2(q * r);
}

/**
 * Subtotal = Sum of all items
 * Grand Total = Subtotal − Discount + GST
 */
export function calculateQuotationTotals(
  items: QuotationItem[],
  discountType: DiscountType,
  discountValue: number,
  gstPercent: number
): QuotationTotals {
  const subtotal = round2(
    items.reduce((sum, item) => sum + calculateItemAmount(item.quantity, item.rate), 0)
  );

  const rawDiscount = Math.max(0, Number(discountValue) || 0);
  let discountAmount = 0;

  if (discountType === 'percent') {
    const cappedPct = Math.min(100, rawDiscount);
    discountAmount = round2((subtotal * cappedPct) / 100);
  } else {
    discountAmount = round2(Math.min(subtotal, rawDiscount));
  }

  const taxableAmount = round2(Math.max(0, subtotal - discountAmount));
  const safeGstPct = Math.max(0, Math.min(100, Number(gstPercent) || 0));
  const gstAmount = round2((taxableAmount * safeGstPct) / 100);
  const grandTotal = round2(taxableAmount + gstAmount);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    gstPercent: safeGstPct,
    gstAmount,
    grandTotal,
  };
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const locale = symbol === '₹' ? 'en-IN' : 'en-US';
  const formatted = safe.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function formatPdfCurrency(amount: number, symbol = '₹'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const locale = symbol === '₹' ? 'en-IN' : 'en-US';
  const formatted = safe.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (symbol === '₹') return `Rs. ${formatted}`;
  if (symbol === '€') return `EUR ${formatted}`;
  if (symbol === '£') return `GBP ${formatted}`;
  return `${symbol}${formatted}`;
}

export function formatQuantity(qty: number): string {
  const safe = Number.isFinite(qty) ? qty : 0;
  return Number.isInteger(safe) ? String(safe) : safe.toFixed(2);
}
