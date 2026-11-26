import React, { useState } from 'react';
import { Check, Copy, Download, MessageCircle, Printer } from 'lucide-react';
import { BusinessDetails, QuotationDraft, QuotationTotals } from '../types/quotation';
import { formatCurrency, formatQuantity } from '../utils/calculations';
import { generateQuotationPdf } from '../utils/pdfGenerator';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp';

interface QuotationPreviewProps {
  business: BusinessDetails;
  draft: QuotationDraft;
  totals: QuotationTotals;
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  business,
  draft,
  totals,
}) => {
  const [copied, setCopied] = useState(false);

  const sym = business.currencySymbol || '₹';
  const companyName = business.companyName.trim() || 'Furniture & Interior Studio';
  const whatsappUrl = buildWhatsAppUrl(business, draft, totals);

  const handleDownloadPdf = () => {
    generateQuotationPdf(business, draft, totals);
  };

  const handleCopySummary = async () => {
    const text = buildWhatsAppMessage(business, draft, totals);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="no-print bg-white border border-[#E5E3DD] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-[#5C5A54] px-1">
          A4 Quotation Preview · <span className="font-mono text-[#1A1916]">{draft.meta.quotationNumber}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#3E3C37] bg-[#F6F5F1] hover:bg-[#EAE7DF] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#3E3C37] bg-[#F6F5F1] hover:bg-[#EAE7DF] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#15803D]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Text
              </>
            )}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1E3A34] hover:bg-[#162C27] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* A4 Quotation Paper Layout */}
      <div className="print-only-sheet bg-white border border-[#E5E3DD] rounded-xl shadow-xs p-6 sm:p-10 text-[#1A1916]">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#E5E3DD]">
          <div className="space-y-1 max-w-sm">
            <h3 className="text-xl font-bold tracking-tight text-[#1E3A34]">
              {companyName}
            </h3>
            {business.tagline.trim() && (
              <p className="text-xs text-[#6B675E]">{business.tagline.trim()}</p>
            )}
            {business.address.trim() && (
              <p className="text-xs text-[#5C5A54] whitespace-pre-line pt-1">
                {business.address.trim()}
              </p>
            )}
            {(business.phone.trim() || business.email.trim()) && (
              <p className="text-xs text-[#5C5A54]">
                {[
                  business.phone.trim() ? `Ph: ${business.phone.trim()}` : '',
                  business.email.trim() ? `Email: ${business.email.trim()}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {business.gstin.trim() && (
              <p className="text-xs font-mono font-medium text-[#1A1916] pt-0.5">
                GSTIN: {business.gstin.trim()}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-2">
            <p className="text-lg font-display font-bold tracking-wider text-[#1A1916]">
              QUOTATION
            </p>
            <div className="text-xs space-y-1">
              <div className="flex sm:justify-end gap-3">
                <span className="text-[#6B675E]">Quotation No:</span>
                <span className="font-mono font-semibold text-[#1A1916]">
                  {draft.meta.quotationNumber || '—'}
                </span>
              </div>
              <div className="flex sm:justify-end gap-3">
                <span className="text-[#6B675E]">Date:</span>
                <span className="font-mono text-[#1A1916]">{draft.meta.date || '—'}</span>
              </div>
              <div className="flex sm:justify-end gap-3">
                <span className="text-[#6B675E]">Valid Until:</span>
                <span className="font-mono text-[#1A1916]">{draft.meta.validUntil || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client & Project Block */}
        <div className="mt-6 bg-[#F9F8F5] border border-[#E5E3DD] rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#1E3A34] uppercase">
              Prepared For
            </p>
            <p className="text-sm font-semibold text-[#1A1916] mt-1">
              {draft.customer.name.trim() || 'Client Name'}
            </p>
            <p className="text-xs text-[#5C5A54] font-mono mt-0.5">
              Mobile: {draft.customer.mobile.trim() || '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#1E3A34] uppercase">
              Project Details
            </p>
            <p className="text-sm font-semibold text-[#1A1916] mt-1">
              {draft.customer.projectName.trim() || 'Interior / Furniture Project'}
            </p>
            {draft.customer.siteAddress.trim() && (
              <p className="text-xs text-[#5C5A54] mt-0.5">
                {draft.customer.siteAddress.trim()}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E3A34] text-white text-[11px] font-semibold tracking-wide">
                <th className="py-2.5 px-2.5 rounded-tl-md w-8">#</th>
                <th className="py-2.5 px-2.5">Item & Specification</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Dimensions</th>
                <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Qty / Unit</th>
                <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Rate</th>
                <th className="py-2.5 px-2.5 text-right rounded-tr-md whitespace-nowrap">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6] text-xs">
              {draft.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8A867C] italic">
                    Add items in the quotation builder to populate this estimate.
                  </td>
                </tr>
              ) : (
                draft.items.map((item, idx) => {
                  const dimText =
                    item.unit === 'Sq. Ft.' && item.length > 0 && item.width > 0
                      ? `${item.length} × ${item.width} ft`
                      : item.unit === 'Running Ft.' && item.length > 0
                        ? `${item.length} ft`
                        : '—';

                  return (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#FCFBF9]' : ''}>
                      <td className="py-3 px-2.5 align-top font-mono text-[#8A867C]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-2.5 align-top">
                        <p className="font-semibold text-[#1A1916]">{item.name}</p>
                        {item.description && (
                          <p className="text-[11px] text-[#6B675E] mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-2.5 align-top font-mono text-[#5C5A54] whitespace-nowrap">
                        {dimText}
                      </td>
                      <td className="py-3 px-2.5 align-top text-right font-mono text-[#1A1916] whitespace-nowrap">
                        {formatQuantity(item.quantity)} {item.unit}
                      </td>
                      <td className="py-3 px-2.5 align-top text-right font-mono text-[#5C5A54] whitespace-nowrap">
                        {formatCurrency(item.rate, sym)}
                      </td>
                      <td className="py-3 px-2.5 align-top text-right font-mono font-semibold text-[#1A1916] whitespace-nowrap">
                        {formatCurrency(item.amount, sym)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Notes, Terms & Totals */}
        <div className="mt-6 pt-5 border-t border-[#E5E3DD] grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          <div className="sm:col-span-7 space-y-4">
            {draft.meta.notes.trim() && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#1E3A34] uppercase">
                  Project Notes
                </p>
                <p className="text-xs text-[#5C5A54] mt-1 whitespace-pre-line leading-relaxed">
                  {draft.meta.notes.trim()}
                </p>
              </div>
            )}

            {business.terms.trim() && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#1E3A34] uppercase">
                  Terms & Conditions
                </p>
                <p className="text-[11px] text-[#6B675E] mt-1 whitespace-pre-line leading-relaxed">
                  {business.terms.trim()}
                </p>
              </div>
            )}
          </div>

          <div className="sm:col-span-5 space-y-2 text-xs">
            <div className="flex justify-between text-[#5C5A54] px-2">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-[#1A1916]">
                {formatCurrency(totals.subtotal, sym)}
              </span>
            </div>

            {totals.discountAmount > 0 && (
              <>
                <div className="flex justify-between text-[#5C5A54] px-2">
                  <span>
                    Discount{' '}
                    {draft.discountType === 'percent' ? `(${draft.discountValue}%)` : ''}
                  </span>
                  <span className="font-mono text-[#15803D]">
                    − {formatCurrency(totals.discountAmount, sym)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B675E] px-2">
                  <span>Taxable Value</span>
                  <span className="font-mono">{formatCurrency(totals.taxableAmount, sym)}</span>
                </div>
              </>
            )}

            {totals.gstPercent > 0 && (
              <div className="flex justify-between text-[#5C5A54] px-2">
                <span>GST ({totals.gstPercent}%)</span>
                <span className="font-mono text-[#1A1916]">
                  + {formatCurrency(totals.gstAmount, sym)}
                </span>
              </div>
            )}

            <div className="mt-2 bg-[#1E3A34] text-white rounded-lg px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide">GRAND TOTAL</span>
              <span className="text-base font-mono font-bold">
                {formatCurrency(totals.grandTotal, sym)}
              </span>
            </div>

            <div className="pt-10 text-right">
              <div className="inline-block border-t border-[#DCD9D0] pt-1.5 min-w-[140px]">
                <p className="text-[11px] text-[#6B675E]">For {companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
