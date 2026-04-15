import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import Vendor from '@/models/Vendor';
import { serializeVendor } from '@/lib/vendors';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }
    await mongooseConnect();

    const vendors = await Vendor.find({}).sort({ name: 1, createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: vendors.map(serializeVendor).filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }
    await mongooseConnect();

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const shopNumber = String(body?.shopNumber || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Vendor name is required.' }, { status: 400 });
    }

    const existingVendor = await Vendor.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
    if (existingVendor) {
      return NextResponse.json({ success: false, error: 'A vendor with this name already exists.' }, { status: 409 });
    }

    const vendor = await Vendor.create({ name, shopNumber });

    revalidateTag('admin-dashboard');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/products');

    return NextResponse.json({
      success: true,
      data: serializeVendor(vendor.toObject()),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
