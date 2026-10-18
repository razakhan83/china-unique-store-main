import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { normalizeOrderStatus } from '@/lib/order-status';

function escapeCsvField(val) {
  if (val == null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req) {
  try {
    const { session, error: authError } = await requireApiAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    await mongooseConnect();

    const query = {
      isDeleted: { $ne: true },
      isDraft: { $ne: true },
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (status && status !== 'all') {
      query.status = normalizeOrderStatus(status);
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    let totalOrders = orders.length;
    let totalUnits = 0;
    let totalGrossRevenue = 0;
    let totalRefunded = 0;
    let totalShipping = 0;
    let totalDiscounts = 0;
    let totalTax = 0;

    const formattedOrders = orders.map((o) => {
      const itemsCount = (o.items || []).reduce((acc, i) => acc + Number(i.quantity || 1), 0);
      const gross = Number(o.totalAmount || 0);
      const refunded = Number(o.refundedAmount || 0);
      const net = Math.max(0, gross - refunded);
      const shipping = Number(o.shippingAmount || 0);
      const discount = Number(o.discountAmount || 0);
      const tax = Number(o.taxAmount || 0);

      totalUnits += itemsCount;
      totalGrossRevenue += gross;
      totalRefunded += refunded;
      totalShipping += shipping;
      totalDiscounts += discount;
      totalTax += tax;

      return {
        orderId: o.orderId,
        date: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '',
        customerName: o.customerName || '',
        customerPhone: o.customerPhone || '',
        customerCity: o.customerCity || '',
        status: normalizeOrderStatus(o.status),
        itemsCount,
        gross,
        shipping,
        discount,
        tax,
        refunded,
        net,
        paymentStatus: o.paymentStatus || 'COD',
        courier: o.courierName || 'NOC Express',
        trackingNumber: o.nocParcelNo || o.trackingNumber || o.nocThirdPartyNo || '',
      };
    });

    const netRevenue = Math.max(0, totalGrossRevenue - totalRefunded);

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        summary: {
          totalOrders,
          totalUnits,
          totalGrossRevenue,
          totalRefunded,
          netRevenue,
          totalShipping,
          totalDiscounts,
          totalTax,
        },
        orders: formattedOrders,
      });
    }

    // Generate CSV
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Phone',
      'City',
      'Status',
      'Units',
      'Shipping Fee (PKR)',
      'Discount (PKR)',
      'Sales Tax (PKR)',
      'Gross Total (PKR)',
      'Refunded (PKR)',
      'Net Revenue (PKR)',
      'Payment Status',
      'Courier',
      'Tracking CN',
    ];

    const csvRows = [headers.map(escapeCsvField).join(',')];

    formattedOrders.forEach((o) => {
      const row = [
        o.orderId,
        o.date,
        o.customerName,
        o.customerPhone,
        o.customerCity,
        o.status,
        o.itemsCount,
        o.shipping,
        o.discount,
        o.tax,
        o.gross,
        o.refunded,
        o.net,
        o.paymentStatus,
        o.courier,
        o.trackingNumber,
      ];
      csvRows.push(row.map(escapeCsvField).join(','));
    });

    // Summary Footer Row
    const summaryRow = [
      'TOTALS',
      '',
      '',
      '',
      '',
      `${totalOrders} Orders`,
      totalUnits,
      totalShipping,
      totalDiscounts,
      totalTax,
      totalGrossRevenue,
      totalRefunded,
      netRevenue,
      '',
      '',
      '',
    ];
    csvRows.push(summaryRow.map(escapeCsvField).join(','));

    const csvContent = csvRows.join('\r\n');
    const filename = `sales-report-${startDate || 'all'}-to-${endDate || 'today'}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[API] Sales Report Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
