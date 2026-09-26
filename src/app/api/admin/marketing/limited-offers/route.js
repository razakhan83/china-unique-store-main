import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { requireApiAdmin } from '@/lib/requireAdmin';
import mongoose from 'mongoose';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import { isDiscountActive } from '@/lib/discount';

const SETTINGS_KEY = 'site-settings';
const MAX_OFFERS = 10;

function serializeOffer(product) {
  const active = isDiscountActive(product);
  return {
    _id: product._id.toString(),
    Name: product.Name || '',
    Price: Number(product.Price || 0),
    slug: product.slug || product._id.toString(),
    discountPercentage: Number(product.discountPercentage || 0),
    discountType: product.discountType || 'none',
    discountEndsAt: product.discountEndsAt ? new Date(product.discountEndsAt).toISOString() : null,
    active,
    expired: product.discountType === 'time-based' && !active,
  };
}

async function loadSelected(ids) {
  const objectIds = ids.filter((id) => id);
  if (objectIds.length === 0) return [];
  const products = await Product.find({ _id: { $in: objectIds } })
    .select('Name Price slug discountPercentage discountType discountEndsAt isDiscounted')
    .lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean).map(serializeOffer);
}

export async function GET(request) {
  const auth = await requireApiAdmin();
  if (auth.error) return auth.error;

  await mongooseConnect();
  const { searchParams } = new URL(request.url);
  const query = String(searchParams.get('q') || '').trim();

  const settings = await Settings.findOne({ singletonKey: SETTINGS_KEY }).select('limitedOfferProductIds').lean();
  const ids = Array.isArray(settings?.limitedOfferProductIds) ? settings.limitedOfferProductIds.map(String).slice(0, MAX_OFFERS) : [];

  let matches = [];
  if (query) {
    const found = await Product.find({
      showOnStore: true,
      discountType: 'time-based',
      Name: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    })
      .select('Name Price slug discountPercentage discountType discountEndsAt isDiscounted')
      .sort({ discountEndsAt: 1 })
      .limit(12)
      .lean();
    matches = found.map(serializeOffer);
  }

  return NextResponse.json({
    success: true,
    productIds: ids,
    selected: await loadSelected(ids),
    matches,
  });
}

export async function PUT(request) {
  const auth = await requireApiAdmin({ mutation: true });
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.productIds)
    ? [...new Set(body.productIds.map((id) => String(id || '').trim()).filter((id) => mongoose.Types.ObjectId.isValid(id)))]
    : [];

  if (ids.length > MAX_OFFERS) {
    return NextResponse.json({ success: false, message: 'Limited Time Offers can include at most 10 products.' }, { status: 400 });
  }

  await mongooseConnect();
  const products = ids.length
    ? await Product.find({ _id: { $in: ids } }).select('discountType discountEndsAt discountPercentage isDiscounted').lean()
    : [];
  const byId = new Map(products.map((product) => [String(product._id), product]));

  for (const id of ids) {
    const product = byId.get(id);
    if (!product || product.discountType !== 'time-based' || !isDiscountActive(product)) {
      return NextResponse.json({
        success: false,
        message: 'Only products with an active flash sale can be added.',
      }, { status: 400 });
    }
  }

  await Settings.updateOne(
    { singletonKey: SETTINGS_KEY },
    { $set: { limitedOfferProductIds: ids } },
    { upsert: true },
  );

  revalidateTag('settings', 'max');
  revalidateTag('home-page', 'max');
  revalidateTag('products', 'max');

  return NextResponse.json({
    success: true,
    productIds: ids,
    selected: await loadSelected(ids),
  });
}
