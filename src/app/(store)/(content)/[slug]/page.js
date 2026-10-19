import { cacheLife, cacheTag } from 'next/cache';
import { notFound, redirect, permanentRedirect } from 'next/navigation';

import StoreCustomPage from '@/components/StoreCustomPage';
import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';
import { pageMetadata } from '@/lib/siteSeo';

const RESERVED_STATIC_SLUGS = new Set([
  'faq',
  'faqs',
  'about-us',
  'contact',
  'contact-us',
  'privacy',
  'privacy-policy',
  'shipping-policy',
  'terms',
  'terms-of-service',
  'refund-policy',
  'cart',
  'categories',
  'orders',
  'settings',
  'wishlist',
]);

export async function generateStaticParams() {
  const settings = await getStoreSettings();
  const pages = settings?.customPages || [];
  const filtered = pages
    .map((page) => ({ slug: page.slug }))
    .filter((p) => Boolean(p.slug) && !RESERVED_STATIC_SLUGS.has(String(p.slug).toLowerCase().trim()));

  return filtered.length > 0 ? filtered : [{ slug: '__default__' }];
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug || RESERVED_STATIC_SLUGS.has(String(slug).toLowerCase().trim())) {
    return {};
  }
  const page = await getStoreCustomPageBySlug(slug);

  if (!page || page.isEnabled === false) {
    return {};
  }

  return pageMetadata({
    title: page.seoTitle || page.title || 'Store Page',
    description: page.seoDescription || page.description || '',
  });
}

export default async function DynamicCustomPage({ params }) {
  'use cache';
  cacheLife('foreverish');
  cacheTag('custom-pages', 'settings');

  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug || RESERVED_STATIC_SLUGS.has(String(slug).toLowerCase().trim())) {
    notFound();
  }

  const [page, settings] = await Promise.all([
    getStoreCustomPageBySlug(slug),
    getStoreSettings(),
  ]);

  if (!page || page.isEnabled === false) {
    const rawRedirects = Array.isArray(settings?.urlRedirects) ? settings.urlRedirects : [];
    const normalizedSlug = String(slug || '').toLowerCase().trim();
    const match = rawRedirects.find((r) => {
      if (r.isEnabled === false) return false;
      const cleanSource = String(r.sourcePath || '').trim().toLowerCase().replace(/^\/+/, '');
      return cleanSource === normalizedSlug;
    });

    if (match?.targetPath) {
      if (match.statusCode === 302) {
        redirect(match.targetPath);
      } else {
        permanentRedirect(match.targetPath);
      }
    }

    notFound();
  }

  return <StoreCustomPage page={page} storeName={settings.storeName} />;
}
