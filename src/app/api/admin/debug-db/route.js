import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toggleProductLiveAction } from '@/app/actions';
import Product from '@/models/Product';
import mongooseConnect from '@/lib/mongooseConnect';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        await mongooseConnect();
        const p = await Product.findOne({}).lean();
        
        if (!p) {
            return NextResponse.json({ success: false, message: "No products found" });
        }

        const original = p.showOnStore;
        const res = await toggleProductLiveAction(p._id.toString(), false);
        const p2 = await Product.findOne({ _id: p._id }).lean();
        const after = p2.showOnStore;

        return NextResponse.json({
            success: true,
            original,
            res,
            after
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
