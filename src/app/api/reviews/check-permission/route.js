import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { normalizeEmail, getPhoneRegex } from '@/lib/admin';

export async function GET(req) {
  await connection();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: true, canReview: false });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    await mongooseConnect();
    const email = normalizeEmail(session.user.email);

    // 1. Find user in DB to get their phone if any
    const user = await User.findOne({ email }).lean();
    if (!user) {
       return NextResponse.json({ success: true, canReview: false });
    }

    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId).select('_id slug').lean();
    }
    if (!product) {
      product = await Product.findOne({ slug: productId }).select('_id slug').lean();
    }
    if (!product) {
      return NextResponse.json({ success: true, canReview: false });
    }

    const productIdentifiers = [product._id.toString(), product.slug].filter(Boolean);

    // 2. Query for delivered orders containing this product
    const query = {
      status: 'Delivered',
      items: { $elemMatch: { productId: { $in: productIdentifiers } } },
      $or: [
        { customerEmail: email }
      ]
    };

    if (user.phone) {
      const phoneRegex = getPhoneRegex(user.phone);
      if (phoneRegex) {
        query.$or.push({ customerPhone: { $regex: phoneRegex } });
      }
    }

    const orderCount = await Order.countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      canReview: orderCount > 0 
    });

  } catch (error) {
    console.error('Check review permission error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
