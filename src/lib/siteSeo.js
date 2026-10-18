export const SITE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Store';

export const SITE_TITLE_DEFAULT = `${SITE_NAME} | Trending Products & Smart Gadgets`;

export const SITE_DESCRIPTION =
  'Shop the coolest unique products and trending items.';

const escapedSiteName = (process.env.NEXT_PUBLIC_STORE_NAME || 'China Unique').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TITLE_SUFFIX_PATTERN = new RegExp(`\\s*[|–—-]\\s*(?:${escapedSiteName}|China Unique)(?: Store)?\\s*$`, 'i');

export function metadataTitle(value = '') {
  return String(value || '')
    .replace(TITLE_SUFFIX_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pageMetadata({ title, description } = {}) {
  const safeTitle = metadataTitle(title);
  const safeDescription = String(description || '').trim();

  return {
    title: safeTitle || SITE_TITLE_DEFAULT,
    description: safeDescription && safeDescription !== safeTitle ? safeDescription : SITE_DESCRIPTION,
  };
}
