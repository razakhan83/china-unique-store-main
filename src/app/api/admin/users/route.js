// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';

import mongooseConnect from '@/lib/mongooseConnect';
import User from '@/models/User';

export async function GET() {
  try {
    const auth = await requireApiAdmin({ requireRealAdmin: true });
    if (auth.error) return auth.error;

    await mongooseConnect();
    const users = await User.find({})
      .select('name email image createdAt disabled forceLogoutAt')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        ...user,
        _id: user._id.toString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

