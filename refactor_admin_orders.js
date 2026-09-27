const fs = require('fs');
const file = 'src/app/admin/orders/AdminOrdersClient.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replacements object
const replacements = [
  {
    start: 'const handleGenerateCourierSheet = async () => {',
    end: 'const handleGenerateSourcingSlip = async',
    newCode: `const handleGenerateCourierSheet = async () => {
    const isDraftContext = statusFilter === DRAFT_TAB_ID;
    let ordersToExport = [];
    
    if (isDraftContext) {
      ordersToExport = getSelectedOrders();
      if (ordersToExport.length === 0) {
        toast.error("Select at least one draft order to generate courier sheet.");
        return;
      }
    } else {
      ordersToExport = validateSelectedOrders('Packed', 'Generate Courier Sheet');
      if (!ordersToExport) return;
    }

    setPendingWorkflowAction('courier');

    try {
      const { generateCourierSheetExcel, downloadBlob } = await import('@/lib/export/orderExcelExport');
      const blob = await generateCourierSheetExcel({ ordersToExport, PAKISTAN_CITIES, getCodAmount });
      downloadBlob(blob, \`Courier_Sheet_\${new Date().toISOString().slice(0, 10)}.xlsx\`);

      await moveSelectedOrdersToStatus('Shipped', {
        allowedCurrentStatuses: isDraftContext ? [] : ['Packed'],
        logReason: isDraftContext ? 'Courier sheet generated from Draft. Status moved to Shipped.' : 'Courier sheet generated. Status moved from Packed to Shipped.',
      });
    } finally {
      setPendingWorkflowAction('');
    }
  };

  `
  },
  {
    start: 'const handleGenerateSourcingSlip = async',
    end: 'const handlePrintSourcingSlip = async',
    newCode: `const handleGenerateSourcingSlip = async ({ moveToNextStep = true } = {}) => {
    const ordersToExport = validateSelectedOrders('Order Confirmed', 'Generate Sourcing Slip');
    if (!ordersToExport) return;

    setPendingWorkflowAction(moveToNextStep ? 'sourcing-move' : 'sourcing-download');

    try {
      const { generateSourcingSlipPdf } = await import('@/lib/export/orderPdfExport');
      const { sourcingRows, imageLookup, grandTotalCost } = await collectSourcingSlipData(ordersToExport);
      
      const doc = await generateSourcingSlipPdf({ sourcingRows, imageLookup, grandTotalCost, sanitizePdfText });

      if (moveToNextStep) {
        const statusMoved = await moveSelectedOrdersToStatus('In Process', {
          allowedCurrentStatuses: ['Order Confirmed'],
          logReason: 'Sourcing slip generated. Status moved from Order Confirmed to In Process.',
        });

        if (!statusMoved) return;
      }

      doc.save(\`Sourcing_Slip_\${new Date().toISOString().slice(0, 10)}.pdf\`);
    } finally {
      setPendingWorkflowAction('');
    }
  };

  `
  },
  {
    start: 'const handleGeneratePackingSlip = async',
    end: 'const handlePrintPackingSlip = async',
    newCode: `const handleGeneratePackingSlip = async ({ moveToNextStep = true } = {}) => {
    const selectedRecords = validateSelectedOrders('In Process', 'Generate Packing Slip');
    if (!selectedRecords) return;

    setPendingWorkflowAction(moveToNextStep ? 'packing-move' : 'packing-download');

    try {
      const { generatePackingSlipPdf } = await import('@/lib/export/orderPdfExport');
      const doc = await generatePackingSlipPdf({ selectedRecords, sanitizePdfText });

      if (moveToNextStep) {
        const statusMoved = await moveSelectedOrdersToStatus('Packed', {
          allowedCurrentStatuses: ['In Process'],
          logReason: 'Packing slip generated. Status moved from In Process to Packed.',
        });

        if (!statusMoved) return;
      }

      doc.save(\`Packing_Slips_\${new Date().toISOString().slice(0, 10)}.pdf\`);
    } finally {
      setPendingWorkflowAction('');
    }
  };

  `
  },
  {
    start: 'const handleExportMonthlySales = async (format) => {',
    end: 'const handleQuickUpdate = async (id) => {',
    newCode: `const handleExportMonthlySales = async (format) => {
    // Filter orders by the selected date range for monthly report
    const reportOrders = orders;
    if (reportOrders.length === 0) {
      toast.error('No orders found in the current filtered range for report.');
      return;
    }

    const totalRevenue = reportOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const statusCounts = reportOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    if (format === 'excel') {
      const { generateMonthlySalesExcel, downloadBlob } = await import('@/lib/export/orderExcelExport');
      const blob = await generateMonthlySalesExcel({ reportOrders, startDate, endDate, totalRevenue, statusCounts });
      downloadBlob(blob, \`Monthly_Sales_Report_\${new Date().toISOString().slice(0, 7)}.xlsx\`);
    } else {
      const { generateMonthlySalesPdf } = await import('@/lib/export/orderPdfExport');
      const doc = await generateMonthlySalesPdf({ reportOrders, startDate, endDate, totalRevenue, statusCounts });
      doc.save(\`Monthly_Sales_Report_\${new Date().toISOString().slice(0, 7)}.pdf\`);
    }
  };

  `
  }
];

let successCount = 0;

for (const rep of replacements) {
  const startIdx = content.indexOf(rep.start);
  const endIdx = content.indexOf(rep.end, startIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + rep.newCode + content.substring(endIdx);
    successCount++;
  } else {
    console.error('Failed to find slice:', rep.start.substring(0, 30));
  }
}

fs.writeFileSync(file, content);
console.log('Successfully replaced ' + successCount + ' sections.');
