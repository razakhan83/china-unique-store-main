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
} = {}) {
  const safeSubtotal = Math.max(0, toSafeNumber(subtotal));
  const normalizedCity = normalizeCheckoutCity(city);
  const isKarachi = normalizedCity === 'karachi';
  const shippingBase = isKarachi
    ? toSafeNumber(settings?.karachiDeliveryFee, 0)
    : toSafeNumber(settings?.outsideKarachiDeliveryFee, 0);
  const freeShippingThreshold = Math.max(0, toSafeNumber(settings?.freeShippingThreshold, 0));
  const isFreeShipping = safeSubtotal >= freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : Math.max(0, shippingBase);
  const total = safeSubtotal + shipping;

  return {
    subtotal: safeSubtotal,
    shipping,
    total,
    isFreeShipping,
    freeShippingThreshold,
    isKarachi,
  };
}
