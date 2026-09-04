import { cacheLife, cacheTag } from 'next/cache';
import StoreCustomPage from '@/components/StoreCustomPage';
import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';
import { notFound } from 'next/navigation';

export async function generateMetadata() {
  const page = await getStoreCustomPageBySlug('terms-of-service');

  return {
    title: page?.seoTitle || page?.title || 'Terms of Service',
    description: page?.seoDescription || page?.description || '',
  };
}

export default async function TermsOfServicePage() {
  'use cache';
  cacheLife('foreverish');
  cacheTag('custom-pages', 'settings');

  const [page, settings] = await Promise.all([
    getStoreCustomPageBySlug('terms-of-service'),
    getStoreSettings(),
  ]);

  if (!page || page.isEnabled === false) {
    notFound();
  }

  return <StoreCustomPage page={page} storeName={settings?.storeName || 'China Unique Store'} />;
}
