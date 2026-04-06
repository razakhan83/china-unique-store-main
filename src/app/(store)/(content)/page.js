import HomeSectionRenderer from '@/components/home/HomeSectionRenderer';
import { getStorefrontHomePage } from '@/lib/data';

export default async function HomePage() {
  const { sections } = await getStorefrontHomePage();

  return <HomeSectionRenderer sections={sections} />;
}
