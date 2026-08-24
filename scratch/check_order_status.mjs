import mongooseConnect from '../src/lib/mongooseConnect.js';
import Order from '../src/models/Order.js';

async function checkOrder() {
  await mongooseConnect();
  const order = await Order.findOne({ trackingNumber: '16223506416434' }).lean();
  console.log('Order found:', order ? {
    orderId: order.orderId,
    status: order.status,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    statusHistory: order.statusHistory,
  } : 'NOT FOUND BY TRACKING NUMBER');

  if (!order) {
    const sample = await Order.findOne({ trackingNumber: { $exists: true, $ne: '' } }).lean();
    console.log('Sample order with tracking:', sample ? {
      orderId: sample.orderId,
      status: sample.status,
      trackingNumber: sample.trackingNumber,
      statusHistory: sample.statusHistory,
    } : 'None');
  }
  process.exit(0);
}

checkOrder();
