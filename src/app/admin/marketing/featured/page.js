import { requireAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import { normalizeProductImages } from '@/lib/productImages';
import FeaturedProductsClient from './FeaturedProductsClient';

export const metadata = {
  title: 'Featured Products | Admin',
};

export default async function FeaturedProductsPage() {
  await requireAdmin();
  await mongooseConnect();

  const [featuredProducts, allProducts] = await Promise.all([
    Product.find({ isFeatured: true })
      .select('Name Price Images slug isFeatured featuredPriority StockStatus')
      .sort({ featuredPriority: -1, createdAt: -1 })
      .lean(),
    Product.find({ showOnStore: true })
      .select('Name Price Images slug isFeatured featuredPriority StockStatus')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const serialize = (p) => ({
    _id: p._id.toString(),
    id: p.slug || p._id.toString(),
    Name: p.Name || '',
    Price: Number(p.Price || 0),
    StockStatus: p.StockStatus || 'In Stock',
    Images: normalizeProductImages(p.Images),
    slug: p.slug || p._id.toString(),
    featuredPriority: Number(p.featuredPriority || 0),
    isFeatured: p.isFeatured === true,
  });

  return (
    <FeaturedProductsClient
      initialFeatured={featuredProducts.map(serialize)}
      allProducts={allProducts.map(serialize)}
    />
  );
}
