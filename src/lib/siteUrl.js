const DEFAULT_SITE_URL = 'https://china-unique-items.vercel.app';

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    url.pathname = url.pathname.replace(/\/$/, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function isLocalhostUrl(value) {
  return /localhost|127\.0\.0\.1/i.test(String(value || ''));
}

export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.NEXTAUTH_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (!normalized) continue;

    if (process.env.NODE_ENV === 'production' && isLocalhostUrl(normalized)) {
      continue;
    }

    return normalized;
  }

  return DEFAULT_SITE_URL;
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}
