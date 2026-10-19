import { optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';

export function normalizeProductImage(image) {
  if (!image) return null;

  let rawUrl = '';
  let rawPublicId = '';
  let rawBlur = '';

  if (typeof image === 'string') {
    rawUrl = image.trim();
  } else if (typeof image === 'object') {
    rawUrl = String(image.url || image.image || '').trim();
    rawPublicId = String(image.publicId || image.public_id || '').trim();
    rawBlur = String(image.blurDataURL || '').trim();
  }

  // Reject oversized data URIs or raw base64 blobs that bloat the HTML payload
  if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.length > 2048) {
    return null;
  }

  return {
    url: optimizeCloudinaryUrl(rawUrl),
    blurDataURL: rawBlur.length > 1024 ? '' : rawBlur,
    publicId: rawPublicId,
  };
}

export function normalizeProductImages(images, fallbackImage = "") {
  const normalizedImages = Array.isArray(images)
    ? images.map(normalizeProductImage).filter(Boolean)
    : [];

  if (normalizedImages.length > 0) {
    return normalizedImages;
  }

  const fallback = normalizeProductImage(fallbackImage);
  return fallback ? [fallback] : [];
}

export function moveProductImageToFront(images, index) {
  if (!Array.isArray(images)) return [];

  const safeIndex = Number(index);
  if (!Number.isInteger(safeIndex) || safeIndex < 0 || safeIndex >= images.length) {
    return [...images];
  }

  if (safeIndex === 0) {
    return [...images];
  }

  const nextImages = [...images];
  const [selectedImage] = nextImages.splice(safeIndex, 1);
  nextImages.unshift(selectedImage);
  return nextImages;
}

export function getPrimaryProductImage(product) {
  const normalizedImages = normalizeProductImages(product?.Images);

  return normalizedImages[0] || null;
}
