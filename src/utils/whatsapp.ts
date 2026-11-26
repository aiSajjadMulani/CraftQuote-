import { BusinessDetails, QuotationDraft, QuotationTotals } from '../types/quotation';
import { formatCurrency, formatQuantity } from './calculations';

export function sanitizePhoneForWhatsApp(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  // If user entered a 10-digit local mobile number without country code, default to +91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  // Remove leading zeros if someone typed 098...
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppMessage(
  business: BusinessDetails,
  draft: QuotationDraft,
  totals: QuotationTotals
): string {
  const sym = business.currencySymbol || '₹';
  const company = business.companyName.trim() || 'Our Interior Studio';
  const customerName = draft.customer.name.trim() || 'Valued Client';
  const project = draft.customer.projectName.trim();

  const lines: string[] = [];
  lines.push(`Hello ${customerName},`);
  lines.push('');
  lines.push(`Please find your *Furniture & Interior Quotation* from *${company}*.`);
  lines.push('');
  lines.push(`*Quotation No:* ${draft.meta.quotationNumber}`);
  lines.push(`*Date:* ${draft.meta.date}`);
  if (project) {
    lines.push(`*Project:* ${project}`);
  }
  lines.push('');

  if (draft.items.length > 0) {
    lines.push('*Estimate Summary:*');
    draft.items.forEach((item, idx) => {
      const dims =
        item.unit === 'Sq. Ft.' && item.length > 0 && item.width > 0
          ? ` (${item.length} × ${item.width} ft)`
          : item.unit === 'Running Ft.' && item.length > 0
            ? ` (${item.length} ft)`
            : '';
      lines.push(
        `${idx + 1}. ${item.name}${dims} — ${formatQuantity(item.quantity)} ${item.unit} × ${formatCurrency(item.rate, sym)} = *${formatCurrency(item.amount, sym)}*`
      );
    });
    lines.push('');
  }

  lines.push(`*Subtotal:* ${formatCurrency(totals.subtotal, sym)}`);
  if (totals.discountAmount > 0) {
    const discLabel =
      draft.discountType === 'percent' ? `Discount (${draft.discountValue}%)` : 'Discount';
    lines.push(`*${discLabel}:* -${formatCurrency(totals.discountAmount, sym)}`);
  }
  if (totals.gstPercent > 0) {
    lines.push(`*GST (${totals.gstPercent}%):* +${formatCurrency(totals.gstAmount, sym)}`);
  }
  lines.push(`*Grand Total:* *${formatCurrency(totals.grandTotal, sym)}*`);

  if (draft.meta.validUntil) {
    lines.push('');
    lines.push(`Valid until: ${draft.meta.validUntil}`);
  }

  lines.push('');
  lines.push('I am attaching the detailed PDF quotation herewith. Please let us know if you need any revisions.');
  if (business.phone.trim()) {
    lines.push(`Contact: ${business.phone.trim()}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppUrl(
  business: BusinessDetails,
  draft: QuotationDraft,
  totals: QuotationTotals
): string {
  const message = buildWhatsAppMessage(business, draft, totals);
  const phone = sanitizePhoneForWhatsApp(draft.customer.mobile);
  const encodedText = encodeURIComponent(message);
  if (phone) {
    return `https://wa.me/${phone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
