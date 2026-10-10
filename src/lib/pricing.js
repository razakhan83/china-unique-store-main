/**
 * Format any numeric or string price amount into the standardized PKR storefront display string.
 * Output format: "Rs 1,290" (Prefix "Rs", a single space, thousands separator, no decimals).
 * Handles null, undefined, NaN, and negative values gracefully.
 *
 * @param {number|string|null|undefined} amount
 * @returns {string} e.g. "Rs 1,290" or "Rs 0"
 */
export function formatPrice(amount) {
  if (amount == null || amount === '') return 'Rs 0';
  const cleaned = typeof amount === 'number'
    ? amount
    : Number(String(amount).replace(/[^\d.-]/g, ''));
  const safeNum = Number.isFinite(cleaned) ? Math.round(cleaned) : 0;
  return `Rs ${safeNum.toLocaleString('en-PK')}`;
}

/**
 * Single source of truth for a product's current active selling price.
 * Aligns with server-side pricing in order fulfillment and product cards.
 * Avoids dynamic Date.now() during Next.js static prerendering when now is not provided.
 *
 * @param {object} product
 * @param {Date|number|null} [now=null]
 * @returns {number}
 */
export function getSellingPrice(product, now = null) {
  if (!product || typeof product !== 'object') return 0;

  let basePrice = Number(product.Price ?? product.price ?? 0);

  // If a specific pack option is selected
  if (product.packLabel && Array.isArray(product.packOptions)) {
    const pack = product.packOptions.find((p) => p.label === product.packLabel);
    if (pack && Number.isFinite(Number(pack.price))) {
      basePrice = Number(pack.price);
    }
  }

  if (!Number.isFinite(basePrice) || basePrice < 0) return 0;

  // Active discount check
  let isDiscountValid = false;
  if (product.isDiscounted === true && Number(product.discountPercentage) > 0) {
    if (product.discountType === 'time-based' && product.discountEndsAt) {
      if (now != null) {
        const endsAt = new Date(product.discountEndsAt).getTime();
        isDiscountValid = Number.isFinite(endsAt) && endsAt > Number(now);
      } else {
        // In static prerendering where now is not passed, treat as active if configured
        isDiscountValid = true;
      }
    } else {
      isDiscountValid = true;
    }
  }

  if (isDiscountValid) {
    if (product.discountedPrice != null && Number.isFinite(Number(product.discountedPrice))) {
      return Math.round(Number(product.discountedPrice));
    }
    const percentage = Number(product.discountPercentage || 0);
    if (percentage > 0) {
      return Math.round(basePrice * (1 - percentage / 100));
    }
  }

  return Math.round(basePrice);
}

/**
 * Single source of truth for a product's compare-at (strikethrough / original) price.
 * Returns null if there is no valid strikethrough price or if compareAtPrice <= sellingPrice.
 *
 * @param {object} product
 * @param {Date|number|null} [now=null]
 * @returns {number|null}
 */
export function getComparePrice(product, now = null) {
  if (!product || typeof product !== 'object') return null;

  const selling = getSellingPrice(product, now);
  let basePrice = Number(product.Price ?? product.price ?? 0);

  if (product.packLabel && Array.isArray(product.packOptions)) {
    const pack = product.packOptions.find((p) => p.label === product.packLabel);
    if (pack && Number.isFinite(Number(pack.price))) {
      basePrice = Number(pack.price);
    }
  }

  // If currently selling at a discount below base price, base price is the original compare price
  if (Number.isFinite(basePrice) && basePrice > selling) {
    return Math.round(basePrice);
  }

  // Otherwise check compareAtPrice attribute
  const compareAt = Number(product.compareAtPrice ?? 0);
  if (Number.isFinite(compareAt) && compareAt > selling) {
    return Math.round(compareAt);
  }

  return null;
}

/**
 * Single source of truth for discount percentage (integer).
 *
 * @param {object} product
 * @param {Date|number|null} [now=null]
 * @returns {number} e.g. 20 (for 20% off)
 */
export function getDiscountPercent(product, now = null) {
  if (!product || typeof product !== 'object') return 0;

  const selling = getSellingPrice(product, now);
  const compare = getComparePrice(product, now);

  if (compare && compare > selling) {
    return Math.round(((compare - selling) / compare) * 100);
  }

  if (product.isDiscounted === true && Number(product.discountPercentage) > 0) {
    return Math.round(Number(product.discountPercentage));
  }

  return 0;
}

// Backward-compatible alias for existing callers
export const getVisibleCompareAtPrice = getComparePrice;
