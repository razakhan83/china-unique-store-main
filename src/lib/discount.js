const DISCOUNT_TYPES = new Set(['none', 'no-time', 'time-based']);

export function resolveDiscountType(product) {
  const type = product?.discountType;
  if (DISCOUNT_TYPES.has(type)) return type;
  if (product?.isDiscounted === true && Number(product.discountPercentage) > 0) return 'no-time';
  return 'none';
}

export function isStorefrontDiscountVisible(product) {
  const type = resolveDiscountType(product);
  const percentage = Number(product?.discountPercentage) || 0;
  if (percentage <= 0 || type === 'none') return false;
  if (type === 'no-time') return true;
  return Boolean(product?.discountEndsAt);
}

export function isDiscountActive(product, now = Date.now()) {
  const type = resolveDiscountType(product);
  const percentage = Number(product?.discountPercentage) || 0;
  if (percentage <= 0 || type === 'none') return false;
  if (type === 'no-time') return true;

  const endsAt = product?.discountEndsAt ? new Date(product.discountEndsAt).getTime() : NaN;
  if (!Number.isFinite(endsAt)) return false;
  return endsAt > Number(now);
}

export function getActiveSellingPrice(product, now = new Date()) {
  const basePrice = Number(product?.Price || product?.price || 0);
  if (!isDiscountActive(product, now)) return basePrice;

  if (product?.discountedPrice != null && Number.isFinite(Number(product.discountedPrice))) {
    return Number(product.discountedPrice);
  }

  const percentage = Number(product.discountPercentage) || 0;
  return Math.round(basePrice * (1 - percentage / 100));
}

export function limitedTimeOfferMongoFilter() {
  return {
    isDiscounted: true,
    discountType: 'time-based',
    discountPercentage: { $gt: 0 },
    discountEndsAt: { $ne: null },
  };
}

export function activeDiscountMongoFilter() {
  return {
    isDiscounted: true,
    $or: [
      { discountType: { $exists: false } },
      { discountType: null },
      { discountType: 'no-time' },
      { discountType: 'time-based', discountEndsAt: { $ne: null } },
    ],
  };
}

export function normalizeDiscountInput({ price, discountPercentage, discountType, discountEndsAt }) {
  const percentage = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const basePrice = Number(price) || 0;

  if (percentage <= 0) {
    return {
      discountPercentage: 0,
      discountType: 'none',
      discountEndsAt: null,
      isDiscounted: false,
      discountedPrice: null,
    };
  }

  const type = discountType === 'time-based' ? 'time-based' : 'no-time';
  const discountedPrice = Math.round(basePrice * (1 - percentage / 100));

  if (type === 'no-time') {
    return {
      discountPercentage: percentage,
      discountType: 'no-time',
      discountEndsAt: null,
      isDiscounted: true,
      discountedPrice,
    };
  }

  const endsAt = discountEndsAt ? new Date(discountEndsAt) : null;
  if (!endsAt || Number.isNaN(endsAt.getTime())) {
    return { error: 'Flash sale needs an end date and time.' };
  }
  if (endsAt.getTime() <= Date.now()) {
    return { error: 'Flash sale end time must be in the future.' };
  }

  return {
    discountPercentage: percentage,
    discountType: 'time-based',
    discountEndsAt: endsAt,
    isDiscounted: true,
    discountedPrice,
  };
}

export function toDateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
