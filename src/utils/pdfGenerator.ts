import { jsPDF } from 'jspdf';
import { BusinessDetails, QuotationDraft, QuotationTotals } from '../types/quotation';
import { formatPdfCurrency, formatQuantity } from './calculations';

function sanitizePdfText(value: string): string {
  return value
    .replace(/₹/g, 'Rs. ')
    .replace(/€/g, 'EUR ')
    .replace(/£/g, 'GBP ')
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/×/g, 'x')
    .replace(/[^\x20-\x7E\n\r]/g, '');
}

export function generateQuotationPdf(
  business: BusinessDetails,
  draft: QuotationDraft,
  totals: QuotationTotals
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const sym = business.currencySymbol || '₹';

  const inkDark: [number, number, number] = [26, 25, 22];
  const inkMuted: [number, number, number] = [95, 92, 86];
  const accentDark: [number, number, number] = [30, 58, 52];
  const borderHairline: [number, number, number] = [220, 217, 210];
  const surfaceLight: [number, number, number] = [246, 245, 241];

  let y = 16;

  // Top Header Band
  const companyName = sanitizePdfText(business.companyName.trim()) || 'Furniture & Interior Studio';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...accentDark);
  doc.text(companyName, marginX, y);

  // Right side: QUOTATION title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...inkDark);
  doc.text('QUOTATION', pageWidth - marginX, y, { align: 'right' });

  y += 5.5;

  // Company details left
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...inkMuted);

  let leftY = y;
  if (business.tagline.trim()) {
    doc.text(sanitizePdfText(business.tagline.trim()), marginX, leftY);
    leftY += 4.2;
  }
  if (business.address.trim()) {
    const addrLines = doc.splitTextToSize(sanitizePdfText(business.address.trim()), 95);
    doc.text(addrLines, marginX, leftY);
    leftY += addrLines.length * 4;
  }
  const contactParts: string[] = [];
  if (business.phone.trim()) contactParts.push(`Ph: ${sanitizePdfText(business.phone.trim())}`);
  if (business.email.trim()) contactParts.push(`Email: ${sanitizePdfText(business.email.trim())}`);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), marginX, leftY);
    leftY += 4.2;
  }
  if (business.gstin.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${sanitizePdfText(business.gstin.trim())}`, marginX, leftY);
    doc.setFont('helvetica', 'normal');
    leftY += 4.2;
  }

  // Quotation metadata right
  let rightY = y;
  const metaRows: [string, string][] = [
    ['Quotation No:', sanitizePdfText(draft.meta.quotationNumber) || '-'],
    ['Date:', sanitizePdfText(draft.meta.date) || '-'],
    ['Valid Until:', sanitizePdfText(draft.meta.validUntil) || '-'],
  ];

  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...inkMuted);
    doc.text(label, pageWidth - marginX - 36, rightY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...inkDark);
    doc.text(value, pageWidth - marginX, rightY, { align: 'right' });
    rightY += 4.5;
  });

  y = Math.max(leftY, rightY) + 4;

  // Divider
  doc.setDrawColor(...borderHairline);
  doc.setLineWidth(0.35);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  // Customer Details Box
  doc.setFillColor(...surfaceLight);
  doc.setDrawColor(...borderHairline);
  const custBoxStartY = y;

  const customerName = sanitizePdfText(draft.customer.name.trim()) || 'Client Name';
  const customerMobile = sanitizePdfText(draft.customer.mobile.trim()) || '-';
  const projectName = sanitizePdfText(draft.customer.projectName.trim()) || '-';
  const siteAddr = sanitizePdfText(draft.customer.siteAddress.trim());
  const siteAddrLines = siteAddr ? doc.splitTextToSize(siteAddr, 80) : [];
  const boxHeight = Math.max(20, 14 + siteAddrLines.length * 4);

  doc.roundedRect(marginX, custBoxStartY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentDark);
  doc.text('PREPARED FOR', marginX + 4, custBoxStartY + 5);
  doc.text('PROJECT DETAILS', marginX + contentWidth / 2 + 4, custBoxStartY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...inkDark);
  doc.text(customerName, marginX + 4, custBoxStartY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...inkMuted);
  doc.text(`Mobile: ${customerMobile}`, marginX + 4, custBoxStartY + 15.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...inkDark);
  doc.text(projectName, marginX + contentWidth / 2 + 4, custBoxStartY + 10.5);

  if (siteAddrLines.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...inkMuted);
    doc.text(siteAddrLines, marginX + contentWidth / 2 + 4, custBoxStartY + 15.2);
  }

  y = custBoxStartY + boxHeight + 7;

  // Table column configuration (total = 180mm)
  const colX = {
    idx: marginX,
    item: marginX + 9,
    dim: marginX + 83,
    qty: marginX + 111,
    rate: marginX + 135,
    amt: marginX + 160,
  };

  const drawTableHeader = (startY: number): number => {
    doc.setFillColor(...accentDark);
    doc.rect(marginX, startY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    const textY = startY + 5.3;
    doc.text('#', colX.idx + 3, textY);
    doc.text('ITEM & SPECIFICATION', colX.item + 2, textY);
    doc.text('DIMENSIONS', colX.dim + 2, textY);
    doc.text('QTY / UNIT', colX.qty + 22, textY, { align: 'right' });
    doc.text('RATE', colX.rate + 23, textY, { align: 'right' });
    doc.text('AMOUNT', pageWidth - marginX - 3, textY, { align: 'right' });
    return startY + 8;
  };

  y = drawTableHeader(y);

  // Table Rows
  if (draft.items.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...inkMuted);
    doc.text('No items added to this quotation yet.', marginX + 4, y + 8);
    y += 14;
  } else {
    draft.items.forEach((item, index) => {
      const nameLines = doc.splitTextToSize(sanitizePdfText(item.name) || 'Untitled Item', 70);
      const descLines = item.description.trim()
        ? doc.splitTextToSize(sanitizePdfText(item.description.trim()), 70)
        : [];
      const rowHeight = Math.max(10, 5 + nameLines.length * 4 + descLines.length * 3.6 + 2);

      // Page break check
      if (y + rowHeight > pageHeight - 36) {
        doc.addPage();
        y = 16;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...inkMuted);
        doc.text(
          `${companyName} - Quotation ${sanitizePdfText(draft.meta.quotationNumber)} (Continued)`,
          marginX,
          y
        );
        y += 5;
        y = drawTableHeader(y);
      }

      if (index % 2 === 1) {
        doc.setFillColor(251, 250, 248);
        doc.rect(marginX, y, contentWidth, rowHeight, 'F');
      }

      const rowTextStartY = y + 5;

      // Index
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...inkMuted);
      doc.text(String(index + 1), colX.idx + 3, rowTextStartY);

      // Item name & description
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...inkDark);
      doc.text(nameLines, colX.item + 2, rowTextStartY);

      if (descLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(...inkMuted);
        doc.text(descLines, colX.item + 2, rowTextStartY + nameLines.length * 4);
      }

      // Dimensions
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(...inkMuted);
      let dimText = '-';
      if (item.unit === 'Sq. Ft.' && item.length > 0 && item.width > 0) {
        dimText = `${item.length} x ${item.width} ft`;
      } else if (item.unit === 'Running Ft.' && item.length > 0) {
        dimText = `${item.length} ft`;
      }
      doc.text(dimText, colX.dim + 2, rowTextStartY);

      // Qty / Unit
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...inkDark);
      doc.text(
        `${formatQuantity(item.quantity)} ${item.unit}`,
        colX.qty + 22,
        rowTextStartY,
        { align: 'right' }
      );

      // Rate
      doc.text(formatPdfCurrency(item.rate, sym), colX.rate + 23, rowTextStartY, {
        align: 'right',
      });

      // Amount
      doc.setFont('helvetica', 'bold');
      doc.text(formatPdfCurrency(item.amount, sym), pageWidth - marginX - 3, rowTextStartY, {
        align: 'right',
      });

      y += rowHeight;
      doc.setDrawColor(...borderHairline);
      doc.setLineWidth(0.2);
      doc.line(marginX, y, pageWidth - marginX, y);
    });
  }

  y += 6;

  // Check if totals + terms fit on current page
  const termsLines = business.terms.trim()
    ? doc.splitTextToSize(sanitizePdfText(business.terms.trim()), 98)
    : [];
  const notesLines = draft.meta.notes.trim()
    ? doc.splitTextToSize(`Note: ${sanitizePdfText(draft.meta.notes.trim())}`, 98)
    : [];
  const neededFooterHeight = Math.max(46, (termsLines.length + notesLines.length) * 4 + 28);

  if (y + neededFooterHeight > pageHeight - 14) {
    doc.addPage();
    y = 18;
  }

  // Left: Notes & Terms, Right: Totals Summary
  const summaryStartY = y;
  let notesY = summaryStartY + 3;

  if (notesLines.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...accentDark);
    doc.text('PROJECT NOTES', marginX, notesY);
    notesY += 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...inkMuted);
    doc.text(notesLines, marginX, notesY);
    notesY += notesLines.length * 3.8 + 4;
  }

  if (termsLines.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...accentDark);
    doc.text('TERMS & CONDITIONS', marginX, notesY);
    notesY += 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...inkMuted);
    doc.text(termsLines, marginX, notesY);
    notesY += termsLines.length * 3.8;
  }

  // Right Totals Table
  const totBoxX = pageWidth - marginX - 72;
  const totBoxW = 72;
  let totY = summaryStartY;

  const drawTotalRow = (label: string, val: string, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(isBold ? inkDark : inkMuted));
    doc.text(label, totBoxX + 3, totY + 4.5);
    doc.setTextColor(...inkDark);
    doc.text(val, pageWidth - marginX - 3, totY + 4.5, { align: 'right' });
    totY += 6.5;
  };

  drawTotalRow('Subtotal', formatPdfCurrency(totals.subtotal, sym));

  if (totals.discountAmount > 0) {
    const discLabel =
      draft.discountType === 'percent' ? `Discount (${draft.discountValue}%)` : 'Discount';
    drawTotalRow(discLabel, `- ${formatPdfCurrency(totals.discountAmount, sym)}`);
    drawTotalRow('Taxable Value', formatPdfCurrency(totals.taxableAmount, sym));
  }

  if (totals.gstPercent > 0) {
    drawTotalRow(`GST (${totals.gstPercent}%)`, `+ ${formatPdfCurrency(totals.gstAmount, sym)}`);
  }

  totY += 1.5;
  doc.setFillColor(...accentDark);
  doc.roundedRect(totBoxX, totY, totBoxW, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', totBoxX + 3.5, totY + 6.5);
  doc.text(formatPdfCurrency(totals.grandTotal, sym), pageWidth - marginX - 3.5, totY + 6.5, {
    align: 'right',
  });
  totY += 16;

  // Signature block
  const sigY = Math.max(notesY + 12, totY + 8);
  const finalSigY = Math.min(sigY, pageHeight - 18);
  doc.setDrawColor(...borderHairline);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginX - 52, finalSigY, pageWidth - marginX, finalSigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...inkMuted);
  doc.text(`For ${companyName}`, pageWidth - marginX, finalSigY + 4.5, { align: 'right' });

  // Clean filename
  const safeNo = (draft.meta.quotationNumber || 'Quotation').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeClient = (draft.customer.name.trim() || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeNo}_${safeClient}.pdf`);
}
