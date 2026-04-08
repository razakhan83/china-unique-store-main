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
    month: 'short',
    day: 'numeric',
  });
}

function normalizeItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const quantity = Math.max(1, getNumber(item?.quantity, 1));
    const unitPrice = getNumber(item?.price);

    return {
      item: getText(item?.name || item?.Name, `Item ${index + 1}`),
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

function drawSection(doc, { title, lines, x, y, width, palette }) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...palette.muted);
  doc.text(title, x, y);

  let currentY = y + 18;
  const safeLines = Array.isArray(lines) && lines.length > 0 ? lines : ['Not provided'];

  safeLines.forEach((line, index) => {
    const wrapped = doc.splitTextToSize(getText(line, 'Not provided'), width);
    doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...palette.text);
    doc.text(wrapped, x, currentY);
    currentY += wrapped.length * 13 + 4;
  });

  return currentY;
}

export const generateInvoice = async (order, branding = {}) => {
  const { jsPDF } = await import('jspdf');
  const autoTableImport = await import('jspdf-autotable');
  const autoTable = autoTableImport.default || autoTableImport;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  if (typeof autoTable !== 'function' && typeof doc.autoTable !== 'function') {
    throw new Error('PDF table plugin not loaded correctly.');
  }

  const palette = {
    text: [31, 41, 55],
    muted: [107, 114, 128],
    line: [229, 231, 235],
    soft: [243, 244, 246],
    accent: [17, 24, 39],
    statusPaid: [22, 101, 52],
    statusUnpaid: [180, 83, 9],
  };

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

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  const logoDataUrl = await loadImageDataUrl(logoUrl);
  const headerTop = margin;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, headerTop, 120, 40, undefined, 'FAST');
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...palette.accent);
    doc.text(storeName, margin, headerTop + 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...palette.accent);
  doc.text('INVOICE', pageWidth - margin, headerTop + 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...palette.muted);
  doc.text(`Invoice No: ${invoiceNumber}`, pageWidth - margin, headerTop + 36, { align: 'right' });
  doc.text(`Date: ${formatDate(order?.createdAt)}`, pageWidth - margin, headerTop + 50, { align: 'right' });

  doc.setDrawColor(...palette.line);
  doc.line(margin, headerTop + 72, pageWidth - margin, headerTop + 72);

  const sectionY = headerTop + 102;
  const gap = 36;
  const colWidth = (pageWidth - margin * 2 - gap) / 2;

  const leftBottom = drawSection(doc, {
    title: 'STORE FROM',
    lines: [
      storeName,
      businessAddress,
      supportEmail ? `Email: ${supportEmail}` : 'Support email not configured',
    ],
    x: margin,
    y: sectionY,
    width: colWidth,
    palette,
  });

  const rightBottom = drawSection(doc, {
    title: 'SHIP TO',
    lines: [
      getText(order?.customerName, 'Customer'),
      getText(order?.customerPhone) ? `Phone: ${getText(order?.customerPhone)}` : 'Phone: Not provided',
      getText(order?.customerEmail) ? `Email: ${getText(order?.customerEmail)}` : '',
      getText(order?.customerAddress, 'Address not provided'),
      getText(order?.customerCity) ? `City: ${getText(order?.customerCity)}` : '',
      getText(order?.landmark) ? `Landmark: ${getText(order?.landmark)}` : '',
    ].filter(Boolean),
    x: margin + colWidth + gap,
    y: sectionY,
    width: colWidth,
    palette,
  });

  const metaY = Math.max(leftBottom, rightBottom) + 18;

  doc.setFillColor(...palette.soft);
  doc.roundedRect(margin, metaY, pageWidth - margin * 2, 42, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...palette.text);
  doc.text(`Payment Method: ${paymentMethod}`, margin + 14, metaY + 26);
  doc.setTextColor(...(paymentStatus === 'Paid' ? palette.statusPaid : palette.statusUnpaid));
  doc.text(`Status: ${paymentStatus}`, pageWidth / 2 + 20, metaY + 26);

  autoTable(doc, {
    startY: metaY + 62,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: items.length
      ? items.map((item) => [
          item.item,
          String(item.quantity),
          formatCurrency(item.unitPrice),
          formatCurrency(item.total),
        ])
      : [['No products found', '-', '-', formatCurrency(0)]],
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: palette.soft,
      textColor: palette.text,
      lineColor: palette.line,
      lineWidth: 1,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: palette.text,
      lineColor: palette.line,
      lineWidth: 1,
      fontSize: 10,
      cellPadding: 10,
    },
    styles: {
      font: 'helvetica',
      overflow: 'linebreak',
      cellPadding: 10,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 48, halign: 'center' },
      2: { cellWidth: 90, halign: 'right' },
      3: { cellWidth: 90, halign: 'right' },
    },
  });

  const tableBottom = doc.lastAutoTable?.finalY || metaY + 200;
  const summaryY = tableBottom + 24;
  const summaryWidth = 210;
  const summaryX = pageWidth - margin - summaryWidth;

  if (getText(order?.notes)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...palette.muted);
    doc.text('NOTE', margin, summaryY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...palette.text);
    const noteLines = splitLines(doc, order.notes, pageWidth - margin * 2 - summaryWidth - 32);
    doc.text(noteLines, margin, summaryY + 30);
  }

  doc.setFillColor(...palette.soft);
  doc.roundedRect(summaryX, summaryY, summaryWidth, 88, 8, 8, 'F');

  const totals = [
    ['Subtotal', formatCurrency(subtotal)],
    ['Shipping', formatCurrency(shipping)],
    ['Total', formatCurrency(total)],
  ];

  let currentY = summaryY + 22;
  totals.forEach(([label, value], index) => {
    const isTotal = index === totals.length - 1;
    if (isTotal) {
      doc.setDrawColor(...palette.line);
      doc.line(summaryX + 14, currentY - 10, summaryX + summaryWidth - 14, currentY - 10);
    }

    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 11 : 10);
    doc.setTextColor(...palette.text);
    doc.text(label, summaryX + 14, currentY);
    doc.text(value, summaryX + summaryWidth - 14, currentY, { align: 'right' });
    currentY += isTotal ? 24 : 18;
  });

  let footerY = summaryY + 118;
  if (footerY > pageHeight - 72) {
    doc.addPage();
    footerY = margin;
  }

  doc.setDrawColor(...palette.line);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...palette.text);
  doc.text('Thank you for shopping with us!', margin, footerY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...palette.muted);
  doc.text('Return policy:', margin, footerY + 40);
  doc.text(returnPolicyUrl, margin + 60, footerY + 40, {
    url: returnPolicyUrl,
    maxWidth: pageWidth - margin * 2 - 60,
  });

  doc.save(`Invoice_${invoiceNumber}.pdf`);
};
