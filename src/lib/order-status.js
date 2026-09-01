export const ORDER_STATUSES = [
  'Order Confirmed',
  'In Process',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Returned',
];

export const DEFAULT_ORDER_STATUS = 'Order Confirmed';
export const DEFAULT_ADMIN_FILTER_STATUS = 'all';

export const LEGACY_ORDER_STATUS_MAP = {
  Pending: 'Order Confirmed',
  Confirmed: 'Order Confirmed',
  Sourcing: 'In Process',
  Packed: 'Packed',
  'Out for Delivery': 'Out For Delivery',
  'Delivery Address Issue': 'Returned',
};

/**
 * Maps courier (NOC Express) tracking statuses directly to Store Order lifecycle & payment status
 */
export function mapNocStatusToStoreLifecycle(rawNocStatus) {
  const s = String(rawNocStatus || '').trim().toLowerCase();
  if (!s) return null;

  // 1. Payment Done / COD Remitted -> Delivered + Paid
  if (
    s.includes('payment') ||
    s.includes('paid') ||
    s.includes('remit') ||
    s.includes('cr done') ||
    s.includes('cash collect') ||
    s.includes('cheque')
  ) {
    return {
      status: 'Delivered',
      paymentStatus: 'Paid',
    };
  }

  // 2. Delivered -> Delivered (payment pending)
  if (
    s.includes('deliver') &&
    !s.includes('out for') &&
    !s.includes('under deliver') &&
    !s.includes('attempt') &&
    !s.includes('fail')
  ) {
    return {
      status: 'Delivered',
    };
  }

  // 3. Return / Refused / Cancelled / RTO -> Returned
  if (
    s.includes('return') ||
    s.includes('refus') ||
    s.includes('cancel') ||
    s.includes('rto') ||
    s.includes('rts') ||
    s.includes('damage') ||
    s.includes('reject') ||
    s.includes('undelivered - ret')
  ) {
    return {
      status: 'Returned',
    };
  }

  // 4. In Transit / Out For Delivery / Movement on route / Hub / Runsheet -> Out For Delivery
  if (
    s.includes('transit') ||
    s.includes('out for') ||
    s.includes('dispatch') ||
    s.includes('route') ||
    s.includes('runsheet') ||
    s.includes('rider') ||
    s.includes('destination') ||
    s.includes('arrived at') ||
    s.includes('under deliver') ||
    s.includes('hub')
  ) {
    return {
      status: 'Out For Delivery',
    };
  }

  // 5. Initial / Booking / Received at office -> Shipped
  if (
    s.includes('book') ||
    s.includes('received at') ||
    s.includes('manifest') ||
    s.includes('pickup')
  ) {
    return {
      status: 'Shipped',
    };
  }

  return null;
}

/**
 * Maps raw courier checkpoint to clean, customer-friendly status and description.
 * Customer sees understandable descriptions rather than courier internal codes.
 */
export function mapCourierEventForCustomer(rawStatus, rawRemarks = '') {
  const s = String(rawStatus || '').trim().toLowerCase();
  const rem = String(rawRemarks || '').trim();

  // 1. Delivered
  if (
    s.includes('payment') ||
    s.includes('paid') ||
    s.includes('remit') ||
    s.includes('cr done') ||
    (s.includes('deliver') && !s.includes('out for') && !s.includes('attempt') && !s.includes('fail') && !s.includes('under deliver'))
  ) {
    return {
      title: 'Delivered',
      description: 'Package successfully delivered. Thank you for shopping!',
    };
  }

  // 2. Return
  if (
    s.includes('return') ||
    s.includes('refus') ||
    s.includes('rto') ||
    s.includes('rts') ||
    s.includes('damage') ||
    s.includes('reject')
  ) {
    return {
      title: 'Returned',
      description: 'Shipment returning to store.',
    };
  }

  // 3. Delivery Attempt Failed / Consignee unavailable
  if (s.includes('attempt') || s.includes('fail') || s.includes('undelivered') || s.includes('reschedule') || s.includes('unavailable')) {
    return {
      title: 'Delivery Rescheduled',
      description: 'Courier could not reach you; next attempt scheduled.',
    };
  }

  // 4. In Transit / Out for delivery / Destination city / Runsheet
  if (s.includes('transit') || s.includes('out for') || s.includes('rider') || s.includes('runsheet') || s.includes('under deliver') || s.includes('dispatch') || s.includes('route') || s.includes('hub') || s.includes('destination')) {
    return {
      title: 'In Transit',
      description: 'Package is on the way to your city.',
    };
  }

  // 5. Received at office / Sorting facility
  if (s.includes('received at') || s.includes('pickup') || s.includes('office') || s.includes('facility')) {
    return {
      title: 'In Transit',
      description: 'Package received at courier facility.',
    };
  }

  // 6. Booking / Shipped
  if (s.includes('book') || s.includes('manifest') || s.includes('shipped')) {
    return {
      title: 'Order Shipped',
      description: 'Parcel has been booked with courier partner.',
    };
  }

  return {
    title: rawStatus || 'Order Update',
    description: rem || 'Package is being processed by courier.',
  };
}

export function normalizeOrderStatus(status) {
  const rawStatus = String(status || '').trim();
  if (!rawStatus) return DEFAULT_ORDER_STATUS;
  if (rawStatus === 'all' || rawStatus === 'draft' || rawStatus === 'trash') return rawStatus;
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

export function getStatusBadgeClass(status, isDraft = false) {
  if (isDraft) {
    return 'border-slate-300 bg-slate-50 text-slate-700';
  }
  const normalizedStatus = normalizeOrderStatus(status).toLowerCase();

  if (normalizedStatus === 'order confirmed') {
    return 'border-sky-200 bg-sky-100 text-sky-800';
  }

  if (normalizedStatus === 'delivered') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  }

  if (
    normalizedStatus.includes('issue') ||
    normalizedStatus.includes('return')
  ) {
    return 'border-red-200 bg-red-100 text-red-800';
  }

  if (
    normalizedStatus === 'in process' ||
    normalizedStatus === 'packed' ||
    normalizedStatus === 'shipped' ||
    normalizedStatus === 'out for delivery'
  ) {
    return 'border-amber-200 bg-amber-100 text-amber-800';
  }

  return 'border-slate-200 bg-slate-100 text-slate-800';
}

export function getOrderOriginInfo(order) {
  const isAdmin = 
    order?.orderType === 'Admin' ||
    Boolean(order?.isDraft) ||
    Boolean(order?.sourceTag && String(order.sourceTag).trim() !== '') ||
    Boolean(order?.invoiceId || order?.invoiceNumber) ||
    (order?.manualCodAmount !== undefined && order?.manualCodAmount !== null && order?.manualCodAmount !== '') ||
    Boolean(order?.itemType && order?.itemType !== 'Mix');

  const isOnline = !isAdmin && (order?.orderType === 'Online' || !order?.orderType);
  const tag = order?.sourceTag || '';

  return {
    isOnline,
    isAdmin,
    label: isOnline ? 'Online (Website)' : (tag ? `Admin (${tag})` : 'Created by Admin'),
    shortLabel: isOnline ? 'Online' : (tag || 'Admin'),
    tooltip: isOnline 
      ? 'Online Order (Placed by customer on website)' 
      : `Created by Admin${tag ? ` • Channel: ${tag}` : ' (Manual / Draft)'}`,
    badgeClass: isOnline 
      ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300' 
      : 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    iconClass: 'text-foreground shrink-0 select-none',
  };
}

