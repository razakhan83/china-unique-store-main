import { NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  try {
    await requireAdmin();
    await mongooseConnect();

    const products = await Product.find({})
      .select('Name Price discountedPrice isDiscounted Images slug Category')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      products: products.map((p) => ({
        _id: String(p._id),
        Name: p.Name || '',
        Price: Number(p.Price || 0),
        discountedPrice: p.discountedPrice != null ? Number(p.discountedPrice) : null,
        isDiscounted: p.isDiscounted === true,
        Images: p.Images || [],
        slug: p.slug || '',
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
