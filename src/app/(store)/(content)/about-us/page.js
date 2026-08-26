import StoreCustomPage from '@/components/StoreCustomPage';
import { getStoreCustomPageBySlug, getStoreSettings } from '@/lib/data';
import { DEFAULT_CUSTOM_PAGES, getCustomPageBySlug } from '@/lib/customPages';

export async function generateMetadata() {
  try {
    const page = await getStoreCustomPageBySlug('about-us');
    return {
      title: page?.seoTitle || page?.title || 'About Us',
      description: page?.seoDescription || page?.description || '',
    };
  } catch (e) {
    const fallbackPage = getCustomPageBySlug(DEFAULT_CUSTOM_PAGES, 'about-us');
    return {
      title: fallbackPage?.seoTitle || 'About Us',
      description: fallbackPage?.seoDescription || '',
    };
  }
}

export default async function AboutUsPage() {
  try {
    const [page, settings] = await Promise.all([
      getStoreCustomPageBySlug('about-us'),
      getStoreSettings(),
    ]);

    const finalPage = page || getCustomPageBySlug(DEFAULT_CUSTOM_PAGES, 'about-us');
    return <StoreCustomPage page={finalPage} storeName={settings?.storeName || 'China Unique Store'} />;
  } catch (e) {
    const fallbackPage = getCustomPageBySlug(DEFAULT_CUSTOM_PAGES, 'about-us');
    return <StoreCustomPage page={fallbackPage} storeName="China Unique Store" />;
  }
}
