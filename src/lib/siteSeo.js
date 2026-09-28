export const SITE_NAME = 'China Unique Store';

export const SITE_TITLE_DEFAULT = 'China Unique Store | Trending Products & Smart Gadgets';

export const SITE_DESCRIPTION =
  'Shop the coolest unique products and trending items in Pakistan.';

const TITLE_SUFFIX_PATTERN = /\s*[|–—-]\s*China Unique(?: Store)?\s*$/i;

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
