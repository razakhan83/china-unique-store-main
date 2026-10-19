export const SITE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'China Unique Store';

export const SITE_TITLE_DEFAULT = `${SITE_NAME} | Trending Products & Smart Gadgets`;

export const SITE_DESCRIPTION =
  'Shop unique products, trending smart gadgets, home essentials, and kitchenware with fast delivery and cash on delivery across Pakistan.';

const escapedSiteName = (process.env.NEXT_PUBLIC_STORE_NAME || 'China Unique Store').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TITLE_SUFFIX_PATTERN = new RegExp(`\\s*[|–—-]\\s*(?:${escapedSiteName}|Store)(?: Store)?\\s*$`, 'i');

export function metadataTitle(value = '') {
  return String(value || '')
    .replace(TITLE_SUFFIX_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pageMetadata({ title, description, canonical } = {}) {
  const safeTitle = metadataTitle(title);
  const safeDescription = String(description || '').trim();

  const meta = {
    title: safeTitle || SITE_TITLE_DEFAULT,
    description: safeDescription && safeDescription !== safeTitle ? safeDescription : SITE_DESCRIPTION,
  };

  if (canonical) {
    meta.alternates = { canonical };
  }

  return meta;
}
