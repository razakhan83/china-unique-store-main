'use client';

import { useEffect } from 'react';
import { trackViewContentEvent } from '@/lib/clientTracking';

export default function ProductViewTracking({
  enabled,
  facebookPixelId,
  tiktokPixelId,
  productId,
  name,
  category,
  value,
}) {
  useEffect(() => {
    const safeProductId = String(productId || '').trim();
    if (!enabled || !safeProductId) return;

    const payload = {
      content_ids: [safeProductId],
      content_name: name,
      content_category: category,
      content_type: 'product',
      value: Number(value || 0),
      currency: 'PKR',
    };

    if (facebookPixelId) {
      trackViewContentEvent({ productId: safeProductId, name, category, value });
    }

    if (tiktokPixelId && typeof window.ttq?.track === 'function') {
      window.ttq.track('ViewContent', payload);
    }
  }, [category, enabled, facebookPixelId, name, productId, tiktokPixelId, value]);

  return null;
}
