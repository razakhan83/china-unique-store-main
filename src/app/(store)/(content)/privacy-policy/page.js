import StoreCustomPage from '@/components/StoreCustomPage';
import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';
import { notFound } from 'next/navigation';

export async function generateMetadata() {
  const page = await getStoreCustomPageBySlug('privacy-policy');

  return {
    title: page?.seoTitle || page?.title || 'Privacy Policy',
    description: page?.seoDescription || page?.description || '',
  };
}

export default async function PrivacyPolicyPage() {
  const [page, settings] = await Promise.all([
    getStoreCustomPageBySlug('privacy-policy'),
    getStoreSettings(),
  ]);

  if (!page || page.isEnabled === false) {
    notFound();
  }

  return <StoreCustomPage page={page} storeName={settings.storeName} />;
}
