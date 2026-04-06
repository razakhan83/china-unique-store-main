import { getAdminHomePageBuilderData } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';

import HomePageBuilderClient from './HomePageBuilderClient';

export default async function AdminHomePageBuilderPage() {
  await requireAdmin();

  const data = await getAdminHomePageBuilderData();

  return (
    <HomePageBuilderClient
      initialSections={data.sections}
      availableCategories={data.categories}
    />
  );
}
