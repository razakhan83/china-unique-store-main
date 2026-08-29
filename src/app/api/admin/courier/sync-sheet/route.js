import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { requireApiAdmin } from '@/lib/requireAdmin';

export async function POST(request) {
  const auth = await requireApiAdmin({ mutation: true });
  if (auth.error) return auth.error;

  try {
    const contentType = request.headers.get('content-type') || '';
    let parsedRows = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return NextResponse.json({ success: false, error: 'Empty Excel file' }, { status: 400 });
      }

      // Detect header columns dynamically
      let courierCol = -1;
      let parcelCol = -1;
      let thirdPartyCol = -1;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1 || (courierCol === -1 && parcelCol === -1)) {
          row.eachCell((cell, colNumber) => {
            const val = String(cell.value || '').trim().toLowerCase();
            if (val.includes('courier')) courierCol = colNumber;
            if (val.includes('parcel') || val.includes('tracking') || val.includes('cn')) parcelCol = colNumber;
            if (val.includes('3rd') || val.includes('third') || val.includes('party')) thirdPartyCol = colNumber;
          });
          return;
        }

        const rawCourier = courierCol !== -1 ? String(row.getCell(courierCol).value || '').trim() : '';
        const rawParcelNo = parcelCol !== -1 ? String(row.getCell(parcelCol).value || '').trim() : '';
        const raw3rdParty = thirdPartyCol !== -1 ? String(row.getCell(thirdPartyCol).value || '').trim() : '';

        if (rawParcelNo || raw3rdParty) {
          parsedRows.push({
            courier: rawCourier,
            parcelNo: rawParcelNo,
            thirdPartyNo: raw3rdParty,
          });
        }
      });
    } else {
      // JSON payload (e.g. pasted rows or manual array)
      const body = await request.json();
      parsedRows = Array.isArray(body.rows) ? body.rows : [];
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid parcel rows found to sync.' },
        { status: 400 }
      );
    }

    await mongooseConnect();

    let updatedCount = 0;
    const updateResults = [];

    for (const row of parsedRows) {
      const pNo = String(row.parcelNo || row.ParcelNo || '').trim();
      const tpNo = String(row.thirdPartyNo || row['3RD Party NO'] || row['3rdPartyNo'] || '').trim();
      const courier = String(row.courier || row.Courier || '').trim();

      if (!pNo && !tpNo) continue;

      const isTpValid =
        tpNo !== '' &&
        tpNo.toUpperCase() !== 'N/A' &&
        tpNo.toUpperCase() !== 'NA' &&
        tpNo.toLowerCase() !== 'null' &&
        tpNo.toLowerCase() !== 'undefined';

      const finalTp = isTpValid ? tpNo : '';
      const finalCourier = courier || 'NOC';

      // Find matching order in DB
      const orQuery = [];
      if (pNo) {
        orQuery.push({ trackingNumber: pNo }, { nocParcelNo: pNo });
      }
      if (finalTp) {
        orQuery.push({ nocThirdPartyNo: finalTp });
      }

      if (orQuery.length === 0) continue;

      const order = await Order.findOne({ $or: orQuery, isDeleted: { $ne: true } });

      if (order) {
        let changed = false;
        if (finalCourier && order.courierName !== finalCourier) {
          order.courierName = finalCourier;
          changed = true;
        }
        if (pNo && order.nocParcelNo !== pNo) {
          order.nocParcelNo = pNo;
          changed = true;
        }
        if (order.nocThirdPartyNo !== finalTp) {
          order.nocThirdPartyNo = finalTp;
          changed = true;
        }

        if (changed) {
          await order.save();
          updatedCount++;
          updateResults.push({
            orderId: order.orderId,
            courier: order.courierName,
            parcelNo: order.nocParcelNo,
            thirdPartyNo: order.nocThirdPartyNo,
          });
        }
      }
    }

    if (updatedCount > 0) {
      revalidateTag('orders');
      revalidateTag('admin-dashboard');
      revalidatePath('/admin/orders');
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${updatedCount} order(s) from NOC sheet.`,
      updatedCount,
      totalRowsProcessed: parsedRows.length,
      updateResults,
    });
  } catch (error) {
    if (error?.digest?.startsWith('NEXT_')) throw error;
    console.error('Error syncing NOC sheet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error syncing sheet' },
      { status: 500 }
    );
  }
}
