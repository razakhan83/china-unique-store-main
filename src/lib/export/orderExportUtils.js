
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
      .replace(/[, \n\r]+/g, ' ')
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
      formulae: [`$T$1:$T$${PAKISTAN_CITIES.length}`],
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
