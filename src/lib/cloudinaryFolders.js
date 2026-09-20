const CUSTOMER_FOLDERS = new Set(['china_unique_items_reviews']);

const ADMIN_FOLDERS = new Set([
  'china_unique_items_products',
  'china_unique_items_videos',
  'china_unique_items_homepage',
  'china_unique_items_homepage_videos',
  'china_unique_items_branding',
  'china_unique_items_categories',
  'china_unique_items_covers',
]);

export function resolveCloudinaryFolder(rawFolder, session) {
  const folder = String(rawFolder || 'china_unique_items_products').trim();

  if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
    return { error: 'Invalid upload folder.', status: 400 };
  }

  if (CUSTOMER_FOLDERS.has(folder)) {
    if (!session?.user) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { folder };
  }

  if (ADMIN_FOLDERS.has(folder)) {
    if (!session?.user?.isAdmin) {
      return { error: 'Unauthorized', status: 401 };
    }
    if (session.user?.isDemo) {
      return { error: 'Demo Mode: Actions are disabled. You have read-only access.', status: 403 };
    }
    return { folder };
  }

  return { error: 'Unauthorized', status: 401 };
}
