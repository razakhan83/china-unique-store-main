import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import { serializeVendor } from '@/lib/vendors';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }
    await mongooseConnect();

    const { id } = await params;
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const shopNumber = String(body?.shopNumber || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Vendor name is required.' }, { status: 400 });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found.' }, { status: 404 });
    }

    const duplicate = await Vendor.findOne({
      _id: { $ne: vendor._id },
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).lean();
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'A vendor with this name already exists.' }, { status: 409 });
    }

    vendor.name = name;
    vendor.shopNumber = shopNumber;
    await vendor.save();

    await Product.updateMany(
      { 'vendors.vendorId': vendor._id },
      {
        $set: {
          'vendors.$[entry].name': vendor.name,
          'vendors.$[entry].shopNumber': vendor.shopNumber,
        },
      },
      {
        arrayFilters: [{ 'entry.vendorId': vendor._id }],
      }
    );

    revalidateTag('products');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/products');
    revalidatePath('/products');

    return NextResponse.json({
      success: true,
      data: serializeVendor(vendor.toObject()),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }
    await mongooseConnect();

    const { id } = await params;
    const vendor = await Vendor.findById(id).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found.' }, { status: 404 });
    }

    await Product.updateMany(
      { 'vendors.vendorId': vendor._id },
      { $pull: { vendors: { vendorId: vendor._id } } }
    );
    await Vendor.findByIdAndDelete(id);

    revalidateTag('products');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/products');
    revalidatePath('/products');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
