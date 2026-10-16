export function normalizeCheckoutCity(city = '') {
  return String(city || '').trim().toLowerCase();
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateCheckoutPricing({
  subtotal = 0,
  city = '',
  settings = {},
  appliedCoupon = null,
  hasFreeDeliveryProduct = false,
  items = [],
} = {}) {
  const safeSubtotal = Math.max(0, toSafeNumber(subtotal));
  const normalizedCity = normalizeCheckoutCity(city);
  const isCitySelected = Boolean(normalizedCity);
  const isKarachi = normalizedCity === 'karachi';

  const karachiFee = toSafeNumber(settings?.karachiDeliveryFee, 200);
  const outsideKarachiFee = toSafeNumber(settings?.outsideKarachiDeliveryFee, 300);

  let discountAmount = 0;
  if (appliedCoupon && safeSubtotal >= (appliedCoupon.minOrderAmount || 0)) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.max(0, (safeSubtotal * appliedCoupon.discountValue) / 100);
    } else if (appliedCoupon.discountType === 'fixed_amount') {
      discountAmount = Math.max(0, Math.min(safeSubtotal, appliedCoupon.discountValue));
    }
  }

  const freeShippingThreshold = Math.max(0, toSafeNumber(settings?.freeShippingThreshold, 5000));
  const qualifiesByThreshold = safeSubtotal >= freeShippingThreshold && freeShippingThreshold > 0;
  const qualifiesByCoupon = appliedCoupon?.discountType === 'free_shipping';
  const qualifiesByProduct = Boolean(
    hasFreeDeliveryProduct || 
    (Array.isArray(items) && items.some((item) => Boolean(item?.isFreeDelivery)))
  );

  const isFreeShipping = qualifiesByThreshold || qualifiesByCoupon || qualifiesByProduct;

  let shippingBase = 0;
  if (!isFreeShipping) {
    if (isKarachi) {
      shippingBase = karachiFee;
    } else if (isCitySelected) {
      shippingBase = outsideKarachiFee;
    } else {
      // City is not chosen yet - do not silently assume outside Karachi
      shippingBase = 0;
    }
  }

  const shipping = isFreeShipping ? 0 : Math.max(0, shippingBase);
  const total = Math.max(0, safeSubtotal - discountAmount) + shipping;

  return {
    subtotal: safeSubtotal,
    shipping,
    total,
    isFreeShipping,
    freeShippingThreshold,
    isKarachi,
    isCitySelected,
    karachiFee,
    outsideKarachiFee,
    discountAmount,
    appliedCoupon,
    isProductFreeDelivery: qualifiesByProduct,
  };
}
