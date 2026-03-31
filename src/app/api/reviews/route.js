import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import Review from '@/models/Review';
import Notification from '@/models/Notification';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import { getPhoneRegex, normalizeEmail } from '@/lib/admin';

// GET reviews for a specific product
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    await mongooseConnect();
    const reviews = await Review.find({ productId, isApproved: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST submit a new review
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await mongooseConnect();
    const body = await req.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating) {
      return NextResponse.json({ success: false, error: 'Product ID and rating are required' }, { status: 400 });
    }

    // Find user in DB
    const email = normalizeEmail(session.user.email);
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Resolve product — productId may be a real ObjectId string or a slug
    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    // If it wasn't a valid ObjectId, or the findById returned nothing, try slug fallback
    if (!product) {
      product = await Product.findOne({ slug: productId });
    }
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Always use the real Mongo _id for the review reference
    const resolvedProductId = product._id;
    const productIdentifiers = [resolvedProductId.toString(), product.slug].filter(Boolean);

    const orderQuery = {
      status: 'Delivered',
      items: {
        $elemMatch: {
          productId: { $in: productIdentifiers },
        },
      },
      $or: [{ customerEmail: email }],
    };

    if (user.phone) {
      const phoneRegex = getPhoneRegex(user.phone);
      if (phoneRegex) {
        orderQuery.$or.push({ customerPhone: { $regex: phoneRegex } });
      }
    }

    const eligibleOrder = await Order.findOne(orderQuery).select('_id').lean();
    if (!eligibleOrder) {
      return NextResponse.json(
        { success: false, error: 'Only delivered customers can review this product' },
        { status: 403 }
      );
    }

    const review = await Review.create({
      productId: resolvedProductId,
      userId: user._id,
      userName: user.name,
      rating: Number(rating),
      comment: comment || '',
    });

    // Create Admin Notification
    await Notification.create({
      type: 'review',
      message: `${user.name} left a ${rating}-star rating on ${product.Name}`,
      link: `/admin/reviews?id=${review._id}`,
      metadata: {
        id: resolvedProductId.toString(),
        userName: user.name,
        rating: Number(rating),
      }
    });

    revalidateTag(`reviews-${resolvedProductId.toString()}`);
    revalidateTag(`reviews-${productId}`); // also bust cache keyed by original input

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
