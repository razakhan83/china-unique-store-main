export const DEFAULT_CUSTOM_PAGES = [
  {
    slug: 'about-us',
    title: 'About Us',
    label: 'About Us',
    description: 'Learn more about China Unique Store and the standards behind our product selection.',
    content: `China Unique Store exists to bring thoughtfully selected kitchenware, home decor, and lifestyle pieces to homes across Pakistan.

We focus on products that feel practical, polished, and reliable in everyday use. Each collection is chosen with close attention to quality, finish, and long-term value.

Our goal is simple: make it easier for customers to discover premium household essentials without the guesswork. From browsing to delivery, we aim to keep the experience clear, dependable, and personal.`,
    seoTitle: 'About Us | China Unique Store',
    seoDescription: 'Discover the story, standards, and product philosophy behind China Unique Store.',
    isEnabled: true,
    showInFooter: true,
    sortOrder: 0,
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    label: 'Refund Policy',
    description: 'Understand the return, exchange, and refund terms for orders placed with China Unique Store.',
    content: `We offer support for damaged, incorrect, or incomplete orders. If something arrives in an unsatisfactory condition, please contact us as soon as possible with your order details and clear photos.

Eligible refund or exchange requests should be made within 7 days of delivery. Items must be unused and returned in their original condition unless the issue was caused during delivery.

Once a request is reviewed and approved, we will guide you through the next steps for replacement, store credit, or refund depending on stock availability and the issue reported.`,
    seoTitle: 'Refund Policy | China Unique Store',
    seoDescription: 'Read the refund and exchange policy for China Unique Store orders.',
    isEnabled: true,
    showInFooter: true,
    sortOrder: 1,
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    label: 'Privacy Policy',
    description: 'See how customer information is collected, used, and protected on China Unique Store.',
    content: `We collect the information required to process orders, provide delivery updates, and support customer service. This may include your name, phone number, email address, and shipping information.

Your data is used only for store operations, order communication, service improvement, and essential analytics. We do not sell customer information to outside advertisers.

We take reasonable steps to protect your information through secure services, controlled access, and trusted third-party tools used for payments, messaging, and store operations.`,
    seoTitle: 'Privacy Policy | China Unique Store',
    seoDescription: 'Learn how China Unique Store handles and protects customer data.',
    isEnabled: true,
    showInFooter: true,
    sortOrder: 2,
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    label: 'Shipping Policy',
    description: 'Review delivery timing, shipping charges, and order dispatch expectations.',
    content: `We ship orders across Pakistan and aim to dispatch confirmed orders as quickly as possible. Delivery timing can vary by city, courier availability, and seasonal traffic.

Shipping charges are calculated according to your delivery city and the rules configured at checkout. Promotional free-shipping thresholds may apply when available.

After dispatch, tracking details are shared when supported by the courier. If you need help with delivery updates, our team can assist through the contact channels listed on the store.`,
    seoTitle: 'Shipping Policy | China Unique Store',
    seoDescription: 'Find delivery, dispatch, and shipping charge information for China Unique Store.',
    isEnabled: true,
    showInFooter: true,
    sortOrder: 3,
  },
  {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    label: 'FAQ',
    description: 'Find quick answers about ordering, delivery, payments, and support.',
    content: `Q: How can I place an order?
A: You can place an order directly through our website by adding products to your cart and completing checkout with your delivery details.

Q: How long does delivery usually take?
A: Delivery times depend on your city and courier availability, but most confirmed orders are dispatched as quickly as possible and delivered within the standard courier timeline.

Q: Do you deliver all over Pakistan?
A: Yes, we deliver nationwide across Pakistan. Shipping charges may vary depending on your delivery location.

Q: How will I know if my order has been dispatched?
A: Once your order is dispatched, our team shares tracking or delivery updates when the courier supports them.

Q: What should I do if I receive a damaged or incorrect item?
A: Please contact our support team as soon as possible with your order details and photos so we can review the issue and help with a replacement or refund process.

Q: How can I contact your team?
A: You can reach us through the WhatsApp and contact options available on the store for order help, delivery questions, and general support.`,
    seoTitle: 'FAQ | China Unique Store',
    seoDescription: 'Read common questions and answers about shopping with China Unique Store.',
    isEnabled: true,
    showInFooter: true,
    sortOrder: 4,
  },
];

export function normalizeCustomPageSlug(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCustomPageEntry(page = {}, index = 0) {
  const slug = normalizeCustomPageSlug(page.slug || page.title || `custom-page-${index + 1}`) || `custom-page-${index + 1}`;
  const title = String(page.title || page.label || slug).trim() || slug;

  return {
    slug,
    title,
    label: String(page.label || title).trim() || title,
    description: String(page.description || '').trim(),
    content: String(page.content || '').trim(),
    seoTitle: String(page.seoTitle || '').trim(),
    seoDescription: String(page.seoDescription || '').trim(),
    isEnabled: page.isEnabled !== false,
    showInFooter: page.showInFooter !== false,
    sortOrder: Number(page.sortOrder ?? index) || 0,
  };
}

export function mergeCustomPages(pages = []) {
  const normalizedIncoming = Array.isArray(pages)
    ? pages.map((page, index) => normalizeCustomPageEntry(page, index))
    : [];

  const incomingMap = new Map(normalizedIncoming.map((page) => [page.slug, page]));
  const mergedDefaults = DEFAULT_CUSTOM_PAGES.map((page, index) => ({
    ...page,
    ...(incomingMap.get(page.slug) || {}),
    sortOrder: Number(incomingMap.get(page.slug)?.sortOrder ?? page.sortOrder ?? index) || index,
  }));

  const extraPages = normalizedIncoming.filter(
    (page) => !DEFAULT_CUSTOM_PAGES.some((defaultPage) => defaultPage.slug === page.slug),
  );

  return [...mergedDefaults, ...extraPages]
    .map((page, index) => normalizeCustomPageEntry(page, index))
    .sort((a, b) => {
      const sortDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      if (sortDiff !== 0) return sortDiff;
      return a.title.localeCompare(b.title);
    });
}

export function getCustomPageBySlug(pages = [], slug = '') {
  const safeSlug = normalizeCustomPageSlug(slug);
  if (!safeSlug) return null;

  return mergeCustomPages(pages).find((page) => page.slug === safeSlug) || null;
}
