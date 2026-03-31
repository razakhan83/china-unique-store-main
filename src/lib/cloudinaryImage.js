const CLOUDINARY_HOSTS = new Set(['res.cloudinary.com']);

export const CLOUDINARY_IMAGE_PRESETS = {
  categoryCircle: { width: 216, height: 216, crop: 'fill', gravity: 'auto' },
  heroOriginal: { includeDpr: false },
  productCard: { width: 285, crop: 'fill', gravity: 'auto', format: 'avif' },
  productGalleryMain: { width: 1400, height: 1400, crop: 'fill', gravity: 'auto' },
  productGalleryThumb: { width: 240, height: 240, crop: 'fill', gravity: 'auto' },
  searchSuggestion: { width: 96, height: 96, crop: 'fill', gravity: 'auto' },
  cartItem: { width: 160, height: 160, crop: 'fill', gravity: 'auto' },
  productModal: { width: 960, height: 960, crop: 'fill', gravity: 'auto' },
  adminThumb: { width: 128, height: 128, crop: 'fill', gravity: 'auto' },
};

function buildCloudinaryTransformSegment(options = {}) {
  const transforms = [];

  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.gravity) transforms.push(`g_${options.gravity}`);
  if (options.width) transforms.push(`w_${Math.round(options.width)}`);
  if (options.height) transforms.push(`h_${Math.round(options.height)}`);

  transforms.push(`q_${options.quality || 'auto'}`);
  transforms.push(`f_${options.format || 'avif'}`);
  if (options.includeDpr !== false) {
    transforms.push(`dpr_${options.dpr || 'auto'}`);
  }

  return transforms.join(',');
}

function looksLikeCloudinaryTransformSegment(segment = '') {
  return /^(?:[a-z]{1,3}_[^/]+)(?:,(?:[a-z]{1,3}_[^/]+))*$/.test(segment);
}

export function optimizeCloudinaryUrl(url = '', options = {}) {
  const source = String(url || '').trim();
  if (!source) return '';

  try {
    const parsed = new URL(source);
    if (!CLOUDINARY_HOSTS.has(parsed.hostname)) {
      return source;
    }

    const uploadSegment = '/image/upload/';
    if (!parsed.pathname.includes(uploadSegment)) {
      return source;
    }

    const transformSegment = buildCloudinaryTransformSegment(options);
    const segments = parsed.pathname.split('/');
    const uploadIndex = segments.findIndex((segment) => segment === 'upload');

    if (uploadIndex === -1) {
      return source;
    }

    const nextSegment = segments[uploadIndex + 1];
    const hasExistingTransform = looksLikeCloudinaryTransformSegment(nextSegment);

    if (hasExistingTransform) {
      segments[uploadIndex + 1] = transformSegment;
    } else {
      segments.splice(uploadIndex + 1, 0, transformSegment);
    }

    parsed.pathname = segments.join('/');

    return parsed.toString();
  } catch {
    return source;
  }
}

export function optimizeCloudinaryAsset(asset, options = {}) {
  if (!asset || typeof asset !== 'object') return asset;

  return {
    ...asset,
    url: optimizeCloudinaryUrl(asset.url, options),
  };
}
