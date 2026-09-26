import { requireAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import { isDiscountActive } from '@/lib/discount';
import LimitedOffersClient from './LimitedOffersClient';

export const metadata = {
  title: 'Limited Time Offers | Admin',
};

export default async function LimitedOffersPage() {
  await requireAdmin();
  await mongooseConnect();

  const settings = await Settings.findOne({ singletonKey: 'site-settings' }).select('limitedOfferProductIds').lean();
  const ids = Array.isArray(settings?.limitedOfferProductIds) ? settings.limitedOfferProductIds.map(String).slice(0, 10) : [];
  const products = ids.length
    ? await Product.find({ _id: { $in: ids } })
      .select('Name Price slug discountPercentage discountType discountEndsAt isDiscounted')
      .lean()
    : [];
  const byId = new Map(products.map((product) => [String(product._id), product]));
  const selected = ids.map((id) => byId.get(id)).filter(Boolean).map((product) => ({
    _id: product._id.toString(),
    Name: product.Name || '',
    Price: Number(product.Price || 0),
    slug: product.slug || product._id.toString(),
    discountPercentage: Number(product.discountPercentage || 0),
    discountType: product.discountType || 'none',
    discountEndsAt: product.discountEndsAt ? new Date(product.discountEndsAt).toISOString() : null,
    active: isDiscountActive(product),
    expired: product.discountType === 'time-based' && !isDiscountActive(product),
  }));

  return <LimitedOffersClient initialSelected={selected} />;
}
