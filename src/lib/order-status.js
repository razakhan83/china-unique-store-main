export const ORDER_STATUSES = [
  'Order Confirmed',
  'In Process',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Returned',
];

export const DEFAULT_ORDER_STATUS = ORDER_STATUSES[0];

export const LEGACY_ORDER_STATUS_MAP = {
  Pending: 'Order Confirmed',
  Confirmed: 'Order Confirmed',
  Sourcing: 'In Process',
  Packed: 'Packed',
  'Out for Delivery': 'Out For Delivery',
  'Delivery Address Issue': 'Returned',
};

export function normalizeOrderStatus(status) {
  const rawStatus = String(status || '').trim();
  if (!rawStatus) return DEFAULT_ORDER_STATUS;
  if (ORDER_STATUSES.includes(rawStatus)) return rawStatus;
  return LEGACY_ORDER_STATUS_MAP[rawStatus] || rawStatus;
}

export function isValidOrderStatus(status) {
  return ORDER_STATUSES.includes(normalizeOrderStatus(status));
}

export function getOrderStatusQueryValue(status) {
  const normalizedStatus = normalizeOrderStatus(status);

  switch (normalizedStatus) {
    case 'Order Confirmed':
      return { $in: ['Order Confirmed', 'Confirmed', 'Pending'] };
    case 'In Process':
      return { $in: ['In Process', 'Sourcing'] };
    case 'Packed':
      return { $in: ['Packed'] };
    case 'Out For Delivery':
      return { $in: ['Out For Delivery', 'Out for Delivery'] };
    case 'Returned':
      return { $in: ['Returned', 'Delivery Address Issue'] };
    default:
      return normalizedStatus;
  }
}

export function getOrderStatusSummaryCounts(statusCountMap) {
  const getCount = (keys) =>
    keys.reduce((total, key) => total + Number(statusCountMap.get(key) || 0), 0);

  const counts = {
    orderConfirmedCount: getCount(['Order Confirmed', 'Confirmed', 'Pending']),
    inProcessCount: getCount(['In Process', 'Sourcing']),
    packedCount: getCount(['Packed']),
    shippedCount: getCount(['Shipped']),
    outForDeliveryCount: getCount(['Out For Delivery', 'Out for Delivery']),
    deliveredCount: getCount(['Delivered']),
    returnedCount: getCount(['Returned', 'Delivery Address Issue']),
  };

  return {
    ...counts,
    allCount:
      counts.orderConfirmedCount +
      counts.inProcessCount +
      counts.packedCount +
      counts.shippedCount +
      counts.outForDeliveryCount +
      counts.deliveredCount +
      counts.returnedCount,
  };
}
