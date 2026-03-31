import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Review from '@/models/Review';

export async function GET() {
  try {
    await requireAdmin();
    await mongooseConnect();
    
    const reviews = await Review.find({})
      .populate('productId', 'Name slug')
      .sort({ createdAt: -1 })
      .lean();

    const serializedReviews = reviews.map(review => ({
      ...review,
      _id: review._id.toString(),
      productId: review.productId ? {
        ...review.productId,
        _id: review.productId._id.toString()
      } : null,
      userId: review.userId ? review.userId.toString() : null,
      createdAt: review.createdAt?.toISOString(),
      updatedAt: review.updatedAt?.toISOString(),
    }));

    return NextResponse.json({ success: true, data: serializedReviews });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 });
    }

    await mongooseConnect();
    const result = await Review.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    revalidateTag(`reviews-${result.productId?.toString?.() || result.productId}`);

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
