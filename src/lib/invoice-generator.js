export const generateInvoice = async (order) => {
  // Dynamically import jsPDF and autoTable only when needed on the client
  const { jsPDF } = await import('jspdf');
  const autoTableImport = await import('jspdf-autotable');
  
  // Support both direct import and prototype extension
  const autoTable = autoTableImport.default || autoTableImport;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Ensure autoTable is availability
  if (typeof autoTable !== 'function' && typeof doc.autoTable !== 'function') {
    throw new Error('PDF Table plugin not loaded correctly');
  }

  // Colors
  const primaryColor = [16, 185, 129]; // Emerald 500
  const secondaryColor = [107, 114, 128]; // Gray 500
  const titleColor = [31, 41, 55]; // Gray 800

  // Header - Store Info
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('KIFAYATLY', margin, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Smart Shopping, Better Living', margin, 32);

  // Invoice Label
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text('INVOICE', pageWidth - margin - 35, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: ${order.orderId}`, pageWidth - margin - 50, 32);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - margin - 50, 37);

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, 45, pageWidth - margin, 45);

  // Customer Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text('BILL TO:', margin, 55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, margin, 62);
  doc.text(`Phone: ${order.customerPhone}`, margin, 67);
  
  const addressLines = doc.splitTextToSize(order.customerAddress, pageWidth / 2 - margin);
  doc.text(addressLines, margin, 72);

  // Order Details (Payment Status/Method)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER INFO:', pageWidth / 2 + 10, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Method: Cash on Delivery', pageWidth / 2 + 10, 62);
  doc.text(`Status: ${order.status}`, pageWidth / 2 + 10, 67);

  // Items Table
  const tableData = order.items.map((item) => [
    item.name,
    item.quantity.toString(),
    `Rs. ${item.price.toLocaleString()}`,
    `Rs. ${(item.price * item.quantity).toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Product', 'Qty', 'Unit Price', 'Line Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 6 
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });

  // Totals Section
  const finalY = doc.lastAutoTable.finalY + 10;
  const subtotal = order.totalAmount; // This seems to be the total in the data, let's assume it handles delivery

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', pageWidth - margin - 60, finalY);
  doc.text(`Rs. ${subtotal.toLocaleString()}`, pageWidth - margin, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Thank you for shopping with Kifayatly!', pageWidth / 2, 280, { align: 'center' });
  doc.text('For support, contact us at support@kifayatly.com', pageWidth / 2, 285, { align: 'center' });

  // Save PDF
  doc.save(`Invoice_${order.orderId}.pdf`);
};
