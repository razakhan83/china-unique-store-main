import { notFound } from 'next/navigation';

import StoreCustomPage from '@/components/StoreCustomPage';
import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const page = await getStoreCustomPageBySlug(resolvedParams?.slug);

  if (!page || page.isEnabled === false) {
    return {};
  }

  return {
    title: page.seoTitle || page.title || 'Store Page',
    description: page.seoDescription || page.description || '',
  };
}

export default async function DynamicCustomPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  const [page, settings] = await Promise.all([
    getStoreCustomPageBySlug(slug),
    getStoreSettings(),
  ]);

  if (!page || page.isEnabled === false) {
    notFound();
  }

  return <StoreCustomPage page={page} storeName={settings.storeName} />;
}
