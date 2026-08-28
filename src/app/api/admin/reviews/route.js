import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Review from '@/models/Review';

export async function GET() {
  try {
    const auth = await requireApiAdmin();
    if (auth.error) return auth.error;
    await mongooseConnect();

    const reviews = await Review.find({})
      .populate('productId', 'Name slug')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const serializedReviews = reviews.map((review) => ({
      ...review,
      _id: review._id.toString(),
      productId: review.productId
        ? {
            ...review.productId,
            _id: review.productId._id.toString(),
          }
        : null,
      userId: review.userId ? review.userId.toString() : null,
      createdAt: review.createdAt?.toISOString(),
      updatedAt: review.updatedAt?.toISOString(),
    }));

    return NextResponse.json({ success: true, data: serializedReviews });
  } catch (error) {
    console.error('Admin reviews GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await requireApiAdmin({ mutation: true });
    if (auth.error) return auth.error;
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Review ID and status are required' }, { status: 400 });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    await mongooseConnect();
    const result = await Review.findByIdAndUpdate(
      id,
      {
        status,
        isApproved: status === 'Approved',
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    revalidateTag(`reviews-${result.productId?.toString?.() || result.productId}`);

    return NextResponse.json({ success: true, message: `Review ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Admin reviews PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update review' }, { status: 500 });
  }
}
