import StoreCustomPage from '@/components/StoreCustomPage';
import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';
import { notFound } from 'next/navigation';

export async function generateMetadata() {
  const page = await getStoreCustomPageBySlug('refund-policy');

  return {
    title: page?.seoTitle || page?.title || 'Refund Policy',
    description: page?.seoDescription || page?.description || '',
  };
}

export default async function RefundPolicyPage() {
  const [page, settings] = await Promise.all([
    getStoreCustomPageBySlug('refund-policy'),
    getStoreSettings(),
  ]);

  if (!page || page.isEnabled === false) {
    notFound();
  }

  return <StoreCustomPage page={page} storeName={settings.storeName} />;
}
