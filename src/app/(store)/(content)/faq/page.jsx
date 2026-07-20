import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';
import { notFound } from 'next/navigation';
import FaqPageClient from './FaqPageClient';

export async function generateMetadata() {
  const page = await getStoreCustomPageBySlug('faq');

  return {
    title: page?.seoTitle || 'Frequently Asked Questions | China Unique Store',
    description: page?.seoDescription || 'Find quick answers about shipping, delivery times, cash on delivery (COD), return guarantee, and product usage at China Unique Store.',
  };
}

export default async function FaqPage() {
  const [page, settings] = await Promise.all([
    getStoreCustomPageBySlug('faq'),
    getStoreSettings(),
  ]);

  if (!page || page.isEnabled === false) {
    notFound();
  }

  return (
    <FaqPageClient
      whatsappNumber={settings.whatsappNumber}
      storeName={settings.storeName}
      pageTitle={page.title}
      pageDescription={page.description}
    />
  );
}
