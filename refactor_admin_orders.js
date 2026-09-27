const fs = require('fs');
const file = 'src/app/admin/orders/AdminOrdersClient.jsx';
let content = fs.readFileSync(file, 'utf8');
const orderExportContent = `
export async function generateCourierSheetExcel({ ordersToExport, PAKISTAN_CITIES, getCodAmount }) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const mainSheet = workbook.addWorksheet('Sheet1');

  PAKISTAN_CITIES.forEach((city, index) => {
    mainSheet.getCell(index + 1, 20).value = city;
  });
  mainSheet.getColumn(20).hidden = true;

  const headers = [
    'ConsigneeName', 'ConsigneeAddress', 'ConsigneeEmail', 'ConsigneeCellNo',
    'ConsigneeCity', 'ItemType', 'Quantity', 'CODAmount', 'Weight', 'SpecialInstruction'
  ];

  mainSheet.getRow(1).values = headers;
  mainSheet.getRow(1).font = { bold: true };

  ordersToExport.forEach((order, index) => {
    let codAmount = 0;
    if (order.manualCodAmount !== undefined && order.manualCodAmount !== null && order.manualCodAmount !== '') {
      codAmount = Number(order.manualCodAmount);
    } else if (order.paymentStatus === 'Online') {
      codAmount = 0;
    } else {
      codAmount = getCodAmount(order);
    }

    const cleanAddress = [order.customerAddress, order.landmark]
      .filter(Boolean)
      .join(' - ')
      .replace(/[, \\n\\r]+/g, ' ')
      .trim();

    let city = (order.customerCity || '').trim();
    const exactMatch = PAKISTAN_CITIES.find((entry) => entry.trim().toLowerCase() === city.toLowerCase());
    city = exactMatch || 'KARACHI';

    const row = mainSheet.getRow(index + 2);
    const email = (order.customerEmail || 'customer@store.com').trim();

    row.values = [
      order.customerName, cleanAddress, email, order.customerPhone, city,
      order.itemType || 'Mix', String(order.orderQuantity || 1), codAmount,
      order.weight ?? 2, order.notes || ''
    ];

    row.getCell(5).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [\`$T$1:$T$\${PAKISTAN_CITIES.length}\`],
      showDropDown: true,
    };
  });

  mainSheet.columns.forEach((column, index) => {
    if (index < 10) column.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return blob;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
`;
fs.mkdirSync('src/lib/export', { recursive: true });
fs.writeFileSync('src/lib/export/orderExportUtils.js', orderExportContent);
console.log('Created orderExportUtils.js');

const generateCourierSheetRegex = /const handleGenerateCourierSheet = async \(\) => \{[\s\S]*?setPendingWorkflowAction\(''\);\n\s*\}\n\s*\};/;
const generateCourierReplacement = `const handleGenerateCourierSheet = async () => {
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
      const { generateCourierSheetExcel, downloadBlob } = await import('@/lib/export/orderExportUtils');
      const blob = await generateCourierSheetExcel({ ordersToExport, PAKISTAN_CITIES, getCodAmount });
      downloadBlob(blob, \`Courier_Sheet_\${new Date().toISOString().slice(0, 10)}.xlsx\`);

      await moveSelectedOrdersToStatus('Shipped', {
        allowedCurrentStatuses: isDraftContext ? [] : ['Packed'],
        logReason: isDraftContext ? 'Courier sheet generated from Draft. Status moved to Shipped.' : 'Courier sheet generated. Status moved from Packed to Shipped.',
      });
    } finally {
      setPendingWorkflowAction('');
    }
  };`;

content = content.replace(generateCourierSheetRegex, generateCourierReplacement);
fs.writeFileSync(file, content);
console.log('Refactored handleGenerateCourierSheet');
