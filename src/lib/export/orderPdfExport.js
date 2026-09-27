export async function generateSourcingSlipPdf({ sourcingRows, imageLookup, grandTotalCost, sanitizePdfText }) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(28, 28, 539, 70, 18, 18, 'F');
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(18);
  doc.text('Daily Sourcing Slip', 44, 56);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${new Date().toLocaleString('en-PK')}`, 44, 76);

  autoTable(doc, {
    startY: 118,
    head: [['Image', 'Item / Variant', 'Vendor List', 'Qty']],
    body: sourcingRows.map((row) => [
      '',
      row.itemName,
      row.vendors.length > 0
        ? row.vendors
            .map((vendor) => {
              const vendorName = sanitizePdfText(vendor.name || 'Vendor');
              const vendorProductName = sanitizePdfText(vendor.vendorProductName || '');
              const priceLabel = vendor.vendorPrice != null
                ? `PKR ${Number(vendor.vendorPrice).toLocaleString('en-PK')}`
                : 'Price N/A';
              return `${vendorName}${vendorProductName ? ` (${vendorProductName})` : ''} - ${priceLabel}`;
            })
            .join('\n')
        : '',
      String(row.totalQuantity || 0),
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 8,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 72, minCellHeight: 60 },
      1: { cellWidth: 170 },
      2: { cellWidth: 220 },
      3: { cellWidth: 45, halign: 'center' },
    },
    didDrawCell: (hookData) => {
      if (hookData.section !== 'body' || hookData.column.index !== 0) return;

      const imageKey = sourcingRows[hookData.row.index]?.image;
      const imageData = imageLookup.get(imageKey);

      if (imageData) {
        doc.addImage(imageData, hookData.cell.x + 8, hookData.cell.y + 6, 48, 48);
        return;
      }

      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(hookData.cell.x + 8, hookData.cell.y + 6, 48, 48, 8, 8);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('No image', hookData.cell.x + 16, hookData.cell.y + 34);
    },
  });

  const tableEndY = doc.lastAutoTable?.finalY || 118;
  doc.setDrawColor(226, 232, 240);
  doc.line(28, tableEndY + 18, 567, tableEndY + 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Grand Total Cost (lowest vendor price):', 332, tableEndY + 40);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`PKR ${grandTotalCost.toLocaleString('en-PK')}`, 567, tableEndY + 40, { align: 'right' });

  return doc;
}

export async function generatePackingSlipPdf({ selectedRecords, sanitizePdfText }) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = 28;
  const sectionX = 42;
  const sectionWidth = pageWidth - 84;
  const bottomMargin = 24;
  const sectionGap = 14;

  selectedRecords.forEach((order, orderIndex) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const addressLabel = `Address: ${sanitizePdfText(
      [order.customerAddress, order.customerCity].filter(Boolean).join(', ') || 'N/A'
    )}`;
    const addressLines = doc.splitTextToSize(addressLabel, sectionWidth - 24);
    const addressHeight = Math.max(12, addressLines.slice(0, 2).length * 10);
    const estimatedSectionHeight = 70 + addressHeight + 24 + (items.length * 20);

    if (cursorY + estimatedSectionHeight > pageHeight - bottomMargin) {
      doc.addPage();
      cursorY = 28;
    }

    const sectionTop = cursorY;
    const tableStartY = sectionTop + 50 + addressHeight;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.roundedRect(sectionX, sectionTop, sectionWidth, estimatedSectionHeight - 8, 8, 8, 'S');

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(sectionX, sectionTop, sectionWidth, 24, 8, 8, 'F');
    doc.rect(sectionX, sectionTop + 12, sectionWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('PACKING SLIP', sectionX + 12, sectionTop + 16);
    doc.text(`${sanitizePdfText(order.orderId)}`, pageWidth - sectionX - 12, sectionTop + 16, { align: 'right' });

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(8);
    doc.text(`Name: ${sanitizePdfText(order.customerName || 'N/A')}`, sectionX + 12, sectionTop + 38);
    doc.text(`Phone: ${sanitizePdfText(order.customerPhone || 'N/A')}`, sectionX + 210, sectionTop + 38);
    doc.text(addressLines.slice(0, 2), sectionX + 12, sectionTop + 50);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Items', 'Qty']],
      body: items.map((item) => [
        sanitizePdfText(item.name || 'Unnamed item'),
        String(Number(item.quantity || 0)),
      ]),
      theme: 'grid',
      margin: { left: sectionX, right: sectionX },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: sectionWidth - 70 },
        1: { cellWidth: 70, halign: 'center' },
      },
    });

    const finalY = doc.lastAutoTable?.finalY || tableStartY;
    cursorY = finalY + sectionGap;
  });

  return doc;
}

export async function generateMonthlySalesPdf({ reportOrders, startDate, endDate, totalRevenue, statusCounts }) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Monthly Sales Report', 14, 20);
  doc.setFontSize(12);
  doc.text(`Period: ${startDate || 'All'} to ${endDate || 'All'}`, 14, 30);
  
  doc.text('Summary', 14, 45);
  autoTable(doc, {
    body: [
      ['Total Orders', reportOrders.length],
      ['Total Revenue', `PKR ${totalRevenue.toLocaleString()}`],
    ],
    startY: 50,
    theme: 'grid',
  });

  doc.text('Status Breakdown', 14, doc.lastAutoTable?.finalY + 15 || 80);
  autoTable(doc, {
    body: Object.entries(statusCounts),
    startY: doc.lastAutoTable?.finalY + 20 || 85,
    theme: 'grid',
  });

  doc.text('Order details', 14, doc.lastAutoTable?.finalY + 15 || 120);
  autoTable(doc, {
    head: [['Date', 'ID', 'Customer', 'City', 'Amount', 'Status']],
    body: reportOrders.map(o => [
      new Date(o.createdAt).toLocaleDateString(),
      o.orderId,
      o.customerName,
      o.customerCity,
      o.totalAmount,
      o.status
    ]),
    startY: doc.lastAutoTable?.finalY + 20 || 125,
  });

  return doc;
}
