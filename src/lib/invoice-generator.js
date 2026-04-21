function getText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function getNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatCurrency(value) {
  return `Rs. ${getNumber(value).toLocaleString('en-PK')}`;
}

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function normalizeItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const quantity = Math.max(1, getNumber(item?.quantity, 1));
    const unitPrice = getNumber(item?.price);

    return {
      name: getText(item?.name || item?.Name, `Item ${index + 1}`),
      image: getText(item?.image || item?.Image || item?.imageUrl),
      variant: getText(item?.variant),
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
  });
}

function splitLines(doc, value, width) {
  const text = getText(value);
  if (!text) return [];
  return doc.splitTextToSize(text, width);
}

async function loadImageDataUrl(url) {
  const src = getText(url);
  if (!src || typeof window === 'undefined') return null;

  try {
    const response = await fetch(src);
    if (!response.ok) return null;

    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Color Palette ──────────────────────────────────────────────────────────
const PALETTE = {
  text: [23, 23, 23],
  muted: [115, 115, 115],
  light: [163, 163, 163],
  line: [229, 229, 229],
  lineSoft: [243, 243, 243],
  soft: [250, 250, 250],
  white: [255, 255, 255],
  accent: [15, 118, 110],       // teal-700
  accentLight: [204, 251, 241], // teal-100
  accentDark: [13, 87, 80],     // teal-800
  statusPaid: [22, 101, 52],
  statusPaidBg: [220, 252, 231],
  statusUnpaid: [146, 64, 14],
  statusUnpaidBg: [254, 243, 199],
};

// ─── Drawing Helpers ────────────────────────────────────────────────────────

function drawRoundedRect(doc, x, y, w, h, r, fillColor) {
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function drawLine(doc, x1, y1, x2, y2, color = PALETTE.line) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(x1, y1, x2, y2);
}

function drawText(doc, text, x, y, opts = {}) {
  const {
    size = 10,
    color = PALETTE.text,
    weight = 'normal',
    align = 'left',
    maxWidth,
  } = opts;

  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
  doc.setTextColor(...color);

  const drawOpts = { align };
  if (maxWidth) drawOpts.maxWidth = maxWidth;
  doc.text(String(text), x, y, drawOpts);
}

function drawPill(doc, text, x, y, bgColor, textColor) {
  const pillW = doc.getTextWidth(text) + 16;
  const pillH = 18;
  drawRoundedRect(doc, x, y - 12, pillW, pillH, 4, bgColor);
  drawText(doc, text, x + 8, y, { size: 8, color: textColor, weight: 'bold' });
  return pillW;
}

function drawInfoSection(doc, { title, lines, x, y, width }) {
  drawText(doc, title, x, y, { size: 8, color: PALETTE.light, weight: 'bold' });

  let currentY = y + 16;
  const safeLines = Array.isArray(lines) && lines.length > 0 ? lines : ['Not provided'];

  safeLines.forEach((line, index) => {
    const wrapped = doc.splitTextToSize(getText(line, 'Not provided'), width);
    drawText(doc, wrapped, x, currentY, {
      size: index === 0 ? 10 : 9,
      weight: index === 0 ? 'bold' : 'normal',
      color: index === 0 ? PALETTE.text : PALETTE.muted,
    });
    currentY += wrapped.length * 13 + 3;
  });

  return currentY;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export const generateInvoice = async (order, branding = {}) => {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;

  const items = normalizeItems(order?.items);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(getNumber(order?.totalAmount, subtotal), subtotal);
  const shipping = Math.max(total - subtotal, 0);

  const paymentMethod = getText(order?.paymentStatus, 'COD');
  const paymentStatus = paymentMethod === 'Online' ? 'Paid' : 'Unpaid';
  const invoiceNumber = getText(order?.orderId, 'Draft');
  const storeName = getText(branding?.storeName || order?.storeName, 'Aam Samaan');
  const supportEmail = getText(branding?.supportEmail);
  const businessAddress = getText(branding?.businessAddress, 'Business address not available');
  const baseUrl = getText(
    branding?.baseUrl,
    typeof window !== 'undefined' ? window.location.origin : 'https://chinaunique.pk',
  );
  const returnPolicyUrl = getText(branding?.returnPolicyUrl, `${baseUrl}/refund-policy`);
  const logoUrl = getText(branding?.lightLogoUrl || branding?.darkLogoUrl);

  // ─── Page Background ───────────────────────────────────────────────────
  doc.setFillColor(...PALETTE.white);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ─── Header Bar ─────────────────────────────────────────────────────────
  const headerTop = margin;

  // Logo or store name
  const logoDataUrl = await loadImageDataUrl(logoUrl);
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, headerTop - 4, 110, 36, undefined, 'FAST');
  } else {
    drawText(doc, storeName, margin, headerTop + 18, {
      size: 18, weight: 'bold', color: PALETTE.text,
    });
  }

  // Right side: INVOICE title + accent underline
  drawText(doc, 'INVOICE', pageWidth - margin, headerTop + 8, {
    size: 26, weight: 'bold', color: PALETTE.accent, align: 'right',
  });
  // Accent underline below INVOICE
  const invoiceTextWidth = 95;
  doc.setFillColor(...PALETTE.accent);
  doc.rect(pageWidth - margin - invoiceTextWidth, headerTop + 14, invoiceTextWidth, 2.5, 'F');

  // Invoice meta
  drawText(doc, `#${invoiceNumber}`, pageWidth - margin, headerTop + 32, {
    size: 10, color: PALETTE.muted, weight: 'bold', align: 'right',
  });
  drawText(doc, formatDate(order?.createdAt), pageWidth - margin, headerTop + 46, {
    size: 9, color: PALETTE.muted, align: 'right',
  });

  // Divider
  const dividerY = headerTop + 64;
  drawLine(doc, margin, dividerY, pageWidth - margin, dividerY, PALETTE.line);

  // ─── From / Ship To Sections ────────────────────────────────────────────
  const sectionY = dividerY + 24;
  const gap = 32;
  const colWidth = (contentWidth - gap) / 2;

  const leftBottom = drawInfoSection(doc, {
    title: 'FROM',
    lines: [
      storeName,
      businessAddress,
      supportEmail ? `Email: ${supportEmail}` : '',
    ].filter(Boolean),
    x: margin,
    y: sectionY,
    width: colWidth,
  });

  const rightBottom = drawInfoSection(doc, {
    title: 'SHIP TO',
    lines: [
      getText(order?.customerName, 'Customer'),
      getText(order?.customerPhone) ? `Phone: ${getText(order?.customerPhone)}` : '',
      getText(order?.customerEmail) ? `Email: ${getText(order?.customerEmail)}` : '',
      getText(order?.customerAddress, 'Address not provided'),
      getText(order?.customerCity) ? `City: ${getText(order?.customerCity)}` : '',
      getText(order?.landmark) ? `Landmark: ${getText(order?.landmark)}` : '',
    ].filter(Boolean),
    x: margin + colWidth + gap,
    y: sectionY,
    width: colWidth,
  });

  // ─── Payment Status Bar ─────────────────────────────────────────────────
  const metaY = Math.max(leftBottom, rightBottom) + 12;

  drawRoundedRect(doc, margin, metaY, contentWidth, 36, 6, PALETTE.soft);

  drawText(doc, 'Payment:', margin + 14, metaY + 22, {
    size: 9, color: PALETTE.muted, weight: 'bold',
  });
  drawText(doc, paymentMethod, margin + 68, metaY + 22, {
    size: 9, color: PALETTE.text, weight: 'bold',
  });

  // Draw status pill
  const isPaid = paymentStatus === 'Paid';
  const pillBg = isPaid ? PALETTE.statusPaidBg : PALETTE.statusUnpaidBg;
  const pillText = isPaid ? PALETTE.statusPaid : PALETTE.statusUnpaid;
  drawPill(doc, paymentStatus.toUpperCase(), pageWidth - margin - 80, metaY + 22, pillBg, pillText);

  // ─── Product Table ──────────────────────────────────────────────────────
  const tableStartY = metaY + 56;

  // Table header
  drawRoundedRect(doc, margin, tableStartY, contentWidth, 30, 6, PALETTE.accent);
  const colProduct = margin + 14;
  const colQty = margin + contentWidth * 0.55;
  const colPrice = margin + contentWidth * 0.70;
  const colTotal = pageWidth - margin - 14;

  drawText(doc, 'Product', colProduct, tableStartY + 19, {
    size: 9, color: PALETTE.white, weight: 'bold',
  });
  drawText(doc, 'Qty', colQty, tableStartY + 19, {
    size: 9, color: PALETTE.white, weight: 'bold', align: 'center',
  });
  drawText(doc, 'Price', colPrice, tableStartY + 19, {
    size: 9, color: PALETTE.white, weight: 'bold', align: 'right',
  });
  drawText(doc, 'Total', colTotal, tableStartY + 19, {
    size: 9, color: PALETTE.white, weight: 'bold', align: 'right',
  });

  // Load product images in parallel
  const imagePromises = items.map((item) => loadImageDataUrl(item.image));
  const imageDataUrls = await Promise.all(imagePromises);

  // Product rows
  let rowY = tableStartY + 30;
  const imgSize = 36;
  const rowPadding = 14;
  const minRowHeight = imgSize + rowPadding * 2;

  if (items.length === 0) {
    drawRoundedRect(doc, margin, rowY, contentWidth, 40, 0, PALETTE.white);
    drawLine(doc, margin, rowY + 40, pageWidth - margin, rowY + 40);
    drawText(doc, 'No products found', margin + contentWidth / 2, rowY + 25, {
      size: 10, color: PALETTE.muted, align: 'center',
    });
    rowY += 40;
  } else {
    items.forEach((item, index) => {
      // Check if we need a new page
      if (rowY + minRowHeight > pageHeight - 100) {
        doc.addPage();
        doc.setFillColor(...PALETTE.white);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        rowY = margin;
      }

      const isEven = index % 2 === 0;
      const rowBg = isEven ? PALETTE.white : PALETTE.soft;
      const nameLines = doc.splitTextToSize(item.name, contentWidth * 0.38);
      const actualRowHeight = Math.max(minRowHeight, nameLines.length * 14 + rowPadding * 2 + 8);

      // Row background
      drawRoundedRect(doc, margin, rowY, contentWidth, actualRowHeight, 0, rowBg);

      // Bottom border
      drawLine(doc, margin, rowY + actualRowHeight, pageWidth - margin, rowY + actualRowHeight, PALETTE.lineSoft);

      const centerY = rowY + actualRowHeight / 2;

      // Product image
      const imgX = colProduct;
      const imgY = centerY - imgSize / 2;
      const imgDataUrl = imageDataUrls[index];

      if (imgDataUrl) {
        // Draw image border/background
        doc.setFillColor(...PALETTE.soft);
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 4, 4, 'F');
        doc.addImage(imgDataUrl, 'JPEG', imgX + 1, imgY + 1, imgSize - 2, imgSize - 2, `prod-${index}`, 'FAST');
        // Border
        doc.setDrawColor(...PALETTE.line);
        doc.setLineWidth(0.5);
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 4, 4, 'S');
      } else {
        // Placeholder square
        drawRoundedRect(doc, imgX, imgY, imgSize, imgSize, 4, PALETTE.lineSoft);
        drawText(doc, 'N/A', imgX + imgSize / 2, centerY + 3, {
          size: 7, color: PALETTE.light, weight: 'bold', align: 'center',
        });
      }

      // Product name + variant
      const textX = imgX + imgSize + 10;
      const nameY = nameLines.length > 1 ? centerY - 6 : centerY + 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...PALETTE.text);
      doc.text(nameLines, textX, nameY);

      if (item.variant) {
        drawText(doc, item.variant, textX, nameY + nameLines.length * 13, {
          size: 8, color: PALETTE.muted,
        });
      }

      // Quantity
      drawText(doc, String(item.quantity), colQty, centerY + 3, {
        size: 10, color: PALETTE.text, weight: 'bold', align: 'center',
      });

      // Unit price
      drawText(doc, formatCurrency(item.unitPrice), colPrice, centerY + 3, {
        size: 9, color: PALETTE.muted, align: 'right',
      });

      // Line total
      drawText(doc, formatCurrency(item.total), colTotal, centerY + 3, {
        size: 10, color: PALETTE.text, weight: 'bold', align: 'right',
      });

      rowY += actualRowHeight;
    });
  }

  // ─── Notes + Summary ────────────────────────────────────────────────────
  const summaryY = rowY + 20;
  const summaryWidth = 200;
  const summaryX = pageWidth - margin - summaryWidth;

  // Check page overflow
  if (summaryY + 120 > pageHeight - 60) {
    doc.addPage();
    doc.setFillColor(...PALETTE.white);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  const finalSummaryY = (summaryY + 120 > pageHeight - 60) ? margin : summaryY;

  // Notes (left side)
  if (getText(order?.notes)) {
    drawText(doc, 'ORDER NOTES', margin, finalSummaryY + 10, {
      size: 8, color: PALETTE.light, weight: 'bold',
    });
    const noteLines = splitLines(doc, order.notes, contentWidth - summaryWidth - 28);
    drawText(doc, noteLines, margin, finalSummaryY + 26, {
      size: 9, color: PALETTE.muted,
    });
  }

  // Summary box (right side)
  drawRoundedRect(doc, summaryX, finalSummaryY, summaryWidth, 92, 8, PALETTE.soft);

  // Border
  doc.setDrawColor(...PALETTE.line);
  doc.setLineWidth(0.5);
  doc.roundedRect(summaryX, finalSummaryY, summaryWidth, 92, 8, 8, 'S');

  const summaryPad = 14;
  let sumY = finalSummaryY + 22;

  // Subtotal
  drawText(doc, 'Subtotal', summaryX + summaryPad, sumY, { size: 9, color: PALETTE.muted });
  drawText(doc, formatCurrency(subtotal), summaryX + summaryWidth - summaryPad, sumY, {
    size: 9, color: PALETTE.text, align: 'right',
  });

  // Shipping
  sumY += 18;
  drawText(doc, 'Shipping', summaryX + summaryPad, sumY, { size: 9, color: PALETTE.muted });
  drawText(doc, formatCurrency(shipping), summaryX + summaryWidth - summaryPad, sumY, {
    size: 9, color: PALETTE.text, align: 'right',
  });

  // Divider
  sumY += 12;
  drawLine(doc, summaryX + summaryPad, sumY, summaryX + summaryWidth - summaryPad, sumY, PALETTE.line);

  // Grand total with accent
  sumY += 18;
  drawText(doc, 'Total', summaryX + summaryPad, sumY, {
    size: 11, color: PALETTE.accent, weight: 'bold',
  });
  drawText(doc, formatCurrency(total), summaryX + summaryWidth - summaryPad, sumY, {
    size: 11, color: PALETTE.accent, weight: 'bold', align: 'right',
  });

  // ─── Footer ────────────────────────────────────────────────────────────
  let footerY = finalSummaryY + 118;
  if (footerY > pageHeight - 68) {
    doc.addPage();
    doc.setFillColor(...PALETTE.white);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    footerY = margin;
  }

  // Footer accent line
  doc.setFillColor(...PALETTE.accent);
  doc.rect(margin, footerY, contentWidth, 2, 'F');

  drawText(doc, 'Thank you for your order!', margin, footerY + 20, {
    size: 10, color: PALETTE.text, weight: 'bold',
  });

  drawText(doc, `Return Policy: ${returnPolicyUrl}`, margin, footerY + 36, {
    size: 8, color: PALETTE.muted, maxWidth: contentWidth,
  });

  drawText(doc, `${storeName} • Generated on ${new Date().toLocaleDateString('en-PK', { dateStyle: 'medium' })}`, margin, footerY + 50, {
    size: 7, color: PALETTE.light,
  });

  doc.save(`Invoice_${invoiceNumber}.pdf`);
};
