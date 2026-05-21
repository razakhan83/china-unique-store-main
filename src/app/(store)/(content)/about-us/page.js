import StoreCustomPage from '@/components/StoreCustomPage';
import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';
import { notFound } from 'next/navigation';

export async function generateMetadata() {
  const page = await getStoreCustomPageBySlug('about-us');

  return {
    title: page?.seoTitle || page?.title || 'About Us',
    description: page?.seoDescription || page?.description || '',
  };
}

export default async function AboutUsPage() {
  const [page, settings] = await Promise.all([
    getStoreCustomPageBySlug('about-us'),
    getStoreSettings(),
  ]);

  if (!page || page.isEnabled === false) {
    notFound();
  }

  return <StoreCustomPage page={page} storeName={settings.storeName} />;
}
